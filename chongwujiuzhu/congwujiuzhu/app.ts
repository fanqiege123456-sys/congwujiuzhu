import { Pet, Coordinates, PetStatus, UserProfile } from './types';
import { getStoredPets, savePet, updatePet, calculateDistance, syncPetsFromServer } from './services/storageService';
import { apiGet } from './services/apiService';
import { loginOrRegister, loginWithCode } from './services/userService';

const DEFAULT_LOCATION: Coordinates = { lat: 39.9042, lng: 116.4074 }; // Beijing fallback
const SEARCH_RADIUS_KM = 50;

type AppPage = any;

interface AppOption {
  globalData: {
    userLocation: Coordinates | null;
    userProfile: UserProfile | null;
    pets: Pet[];
    filteredPets: Pet[];
    selectedPet: Pet | null;
    showNeedsRescue: boolean;
    showRescued: boolean;
  };
  onLaunch: () => void;
  onShow: () => void;
  onHide: () => void;
  getUserLocation: () => Promise<Coordinates>;
  loadPets: (center: Coordinates) => void;
  filterPets: (allPets: Pet[], center: Coordinates) => void;
  savePet: (pet: Pet) => void;
  updatePet: (pet: Pet) => void;
  refreshLocation: () => void;
  _getActualLocation?: (resolve: any, reject: any) => void;
  _useDefaultLocation?: (resolve: any) => void;
  wgs84ToGcj02?: (lat: number, lng: number) => { lat: number; lng: number };
  transformLat?: (lng: number, lat: number) => number;
  transformLng?: (lng: number, lat: number) => number;
  checkUnreadNotifications: () => void;
}

const app: AppOption = {
  globalData: {
    userLocation: null,
    userProfile: null,
    pets: [],
    filteredPets: [],
    selectedPet: null,
    showNeedsRescue: true,
    showRescued: true
  },

  onLaunch() {
    // 先同步数据，让详情页可以无权限浏览
    syncPetsFromServer()
      .then(() => {
        // 数据加载后，如果有存储的定位信息就用
        const savedLocation = wx.getStorageSync('userLocation');
        if (savedLocation && savedLocation.lat && savedLocation.lng) {
          this.globalData.userLocation = savedLocation;
          this.loadPets(savedLocation);
        } else {
          // 没有存储的定位，使用默认位置加载数据
          this.globalData.userLocation = DEFAULT_LOCATION;
          this.loadPets(DEFAULT_LOCATION);
        }
      })
      .catch(() => {
        console.warn('同步数据失败');
        this.globalData.userLocation = DEFAULT_LOCATION;
        this.loadPets(DEFAULT_LOCATION);
      });

    // Check for updates
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否立即更新？',
            success: (res) => {
              if (res.confirm) {
                updateManager.applyUpdate();
              }
            }
          });
        });
      }
    });

    // Initialize user profile
    const initUser = async () => {
      const storedProfile = wx.getStorageSync('userProfile');
      if (storedProfile) {
        this.globalData.userProfile = storedProfile;
        return;
      }

      // 尝试微信登录获取持久化 OpenID
      try {
        const res = await loginWithCode();
        // 假设后端返回格式为 { code: 200, data: { openId: '...', ... } }
        if (res && (res.code === 200 || res.success) && res.data && res.data.openId) {
          this.globalData.userProfile = {
            nickname: res.data.nickname || '微信用户',
            avatarUrl: res.data.avatarUrl || '',
            openId: res.data.openId,
            displayId: res.data.displayId
          };
          wx.setStorageSync('userProfile', this.globalData.userProfile);
          return;
        }
      } catch (e) {
        console.warn('微信登录失败，降级为本地随机ID', e);
      }

      // 降级方案：生成本地随机 ID
      let openId = wx.getStorageSync('user_openid');
      if (!openId) {
        openId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        wx.setStorageSync('user_openid', openId);
      }
      this.globalData.userProfile = {
        nickname: '匿名用户',
        avatarUrl: '',
        openId: openId
      };
      wx.setStorageSync('userProfile', this.globalData.userProfile);
    };

    initUser();

    // 预取用户信息（已授权时）
    wx.getSetting({
      success: (settingRes) => {
        if (settingRes.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (infoRes) => {
              const userInfo = infoRes.userInfo || {};
              const currentProfile = this.globalData.userProfile || {};
              const newProfile = {
                ...currentProfile,
                nickname: userInfo.nickName || currentProfile.nickname || '匿名用户',
                avatarUrl: userInfo.avatarUrl || currentProfile.avatarUrl || ''
              };
              this.globalData.userProfile = newProfile;
              wx.setStorageSync('userProfile', newProfile);
              
              // Sync to backend
              loginOrRegister(newProfile).catch(console.error);
            }
          });
        }
      }
    });
  },

  onShow() {
    console.log("App showed");
  },

  onHide() {
    console.log("App hidden");
  },

  getUserLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (settingRes) => {
          const hasLocationPermission = settingRes.authSetting['scope.userLocation'];
          
          if (hasLocationPermission === false) {
            // 用户之前拒绝过，引导到设置页
            wx.showModal({
              title: '需要位置权限',
              content: '使用地图功能需要您的位置信息，请在设置中允许微信访问您的位置。',
              confirmText: '去设置',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success: (settingRes) => {
                      if (settingRes.authSetting['scope.userLocation']) {
                        this._getActualLocation(resolve, reject);
                      } else {
                        this._useDefaultLocation(resolve);
                      }
                    }
                  });
                } else {
                  this._useDefaultLocation(resolve);
                }
              }
            });
          } else {
            // 未授权或已授权，直接调用 getLocation（会自动弹权限）
            this._getActualLocation(resolve, reject);
          }
        },
        fail: () => {
          // getSetting 失败，尝试直接获取位置
          this._getActualLocation(resolve, reject);
        }
      });
    });
  },

  _getActualLocation(resolve: any, reject: any) {
    console.log('🔍 [app._getActualLocation] 开始定位...');
    
    // 先尝试普通定位（更快、更可靠）
    wx.getLocation({
      type: 'wgs84', // 微信默认支持最好
      isHighAccuracy: false,
      success: (res: any) => {
        console.log('✓ [app] 普通定位成功 (wgs84):', res);
        // 转换为 GCJ02（中国坐标系）
        const gcj02 = this.wgs84ToGcj02(res.latitude, res.longitude);
        console.log('✓ [app] 坐标转换成功 (gcj02):', gcj02);
        const location = {
          lat: gcj02.lat,
          lng: gcj02.lng
        };
        // 保存到存储
        wx.setStorageSync('userLocation', location);
        resolve(location);
      },
      fail: (err: any) => {
        console.warn('✗ [app] 普通定位失败:', err);
        console.log('🔄 [app] 尝试高精度定位...');
        
        // 尝试高精度定位
        wx.getLocation({
          type: 'gcj02',
          isHighAccuracy: true,
          highAccuracyExpireTime: 8000, // 增加到 8 秒
          success: (res: any) => {
            console.log('✓ [app] 高精度定位成功 (gcj02):', res);
            const location = {
              lat: res.latitude,
              lng: res.longitude
            };
            // 保存到存储
            wx.setStorageSync('userLocation', location);
            resolve(location);
          },
          fail: (err2: any) => {
            console.error('✗ [app] 高精度定位也失败:', err2);
            console.warn('⚠️ [app] 定位失败，返回默认位置');
            // 两次都失败了，使用默认位置
            this._useDefaultLocation(resolve);
          }
        });
      }
    });
  },

  /**
   * WGS84 转 GCJ02（中国坐标系）
   */
  wgs84ToGcj02(lat: number, lng: number): { lat: number; lng: number } {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    
    let dLat = this.transformLat(lng - 105.0, lat - 35.0);
    let dLng = this.transformLng(lng - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    
    const mgLat = lat + dLat;
    const mgLng = lng + dLng;
    
    return { lat: mgLat, lng: mgLng };
  },

  transformLat(lng: number, lat: number): number {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0);
    ret += ((20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0);
    ret += ((160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0);
    return ret;
  },

  transformLng(lng: number, lat: number): number {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0);
    ret += ((20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0);
    ret += ((150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0);
    return ret;
  },

  _useDefaultLocation(resolve: any) {
    resolve({
      lat: 39.9042, // 北京天安门
      lng: 116.4074
    });
  },

  loadPets(center: Coordinates) {
    const allPets = getStoredPets();
    this.globalData.pets = allPets;
    this.filterPets(allPets, center);
  },

  filterPets(allPets: Pet[], center: Coordinates, radius: number = SEARCH_RADIUS_KM) {
    console.log(`🔍 [Filter] 开始筛选: 中心点 [${center.lat}, ${center.lng}], 半径 ${radius}km, 总数 ${allPets.length}`);
    
    const nearby = allPets.filter(pet => {
      const dist = calculateDistance(center, pet.location);
      const isApproved = pet.auditStatus === 'APPROVED';
      const passed = dist <= radius && isApproved;
      
      // 仅在调试时打印前几个或特定距离的
      if (passed || dist < radius * 2) {
         console.log(`   - 宠物 ${pet.id} (${pet.description?.substring(0, 10)}...): 距离 ${dist.toFixed(2)}km, 状态 ${pet.auditStatus} => ${passed ? '保留' : '过滤'}`);
      }
      
      return passed;
    });

    console.log(`✅ [Filter] 筛选结果: ${nearby.length} 个宠物`);

    // 排序：待救助优先，然后按时间戳排序
    nearby.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === PetStatus.NEEDS_RESCUE ? -1 : 1;
      }
      return b.timestamp - a.timestamp;
    });

    this.globalData.filteredPets = nearby;
  },

  savePet(pet: Pet) {
    const updatedList = savePet(pet);
    this.globalData.pets = updatedList;
    if (this.globalData.userLocation) {
      this.filterPets(updatedList, this.globalData.userLocation);
    }
  },

  updatePet(pet: Pet) {
    const updatedList = updatePet(pet);
    this.globalData.pets = updatedList;
    if (this.globalData.userLocation) {
      this.filterPets(updatedList, this.globalData.userLocation);
    }
    this.globalData.selectedPet = pet;
  },

  refreshLocation() {
    this.getUserLocation().then(location => {
      this.globalData.userLocation = location;
      this.filterPets(this.globalData.pets, location);
      // 通知所有页面更新
      const pages = getCurrentPages();
      pages.forEach(page => {
        if (page.onLocationRefresh) {
          page.onLocationRefresh();
        }
      });
    }).catch(error => {
      console.warn("刷新位置失败", error);
    });
  },

  checkUnreadNotifications() {
    const userProfile = this.globalData.userProfile || wx.getStorageSync('userProfile');
    if (!userProfile || !userProfile.openId) return;

    apiGet(`/api/community/notifications/unread-count?openId=${userProfile.openId}`)
      .then((res: any) => {
        const count = res.data.count;
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage && typeof currentPage.getTabBar === 'function') {
          const tabBar = currentPage.getTabBar();
          if (tabBar) {
            tabBar.setData({ unreadCount: count });
          }
        }
      })
      .catch((err: any) => console.error('Failed to check unread:', err));
  }
};

App(app);

export default app as any;
