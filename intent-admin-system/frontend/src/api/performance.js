import request from './index'

/**
 * 性能监控相关API
 */
export const performanceAPI = {
  // 获取性能分析报告
  getPerformanceAnalysis(params = {}) {
    return request({
      method: 'GET',
      url: '/api/performance/analysis',
      params
    })
  },

  // 获取实时性能监控
  getRealtimePerformance() {
    return request({
      method: 'GET',
      url: '/api/performance/realtime'
    })
  },

  // 获取性能优化建议
  getOptimizationRecommendations(params = {}) {
    return request({
      method: 'GET',
      url: '/api/performance/recommendations',
      params
    })
  },

  // 获取慢查询分析
  getSlowQueryAnalysis(params = {}) {
    return request({
      method: 'GET',
      url: '/api/performance/slow-queries',
      params
    })
  },

  // 获取资源使用分析
  getResourceUsageAnalysis() {
    return request({
      method: 'GET',
      url: '/api/performance/resource-usage'
    })
  },

  // 获取性能趋势
  getPerformanceTrends(params = {}) {
    return request({
      method: 'GET',
      url: '/api/performance/trends',
      params
    })
  },

  // 系统健康检查
  performHealthCheck() {
    return request({
      method: 'GET',
      url: '/api/performance/health-check'
    })
  }
}