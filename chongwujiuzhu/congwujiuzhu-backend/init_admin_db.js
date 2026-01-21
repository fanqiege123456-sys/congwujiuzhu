const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'congwujiuzhu'
};

async function initAdminDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Create Admins Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Admins table checked/created.');

        // 2. Create Settings Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT,
                description VARCHAR(255)
            )
        `);
        console.log('Settings table checked/created.');

        // 3. Insert Default Admin (admin/admin123)
        // In a real app, use bcrypt. Here using simple text for prototype as requested.
        const [admins] = await connection.execute('SELECT * FROM admins WHERE username = ?', ['admin']);
        if (admins.length === 0) {
            await connection.execute('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', 'admin123']);
            console.log('Default admin created (admin/admin123).');
        }

        // 4. Insert Default Settings
        const defaultSettings = [
            { key: 'audit_required', value: 'true', desc: '是否开启发帖审核 (true/false)' },
            { key: 'share_title_template', value: '【$状态】$地点 $描述', desc: '分享标题模板' }
        ];

        for (const setting of defaultSettings) {
            await connection.execute(
                'INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                [setting.key, setting.value, setting.desc]
            );
        }
        console.log('Default settings initialized.');

    } catch (err) {
        console.error('Database initialization failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

initAdminDb();
