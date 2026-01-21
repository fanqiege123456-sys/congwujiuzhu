const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取所有救助记录
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT r.id, r.pet_id, r.rescuer_name, r.rescuer_avatar, r.rescuer_openid,
              r.rescue_method, r.rescue_location, r.notes, r.photos, r.created_at,
              p.description, p.address, p.images, p.status,
              p.reporter_name, p.reporter_avatar, p.reporter_openid
       FROM rescue_records r
       LEFT JOIN pets p ON r.pet_id = p.id
       ORDER BY r.created_at DESC
       LIMIT 50`
    );
    conn.release();
    
    const parseJsonArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch (_e) {
          return [value];
        }
      }
      return [];
    };

    const records = rows.map(record => ({
      ...record,
      rescuerName: record.rescuer_name,
      rescuerAvatar: record.rescuer_avatar || '',
      rescuerOpenId: record.rescuer_openid || '',
      reporterName: record.reporter_name,
      reporterAvatar: record.reporter_avatar || '',
      reporterOpenId: record.reporter_openid || '',
      photos: parseJsonArray(record.photos),
      images: parseJsonArray(record.images)
    }));
    
    res.json({ code: 200, message: 'success', data: records });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 创建救助记录
router.post('/', async (req, res) => {
  try {
    const {
      petId,
      rescuerName,
      rescuerAvatar,
      rescuerOpenId,
      rescueMethod,
      rescueLocation,
      notes,
      photos,
      status
    } = req.body;
    
    if (!petId || !rescuerName || !rescueMethod) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    const conn = await pool.getConnection();
    
    // 插入救助记录
    await conn.query(
      `INSERT INTO rescue_records (pet_id, rescuer_name, rescuer_avatar, rescuer_openid, rescue_method, rescue_location, notes, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        petId,
        rescuerName,
        rescuerAvatar || null,
        rescuerOpenId || null,
        rescueMethod,
        rescueLocation || null,
        notes || null,
        JSON.stringify(photos || [])
      ]
    );
    
    // 只有明确选择'已救助'且当前不是已救助时才更新状态
    if (status === 'RESCUED') {
      const [[petRow]] = await conn.query('SELECT status FROM pets WHERE id = ?', [petId]);
      if (petRow && petRow.status !== 'RESCUED') {
        await conn.query(
          `UPDATE pets SET status = 'RESCUED' WHERE id = ?`,
          [petId]
        );
      }
    }
    
    conn.release();
    
    res.json({ code: 200, message: '救助记录创建成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取某个宠物的救助记录
router.get('/pet/:petId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT r.id, r.pet_id, r.rescuer_name, r.rescuer_avatar, r.rescuer_openid,
              r.rescue_method, r.rescue_location, r.notes, r.photos, r.created_at,
              p.description, p.address, p.images, p.status,
              p.reporter_name, p.reporter_avatar, p.reporter_openid
       FROM rescue_records r
       LEFT JOIN pets p ON r.pet_id = p.id
       WHERE r.pet_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.petId]
    );
    conn.release();
    
    const parseJsonArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch (_e) {
          return [value];
        }
      }
      return [];
    };

    const records = rows.map(record => ({
      ...record,
      rescuerName: record.rescuer_name,
      rescuerAvatar: record.rescuer_avatar || '',
      rescuerOpenId: record.rescuer_openid || '',
      reporterName: record.reporter_name,
      reporterAvatar: record.reporter_avatar || '',
      reporterOpenId: record.reporter_openid || '',
      photos: parseJsonArray(record.photos),
      images: parseJsonArray(record.images)
    }));
    
    res.json({ code: 200, message: 'success', data: records });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
