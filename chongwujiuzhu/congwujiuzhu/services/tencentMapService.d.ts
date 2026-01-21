export declare const TENCENT_MAP_CONFIG: {
    apiKey: string;
    config: {
        key: string;
        version: string;
        libraries: string[];
    };
};
/**
 * 根据坐标获取地址（腾讯地图逆地理编码）
 * @param lat 纬度
 * @param lng 经度
 * @returns 返回地址字符串
 */
export declare function getAddressFromCoordinates(lat: number, lng: number): Promise<string>;
/**
 * 搜索地址（腾讯地图地址搜索）
 * @param keyword 搜索关键词
 * @param region 搜索区域（可选）
 * @returns 返回搜索结果数组
 */
export declare function searchPlace(keyword: string, region?: string): Promise<any[]>;
/**
 * 计算两点之间的距离（使用腾讯地图）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 返回距离（单位：米）
 */
export declare function calculateDistanceWithMap(lat1: number, lng1: number, lat2: number, lng2: number): number;
/**
 * 打开腾讯地图导航
 * @param latitude 目标纬度
 * @param longitude 目标经度
 * @param title 位置标题
 */
export declare function openMapNavigation(latitude: number, longitude: number, title?: string): void;
