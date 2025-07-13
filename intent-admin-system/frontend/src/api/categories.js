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
  },

  // 获取分类树结构
  getCategoryTree(params = {}) {
    return request.get('/api/categories/tree', { params })
  },

  // 移动分类（更改父分类）
  moveCategory(id, data) {
    return request.put(`/api/categories/${id}/move`, data)
  },

  // 获取分类面包屑导航
  getCategoryBreadcrumb(id) {
    return request.get(`/api/categories/${id}/breadcrumb`)
  },

  // 获取子分类列表
  getChildCategories(parentId, params = {}) {
    return request.get(`/api/categories/${parentId}/children`, { params })
  },

  // 获取父分类选项（用于创建/编辑时选择）
  getParentOptions(params = {}) {
    return request.get('/api/categories/parents', { params })
  },

  // 获取分类的回复内容
  getCategoryResponses(categoryId, params = {}) {
    return request.get(`/api/categories/${categoryId}/responses`, { params })
  },

  // 添加分类回复内容
  addCategoryResponse(categoryId, data) {
    return request.post(`/api/categories/${categoryId}/responses`, data)
  },

  // 更新分类回复内容
  updateCategoryResponse(categoryId, responseId, data) {
    return request.put(`/api/categories/${categoryId}/responses/${responseId}`, data)
  },

  // 删除分类回复内容
  deleteCategoryResponse(categoryId, responseId) {
    return request.delete(`/api/categories/${categoryId}/responses/${responseId}`)
  },

  // 批量更新分类回复内容
  batchUpdateCategoryResponses(categoryId, responses) {
    return request.put(`/api/categories/${categoryId}/responses/batch`, { responses })
  },

  // 获取AI推荐回复内容
  getAIRecommendedResponses(categoryId) {
    return request.get(`/api/categories/${categoryId}/responses/recommendations`)
  }
}

export default categoryAPI