const express = require('express');
const router = express.Router();
const db = require('../db');

// 辅助函数：生成唯一的6位数字ID
async function generateDisplayId() {
  for (let i = 0; i < 10; i++) { // 最多重试10次
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    const [rows] = await db.query('SELECT id FROM users WHERE display_id = ?', [id]);
    if (rows.length === 0) return id;
  }
  throw new Error('Failed to generate unique display ID');
}

// 注册或更新用户
router.post('/', async (req, res) => {
  const { openId, nickname, avatarUrl } = req.body;
  
  if (!openId) {
    return res.status(400).json({ code: 400, message: 'OpenId is required' });
  }

  try {
    // 检查用户是否存在
    const [rows] = await db.query('SELECT * FROM users WHERE open_id = ?', [openId]);
    
    if (rows.length > 0) {
      // 更新用户
      await db.query(
        'UPDATE users SET nickname = ?, avatar_url = ?, updated_at = NOW() WHERE open_id = ?',
        [nickname, avatarUrl, openId]
      );
      res.json({ code: 200, data: { ...rows[0], nickname, avatarUrl }, message: 'User updated' });
    } else {
      // 创建用户
      const displayId = await generateDisplayId();
      const [result] = await db.query(
        'INSERT INTO users (open_id, nickname, avatar_url, display_id) VALUES (?, ?, ?, ?)',
        [openId, nickname, avatarUrl, displayId]
      );
      res.json({ 
        code: 200, 
        data: { id: result.insertId, openId, nickname, avatarUrl, displayId }, 
        message: 'User created' 
      });
    }
  } catch (err) {
    console.error('User operation failed:', err);
    res.status(500).json({ code: 500, message: 'Database error' });
  }
});

// 获取用户信息
router.get('/:openId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE open_id = ?', [req.params.openId]);
    if (rows.length > 0) {
      const user = rows[0];
      // 确保返回 camelCase 格式
      res.json({ 
        code: 200, 
        data: {
          ...user,
          displayId: user.display_id,
          avatarUrl: user.avatar_url,
          openId: user.open_id
        } 
      });
    } else {
      res.status(404).json({ code: 404, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Database error' });
  }
});

// 获取所有用户列表
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    const users = rows.map(user => ({
      ...user,
      openId: user.open_id,
      avatarUrl: user.avatar_url,
      nickname: user.nickname
    }));
    res.json({ code: 200, data: users });
  } catch (err) {
    res.status(500).json({ code: 500, message: 'Database error' });
  }
});

module.exports = router;
