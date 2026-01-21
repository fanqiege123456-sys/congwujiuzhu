"use strict";
// 腾讯地图 API 配置和工具
// 需要在腾讯地图官方申请 Key: https://lbs.qq.com/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENCENT_MAP_CONFIG = void 0;
exports.getAddressFromCoordinates = getAddressFromCoordinates;
exports.searchPlace = searchPlace;
exports.calculateDistanceWithMap = calculateDistanceWithMap;
exports.openMapNavigation = openMapNavigation;
exports.TENCENT_MAP_CONFIG = {
    // 替换为您的腾讯地图 Key
    apiKey: 'YOUR_TENCENT_MAP_API_KEY_HERE',
    // 地图中文显示的相关配置
    config: {
        key: 'YOUR_TENCENT_MAP_API_KEY_HERE',
        version: '1.47.8',
        libraries: ['service']
    }
};
/**
 * 根据坐标获取地址（腾讯地图逆地理编码）
 * @param lat 纬度
 * @param lng 经度
 * @returns 返回地址字符串
 */
async function getAddressFromCoordinates(lat, lng) {
    return new Promise((resolve, reject) => {
        // 在微信小程序中使用 wx.request 调用腾讯地图 API
        wx.request({
            url: 'https://apis.map.qq.com/ws/geocoder/v1/',
            method: 'GET',
            data: {
                location: `${lat},${lng}`,
                key: exports.TENCENT_MAP_CONFIG.apiKey,
                get_poi: 1
            },
            success: (res) => {
                if (res.data.status === 0) {
                    const address = res.data.result.address || '未知地址';
                    resolve(address);
                }
                else {
                    reject(new Error('获取地址失败'));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
/**
 * 搜索地址（腾讯地图地址搜索）
 * @param keyword 搜索关键词
 * @param region 搜索区域（可选）
 * @returns 返回搜索结果数组
 */
async function searchPlace(keyword, region) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: 'https://apis.map.qq.com/ws/place/v1/search',
            method: 'GET',
            data: {
                keyword: keyword,
                region: region || '全国',
                key: exports.TENCENT_MAP_CONFIG.apiKey,
                page_size: 10,
                page_index: 1
            },
            success: (res) => {
                if (res.data.status === 0) {
                    resolve(res.data.data || []);
                }
                else {
                    reject(new Error('搜索失败'));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
/**
 * 计算两点之间的距离（使用腾讯地图）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 返回距离（单位：米）
 */
function calculateDistanceWithMap(lat1, lng1, lat2, lng2) {
    // Haversine formula
    const R = 6371; // 地球半径（单位：千米）
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // 转换为米
    return Math.round(distance);
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
/**
 * 打开腾讯地图导航
 * @param latitude 目标纬度
 * @param longitude 目标经度
 * @param title 位置标题
 */
function openMapNavigation(latitude, longitude, title = '目标位置') {
    // 在微信小程序中打开地图导航
    wx.openLocation({
        latitude: latitude,
        longitude: longitude,
        name: title,
        address: title,
        scale: 16
    });
}
