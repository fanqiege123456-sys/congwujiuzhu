# 流浪萌宠救助应用 - 微信小程序版本

## 📱 项目概述

这是一个帮助救助流浪宠物的**微信小程序应用**。用户可以：
- 🗺️ 在地图上查看附近的救助信息
- ➕ 发布新的救助需求（附带照片/视频）
- 📝 更新救助进展
- 👥 与社区互动验证信息的真实性

**✨ 本项目已从 Web 应用（React + Vite）转换为微信小程序，集成腾讯地图服务！**

---

## 🗺️ 为什么使用腾讯地图？

相比原来的 OpenStreetMap (Leaflet)，我们现在使用**腾讯地图**，原因如下：

- ✅ **准确的中国地理数据** - 在中国拥有最准确的地图数据
- ✅ **更优的性能** - 为亚洲地区优化
- ✅ **丰富的 API** - 地址搜索、逆编码、路线规划
- ✅ **小程序原生支持** - 原生 `<map>` 组件完美集成

### 快速配置腾讯地图

1. **申请 API Key**
   - 访问 [腾讯地图开放平台](https://lbs.qq.com/)
   - 注册开发者账户
   - 创建应用，获取 **Web/小程序 Key**

2. **配置 Key**
   ```typescript
   // services/tencentMapService.ts
   export const TENCENT_MAP_CONFIG = {
     apiKey: 'YOUR_KEY_HERE'  // ← 替换为您的 Key
   };
   ```

3. **配置合法域名**
   - 微信小程序后台 > 开发 > 开发设置
   - 服务器域名 > 添加 `https://apis.map.qq.com`

---

## 📁 项目结构

```
congwujiuzhu/
│
├── 📱 页面 (Pages)
│   ├── pages/index/          地图页面（主页）- 显示地图和标记
│   ├── pages/list/           列表页面 - 以列表形式查看信息
│   ├── pages/detail/         详情页面 - 完整信息、更新状态、审核
│   └── pages/report/         发布页面 - 上传照片、填写描述
│
├── 🔧 业务服务 (Services)
│   ├── services/storageService.ts      数据存储（本地 wx.Storage）
│   ├── services/geminiService.ts       AI 分析服务（Google Gemini）
│   └── services/tencentMapService.ts   腾讯地图集成
│
├── ⚙️ 应用配置
│   ├── app.ts                  全局应用脚本
│   ├── app.json                小程序配置（页面、权限等）
│   ├── app.wxss                全局样式
│   ├── types.ts                TypeScript 类型定义
│   ├── project.config.json     开发者工具配置
│   └── sitemap.json            页面索引
│
└── 📚 文档
    ├── README.md               本文件
    └── MINIPROGRAM_GUIDE.md    详细开发指南
```

---

## 🚀 快速开始

### 前置要求

- ✅ 微信开发者工具（[下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)）
- ✅ 微信小程序账户（申请地址：https://mp.weixin.qq.com）
- ✅ Node.js 14+ （可选，用于辅助开发）
- ✅ 腾讯地图 API Key

### 安装步骤

#### 方法一：使用微信开发者工具（推荐）

1. **打开项目**
   ```
   微信开发者工具 > 文件 > 打开项目
   选择本项目根目录 (congwujiuzhu)
   输入您的小程序 AppID
   点击 "打开"
   ```

2. **配置腾讯地图**
   - 编辑 `services/tencentMapService.ts`
   - 将 `YOUR_TENCENT_MAP_API_KEY_HERE` 替换为您的实际 Key

3. **预览**
   ```
   点击工具栏 "预览" 按钮
   用微信扫描二维码查看效果
   ```

#### 方法二：从源码安装

```bash
# 1. 克隆项目
git clone <repo-url> congwujiuzhu
cd congwujiuzhu

# 2. 安装依赖（可选，仅用于编辑代码）
npm install

# 3. 用微信开发者工具打开当前目录
# 详见方法一
```

---

## 📖 功能详解

### 🗺️ 地图页面 (`pages/index/`)

**功能：**
- 显示用户当前位置（蓝色圆形标记）
- 显示附近救助信息（红色 = 待救助，绿色 = 已救助）
- 点击标记查看详情
- 刷新按钮重新定位

**截图示意：**
```
┌─────────────────────────────┐
│ 🗺️ 流浪萌宠救助 [🔄] [📋]  │  <- 标题栏 + 刷新和切换视图按钮
├─────────────────────────────┤
│                             │
│     🗺️ 地图显示             │
│     • 蓝色标记 = 我的位置     │
│     • 红色标记 = 待救助       │
│     • 绿色标记 = 已救助       │
│                             │
├─────────────────────────────┤
│                        [➕]  │  <- 发布按钮
└─────────────────────────────┘
```

### 📋 列表页面 (`pages/list/`)

**功能：**
- 显示附近救助信息列表
- 自动排序：待救助优先，最新在前
- 点击卡片查看详情
- 快速发布新信息

**每个卡片包含：**
- 宠物图片 + 地址
- 状态标签 + 时间戳
- AI 分析标记（如果有）

### 📝 详情页面 (`pages/detail/`)

**三个选项卡：**

1️⃣ **详细信息**
   - 位置和坐标
   - 宠物描述
   - AI 分析结果
   - 视频记录
   - 救助进展

2️⃣ **更新状态**
   - 填写救助详情
   - 标记为"已救助"
   - 更新救助信息

3️⃣ **社区审核**
   - 验证真实性（✅ 认证）
   - 标记存疑（⚠️ 存疑）
   - AI 智能审核
   - 查看审核记录

### ➕ 发布页面 (`pages/report/`)

**步骤：**
1. 上传现场照片（必填）
2. 上传视频记录（可选）
3. 填写详细描述
4. 系统自动进行 AI 分析
5. 发布信息

---

## 🔐 权限和隐私

### 需要的权限

| 权限 | 用途 | 获取时机 |
|------|------|---------|
| 📍 地理位置 | 获取用户位置显示地图 | 首次打开应用 |
| 📷 相机/相册 | 上传救助现场照片 | 点击上传照片 |
| 📹 视频库 | 上传救助视频 | 点击上传视频 |
| 💾 本地存储 | 保存救助信息 | 自动 |

### 数据安全

- ✅ 所有数据存储在**用户设备本地**
- ✅ 不上传个人隐私信息
- ✅ 符合微信小程序隐私政策

---

## 💾 数据存储

### 使用微信存储 API

```typescript
// 保存数据
wx.setStorageSync('key', data);

// 读取数据
const data = wx.getStorageSync('key');
```

### 存储内容

- **宠物信息** - 所有报告的救助案例
- **用户定位** - 最近一次的位置
- **应用设置** - 用户偏好设置

### 数据导出（TODO）

未来支持导出/备份功能：
```typescript
// 导出为 JSON
const backup = wx.getStorageSync('rescue_paws_pets_v1');
console.log(JSON.stringify(backup));
```

---

## 🤖 AI 功能（可选）

### Gemini API 集成

自动分析上传的救助信息，识别：
- 🐾 动物品种
- 🎨 毛发颜色
- 💔 救助紧急程度
- 🏥 健康状况评估

### 配置步骤

1. **申请 API Key**
   - 访问 [Google AI Studio](https://ai.google.dev/)
   - 点击 "Get API Key"
   - 复制您的 API Key

2. **配置环境变量**
   ```typescript
   // services/geminiService.ts
   const ai = new GoogleGenAI({ 
     apiKey: 'YOUR_GEMINI_API_KEY' 
   });
   ```

3. **使用 AI 功能**
   ```typescript
   // 发布时自动分析
   const analysis = await analyzePetReport(description, imageBase64);
   
   // 审核时 AI 校验
   const result = await auditRescueReport(pet);
   ```

---

## 🔄 与 Web 版本的区别

### 从 React Web 版本迁移

| 项目 | Web 版本 | 小程序版本 |
|------|---------|---------|
| 框架 | React 19 + Vite | 微信小程序框架 |
| 样式 | Tailwind CSS | WXSS (小程序样式) |
| 地图 | Leaflet + OpenStreetMap | 腾讯地图 |
| 类型 | TypeScript | TypeScript |
| 存储 | LocalStorage | wx.Storage |
| 组件 | React 组件 | 小程序页面 |

### 兼容性保持

✅ 核心业务逻辑完全相同
✅ 数据结构完全兼容
✅ TypeScript 类型定义复用

---

## 🛠️ 开发指南

### 添加新页面

```bash
# 1. 创建目录
mkdir pages/newpage

# 2. 创建四个文件
touch pages/newpage/newpage.ts
touch pages/newpage/newpage.wxml
touch pages/newpage/newpage.wxss
touch pages/newpage/newpage.json

# 3. 在 app.json 中注册
"pages": [
  "pages/index/index",
  "pages/newpage/newpage"  // <- 新增
]
```

### 修改样式

- **全局样式** → `app.wxss`
- **页面样式** → `pages/*/page.wxss`
- **组件样式** → `components/*/component.wxss`

### 调用腾讯地图 API

```typescript
import { 
  getAddressFromCoordinates,  // 坐标转地址
  searchPlace,                 // 地点搜索
  calculateDistanceWithMap     // 距离计算
} from './services/tencentMapService';

// 获取地址
const addr = await getAddressFromCoordinates(39.9042, 116.4074);
console.log(addr); // "北京市朝阳区..."

// 搜索附近医院
const hospitals = await searchPlace('动物医院', '北京');
hospitals.forEach(h => console.log(h.title));

// 计算距离
const dist = calculateDistanceWithMap(lat1, lng1, lat2, lng2);
console.log(dist); // 单位：米
```

### 页面间跳转

```typescript
// 跳转到详情页
wx.navigateTo({
  url: `/pages/detail/detail?petId=${petId}`
});

// 返回上一页
wx.navigateBack();

// 重定向
wx.redirectTo({
  url: '/pages/index/index'
});
```

### 调试技巧

```typescript
// 1. 使用 console.log
console.log('调试信息', data);

// 2. 使用 wx.showToast 显示提示
wx.showToast({
  title: '提示文字',
  icon: 'success' // 'error', 'loading', 'none'
});

// 3. 使用 wx.showModal 显示对话框
wx.showModal({
  title: '标题',
  content: '内容',
  success(res) {
    if (res.confirm) {
      console.log('用户点击确定');
    }
  }
});
```

---

## 📱 真机测试

### 预览和调试

```
微信开发者工具 > 工具栏 > 预览
扫描生成的二维码
在真实微信中查看效果
```

### 使用真机调试

```
微信开发者工具 > 工具栏 > 真机调试
在真实设备上运行代码
可以查看完整的网络请求和日志
```

---

## 🐛 常见问题

### Q1: 地图不显示？

**可能原因：**
- ❌ 腾讯地图 Key 配置错误
- ❌ 未添加服务器合法域名
- ❌ 在模拟器中运行（某些功能仅支持真机）

**解决方案：**
```
1. 检查 services/tencentMapService.ts 中的 apiKey
2. 微信后台添加 https://apis.map.qq.com
3. 在真实设备上测试
```

### Q2: 定位失败？

**可能原因：**
- ❌ 未授予位置权限
- ❌ 网络问题
- ❌ 设备未启用定位

**解决方案：**
```
1. 微信设置 > 权限管理 > 开启"位置"
2. 确保网络连接正常
3. 在设备设置中启用 GPS
```

### Q3: 图片无法上传？

**可能原因：**
- ❌ 图片太大
- ❌ 格式不支持
- ❌ 本地存储空间不足

**解决方案：**
```
1. 压缩图片大小（<5MB）
2. 使用 JPG/PNG 格式
3. 清理其他应用占用的空间
```

### Q4: 如何集成后端 API？

```typescript
// 原来的本地存储
export const getStoredPets = (): Pet[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// 改为 API 调用
export const getStoredPets = async (): Promise<Pet[]> => {
  const response = await wx.request({
    url: 'https://your-backend.com/api/pets',
    method: 'GET'
  });
  return response.data;
};
```

---

## 📚 参考资源

### 官方文档
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/) 📖
- [腾讯地图 API 文档](https://lbs.qq.com/service/webservice/webservice-guide) 🗺️
- [Google Gemini API](https://ai.google.dev/) 🤖

### 学习资源
- [微信小程序开发教程](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [RESTful API 设计指南](https://restfulapi.net/)

---

## 🚀 部署和发布

### 上传到微信服务器

```
1. 微信开发者工具 > 工具栏 > 上传
2. 输入版本号和版本描述
3. 点击 "上传"
4. 在微信后台提交审核
```

### 发布步骤

```
1. 微信公众平台 > 版本管理 > 审核版本
2. 提交审核信息（应用介绍、使用说明等）
3. 等待微信官方审核（通常 1-5 个工作日）
4. 审核通过后点击 "发布" 上线
```

---

## 📝 未来计划

- [ ] 用户账户系统
- [ ] 云存储集成（微信云开发）
- [ ] 后端 API 对接
- [ ] 推送通知功能
- [ ] 分享到微信群功能
- [ ] 多语言支持
- [ ] 黑暗模式
- [ ] 离线模式

---

## 📄 开源协议

MIT License - 自由使用和修改 ❤️

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📞 获取帮助

遇到问题？

1. 📖 查看 `MINIPROGRAM_GUIDE.md` 详细指南
2. 🔍 搜索相关问题
3. 💬 提交 Issue 或联系我们

---

**做好事，救助宠物，让世界更温暖！** 🐾❤️
