/**
 * 错误处理工具
 */
import { ElMessage } from 'element-plus'

/**
 * 设置全局错误处理
 * @param {Object} app Vue应用实例
 */
export function setupErrorHandler(app) {
  // Vue应用错误处理
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue错误:', err)
    console.error('错误信息:', info)
    console.error('组件实例:', instance)
    
    // 显示用户友好的错误消息
    ElMessage.error('应用出现错误，请刷新页面重试')
    
    // 可以在这里添加错误上报逻辑
    // reportError(err, info)
  }

  // 未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason)
    ElMessage.error('网络请求失败，请稍后重试')
    
    // 阻止默认的控制台错误消息
    event.preventDefault()
  })

  // 全局JavaScript错误
  window.addEventListener('error', (event) => {
    console.error('全局JavaScript错误:', event.error)
    ElMessage.error('页面出现错误，请刷新重试')
  })

  console.log('错误处理器已设置')
}

/**
 * 错误上报函数（示例）
 * @param {Error} error 错误对象
 * @param {String} info 错误信息
 */
export function reportError(error, info) {
  // 这里可以集成错误监控服务
  // 例如：Sentry, Bugsnag等
  const errorData = {
    message: error.message,
    stack: error.stack,
    info: info,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
  
  console.log('错误上报数据:', errorData)
  
  // 发送到错误监控服务
  // fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorData)
  // })
} 