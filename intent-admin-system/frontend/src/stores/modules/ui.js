import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // 侧边栏状态
    sidebarCollapsed: false,
    
    // 主题设置
    theme: 'light',
    
    // 布局设置
    layout: 'default',
    
    // 加载状态
    loading: false,
    
    // 面包屑导航
    breadcrumbs: [],
    
    // 页面标题
    pageTitle: '智能音箱意图管理系统',
    
    // 全局消息
    globalMessage: null,
    
    // 设备类型
    deviceType: 'desktop',
    
    // 屏幕尺寸
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    
    // 对话框状态
    dialogs: {
      // 意图编辑对话框
      intentDialog: false,
      // 分类编辑对话框
      categoryDialog: false,
      // 设置对话框
      settingsDialog: false,
      // 确认对话框
      confirmDialog: false
    },
    
    // 表格设置
    tableSettings: {
      pageSize: 10,
      sortBy: 'id',
      sortOrder: 'desc'
    }
  }),
  
  getters: {
    // 是否为移动设备
    isMobile: (state) => state.deviceType === 'mobile',
    
    // 是否为暗色主题
    isDarkTheme: (state) => state.theme === 'dark',
    
    // 侧边栏宽度
    sidebarWidth: (state) => state.sidebarCollapsed ? 64 : 240,
    
    // 主内容区域宽度
    mainContentWidth: (state) => state.screenSize.width - (state.sidebarCollapsed ? 64 : 240)
  },
  
  actions: {
    // 切换侧边栏状态
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    // 设置侧边栏状态
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed
    },
    
    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
    
    // 设置主题
    setTheme(theme) {
      this.theme = theme
    },
    
    // 设置加载状态
    setLoading(loading) {
      this.loading = loading
    },
    
    // 设置面包屑导航
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs
    },
    
    // 设置页面标题
    setPageTitle(title) {
      this.pageTitle = title
      document.title = title
    },
    
    // 显示全局消息
    showMessage(message) {
      this.globalMessage = message
      setTimeout(() => {
        this.globalMessage = null
      }, 3000)
    },
    
    // 设置设备类型
    setDeviceType(type) {
      this.deviceType = type
    },
    
    // 更新屏幕尺寸
    updateScreenSize() {
      this.screenSize = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      
      // 根据屏幕尺寸自动判断设备类型
      if (window.innerWidth < 768) {
        this.deviceType = 'mobile'
        this.sidebarCollapsed = true
      } else if (window.innerWidth < 1200) {
        this.deviceType = 'tablet'
      } else {
        this.deviceType = 'desktop'
      }
    },
    
    // 打开对话框
    openDialog(dialogName) {
      if (this.dialogs.hasOwnProperty(dialogName)) {
        this.dialogs[dialogName] = true
      }
    },
    
    // 关闭对话框
    closeDialog(dialogName) {
      if (this.dialogs.hasOwnProperty(dialogName)) {
        this.dialogs[dialogName] = false
      }
    },
    
    // 关闭所有对话框
    closeAllDialogs() {
      Object.keys(this.dialogs).forEach(key => {
        this.dialogs[key] = false
      })
    },
    
    // 设置表格设置
    setTableSettings(settings) {
      this.tableSettings = { ...this.tableSettings, ...settings }
    },
    
    // 初始化UI状态
    initializeUI() {
      this.updateScreenSize()
      
      // 监听窗口尺寸变化
      window.addEventListener('resize', () => {
        this.updateScreenSize()
      })
      
      // 从localStorage恢复主题设置
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      }
      
      // 从localStorage恢复侧边栏状态
      const savedSidebarState = localStorage.getItem('sidebarCollapsed')
      if (savedSidebarState !== null) {
        this.sidebarCollapsed = JSON.parse(savedSidebarState)
      }
    }
  },
  
  persist: {
    key: 'ui-store',
    storage: localStorage,
    paths: ['theme', 'sidebarCollapsed', 'tableSettings']
  }
}) 