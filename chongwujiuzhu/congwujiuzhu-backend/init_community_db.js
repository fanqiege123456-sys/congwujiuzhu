const mysql = require('mysql2/promise');
require('dotenv').config();

async function initCommunityDB() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'congwujiuzhu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const conn = await pool.getConnection();
    console.log('Connected to database.');

    // Create community_posts table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id INT NULL,
        content TEXT,
        images JSON,
        videos JSON,
        author_name VARCHAR(255),
        author_avatar VARCHAR(1024),
        author_openid VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table community_posts created or already exists.');

    // Create community_comments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        parent_id INT NULL,
        content TEXT,
        author_name VARCHAR(255),
        author_avatar VARCHAR(1024),
        author_openid VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Table community_comments created or already exists.');

    conn.release();
    console.log('Initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

initCommunityDB();
