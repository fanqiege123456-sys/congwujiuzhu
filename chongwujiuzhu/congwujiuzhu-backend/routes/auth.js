const express = require('express');
const router = express.Router();
const https = require('https');
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

// 微信登录换取 OpenID
router.post('/wechat', async (req, res) => {
  const { code } = req.body;
  
  const APP_ID = process.env.WX_APP_ID || 'wx71625e3d2b32f53f'; 
  const APP_SECRET = process.env.WX_APP_SECRET || 'fc719e660a7519061d05ec2dce877949'; 

  // 模式 1: 本地开发/演示模式
  if (!APP_SECRET) {
    console.log('[Auth] Running in MOCK mode. Code:', code);
    const FIXED_OPENID = 'test_user_persistent_id_888';
    
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE open_id = ?', [FIXED_OPENID]);
      let user = rows[0];
      
      if (!user) {
        const displayId = await generateDisplayId();
        const [result] = await db.query(
          'INSERT INTO users (open_id, nickname, avatar_url, display_id) VALUES (?, ?, ?, ?)',
          [FIXED_OPENID, '微信用户(测试)', '', displayId]
        );
        user = { id: result.insertId, openId: FIXED_OPENID, nickname: '微信用户(测试)', avatarUrl: '', displayId };
      } else {
        // 补全旧用户的 display_id
        if (!user.display_id) {
            const newDisplayId = await generateDisplayId();
            await db.query('UPDATE users SET display_id = ? WHERE id = ?', [newDisplayId, user.id]);
            user.display_id = newDisplayId;
        }
        user = {
            id: user.id,
            openId: user.open_id,
            nickname: user.nickname,
            avatarUrl: user.avatar_url,
            displayId: user.display_id
        };
      }
      
      return res.json({ code: 200, data: user });
    } catch (err) {
      console.error('Mock auth failed:', err);
      return res.status(500).json({ code: 500, message: 'Database error' });
    }
  }

  // 模式 2: 生产环境模式
  console.log('[Auth] Running in PRODUCTION mode.');
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;

  https.get(url, (wxRes) => {
    let data = '';
    wxRes.on('data', (chunk) => data += chunk);
    wxRes.on('end', async () => {
      try {
        const result = JSON.parse(data);
        
        if (result.errcode) {
          console.error('WeChat API Error:', result);
          return res.status(400).json({ code: 400, message: result.errmsg });
        }

        const { openid } = result;
        console.log('✅ WeChat Login Success. OpenID:', openid);
        
        try {
          const [rows] = await db.query('SELECT * FROM users WHERE open_id = ?', [openid]);
          let user = rows[0];
          
          if (!user) {
             const displayId = await generateDisplayId();
             const [insertRes] = await db.query(
              'INSERT INTO users (open_id, nickname, avatar_url, display_id) VALUES (?, ?, ?, ?)',
              [openid, '微信用户', '', displayId]
            );
            user = { id: insertRes.insertId, openId: openid, nickname: '微信用户', avatarUrl: '', displayId };
          } else {
            // 补全旧用户的 display_id
            if (!user.display_id) {
                const newDisplayId = await generateDisplayId();
                await db.query('UPDATE users SET display_id = ? WHERE id = ?', [newDisplayId, user.id]);
                user.display_id = newDisplayId;
            }
            user = {
                id: user.id,
                openId: user.open_id,
                nickname: user.nickname,
                avatarUrl: user.avatar_url,
                displayId: user.display_id
            };
          }
          
          res.json({ code: 200, data: user });
        } catch (dbErr) {
          console.error('Database Error:', dbErr);
          res.status(500).json({ code: 500, message: 'Database Error' });
        }

      } catch (e) {
        console.error('JSON Parse Error:', e);
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
      }
    });
  }).on('error', (e) => {
    console.error('HTTPS Request Error:', e);
    res.status(500).json({ code: 500, message: 'Network Error' });
  });
});

module.exports = router;
