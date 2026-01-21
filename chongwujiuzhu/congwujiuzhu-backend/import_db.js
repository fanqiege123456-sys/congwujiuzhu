const mysql = require('mysql2');
const fs = require('fs');

// 读取SQL文件
const sqlFiles = ['./congwujiuzhu.sql', './community.sql'];
const sqlContent = sqlFiles
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n');

// 按分号分割SQL语句
const sqlStatements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

// 创建连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456'
});

console.log('正在连接数据库...');

connection.connect((err) => {
  if (err) {
    console.log('连接数据库失败:', err.message);
    return;
  }

  console.log('连接成功，正在创建数据库和表...');

  // 先选择数据库
  connection.query('USE congwujiuzhu', (err) => {
    if (err) {
      console.log('选择数据库失败，尝试创建并使用:', err.message);
    }

    // 逐条执行SQL语句
    let executedCount = 0;
    const executeNext = () => {
      if (executedCount >= sqlStatements.length) {
        console.log('所有SQL语句执行完成');
        connection.end();
        return;
      }

      const statement = sqlStatements[executedCount];
      console.log(`执行语句 ${executedCount + 1}/${sqlStatements.length}: ${statement.substring(0, 50)}...`);

      connection.query(statement, (err, result) => {
        if (err) {
          // 忽略一些非关键错误（如DROP TABLE如果表不存在）
          console.log(`语句执行可能有误（可能正常）:`, err.message);
        } else {
          console.log(`语句执行成功`);
        }

        executedCount++;
        executeNext(); // 执行下一条
      });
    };

    executeNext();
  });
});
