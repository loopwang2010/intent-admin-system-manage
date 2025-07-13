import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { ElLoading, ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 导入样式
import './styles/index.scss'

// 导入应用和路由
import App from './App.vue'
import router from './router'
import pinia, { useAuthStore } from './stores'

// 导入工具函数
import { setupErrorHandler } from './utils/errorHandler'

// 创建应用实例
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 设置语言
const getLocale = () => {
  const savedLang = localStorage.getItem('language') || 'zh-cn'
  return savedLang === 'en' ? en : zhCn
}

// 配置Element Plus
app.use(ElementPlus, {
  locale: getLocale(),
  size: 'default',
  zIndex: 3000
})

// 使用Pinia状态管理
app.use(pinia)

// 注册全局Element Plus组件
app.config.globalProperties.$ELEMENT = { size: 'default', zIndex: 3000 }
window.ElLoading = ElLoading
window.ElMessage = ElMessage

// 设置全局错误处理
setupErrorHandler(app)

// 初始化认证状态
const initApp = async () => {
  const authStore = useAuthStore()
  // 初始化认证状态
  await authStore.initAuth()
  console.log('认证状态初始化完成')
}

// 在应用挂载前初始化认证
initApp()

// 使用路由
app.use(router)

// 全局属性
app.config.globalProperties.$ELEMENT_SIZE = 'default'

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误处理器捕获错误:', err)
  console.error('错误信息:', info)
  ElMessage.error('应用出现错误，请刷新页面重试')
}

// 性能监控
if (import.meta.env.PROD) {
  // 监控应用性能
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('页面加载时间:', entry.loadEventEnd - entry.loadEventStart + 'ms')
      }
    }
  })
  observer.observe({ entryTypes: ['navigation'] })
}

// 挂载应用
app.mount('#app')

// 开发环境下的调试工具
if (import.meta.env.DEV) {
  window.app = app
  window.router = router
  window.pinia = pinia
  
  console.log('🎯 智能音箱意图管理系统前端已启动')
  console.log('📦 Vue版本:', app.version)
  console.log('🔧 开发模式已启用')
}

// PWA支持
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

export default app 