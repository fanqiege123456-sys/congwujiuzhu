require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api/pets', require('./routes/pets'));
app.use('/api/audits', require('./routes/audits'));
app.use('/api/rescue-records', require('./routes/rescue-records'));
app.use('/api/dailies', require('./routes/dailies'));
app.use('/api/community', require('./routes/community'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ code: 500, message: '服务器错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  宠物救助后端服务启动成功                              ║
║  API 地址: http://localhost:${PORT}                     ║
║  数据库: congwujiuzhu (MySQL)                          ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
