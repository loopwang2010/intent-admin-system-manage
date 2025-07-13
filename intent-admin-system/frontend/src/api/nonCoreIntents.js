import { request } from './index'

export const nonCoreIntentsAPI = {
  // 获取非核心意图列表
  getList: (params = {}) => {
    return request.get('/api/non-core-intents', { params })
  },

  // 获取非核心意图详情
  getById: (id) => {
    return request.get(`/api/non-core-intents/${id}`)
  },

  // 创建非核心意图
  create: (data) => {
    return request.post('/api/non-core-intents', data)
  },

  // 更新非核心意图
  update: (id, data) => {
    return request.put(`/api/non-core-intents/${id}`, data)
  },

  // 删除非核心意图
  delete: (id) => {
    return request.delete(`/api/non-core-intents/${id}`)
  },

  // 批量更新状态
  batchUpdateStatus: (ids, status) => {
    return request.patch('/api/non-core-intents/batch/status', {
      ids,
      status
    })
  },

  // 新增批量操作接口
  batchOperation: (operation, ids, data = {}) => {
    return request.post('/api/non-core-intents/batch', {
      operation,
      ids,
      data
    })
  },

  // 获取统计信息
  getStatistics: () => {
    return request.get('/api/non-core-intents/statistics')
  },

  // 首句回复功能
  // 获取首句回复
  getFirstResponse: (id, language = 'zh') => {
    return request.get(`/api/non-core-intents/${id}/first-response`, {
      params: { language }
    })
  },

  // 更新首句回复
  updateFirstResponse: (id, data) => {
    return request.put(`/api/non-core-intents/${id}/first-response`, data)
  },

  // 批量设置首句回复
  batchUpdateFirstResponse: (ids, responseData) => {
    return request.post('/api/non-core-intents/batch', {
      operation: 'updateFirstResponse',
      ids,
      data: responseData
    })
  },

  // 测试首句回复
  testFirstResponse: (id, variables = {}) => {
    return request.post(`/api/non-core-intents/${id}/first-response/test`, {
      variables
    })
  },

  // 搜索意图
  search: (query, filters = {}) => {
    return request.get('/api/non-core-intents', {
      params: {
        search: query,
        ...filters
      }
    })
  },

  // 导出数据
  export: (params = {}) => {
    const { format = 'json', ...otherParams } = params
    return request.get('/api/non-core-intents/export/data', {
      params: { format, ...otherParams },
      responseType: format === 'csv' ? 'blob' : 'json'
    })
  },

  // 导入数据
  import: (data, mode = 'create') => {
    return request.post('/api/non-core-intents/import/data', {
      intents: data,
      mode
    })
  },

  // AI功能 - 智能推荐关键词
  suggestKeywords: (data) => {
    return request.post('/api/non-core-intents/ai/suggest-keywords', data)
  },

  // AI功能 - 检测意图冲突
  detectConflicts: (threshold = 0.8) => {
    return request.get('/api/non-core-intents/ai/detect-conflicts', {
      params: { threshold }
    })
  },

  // 批量操作
  batchOperation: (operation, ids, data = {}) => {
    return request.post('/api/non-core-intents/batch', {
      operation,
      ids,
      data
    })
  },

  // 批量删除
  batchDelete: (ids) => {
    return request.post('/api/non-core-intents/batch', {
      operation: 'delete',
      ids
    })
  },

  // 批量移动分类
  batchMoveCategory: (ids, categoryId) => {
    return request.post('/api/non-core-intents/batch', {
      operation: 'updateCategory',
      ids,
      data: { categoryId }
    })
  }
}