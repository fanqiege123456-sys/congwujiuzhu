# 腾讯地图接入完整指南

## 一、获取腾讯地图 API Key

### 1. 注册腾讯位置服务账户
- 访问：https://lbs.qq.com/
- 点击「登录」-> 「注册新账户」或使用微信/QQ登录
- 完成实名认证

### 2. 创建应用并获取 Key
1. 登录后进入「控制台」-> 「应用管理」
2. 点击「创建应用」
3. 填写应用信息：
   - **应用名称**：流浪萌宠救助小程序
   - **应用类型**：选择「微信小程序」
   - **应用描述**：宠物救助平台
4. 创建完成后，在应用详情中复制 **Key**

### 3. 配置应用的应用类型和服务
1. 在应用详情页面，找到「服务」选项
2. 勾选以下服务：
   - ✅ 地图展示（Map）
   - ✅ 位置搜索（PlaceSearch）
   - ✅ 转换坐标系（Geocoding）- 用于地址转换

## 二、配置小程序

### 1. 更新 `services/tencentMapService.ts` 中的 API Key

在第 5 行找到：
```typescript
apiKey: 'YOUR_TENCENT_MAP_API_KEY_HERE',
```

替换为你的腾讯地图 Key：
```typescript
apiKey: 'YOUR_ACTUAL_KEY_FROM_TENCENT_LBS',
```

**例如：**
```typescript
apiKey: 'ABCDE12345FGHIJ67890KLMNO',
```

### 2. 在微信开发者工具中配置

#### 方式A：微信开发者工具中配置（推荐）
1. 打开微信开发者工具
2. 点击「工具」->「代理设置」
3. 配置规则：
   ```
   Pattern: https://apis.map.qq.com
   Replace: https://apis.map.qq.com
   ```

#### 方式B：在 project.config.json 中配置
已在 `app.json` 中添加了 `networkTimeout` 配置。

#### 方式C：使用本地服务器代理（开发阶段）
如果地图仍不显示，在微信开发者工具中：
1. 点击「详情」->「不校验合法域名...」（仅用于开发）

### 3. 设置域名白名单（生产环境必须）

在微信公众平台小程序管理后台：
1. 登录：https://mp.weixin.qq.com/
2. 进入你的小程序 -> 设置 -> 开发设置
3. 在「服务器域名」中添加：
   
   **业务域名：**
   ```
   https://apis.map.qq.com
   ```

4. 上传有效的 SSL 证书验证文件（腾讯会提供）

## 三、验证腾讯地图是否正常工作

### 方法1：检查地图是否加载
1. 在微信开发者工具中运行小程序
2. 点击「地图」选项卡
3. 查看地图是否显示：
   - ✅ 地图背景显示（不再是白色空白）
   - ✅ 可以看到街道、地标信息
   - ✅ 用户位置标记显示
   - ✅ 宠物位置标记显示

### 方法2：检查控制台日志
在微信开发者工具的「Console」标签查看：
- 是否有地图加载错误信息
- 是否有 API Key 错误提示
- 网络请求是否成功 (status: 0 表示成功)

### 方法3：测试 API 调用
在开发者工具 Console 中运行测试：
```javascript
// 测试腾讯地图 API 是否可用
wx.request({
  url: 'https://apis.map.qq.com/ws/geocoder/v1/',
  method: 'GET',
  data: {
    location: '39.9042,116.4074',
    key: 'YOUR_API_KEY_HERE',
    get_poi: 1
  },
  success: (res) => {
    console.log('腾讯地图 API 调用成功:', res);
  },
  fail: (err) => {
    console.error('腾讯地图 API 调用失败:', err);
  }
});
```

## 四、常见问题解决

### 地图显示白色空白
**原因 1：** API Key 未配置或错误
- **解决：** 确保在 `services/tencentMapService.ts` 中正确配置了 Key

**原因 2：** 域名未添加到白名单
- **解决：** 
  - 开发阶段：在微信开发者工具中点击「不校验合法域名...」
  - 生产环境：在微信公众平台添加域名白名单

**原因 3：** 腾讯地图服务未激活
- **解决：** 在腾讯位置服务控制台确保已激活「地图展示」服务

### API 请求返回 401 或 403
**原因：** Key 无效或权限不足
- **解决：** 
  1. 检查 Key 是否正确复制（不含空格）
  2. 在腾讯位置服务中验证 Key 是否有效
  3. 确保应用已激活相应的 API 服务

### 标记点不显示
**原因：** 标记坐标格式错误或超出可见范围
- **解决：** 
  1. 检查宠物坐标是否有效（范围：纬度 -90~90，经度 -180~180）
  2. 检查地图中心点设置是否正确
  3. 确保 `mapMarkers` 数据格式正确

### 获取用户位置失败
**原因：** 未获得位置权限或 GPS 关闭
- **解决：** 
  1. 检查 `app.json` 中是否添加了位置权限申请
  2. 在手机开发环境中确保已开启位置权限
  3. 检查控制台是否有权限相关的错误信息

## 五、API 调用示例

### 获取地址（逆地理编码）
```typescript
import { getAddressFromCoordinates } from '../../services/tencentMapService';

const address = await getAddressFromCoordinates(39.9042, 116.4074);
console.log('当前地址:', address);
```

### 搜索地点
```typescript
import { searchPlace } from '../../services/tencentMapService';

const results = await searchPlace('宠物医院', 39.9042, 116.4074);
console.log('搜索结果:', results);
```

### 计算距离
```typescript
import { calculateDistanceWithMap } from '../../services/tencentMapService';

const distance = await calculateDistanceWithMap(
  { latitude: 39.9042, longitude: 116.4074 },
  { latitude: 39.9100, longitude: 116.4200 }
);
console.log('距离:', distance);
```

### 打开地图导航
```typescript
import { openMapNavigation } from '../../services/tencentMapService';

openMapNavigation(
  '宠物医院',
  39.9100,
  116.4200,
  '去拯救这只小猫咪'
);
```

## 六、生产环境部署

### 1. 获取域名验证文件
1. 在微信公众平台添加 `https://apis.map.qq.com`
2. 下载腾讯颁发的验证文件
3. 上传至你的服务器根目录

### 2. SSL 证书配置
- 确保你的小程序所有请求都使用 HTTPS
- 小程序不支持 HTTP 请求

### 3. 提交审核
1. 完成上述所有配置后
2. 在微信公众平台提交小程序审核
3. 腾讯地图功能会在审核通过后正常工作

## 七、支持资源

- 腾讯位置服务官网：https://lbs.qq.com/
- 小程序地图组件文档：https://developers.weixin.qq.com/miniprogram/dev/component/map.html
- 腾讯地图 WebAPI 文档：https://lbs.qq.com/service/webapi/
- 小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/

**需要帮助？** 在微信开发者工具的 Console 中查看错误日志，确认 API Key 是否有效！
