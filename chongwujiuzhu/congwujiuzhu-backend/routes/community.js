const express = require('express');
const router = express.Router();
const pool = require('../db');

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

router.get('/posts', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { petId } = req.query;
    const params = [];
    let sql = `
      SELECT p.id, p.pet_id, p.content, p.images, p.videos,
             p.author_name, p.author_avatar, p.author_openid,
             UNIX_TIMESTAMP(p.created_at) * 1000 as created_at,
             COUNT(c.id) as comment_count,
             pet.description as pet_name,
             pet.images as pet_images,
             pet.status as pet_status
      FROM community_posts p
      LEFT JOIN community_comments c ON p.id = c.post_id
      LEFT JOIN pets pet ON p.pet_id = pet.id
    `;

    if (petId) {
      sql += ' WHERE p.pet_id = ?';
      params.push(petId);
    }

    sql += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50';

    const [rows] = await conn.query(sql, params);
    const posts = rows.map((post) => {
      const petImages = parseJsonArray(post.pet_images);
      let images = parseJsonArray(post.images);
      // Filter out bad URLs (e.g. example.com from seed data)
      images = images.filter(img => !img.includes('example.com'));

      let petImage = petImages.length > 0 ? petImages[0] : null;
      if (petImage && petImage.includes('example.com')) petImage = null;

      return {
        ...post,
        id: String(post.id),
        petId: post.pet_id ? String(post.pet_id) : null,
        authorName: post.author_name || '',
        authorAvatar: (post.author_avatar && !post.author_avatar.includes('example.com')) ? post.author_avatar : '',
        authorOpenId: post.author_openid || '',
        images: images,
        videos: parseJsonArray(post.videos),
        createdAt: post.created_at,
        commentCount: Number(post.comment_count || 0),
        petName: post.pet_name,
        petImage: petImage,
        petStatus: post.pet_status
      };
    });
    res.json({ code: 200, message: 'success', data: posts });
  } catch (error) {
    console.error('Failed to list community posts:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.get('/posts/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, pet_id, content, images, videos, author_name, author_avatar, author_openid,
              UNIX_TIMESTAMP(created_at) * 1000 as created_at
       FROM community_posts
       WHERE id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Not found' });
    }

    const post = rows[0];
    let images = parseJsonArray(post.images);
    images = images.filter(img => !img.includes('example.com'));

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...post,
        id: String(post.id),
        petId: post.pet_id ? String(post.pet_id) : null,
        authorName: post.author_name || '',
        authorAvatar: (post.author_avatar && !post.author_avatar.includes('example.com')) ? post.author_avatar : '',
        authorOpenId: post.author_openid || '',
        images: images,
        videos: parseJsonArray(post.videos),
        createdAt: post.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.post('/posts', async (req, res) => {
  const { petId, content, images, videos, authorName, authorAvatar, authorOpenId } = req.body;

  if (!content) {
    return res.status(400).json({ code: 400, message: 'Missing content' });
  }

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `INSERT INTO community_posts (pet_id, content, images, videos, author_name, author_avatar, author_openid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        petId || null,
        content,
        JSON.stringify(images || []),
        JSON.stringify(videos || []),
        authorName || 'User',
        authorAvatar || null,
        authorOpenId || null
      ]
    );

    res.json({ code: 200, message: 'created', data: { id: String(result.insertId) } });
  } catch (error) {
    console.error('Failed to create community post:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.get('/posts/:id/comments', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, post_id, parent_id, content, author_name, author_avatar, author_openid,
              UNIX_TIMESTAMP(created_at) * 1000 as created_at
       FROM community_comments
       WHERE post_id = ?
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    const comments = rows.map((comment) => ({
      ...comment,
      id: String(comment.id),
      postId: String(comment.post_id),
      parentId: comment.parent_id ? String(comment.parent_id) : null,
      authorName: comment.author_name || '',
      authorAvatar: (comment.author_avatar && !comment.author_avatar.includes('example.com')) ? comment.author_avatar : '',
      authorOpenId: comment.author_openid || '',
      createdAt: comment.created_at
    }));
    res.json({ code: 200, message: 'success', data: comments });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

router.post('/posts/:id/comments', async (req, res) => {
  const { content, authorName, authorAvatar, authorOpenId, parentId } = req.body;
  const postId = req.params.id;

  if (!content) {
    return res.status(400).json({ code: 400, message: 'Missing content' });
  }

  const conn = await pool.getConnection();
  try {
    // Determine who to notify
    let replyToOpenId = null;
    if (parentId) {
      // Reply to a comment
      const [parentRows] = await conn.query('SELECT author_openid FROM community_comments WHERE id = ?', [parentId]);
      if (parentRows.length > 0) replyToOpenId = parentRows[0].author_openid;
    } else {
      // Reply to the post
      const [postRows] = await conn.query('SELECT author_openid FROM community_posts WHERE id = ?', [postId]);
      if (postRows.length > 0) replyToOpenId = postRows[0].author_openid;
    }

    // Don't notify yourself
    if (replyToOpenId === authorOpenId) {
      replyToOpenId = null; // Or keep it but mark as read? Let's just not notify.
    }

    const [result] = await conn.query(
      `INSERT INTO community_comments (post_id, parent_id, content, author_name, author_avatar, author_openid, reply_to_openid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        postId,
        parentId || null,
        content,
        authorName || 'User',
        authorAvatar || null,
        authorOpenId || null,
        replyToOpenId
      ]
    );

    res.json({ code: 200, message: 'created', data: { id: String(result.insertId) } });
  } catch (error) {
    console.error('Failed to create community comment:', error);
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  const { openId } = req.query;
  if (!openId) return res.status(400).json({ code: 400, message: 'Missing openId' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT c.id, c.post_id, c.content, c.author_name, c.author_avatar, c.created_at, c.is_read,
              p.content as post_content, p.images as post_images
       FROM community_comments c
       JOIN community_posts p ON c.post_id = p.id
       WHERE (c.reply_to_openid = ? OR (p.author_openid = ? AND c.author_openid != ?))
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [openId, openId, openId]
    );
    
    const notifications = rows.map(row => ({
      id: String(row.id),
      postId: String(row.post_id),
      content: row.content,
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      createdAt: row.created_at,
      isRead: !!row.is_read,
      postContent: row.post_content,
      postImage: parseJsonArray(row.post_images)[0] || null
    }));

    res.json({ code: 200, message: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  const { openId } = req.query;
  if (!openId) return res.status(400).json({ code: 400, message: 'Missing openId' });

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT COUNT(*) as count
       FROM community_comments c
       JOIN community_posts p ON c.post_id = p.id
       WHERE (c.reply_to_openid = ? OR (p.author_openid = ? AND c.author_openid != ?))
       AND c.is_read = FALSE`,
      [openId, openId, openId]
    );
    
    res.json({ code: 200, message: 'success', data: { count: rows[0].count } });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

// Mark notifications as read
router.post('/notifications/read', async (req, res) => {
  const { openId } = req.body;
  if (!openId) return res.status(400).json({ code: 400, message: 'Missing openId' });

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `UPDATE community_comments c
       JOIN community_posts p ON c.post_id = p.id
       SET c.is_read = TRUE
       WHERE c.reply_to_openid = ? OR (p.author_openid = ? AND c.author_openid != ?)`,
      [openId, openId, openId]
    );
    res.json({ code: 200, message: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
