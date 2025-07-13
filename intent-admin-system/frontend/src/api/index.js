import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores'
import router from '@/router'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: Date.now() }
    
    // 开发环境下打印请求信息
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 计算响应时间
    const responseTime = Date.now() - response.config.metadata.startTime
    
    // 开发环境下打印响应信息
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        responseTime: `${responseTime}ms`,
        data: response.data
      })
    }
    
    // 统一处理响应数据
    const { data } = response
    
    // 如果是下载文件的响应，直接返回
    if (response.headers['content-disposition']) {
      return response
    }
    
    // 检查业务状态码
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        // 业务失败，显示错误消息
        ElMessage.error(data.message || '操作失败')
        return Promise.reject(new Error(data.message || '操作失败'))
      }
    }
    
    return data
  },
  async (error) => {
    const authStore = useAuthStore()
    
    // 计算响应时间
    const responseTime = error.config?.metadata ? 
      Date.now() - error.config.metadata.startTime : 0
    
    // 开发环境下打印错误信息
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        responseTime: responseTime ? `${responseTime}ms` : 'unknown',
        message: error.message,
        data: error.response?.data
      })
    }
    
    const { response } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数错误')
          break
          
        case 401:
          // 未授权，清除认证状态并跳转到登录页
          ElMessage.error('登录已过期，请重新登录')
          await authStore.logout()
          // 使用Vue Router进行跳转，避免状态混乱
          if (router.currentRoute.value.path !== '/login') {
            // 延迟跳转，避免干扰当前请求处理
            setTimeout(() => {
              router.push('/login').catch(err => {
                // 如果路由跳转失败，回退到直接跳转
                console.warn('Router push failed, using location.href:', err)
                window.location.href = '/login'
              })
            }, 100)
          }
          break
          
        case 403:
          ElMessage.error('权限不足，无法执行此操作')
          break
          
        case 404:
          ElMessage.error(data?.message || '请求的资源不存在')
          break
          
        case 409:
          ElMessage.error(data?.message || '数据冲突')
          break
          
        case 422:
          ElMessage.error(data?.message || '数据验证失败')
          break
          
        case 429:
          ElMessage.warning(data?.message || '请求过于频繁，请稍后再试')
          break
          
        case 500:
          ElMessage.error('服务器内部错误，请稍后再试')
          break
          
        case 502:
        case 503:
        case 504:
          ElMessage.error('服务暂时不可用，请稍后再试')
          break
          
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error(error.message || '未知错误')
    }
    
    return Promise.reject(error)
  }
)

// 通用请求方法
export const request = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    })
  },
  download: async (url, filename, config = {}) => {
    try {
      const response = await api.get(url, {
        ...config,
        responseType: 'blob'
      })
      
      // 创建下载链接
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      return response
    } catch (error) {
      throw error
    }
  }
}

// 批量请求
export const batchRequest = async (requests) => {
  try {
    const results = await Promise.allSettled(requests)
    return results.map((result, index) => ({
      index,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  } catch (error) {
    console.error('批量请求失败:', error)
    throw error
  }
}

// 取消请求的token管理
export const cancelTokenSource = () => axios.CancelToken.source()

// 检查是否为取消请求的错误
export const isCancel = axios.isCancel

// 防抖请求 - 防止重复请求
const pendingRequests = new Map()

export const debounceRequest = (requestFn, delay = 300) => {
  return (...args) => {
    const key = JSON.stringify(args)
    
    if (pendingRequests.has(key)) {
      clearTimeout(pendingRequests.get(key))
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await requestFn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          pendingRequests.delete(key)
        }
      }, delay)
      
      pendingRequests.set(key, timeoutId)
    })
  }
}

// 重试请求
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i < maxRetries) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

export default api 