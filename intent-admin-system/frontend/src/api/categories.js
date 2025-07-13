import { request } from './index'

/**
 * 分类管理相关API
 */
export const categoryAPI = {
  // 获取分类列表
  getCategories(params = {}) {
    return request.get('/api/categories', { params })
  },

  // 获取分类详情
  getCategoryById(id) {
    return request.get(`/api/categories/${id}`)
  },

  // 创建分类
  createCategory(data) {
    return request.post('/api/categories', data)
  },

  // 更新分类
  updateCategory(id, data) {
    return request.put(`/api/categories/${id}`, data)
  },

  // 删除分类
  deleteCategory(id, force = false) {
    return request.delete(`/api/categories/${id}?force=${force}`)
  },

  // 批量操作
  batchOperation(data) {
    return request.post('/api/categories/batch', data)
  },

  // 更新排序
  updateSort(sortList) {
    return request.put('/api/categories/sort', { sortList })
  },

  // 获取分类统计
  getCategoryStats(id) {
    return request.get(`/api/categories/${id}/stats`)
  },

  // 获取分类分析数据
  getCategoryAnalytics(params = {}) {
    return request.get('/api/categories/analytics', { params })
  },

  // 导出分类数据
  exportCategories(format = 'json') {
    return request.get(`/api/categories/export?format=${format}`)
  },

  // 导入分类数据
  importCategories(data, overwrite = false) {
    return request.post('/api/categories/import', { data, overwrite })
  },

  // 获取分类使用趋势
  getCategoryTrends(id, params = {}) {
    return request.get(`/api/categories/${id}/trends`, { params })
  },

  // 获取分类关联的意图
  getCategoryIntents(id, params = {}) {
    return request.get(`/api/categories/${id}/intents`, { params })
  },

  // 分类意图分析
  analyzeCategoryIntents(id) {
    return request.post(`/api/categories/${id}/analyze`)
  },

  // 获取分类推荐
  getCategoryRecommendations(params = {}) {
    return request.get('/api/categories/recommendations', { params })
  }
}

export default categoryAPI