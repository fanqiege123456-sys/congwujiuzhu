const express = require('express');
const router = express.Router();
const pool = require('../db');

// 辅助函数：解析 JSON
const parseJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (e) {
        return [];
    }
};

// Admin Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
            res.json({ success: true, token, user: { username } });
        } else {
            res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Settings
router.get('/settings', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Settings
router.put('/settings', async (req, res) => {
    const { settings } = req.body;
    try {
        const keys = Object.keys(settings);
        for (const key of keys) {
            await pool.execute('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [settings[key], key]);
        }
        res.json({ success: true, message: '设置已更新' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const [pets] = await pool.execute('SELECT COUNT(*) as count FROM pets');
        const [pending] = await pool.execute('SELECT COUNT(*) as count FROM pets WHERE audit_status = "PENDING"');
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [rescued] = await pool.execute('SELECT COUNT(*) as count FROM pets WHERE status = "RESCUED"');

        res.json({
            success: true,
            data: {
                totalPets: pets[0].count,
                pendingAudits: pending[0].count,
                totalUsers: users[0].count,
                rescuedPets: rescued[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get All Dailies (Admin)
router.get('/dailies', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT d.id, d.content, d.images, UNIX_TIMESTAMP(d.created_at) * 1000 as created_at, d.author_name, p.description as pet_desc 
            FROM community_posts d
            LEFT JOIN pets p ON d.pet_id = p.id
            ORDER BY d.created_at DESC
            LIMIT 100
        `);
        
        // 格式化数据：转驼峰，解析 JSON
        const data = rows.map(row => {
            let images = parseJsonArray(row.images);
            images = images.filter(img => !img.includes('example.com'));
            return {
                id: row.id,
                content: row.content,
                images: images,
                createdAt: row.created_at, // 确保前端能读到 createdAt
                authorName: row.author_name,
                petDescription: row.pet_desc
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Daily
router.delete('/dailies/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM community_posts WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get All Comments (Admin)
router.get('/comments', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.id, c.content, UNIX_TIMESTAMP(c.created_at) * 1000 as created_at, c.author_name, 
                   d.content as daily_content, d.images as daily_images,
                   p.description as pet_desc
            FROM community_comments c
            LEFT JOIN community_posts d ON c.post_id = d.id
            LEFT JOIN pets p ON d.pet_id = p.id
            ORDER BY c.created_at DESC
            LIMIT 100
        `);

        // 格式化数据
        const data = rows.map(row => {
            let dailyImages = parseJsonArray(row.daily_images);
            dailyImages = dailyImages.filter(img => !img.includes('example.com'));
            return {
                id: row.id,
                content: row.content,
                createdAt: row.created_at,
                authorName: row.author_name,
                dailyContent: row.daily_content,
                dailyImages: dailyImages,
                petDescription: row.pet_desc
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Comment
router.delete('/comments/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM community_comments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;