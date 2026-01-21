import { apiPost, apiGet } from './apiService';

export interface UserProfile {
    nickname: string;
    avatarUrl: string;
    openId?: string;
    displayId?: string;
}

export const loginOrRegister = async (profile: UserProfile): Promise<UserProfile> => {
    // 如果没有 openId，生成一个本地 ID 作为替代 (模拟)
    // 在真实的小程序中，应该通过 wx.login 获取 code，然后后端换取 openId
    // 这里为了简化，如果本地没有 openId，就生成一个随机的
    let openId = profile.openId;
    if (!openId) {
        openId = wx.getStorageSync('user_openid');
        if (!openId) {
            openId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
            wx.setStorageSync('user_openid', openId);
        }
    }

    try {
        const res = await apiPost('/api/users', {
            openId,
            nickname: profile.nickname,
            avatarUrl: profile.avatarUrl
        });
        
        if (res && res.code === 200) {
            return { ...profile, openId };
        }
        throw new Error(res.message || 'Login failed');
    } catch (err) {
        console.error('User login/register failed', err);
        // 即使后端失败，也返回带有 openId 的 profile，保证前端流程继续
        return { ...profile, openId };
    }
};

export const loginWithCode = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
        wx.login({
            success: async (res) => {
                if (res.code) {
                    try {
                        // 发送 code 到后端换取 openId
                        const serverRes = await apiPost('/api/auth/wechat', { code: res.code });
                        resolve(serverRes);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('wx.login failed: ' + res.errMsg));
                }
            },
            fail: (err) => reject(err)
        });
    });
};
