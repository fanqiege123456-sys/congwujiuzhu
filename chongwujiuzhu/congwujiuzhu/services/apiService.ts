const API_BASE_URL = 'https://cadmin.yibibao.com';
//const API_BASE_URL = 'http://localhost:3000';
export const apiRequest = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: any
): Promise<any> => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method,
      data,
      header: {
        'content-type': 'application/json'
      },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(res);
      },
      fail: (err: any) => {
        reject(err);
      }
    });
  });
};

export const apiGet = (path: string): Promise<any> => apiRequest('GET', path);
export const apiPost = (path: string, data: any): Promise<any> => apiRequest('POST', path, data);
export const apiPut = (path: string, data: any): Promise<any> => apiRequest('PUT', path, data);

export const uploadFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${API_BASE_URL}/api/uploads`,
      filePath,
      name: 'file',
      timeout: 120000,
      success: (res: any) => {
        try {
          const data = JSON.parse(res.data || '{}');
          if (data && data.data && data.data.url) {
            resolve(data.data.url);
            return;
          }
          reject(new Error('Upload response missing url'));
        } catch (err) {
          reject(err);
        }
      },
      fail: (err: any) => {
        reject(err);
      }
    });
  });
};
