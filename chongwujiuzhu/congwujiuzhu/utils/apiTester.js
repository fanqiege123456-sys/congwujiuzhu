"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runApiTests = void 0;
const apiService_1 = require("../services/apiService");
const runApiTests = async () => {
    console.log('🚀 开始 API 接口全量测试...');
    wx.showLoading({ title: '正在测试接口...' });
    const log = (msg, type = 'info') => {
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        console.log(`${prefix} ${msg}`);
    };
    try {
        // 获取当前真实用户ID，以便测试通知功能
        const userProfile = wx.getStorageSync('userProfile');
        const myOpenId = userProfile?.openId || 'test-user-001';
        const myName = userProfile?.nickname || '[测试] 用户A';
        // 1. 用户同步 (User Sync)
        log('1. 测试用户同步接口...');
        await (0, apiService_1.apiPost)('/api/users', {
            openId: myOpenId,
            nickname: myName,
            avatarUrl: userProfile?.avatarUrl || 'http://example.com/avatar.png'
        });
        log('用户同步成功', 'success');
        // 2. 发布宠物 (Create Pet)
        log('2. 测试发布宠物接口...');
        const petRes = await (0, apiService_1.apiPost)('/api/pets', {
            description: '[测试数据] 自动测试发布的猫咪',
            location: { lat: 39.9042, lng: 116.4074 },
            address: '北京市东城区测试路1号',
            status: 'NEEDS_RESCUE',
            reporterName: myName,
            reporterOpenId: myOpenId,
            // 使用 Base64 图片防止 404 错误
            images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZmY2YjlkIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPlRFU1Q8L3RleHQ+PC9zdmc+']
        });
        const petId = petRes.data.id;
        if (!petId)
            throw new Error('未返回宠物ID');
        log(`发布宠物成功 (ID: ${petId})`, 'success');
        // 3. 获取宠物列表 (Get Pets)
        log('3. 测试获取宠物列表接口...');
        const petsRes = await (0, apiService_1.apiGet)('/api/pets');
        if (!Array.isArray(petsRes.data))
            throw new Error('返回格式错误');
        log(`获取宠物列表成功 (当前数量: ${petsRes.data.length})`, 'success');
        // 4. 提交救助记录 (Create Rescue Record)
        log('4. 测试提交救助记录接口...');
        await (0, apiService_1.apiPost)('/api/rescue-records', {
            petId: petId,
            rescuerName: '[测试] 救助侠B',
            rescuerOpenId: 'rescuer-001',
            rescueMethod: '现场救助',
            notes: '已送往医院',
            photos: []
        });
        log('提交救助记录成功', 'success');
        // 5. 获取救助历史 (Get Rescue History)
        log('5. 测试获取救助历史接口...');
        const historyRes = await (0, apiService_1.apiGet)(`/api/rescue-records/pet/${petId}`);
        if (!historyRes.data || historyRes.data.length === 0)
            throw new Error('未找到刚才提交的记录');
        log('获取救助历史成功', 'success');
        // 6. 提交审核 (Create Audit)
        log('6. 测试提交审核接口...');
        await (0, apiService_1.apiPost)('/api/audits', {
            petId: petId,
            reviewerName: '管理员',
            status: 'APPROVED',
            comment: '信息属实'
        });
        log('提交审核成功', 'success');
        // 7. 发布日常 (Create Community Post)
        log('7. 测试发布日常接口...');
        const postRes = await (0, apiService_1.apiPost)('/api/community/posts', {
            petId: petId,
            content: '[测试数据] 猫咪恢复得很好',
            images: [],
            authorName: myName,
            authorOpenId: myOpenId
        });
        const postId = postRes.data.id;
        if (!postId)
            throw new Error('未返回帖子ID');
        log(`发布日常成功 (ID: ${postId})`, 'success');
        // 8. 获取日常列表 (Get Posts)
        log('8. 测试获取日常列表接口...');
        await (0, apiService_1.apiGet)(`/api/community/posts?petId=${petId}`);
        log('获取日常列表成功', 'success');
        // 9. 获取单条日常 (Get Single Post)
        log('9. 测试获取单条日常接口...');
        await (0, apiService_1.apiGet)(`/api/community/posts/${postId}`);
        log('获取单条日常成功', 'success');
        // 10. 发表评论 (Create Comment)
        log('10. 测试发表评论接口...');
        await (0, apiService_1.apiPost)(`/api/community/posts/${postId}/comments`, {
            content: '太棒了！',
            authorName: '围观群众C',
            authorOpenId: 'watcher-001'
        });
        log('发表评论成功', 'success');
        // 11. 获取评论列表 (Get Comments)
        log('11. 测试获取评论列表接口...');
        const commentsRes = await (0, apiService_1.apiGet)(`/api/community/posts/${postId}/comments`);
        if (!commentsRes.data || commentsRes.data.length === 0)
            throw new Error('未找到刚才发表的评论');
        log('获取评论列表成功', 'success');
        // 12. 通知相关 (Notifications)
        log('12. 测试通知相关接口...');
        // 检查救助侠B是否收到评论通知
        const notifRes = await (0, apiService_1.apiGet)('/api/community/notifications?openId=rescuer-001');
        log(`获取通知列表成功 (数量: ${notifRes.data.length})`, 'success');
        await (0, apiService_1.apiGet)('/api/community/notifications/unread-count?openId=rescuer-001');
        log('获取未读数成功', 'success');
        await (0, apiService_1.apiPost)('/api/community/notifications/read', { openId: 'rescuer-001' });
        log('标记已读成功', 'success');
        // 13. 统计数据 (Statistics)
        log('13. 测试统计数据接口...');
        await (0, apiService_1.apiGet)('/api/statistics/overview');
        await (0, apiService_1.apiGet)('/api/statistics/trends');
        await (0, apiService_1.apiGet)('/api/statistics/regions');
        log('统计数据接口调用成功', 'success');
        wx.hideLoading();
        wx.showModal({
            title: '测试通过',
            content: '🎉 所有后端接口均调用成功！请查看控制台(Console)获取详细日志。',
            showCancel: false
        });
    }
    catch (error) {
        wx.hideLoading();
        console.error('测试失败:', error);
        const errMsg = error.errMsg || error.message || JSON.stringify(error);
        log(`测试中断: ${errMsg}`, 'error');
        wx.showModal({
            title: '测试失败',
            content: `接口调用出错：${errMsg}\n请检查后端服务是否启动且无报错。`,
            showCancel: false
        });
    }
};
exports.runApiTests = runApiTests;
