import request from './index'

/**
 * 数据可视化相关API
 */
export const visualizationAPI = {
  // 获取用户操作时间线可视化
  getUserTimelineVisualization(userId, params = {}) {
    return request({
      method: 'GET',
      url: `/api/history-visualization/users/${userId}/timeline`,
      params
    })
  },

  // 获取资源变更历史可视化
  getResourceHistoryVisualization(resource, resourceId, params = {}) {
    return request({
      method: 'GET',
      url: `/api/history-visualization/resources/${resource}/${resourceId}/history`,
      params
    })
  },

  // 获取系统活动热力图数据
  getActivityHeatmapData(params = {}) {
    return request({
      method: 'GET',
      url: '/api/history-visualization/activity-heatmap',
      params
    })
  },

  // 获取操作趋势分析
  getOperationTrends(params = {}) {
    return request({
      method: 'GET',
      url: '/api/history-visualization/operation-trends',
      params
    })
  },

  // 获取用户行为分析
  getUserBehaviorAnalysis(params = {}) {
    return request({
      method: 'GET',
      url: '/api/history-visualization/user-behavior',
      params
    })
  },

  // 获取数据变更影响分析
  getChangeImpactAnalysis(resource, resourceId, params = {}) {
    return request({
      method: 'GET',
      url: `/api/history-visualization/resources/${resource}/${resourceId}/impact`,
      params
    })
  },

  // 获取可视化数据总览
  getVisualizationDashboard(params = {}) {
    return request({
      method: 'GET',
      url: '/api/history-visualization/dashboard',
      params
    })
  }
}