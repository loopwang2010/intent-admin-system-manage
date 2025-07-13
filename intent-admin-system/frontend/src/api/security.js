import request from './index'

/**
 * 安全审计相关API
 */
export const securityAPI = {
  // 检测可疑活动
  detectSuspiciousActivities(data = {}) {
    return request({
      method: 'POST',
      url: '/api/security-audit/suspicious-activities',
      data
    })
  },

  // 生成安全报告
  generateSecurityReport(data = {}) {
    return request({
      method: 'POST',
      url: '/api/security-audit/security-report',
      data
    })
  },

  // 获取实时安全状态
  getRealtimeSecurityStatus() {
    return request({
      method: 'GET',
      url: '/api/security-audit/realtime-status'
    })
  },

  // 获取安全趋势分析
  getSecurityTrends(params = {}) {
    return request({
      method: 'GET',
      url: '/api/security-audit/trends',
      params
    })
  },

  // 获取安全事件详情
  getSecurityIncidentDetails(incidentType, params = {}) {
    const url = incidentType 
      ? `/api/security-audit/incidents/${incidentType}`
      : '/api/security-audit/incidents'
    
    return request({
      method: 'GET',
      url,
      params
    })
  },

  // 获取安全配置建议
  getSecurityRecommendations(params = {}) {
    return request({
      method: 'GET',
      url: '/api/security-audit/recommendations',
      params
    })
  }
}