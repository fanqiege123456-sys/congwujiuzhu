const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get dailies for a specific pet
router.get('/', async (req, res) => {
  const { petId } = req.query;
  if (!petId) {
    return res.status(400).json({ code: 400, message: 'Missing petId' });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, pet_id, author_name, author_avatar, content, images, UNIX_TIMESTAMP(created_at) * 1000 as created_at
       FROM pet_dailies
       WHERE pet_id = ?
       ORDER BY created_at DESC`,
      [petId]
    );

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

    const dailies = rows.map(row => ({
      id: String(row.id),
      petId: String(row.pet_id),
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      content: row.content,
      images: parseJsonArray(row.images),
      createdAt: row.created_at
    }));

    res.json({ code: 200, message: 'success', data: dailies });
  } catch (error) {
    console.error('Failed to fetch dailies:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Create a new daily
router.post('/', async (req, res) => {
  const { petId, authorName, authorAvatar, content, images } = req.body;

  if (!petId || !content) {
    return res.status(400).json({ code: 400, message: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `INSERT INTO pet_dailies (pet_id, author_name, author_avatar, content, images)
       VALUES (?, ?, ?, ?, ?)`,
      [
        petId,
        authorName || '匿名用户',
        authorAvatar || '',
        content,
        JSON.stringify(images || [])
      ]
    );

    res.json({ 
      code: 200, 
      message: 'created', 
      data: { 
        id: String(result.insertId),
        petId,
        authorName,
        authorAvatar,
        content,
        images: images || [],
        createdAt: Date.now()
      } 
    });
  } catch (error) {
    console.error('Failed to create daily:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Get comments for a daily
router.get('/:dailyId/comments', async (req, res) => {
  const { dailyId } = req.params;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, daily_id, author_name, author_avatar, content, UNIX_TIMESTAMP(created_at) * 1000 as created_at
       FROM daily_comments
       WHERE daily_id = ?
       ORDER BY created_at ASC`,
      [dailyId]
    );
    
    const comments = rows.map(row => ({
      id: String(row.id),
      dailyId: String(row.daily_id),
      userName: row.author_name,
      userAvatar: row.author_avatar,
      content: row.content,
      createTime: row.created_at
    }));

    res.json({ code: 200, message: 'success', data: comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Add a comment
router.post('/reply', async (req, res) => {
  const { dailyId, userName, userAvatar, content } = req.body;
  
  if (!dailyId || !content) {
    return res.status(400).json({ code: 400, message: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `INSERT INTO daily_comments (daily_id, author_name, author_avatar, content)
       VALUES (?, ?, ?, ?)`,
      [dailyId, userName || '匿名用户', userAvatar || '', content]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        id: String(result.insertId),
        dailyId,
        userName,
        userAvatar,
        content,
        createTime: Date.now()
      }
    });
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
