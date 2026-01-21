const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let sql = `SELECT p.id, p.description, p.location_lat as lat, p.location_lng as lng, p.address,
              p.status, p.audit_status, p.images, p.videos, UNIX_TIMESTAMP(p.timestamp) * 1000 as timestamp,
              COALESCE(u.nickname, p.reporter_name) as reporter_name, 
              COALESCE(u.avatar_url, p.reporter_avatar) as reporter_avatar, 
              p.reporter_openid, p.ai_analysis, p.rescue_details
       FROM pets p
       LEFT JOIN users u ON p.reporter_openid = u.open_id`;
    
    const params = [];
    // 支持按状态筛选 (如果传了 status 且不是 ALL)
    if (req.query.status && req.query.status !== 'ALL') {
      sql += ` WHERE p.status = ?`;
      params.push(req.query.status);
    }

    sql += ` ORDER BY p.timestamp DESC LIMIT 100`;

    const [rows] = await conn.query(sql, params);

    const pets = rows.map((pet) => {
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

      let images = parseJsonArray(pet.images);
      images = images.filter(img => !img.includes('example.com'));

      return {
        ...pet,
        id: String(pet.id),
        location: {
          lat: parseFloat(pet.lat),
          lng: parseFloat(pet.lng)
        },
        auditStatus: pet.audit_status,
        reporterName: pet.reporter_name,
        reporterAvatar: (pet.reporter_avatar && !pet.reporter_avatar.includes('example.com')) ? pet.reporter_avatar : '',
        reporterOpenId: pet.reporter_openid || '',
        images: images,
        videos: parseJsonArray(pet.videos),
        // 修复：显式映射缺失的字段
        aiAnalysis: pet.ai_analysis,
        rescueDetails: pet.rescue_details,
        audits: []
      };
    });

    res.json({ code: 200, message: 'success', data: pets });
  } catch (error) {
    console.error('Failed to list pets:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.get('/status/:status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, description, location_lat as lat, location_lng as lng, address,
              status, audit_status, images, videos, UNIX_TIMESTAMP(timestamp) * 1000 as timestamp,
              reporter_name, reporter_avatar, reporter_openid
       FROM pets
       WHERE status = ?
       ORDER BY timestamp DESC`,
      [req.params.status]
    );

    const pets = rows.map((pet) => {
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

      let images = parseJsonArray(pet.images);
      images = images.filter(img => !img.includes('example.com'));

      return {
        ...pet,
        id: String(pet.id),
        location: {
          lat: parseFloat(pet.lat),
          lng: parseFloat(pet.lng)
        },
        auditStatus: pet.audit_status,
        reporterName: pet.reporter_name,
        reporterAvatar: (pet.reporter_avatar && !pet.reporter_avatar.includes('example.com')) ? pet.reporter_avatar : '',
        reporterOpenId: pet.reporter_openid || '',
        images: images,
        videos: parseJsonArray(pet.videos)
      };
    });

    res.json({ code: 200, message: 'success', data: pets });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.get('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, description, location_lat as lat, location_lng as lng, address,
              status, audit_status, images, videos, UNIX_TIMESTAMP(timestamp) * 1000 as timestamp,
              reporter_name, reporter_avatar, reporter_openid, ai_analysis, rescue_details
       FROM pets
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Not found' });
    }

    const pet = rows[0];
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
    let images = parseJsonArray(pet.images);
    images = images.filter(img => !img.includes('example.com'));

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...pet,
        id: String(pet.id),
        location: {
          lat: parseFloat(pet.lat),
          lng: parseFloat(pet.lng)
        },
        auditStatus: pet.audit_status,
        reporterName: pet.reporter_name,
        reporterAvatar: (pet.reporter_avatar && !pet.reporter_avatar.includes('example.com')) ? pet.reporter_avatar : '',
        reporterOpenId: pet.reporter_openid || '',
        images: images,
        videos: parseJsonArray(pet.videos),
        // 修复：显式映射缺失的字段
        aiAnalysis: pet.ai_analysis,
        rescueDetails: pet.rescue_details,
        audits: []
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.post('/', async (req, res) => {
  let {
    description,
    location,
    address,
    status,
    images,
    videos,
    videoUrl,
    timestamp,
    reporterName,
    reporterAvatar,
    reporterOpenId
  } = req.body;

  if (!videos && videoUrl) {
    videos = [videoUrl];
  }

  if (!description || !location || !address) {
    return res.status(400).json({ code: 400, message: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    const [settings] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "audit_required"');
    const auditRequired = settings.length > 0 ? settings[0].setting_value === 'true' : true;
    const initialAuditStatus = auditRequired ? 'PENDING' : 'APPROVED';

    const ts = typeof timestamp === 'number' ? new Date(timestamp) : new Date();
    const [result] = await conn.query(
      `INSERT INTO pets (description, location_lat, location_lng, address, status, audit_status, images, videos, timestamp, reporter_name, reporter_avatar, reporter_openid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        description,
        location.lat,
        location.lng,
        address,
        status || 'NEEDS_RESCUE',
        initialAuditStatus,
        JSON.stringify(images || []),
        JSON.stringify(videos || []),
        ts,
        reporterName || '匿名用户',
        reporterAvatar || '',
        reporterOpenId || ''
      ]
    );

    res.json({ code: 200, message: 'created', data: { id: String(result.insertId) } });
  } catch (error) {
    console.error('Failed to create pet:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req, res) => {
  let { description, address, status, images, videos, videoUrl, rescueDetails } = req.body;

  if (!videos && videoUrl) {
    videos = [videoUrl];
  }

  const conn = await pool.getConnection();
  try {
    const updates = [];
    const values = [];

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (images !== undefined) {
      updates.push('images = ?');
      values.push(JSON.stringify(images));
    }
    if (videos !== undefined) {
      updates.push('videos = ?');
      values.push(JSON.stringify(videos));
    }
    if (rescueDetails !== undefined) {
      updates.push('rescue_details = ?');
      values.push(rescueDetails);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: 'No updates provided' });
    }

    values.push(req.params.id);
    const sql = `UPDATE pets SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await conn.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: 'Not found' });
    }

    res.json({ code: 200, message: 'updated' });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query('DELETE FROM pets WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: 'Not found' });
    }
    res.json({ code: 200, message: 'deleted' });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;