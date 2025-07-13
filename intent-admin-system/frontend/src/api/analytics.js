import { request } from './index'

export const analyticsAPI = {
  // 使用趋势分析
  getUsageTrends: (days = 30) => {
    return request.get('/api/analytics/trends/usage', {
      params: { days }
    })
  },

  // 识别准确率统计
  getAccuracyStats: (period = 'week') => {
    return request.get('/api/analytics/stats/accuracy', {
      params: { period }
    })
  },

  // 热门意图排行
  getTopIntents: (limit = 10, period = 'week') => {
    return request.get('/api/analytics/intents/top', {
      params: { limit, period }
    })
  },

  // 分类统计
  getCategoryStats: () => {
    return request.get('/api/analytics/categories/stats')
  },

  // 用户行为分析
  getUserBehaviorAnalysis: (params = {}) => {
    return request.get('/api/analytics/behavior/users', { params })
  },

  // 生成综合报告
  generateComprehensiveReport: (period = 'week') => {
    return request.get('/api/analytics/reports/comprehensive', {
      params: { period }
    })
  },

  // A/B测试报告
  getABTestReport: (testGroup, days = 30) => {
    return request.get('/api/analytics/reports/ab-test', {
      params: { testGroup, days }
    })
  },

  // 实时统计
  getRealTimeStats: () => {
    return request.get('/api/analytics/realtime/stats')
  },

  // 更新每日统计（管理员功能）
  updateDailyStats: (date) => {
    return request.post('/api/analytics/stats/daily/update', {
      date
    })
  },

  // 导出分析报告
  exportReport: (reportType, params = {}) => {
    const filename = `analytics_${reportType}_${new Date().toISOString().split('T')[0]}.json`
    return request.download(`/api/analytics/export/${reportType}`, filename, {
      params
    })
  },

  // 获取性能指标
  getPerformanceMetrics: (timeRange = '24h') => {
    return request.get('/api/analytics/performance/metrics', {
      params: { timeRange }
    })
  },

  // 意图使用情况对比
  compareIntentUsage: (intentIds, period = 'week') => {
    return request.post('/api/analytics/compare/intents', {
      intentIds,
      period
    })
  },

  // 分类性能对比
  compareCategoryPerformance: (categoryIds, period = 'week') => {
    return request.post('/api/analytics/compare/categories', {
      categoryIds,
      period
    })
  },

  // 时间段分析
  getTimeSlotAnalysis: (days = 30) => {
    return request.get('/api/analytics/time-slots', {
      params: { days }
    })
  },

  // 失败模式分析
  getFailurePatternAnalysis: (days = 30) => {
    return request.get('/api/analytics/failures/patterns', {
      params: { days }
    })
  },

  // 置信度分布分析
  getConfidenceDistribution: (period = 'week') => {
    return request.get('/api/analytics/confidence/distribution', {
      params: { period }
    })
  },

  // 响应时间分析
  getResponseTimeAnalysis: (period = 'week') => {
    return request.get('/api/analytics/response-time/analysis', {
      params: { period }
    })
  },

  // 获取预测数据（如果后端支持机器学习）
  getPredictions: (type, params = {}) => {
    return request.get(`/api/analytics/predictions/${type}`, { params })
  },

  // 异常检测
  detectAnomalies: (metric, period = 'week') => {
    return request.get('/api/analytics/anomalies/detect', {
      params: { metric, period }
    })
  }
} 