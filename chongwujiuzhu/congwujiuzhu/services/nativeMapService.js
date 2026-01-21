"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wgs84ToGcj02 = wgs84ToGcj02;
exports.getUserLocation = getUserLocation;
exports.chooseLocation = chooseLocation;
exports.openMap = openMap;
exports.calculateDistance = calculateDistance;
exports.formatDistance = formatDistance;
exports.isWithinRadius = isWithinRadius;
exports.getRecommendedZoomLevel = getRecommendedZoomLevel;
exports.createMarker = createMarker;
exports.calculateViewRegion = calculateViewRegion;
function wgs84ToGcj02(lat, lng) {
    return { lat, lng };
}
function getUserLocation() {
    return new Promise((resolve, reject) => {
        wx.getLocation({
            type: 'wgs84',
            success: (res) => {
                resolve({ lat: res.latitude, lng: res.longitude });
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
function chooseLocation() {
    return new Promise((resolve, reject) => {
        wx.chooseLocation({
            success: (res) => {
                resolve({
                    lat: res.latitude,
                    lng: res.longitude,
                    name: res.name || '',
                    address: res.address || ''
                });
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
function openMap(latitude, longitude, name = 'Location') {
    wx.openLocation({
        latitude,
        longitude,
        name
    });
}
function calculateDistance(from, to) {
    const R = 6371000;
    const dLat = deg2rad(to.lat - from.lat);
    const dLng = deg2rad(to.lng - from.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(from.lat)) *
            Math.cos(deg2rad(to.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
function formatDistance(meters) {
    if (meters < 1000)
        return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}
function isWithinRadius(coord, center, radiusMeters) {
    return calculateDistance(coord, center) <= radiusMeters;
}
function getRecommendedZoomLevel(distanceMeters) {
    if (distanceMeters > 50000)
        return 10;
    if (distanceMeters > 20000)
        return 12;
    if (distanceMeters > 5000)
        return 14;
    if (distanceMeters > 1000)
        return 16;
    return 18;
}
function createMarker(id, coords, title, emoji = '') {
    return {
        id,
        latitude: coords.lat,
        longitude: coords.lng,
        title: emoji ? `${emoji} ${title}` : title
    };
}
function calculateViewRegion(coords) {
    if (!coords.length) {
        return { latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
    let minLat = coords[0].lat;
    let maxLat = coords[0].lat;
    let minLng = coords[0].lng;
    let maxLng = coords[0].lng;
    coords.forEach((c) => {
        minLat = Math.min(minLat, c.lat);
        maxLat = Math.max(maxLat, c.lat);
        minLng = Math.min(minLng, c.lng);
        maxLng = Math.max(maxLng, c.lng);
    });
    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.01, maxLat - minLat + 0.01),
        longitudeDelta: Math.max(0.01, maxLng - minLng + 0.01)
    };
}
exports.default = {
    getUserLocation,
    chooseLocation,
    openMap,
    calculateDistance,
    formatDistance,
    isWithinRadius,
    getRecommendedZoomLevel,
    createMarker,
    calculateViewRegion
};
