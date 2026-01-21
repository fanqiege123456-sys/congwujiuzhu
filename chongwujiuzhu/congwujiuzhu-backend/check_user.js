const db = require('./db');

async function check() {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE nickname = ?', ['7K']);
    console.log('User 7K:', rows);
    
    const [rows2] = await db.query('SELECT * FROM users WHERE open_id = ?', ['oPOlk17zv4e-0i9rT9w8IGToz7_U']);
    console.log('User by OpenID:', rows2);

  } catch (e) {
    console.error(e);
  }
  process.exit();
}

check();
