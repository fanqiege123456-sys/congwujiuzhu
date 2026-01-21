const mysql = require('mysql2/promise');

async function createTable() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'congwujiuzhu'
    });

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rescue_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NOT NULL,
        rescuer_name VARCHAR(255),
        rescuer_avatar VARCHAR(1024),
        rescuer_openid VARCHAR(255),
        rescue_method VARCHAR(255),
        rescue_location VARCHAR(500),
        notes TEXT,
        photos JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ rescue_records 表创建成功！');
    await conn.end();
  } catch (err) {
    console.error('❌ 创建表失败:', err.message);
  }
}

createTable();
