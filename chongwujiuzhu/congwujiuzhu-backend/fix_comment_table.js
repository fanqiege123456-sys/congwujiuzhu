const mysql = require('mysql2/promise');

async function fixTable() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'congwujiuzhu'
    });

    await conn.query(`
      ALTER TABLE community_comments 
      ADD COLUMN reply_to_openid VARCHAR(255) AFTER author_openid
    `);

    console.log('✅ community_comments 表修复成功！');
    await conn.end();
  } catch (err) {
    console.error('❌ 修复失败:', err.message);
  }
}

fixTable();
