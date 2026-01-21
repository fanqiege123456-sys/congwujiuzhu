const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取待审核的信息
router.get('/pending', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT DISTINCT p.id, p.description, p.location_lat as lat, p.location_lng as lng, 
              p.address, p.status, p.audit_status, p.images, p.timestamp, p.reporter_name,
              p.reporter_avatar, p.reporter_openid,
              GROUP_CONCAT(JSON_OBJECT('id', a.id, 'reviewer', a.reviewer_name, 'status', a.status)) as audits
       FROM pets p
       LEFT JOIN audits a ON p.id = a.pet_id
       WHERE p.audit_status = 'PENDING'
       GROUP BY p.id
       ORDER BY p.timestamp DESC`
    );
    conn.release();
    
    const pets = rows.map(pet => {
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

      const audits = pet.audits ? JSON.parse(`[${pet.audits}]`) : [];
      return {
        ...pet,
        location: {
          lat: parseFloat(pet.lat),
          lng: parseFloat(pet.lng)
        },
        auditStatus: pet.audit_status,
        reporterName: pet.reporter_name,
        reporterAvatar: pet.reporter_avatar || '',
        reporterOpenId: pet.reporter_openid || '',
        images: parseJsonArray(pet.images),
        audits: audits
      };
    });
    
    res.json({ code: 200, message: 'success', data: pets });
  } catch (error) {
    console.error('获取待审核信息失败:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 提交审核意见
router.post('/', async (req, res) => {
  try {
    const { petId, reviewerName, status, comment } = req.body;
    
    if (!petId || !reviewerName || !status) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ code: 400, message: '审核状态不合法' });
    }
    
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO audits (pet_id, reviewer_name, status, comment)
       VALUES (?, ?, ?, ?)`,
      [petId, reviewerName, status, comment || null]
    );
    if (reviewerName && reviewerName.toLowerCase() === 'admin') {
      await conn.query(
        `UPDATE pets SET audit_status = ? WHERE id = ?`,
        [status === 'APPROVED' ? 'APPROVED' : 'REJECTED', petId]
      );
    }
    conn.release();
    
    res.json({ code: 200, message: '审核提交成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取某个信息的所有审核
router.get('/pet/:petId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT id, reviewer_name, status, comment, created_at
       FROM audits
       WHERE pet_id = ?
       ORDER BY created_at DESC`,
      [req.params.petId]
    );
    conn.release();
    
    res.json({ code: 200, message: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
