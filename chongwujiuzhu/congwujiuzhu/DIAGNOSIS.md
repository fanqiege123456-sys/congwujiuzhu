// 微信小程序初始化诊断脚本
// 放在 app.ts 顶部运行以诊断初始化问题

console.log('[小程序诊断] 应用启动中...');

// 检查 wx 对象是否存在
if (typeof wx !== 'undefined') {
  console.log('[✓] wx 对象存在');
} else {
  console.error('[✗] wx 对象不存在 - 这不是微信小程序环境！');
}

// 检查 App 函数是否存在
if (typeof App !== 'undefined') {
  console.log('[✓] App 函数存在');
} else {
  console.error('[✗] App 函数不存在');
}

// 检查 Page 函数是否存在
if (typeof Page !== 'undefined') {
  console.log('[✓] Page 函数存在');
} else {
  console.error('[✗] Page 函数不存在');
}

// 检查 getApp 函数是否存在
if (typeof getApp !== 'undefined') {
  console.log('[✓] getApp 函数存在');
} else {
  console.error('[✗] getApp 函数不存在');
}

console.log('[小程序诊断] 环境检查完成');

// 延迟检查应用实例
setTimeout(() => {
  try {
    const app = getApp();
    if (app && app.globalData) {
      console.log('[✓] 应用已成功初始化');
      console.log('[✓] globalData 存在:', Object.keys(app.globalData));
    } else {
      console.warn('[⚠] getApp() 返回的对象不正确:', app);
    }
  } catch (e) {
    console.error('[✗] getApp() 调用失败:', e);
  }
}, 100);
