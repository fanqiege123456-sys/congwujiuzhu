# WeChat 小程序原生地图使用指南

## 概述

本项目使用 **WeChat 小程序内置的地图组件**，不需要任何外部 API Key！

### 优势
✅ 无需配置 API Key
✅ 无需添加域名白名单
✅ 原生性能，加载更快
✅ 完全免费使用
✅ 支持中文地图和位置定位

## 功能说明

### 1. 地图显示
小程序使用原生 `<map>` 组件显示地图，自动调用手机系统的地图数据。

**使用位置：** `pages/index/index.wxml`
```wxml
<map
  id="map"
  longitude="{{mapRegion.longitude}}"
  latitude="{{mapRegion.latitude}}"
  scale="{{mapRegion.scale}}"
  markers="{{mapMarkers}}"
  bindmarkertap="handleMarkerTap"
  style="width: 100%; height: 100%;"
  show-location
></map>
```

### 2. 标记点（Markers）
使用 emoji 表情作为标记点，无需图片资源：
- 📍 用户当前位置
- 🆘 需要救助的宠物（红色）
- ✅ 已救助的宠物（绿色）

### 3. 获取用户位置
```typescript
import { getUserLocation } from '../../services/nativeMapService';

const location = await getUserLocation();
console.log('当前位置:', location);
```

### 4. 打开地图选择位置
用户可以在地图上选择一个位置：
```typescript
import { chooseLocation } from '../../services/nativeMapService';

const selected = await chooseLocation();
console.log('选择的位置:', selected);
```

### 5. 打开系统地图应用
跳转到微信内置的地图应用查看位置或导航：
```typescript
import { openMap } from '../../services/nativeMapService';

openMap(39.9042, 116.4074, '需要救助的地点');
```

### 6. 距离计算
计算两点之间的距离（无需 API 调用）：
```typescript
import { calculateDistance, formatDistance } from '../../services/nativeMapService';

const distance = calculateDistance(
  { lat: 39.9042, lng: 116.4074 },
  { lat: 39.9100, lng: 116.4200 }
);

console.log(formatDistance(distance)); // 输出: "5.2公里"
```

### 7. 范围检查
检查某个坐标是否在指定范围内：
```typescript
import { isWithinRadius } from '../../services/nativeMapService';

const isNearby = isWithinRadius(
  { lat: 39.9042, lng: 116.4074 }, // 待检查坐标
  { lat: 39.9000, lng: 116.4000 }, // 中心坐标
  5000 // 半径 5000 米
);
```

## 配置步骤

### 1. 权限申请
app.json 中已配置位置权限申请：
```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "获取您的位置用于显示地图和查找附近的救助信息"
    }
  },
  "requiredPrivateInfos": [
    "chooseLocation"
  ]
}
```

### 2. 首次运行
用户首次运行小程序时，系统会申请以下权限：
- **位置权限** - 用于获取用户当前位置
- **地图选择** - 用户在发布救助信息时可以选择位置

### 3. 用户需要做的事
在手机设置中确保：
- ✅ 微信已获得位置权限（开启）
- ✅ 手机已开启 GPS 或定位服务

## 工作流程

### 地图页面流程
```
onLoad()
  ↓
获取地图上下文 (wx.createMapContext)
  ↓
从全局数据加载宠物列表
  ↓
生成标记点 (updateMapMarkers)
  ↓
显示地图和标记点
  ↓
用户点击标记 → 查看宠物详情
用户点击发布按钮 → 跳转到发布页面
用户点击刷新位置 → 重新获取当前位置
```

### 发布救助信息流程
```
报告页面加载
  ↓
用户上传照片/视频
  ↓
用户点击"选择位置"
  ↓
打开地图选择界面
  ↓
用户在地图上选择位置
  ↓
自动填充地址和坐标
  ↓
用户输入描述并提交
  ↓
位置数据保存到本地存储
```

## 常见问题

### Q: 地图显示空白
**A:** 这通常是因为：
1. 手机未连接网络 → 检查网络连接
2. 未授予位置权限 → 在手机设置中允许微信访问位置
3. 小程序初始位置加载失败 → 手动刷新页面

### Q: 标记点显示不正确
**A:** 检查以下内容：
1. 确保宠物数据包含有效的坐标 (lat/lng)
2. 纬度范围：-90 到 90
3. 经度范围：-180 到 180

### Q: 获取位置很慢
**A:** 这是正常的，首次获取位置可能需要 3-5 秒。使用 `wx.showLoading()` 提示用户。

### Q: 如何自定义标记外观
**A:** 编辑 `updateMapMarkers()` 方法中的标记定义：
```typescript
label: {
  content: '🆘',           // 修改 emoji
  color: '#FF6B9D',        // 修改文字颜色
  fontSize: 20,            // 修改大小
  bgColor: '#fff',         // 修改背景色
  padding: [3, 5, 3, 5]    // 修改内边距
}
```

## 地图区域控制

### 自动缩放至显示所有标记
```typescript
import { calculateViewRegion } from '../../services/nativeMapService';

const allCoords = filteredPets.map(p => p.location);
const region = calculateViewRegion(allCoords);

this.setData({ mapRegion: region });
```

### 获取推荐缩放级别
```typescript
import { getRecommendedZoomLevel } from '../../services/nativeMapService';

const zoomLevel = getRecommendedZoomLevel(5000); // 5km 距离
```

## 地图控件说明

### show-location 属性
小程序地图支持以下属性：
- `show-location="true"` - 显示用户位置（默认）
- `show-compass="true"` - 显示指南针
- `show-scale="true"` - 显示比例尺

可以在 `index.wxml` 中修改。

## 优化建议

### 1. 地图性能优化
- 不要一次显示超过 100 个标记点
- 定期清理过期数据
- 使用 `scale` 属性控制初始缩放级别

### 2. 位置获取优化
```typescript
// 缓存位置，避免频繁调用
let cachedLocation = null;
let lastFetchTime = 0;

function getCachedLocation() {
  const now = Date.now();
  if (cachedLocation && (now - lastFetchTime) < 60000) {
    return Promise.resolve(cachedLocation);
  }
  return getUserLocation().then(loc => {
    cachedLocation = loc;
    lastFetchTime = now;
    return loc;
  });
}
```

### 3. 标记点优化
```typescript
// 当有大量宠物时，只显示可见范围内的标记
const visibleMarkers = markers.filter(m => {
  return isWithinRadius(
    { lat: m.latitude, lng: m.longitude },
    mapCenter,
    visibleRadius
  );
});
```

## 相关文件

- **地图页面：** `pages/index/index.ts|wxml|wxss`
- **地图服务：** `services/nativeMapService.ts`
- **发布页面：** `pages/report/report.ts`
- **应用配置：** `app.json`
- **全局脚本：** `app.ts`

## 推荐资源

- [WeChat 小程序地图组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/map.html)
- [WeChat 小程序 API - wx.getLocation()](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html)
- [WeChat 小程序 API - wx.chooseLocation()](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html)
- [WeChat 小程序 API - wx.openLocation()](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.openLocation.html)

---

**总结：** 小程序原生地图完全免费，无需任何配置，直接可用！🎉
