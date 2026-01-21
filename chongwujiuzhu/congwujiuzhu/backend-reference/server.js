const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https'); // Added for WeChat API call

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Storage (Simple JSON file based)
const DB_FILE = path.join(__dirname, 'db.json');
let db = {
  pets: [],
  rescueRecords: [],
  audits: [],
  posts: [],
  comments: [],
  users: [],
  notifications: []
};

// Load DB
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to load DB, starting fresh.');
  }
}

const saveDB = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// --- Routes ---

// 1. Uploads
app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ data: { url } });
});

// 2. Pets
app.get('/api/pets', (req, res) => {
  res.json({ data: db.pets });
});

app.post('/api/pets', (req, res) => {
  const pet = {
    id: req.body.id || `pet-${Date.now()}`,
    ...req.body,
    timestamp: Date.now()
  };
  db.pets.unshift(pet);
  saveDB();
  res.json({ data: pet });
});

// 3. Rescue Records
app.get('/api/rescue-records/pet/:petId', (req, res) => {
  const records = db.rescueRecords.filter(r => r.petId === req.params.petId);
  res.json({ data: records });
});

app.post('/api/rescue-records', (req, res) => {
  const record = {
    id: `rescue-${Date.now()}`,
    ...req.body,
    created_at: Date.now()
  };
  db.rescueRecords.push(record);
  
  // Update pet status
  const petIndex = db.pets.findIndex(p => p.id === req.body.petId);
  if (petIndex !== -1) {
    db.pets[petIndex].status = 'RESCUED';
    saveDB();
  }
  
  res.json({ data: record });
});

// 4. Audits
app.post('/api/audits', (req, res) => {
  const audit = {
    id: `audit-${Date.now()}`,
    ...req.body,
    timestamp: Date.now()
  };
  db.audits.push(audit);
  saveDB();
  res.json({ data: audit });
});

// 5. Community Posts
app.get('/api/community/posts', (req, res) => {
  let posts = db.posts;
  if (req.query.petId) {
    posts = posts.filter(p => p.petId === req.query.petId);
  }
  // Sort by newest
  posts.sort((a, b) => b.timestamp - a.timestamp);
  res.json({ data: posts });
});

// Alias for Admin Panel (Potential Fix)
app.get('/api/posts', (req, res) => {
  let posts = db.posts;
  // Sort by newest
  posts.sort((a, b) => b.timestamp - a.timestamp);
  res.json({ data: posts });
});

app.get('/api/community/posts/:id', (req, res) => {
  const post = db.posts.find(p => p.id === req.params.id);
  if (post) {
    res.json({ data: post });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/community/posts', (req, res) => {
  const post = {
    id: req.body.id || `post-${Date.now()}`,
    ...req.body,
    timestamp: Date.now(),
    createdAt: Date.now()
  };
  db.posts.unshift(post);
  saveDB();
  res.json({ data: post });
});

// 6. Comments
app.get('/api/community/comments', (req, res) => {
  const comments = db.comments;
  comments.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ data: comments });
});

// Alias for Admin Panel (Potential Fix)
app.get('/api/comments', (req, res) => {
  const comments = db.comments;
  comments.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ data: comments });
});

app.get('/api/community/posts/:postId/comments', (req, res) => {
  const comments = db.comments.filter(c => c.postId === req.params.postId);
  comments.sort((a, b) => a.createdAt - b.createdAt);
  res.json({ data: comments });
});

app.post('/api/community/posts/:postId/comments', (req, res) => {
  const comment = {
    id: `comment-${Date.now()}`,
    postId: req.params.postId,
    ...req.body,
    createdAt: Date.now()
  };
  db.comments.push(comment);
  
  // Create Notification for Post Author
  const post = db.posts.find(p => p.id === req.params.postId);
  if (post && post.authorOpenId && post.authorOpenId !== comment.authorOpenId) {
    db.notifications.push({
      id: `notif-${Date.now()}`,
      targetOpenId: post.authorOpenId,
      type: 'COMMENT',
      content: `${comment.authorName} 评论了你的日常`,
      relatedId: post.id,
      isRead: false,
      timestamp: Date.now()
    });
  }

  // Create Notification for Parent Comment Author (if reply)
  if (comment.parentId) {
    const parentComment = db.comments.find(c => c.id === comment.parentId);
    if (parentComment && parentComment.authorOpenId && parentComment.authorOpenId !== comment.authorOpenId) {
       db.notifications.push({
        id: `notif-${Date.now()}-reply`,
        targetOpenId: parentComment.authorOpenId,
        type: 'REPLY',
        content: `${comment.authorName} 回复了你的评论`,
        relatedId: post.id,
        isRead: false,
        timestamp: Date.now()
      });
    }
  }

  saveDB();
  res.json({ data: comment });
});

// 7. Users
app.post('/api/users', (req, res) => {
  const { openId } = req.body;
  const index = db.users.findIndex(u => u.openId === openId);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
  } else {
    db.users.push(req.body);
  }
  saveDB();
  res.json({ success: true });
});

// 8. Notifications
app.get('/api/community/notifications', (req, res) => {
  const { openId } = req.query;
  const notifs = db.notifications.filter(n => n.targetOpenId === openId);
  notifs.sort((a, b) => b.timestamp - a.timestamp);
  res.json({ data: notifs });
});

app.get('/api/community/notifications/unread-count', (req, res) => {
  const { openId } = req.query;
  const count = db.notifications.filter(n => n.targetOpenId === openId && !n.isRead).length;
  res.json({ data: { count } });
});

app.post('/api/community/notifications/read', (req, res) => {
  const { openId } = req.body;
  db.notifications.forEach(n => {
    if (n.targetOpenId === openId) {
      n.isRead = true;
    }
  });
  saveDB();
  res.json({ success: true });
});

// 9. Statistics (Mock Data)
app.get('/api/statistics/overview', (req, res) => {
  res.json({
    data: {
      totalRescued: db.pets.filter(p => p.status === 'RESCUED').length,
      activeHelpers: db.users.length,
      monthlyGrowth: 15
    }
  });
});

app.get('/api/statistics/trends', (req, res) => {
  res.json({
    data: [
      { date: '2023-01', count: 5 },
      { date: '2023-02', count: 8 },
      { date: '2023-03', count: 12 }
    ]
  });
});

app.get('/api/statistics/regions', (req, res) => {
  res.json({
    data: [
      { name: '朝阳区', value: 30 },
      { name: '海淀区', value: 25 },
      { name: '丰台区', value: 15 }
    ]
  });
});

// 10. Auth (WeChat Login Real Implementation)
app.post('/api/auth/wechat', (req, res) => {
  const { code } = req.body;
  
  // ==========================================
  // 部署配置：请在此处填入微信公众平台获取的真实信息
  // ==========================================
  const APP_ID = process.env.WX_APP_ID || 'wx71625e3d2b32f53f'; // 您的 AppID
  const APP_SECRET = process.env.WX_APP_SECRET || 'fc719e660a7519061d05ec2dce877949'; // 必须填入 AppSecret 才能在服务器生效

  // 模式 1: 本地开发/演示模式 (当没有配置 Secret 时)
  if (!APP_SECRET) {
    console.log('[Auth] Running in MOCK mode. Code:', code);
    const FIXED_OPENID = 'test_user_persistent_id_888';
    
    let user = db.users.find(u => u.openId === FIXED_OPENID);
    if (!user) {
      user = {
        openId: FIXED_OPENID,
        nickname: '微信用户(测试)',
        avatarUrl: '',
        createdAt: Date.now()
      };
      db.users.push(user);
      saveDB();
    }
    return res.json({ code: 200, data: user });
  }

  // 模式 2: 生产环境模式 (调用微信官方接口)
  console.log('[Auth] Running in PRODUCTION mode.');
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;

  https.get(url, (wxRes) => {
    let data = '';
    wxRes.on('data', (chunk) => data += chunk);
    wxRes.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.errcode) {
          console.error('WeChat API Error:', result);
          return res.status(400).json({ code: 400, message: result.errmsg });
        }

        const { openid, session_key } = result;
        
        // 查找或创建用户
        let user = db.users.find(u => u.openId === openid);
        if (!user) {
          user = {
            openId: openid,
            nickname: '微信用户',
            avatarUrl: '',
            createdAt: Date.now()
          };
          db.users.push(user);
          saveDB();
        }
        
        // 注意：真实生产环境中，不应直接返回 session_key 给前端，应生成自定义 token
        // 这里为了演示简单，直接返回用户信息
        res.json({ code: 200, data: user });

      } catch (e) {
        console.error('JSON Parse Error:', e);
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
      }
    });
  }).on('error', (e) => {
    console.error('HTTPS Request Error:', e);
    res.status(500).json({ code: 500, message: 'Network Error' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
