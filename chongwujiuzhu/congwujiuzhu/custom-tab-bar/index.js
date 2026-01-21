Component({
  data: {
    selected: 0,
    color: "#ffffff",
    selectedColor: "#ffffff",
    unreadCount: 0,
    list: [{
      pagePath: "/pages/index/index",
      iconPath: "/assets/tabbar/map.png",
      selectedIconPath: "/assets/tabbar/map-active.png",
      text: "地图"
    }, {
      pagePath: "/pages/list/list",
      iconPath: "/assets/tabbar/list.png",
      selectedIconPath: "/assets/tabbar/list-active.png",
      text: "列表"
    }, {
      pagePath: "/pages/community/community",
      iconPath: "/assets/tabbar/add.png",
      selectedIconPath: "/assets/tabbar/add-active.png",
      text: "社区"
    }, {
      pagePath: "/pages/profile/profile",
      iconPath: "/assets/tabbar/list.png",
      selectedIconPath: "/assets/tabbar/list-active.png",
      text: "我的"
    }]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
    }
  }
})