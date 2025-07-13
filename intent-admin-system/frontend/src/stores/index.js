import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建pinia实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 导入所有store模块
export { useAuthStore } from './modules/auth'
export { useCategoryStore } from './modules/category'
export { useCoreIntentStore } from './modules/coreIntent'
export { useNonCoreIntentStore } from './modules/nonCoreIntent'
export { useResponseStore } from './modules/response'
export { useTestStore } from './modules/test'
export { useAnalyticsStore } from './modules/analytics'
export { useUIStore } from './modules/ui'
export { useUserStore } from './modules/user'

export default pinia 