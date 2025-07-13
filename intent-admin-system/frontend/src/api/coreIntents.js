import { request } from './index'

export const coreIntentsAPI = {
  // 获取核心意图列表
  getList: (params = {}) => {
    return request.get('/api/core-intents', { params })
  },

  // 获取核心意图详情
  getById: (id) => {
    return request.get(`/api/core-intents/${id}`)
  },

  // 创建核心意图
  create: (data) => {
    return request.post('/api/core-intents', data)
  },

  // 更新核心意图
  update: (id, data) => {
    return request.put(`/api/core-intents/${id}`, data)
  },

  // 删除核心意图
  delete: (id) => {
    return request.delete(`/api/core-intents/${id}`)
  },

  // 批量操作
  batchOperation: (operation, ids, data = {}) => {
    return request.post('/api/core-intents/batch', {
      operation,
      ids,
      data
    })
  },

  // 批量删除
  batchDelete: (ids) => {
    return request.post('/api/core-intents/batch', {
      operation: 'delete',
      ids
    })
  },

  // 批量更新状态
  batchUpdateStatus: (ids, status) => {
    return request.post('/api/core-intents/batch', {
      operation: 'updateStatus',
      ids,
      data: { status }
    })
  },

  // 批量移动分类
  batchMoveCategory: (ids, categoryId) => {
    return request.post('/api/core-intents/batch', {
      operation: 'updateCategory',
      ids,
      data: { categoryId }
    })
  },

  // 更新排序
  updateSort: (sortList) => {
    return request.put('/api/core-intents/sort/update', { sortList })
  },

  // AI功能 - 智能推荐关键词
  suggestKeywords: (data) => {
    return request.post('/api/core-intents/ai/suggest-keywords', data)
  },

  // AI功能 - 检测意图冲突
  detectConflicts: (threshold = 0.8) => {
    return request.get('/api/core-intents/ai/detect-conflicts', {
      params: { threshold }
    })
  },

  // AI功能 - 语义相似度分析
  analyzeSemantics: (id) => {
    return request.get(`/api/core-intents/${id}/ai/semantics`)
  },

  // 导出数据
  export: (params = {}) => {
    const { format = 'json', ...otherParams } = params
    return request.download('/api/core-intents/export/data', `core_intents.${format}`, {
      params: { format, ...otherParams }
    })
  },

  // 导入数据
  import: (data, mode = 'create') => {
    return request.post('/api/core-intents/import/data', {
      intents: data,
      mode
    })
  },

  // 搜索意图
  search: (query, filters = {}) => {
    return request.get('/api/core-intents', {
      params: {
        search: query,
        ...filters
      }
    })
  },

  // 获取统计信息
  getStats: () => {
    return request.get('/api/core-intents/stats')
  },

  // 首句回复功能
  // 获取首句回复
  getFirstResponse: (id, language = 'zh') => {
    return request.get(`/api/core-intents/${id}/first-response`, {
      params: { language }
    })
  },

  // 更新首句回复
  updateFirstResponse: (id, data) => {
    return request.put(`/api/core-intents/${id}/first-response`, data)
  },

  // 批量设置首句回复
  batchUpdateFirstResponse: (ids, responseData) => {
    return request.post('/api/core-intents/batch', {
      operation: 'updateFirstResponse',
      ids,
      data: responseData
    })
  },

  // 测试首句回复
  testFirstResponse: (id, variables = {}) => {
    return request.post(`/api/core-intents/${id}/first-response/test`, {
      variables
    })
  }
} 