const db = require('./db');

async function migrate() {
  try {
    console.log('开始检查数据库结构...');
    
    // 1. 检查是否已有 display_id 字段
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'display_id'");
    if (columns.length === 0) {
      console.log('正在添加 display_id 字段...');
      // 添加字段，设为唯一索引
      await db.query("ALTER TABLE users ADD COLUMN display_id VARCHAR(6) DEFAULT NULL");
      // 尝试添加唯一索引，如果重复可能会报错，所以分开执行
      try {
          await db.query("CREATE UNIQUE INDEX idx_display_id ON users(display_id)");
      } catch (e) {
          console.log('索引可能已存在或创建失败:', e.message);
      }
      console.log('字段添加成功。');
    } else {
      console.log('display_id 字段已存在。');
    }
    
    // 2. 为现有用户补充生成 ID
    const [users] = await db.query("SELECT id FROM users WHERE display_id IS NULL");
    console.log(`发现 ${users.length} 个用户需要生成 ID...`);

    for (const user of users) {
      let success = false;
      while (!success) {
        // 生成 100000 - 999999 之间的随机数
        const newId = Math.floor(100000 + Math.random() * 900000).toString();
        try {
          await db.query("UPDATE users SET display_id = ? WHERE id = ?", [newId, user.id]);
          console.log(`用户 ID ${user.id} -> 分配短号: ${newId}`);
          success = true;
        } catch (e) {
          // 如果随机数重复（极小概率），重试
          if (e.code === 'ER_DUP_ENTRY') {
            console.log('ID碰撞，重试...');
          } else {
            console.error('更新失败:', e);
            break;
          }
        }
      }
    }
    
    console.log('数据库升级完成！');
    process.exit(0);
  } catch (err) {
    console.error('脚本执行出错:', err);
    process.exit(1);
  }
}

migrate();
