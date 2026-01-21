"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.apiPut = exports.apiPost = exports.apiGet = exports.apiRequest = void 0;
const API_BASE_URL = 'https://cadmin.yibibao.com';
//const API_BASE_URL = 'http://localhost:3000';
const apiRequest = (method, path, data) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}${path}`,
            method,
            data,
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                    return;
                }
                reject(res);
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};
exports.apiRequest = apiRequest;
const apiGet = (path) => (0, exports.apiRequest)('GET', path);
exports.apiGet = apiGet;
const apiPost = (path, data) => (0, exports.apiRequest)('POST', path, data);
exports.apiPost = apiPost;
const apiPut = (path, data) => (0, exports.apiRequest)('PUT', path, data);
exports.apiPut = apiPut;
const uploadFile = (filePath) => {
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: `${API_BASE_URL}/api/uploads`,
            filePath,
            name: 'file',
            timeout: 120000,
            success: (res) => {
                try {
                    const data = JSON.parse(res.data || '{}');
                    if (data && data.data && data.data.url) {
                        resolve(data.data.url);
                        return;
                    }
                    reject(new Error('Upload response missing url'));
                }
                catch (err) {
                    reject(err);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};
exports.uploadFile = uploadFile;
