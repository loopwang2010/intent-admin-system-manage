import request from './index'

/**
 * 审计日志相关API
 */
export const auditAPI = {
  // 获取审计日志列表
  getAuditLogs(params = {}) {
    return request({
      method: 'GET',
      url: '/api/audit/logs',
      params
    })
  },

  // 获取用户操作记录
  getUserOperations(userId, params = {}) {
    return request({
      method: 'GET',
      url: `/api/audit/users/${userId}/operations`,
      params
    })
  },

  // 获取资源操作历史
  getResourceHistory(resource, resourceId, params = {}) {
    return request({
      method: 'GET',
      url: `/api/audit/resources/${resource}/${resourceId}/history`,
      params
    })
  },

  // 导出审计日志
  exportAuditLogs(params = {}) {
    return request({
      method: 'POST',
      url: '/api/audit/export',
      data: params,
      responseType: 'blob'
    })
  },

  // 获取操作统计
  getOperationStatistics(params = {}) {
    return request({
      method: 'GET',
      url: '/api/audit/statistics',
      params
    })
  },

  // 搜索审计日志
  searchAuditLogs(params = {}) {
    return request({
      method: 'POST',
      url: '/api/audit/search',
      data: params
    })
  }
}