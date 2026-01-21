const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCommunityDB() {
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

    // Add reply_to_openid and is_read to community_comments
    try {
      await conn.query(`
        ALTER TABLE community_comments
        ADD COLUMN reply_to_openid VARCHAR(255) NULL,
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
      `);
      console.log('Columns added to community_comments.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Columns already exist.');
      } else {
        throw e;
      }
    }

    conn.release();
    console.log('Update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

updateCommunityDB();
