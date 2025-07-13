import { request } from './index'

/**
 * 用户管理API
 */
export const userAPI = {
  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getUsers(params = {}) {
    return request.get('/api/users', { params })
  },

  /**
   * 根据ID获取用户详情
   * @param {number} id - 用户ID
   * @returns {Promise}
   */
  getUserById(id) {
    return request.get(`/api/users/${id}`)
  },

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise}
   */
  createUser(userData) {
    return request.post('/api/users', userData)
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Promise}
   */
  updateUser(id, userData) {
    return request.put(`/api/users/${id}`, userData)
  },

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise}
   */
  deleteUser(id) {
    return request.delete(`/api/users/${id}`)
  },

  /**
   * 批量删除用户
   * @param {Array} ids - 用户ID数组
   * @returns {Promise}
   */
  batchDeleteUsers(ids) {
    return request.post('/api/users/batch-delete', { ids })
  },

  /**
   * 启用/禁用用户
   * @param {number} id - 用户ID
   * @param {boolean} enabled - 是否启用
   * @returns {Promise}
   */
  toggleUserStatus(id, enabled) {
    return request.patch(`/api/users/${id}/status`, { enabled })
  },

  /**
   * 重置用户密码
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise}
   */
  resetPassword(id, newPassword) {
    return request.patch(`/api/users/${id}/reset-password`, { password: newPassword })
  },

  /**
   * 分配用户角色
   * @param {number} id - 用户ID
   * @param {Array} roleIds - 角色ID数组
   * @returns {Promise}
   */
  assignRoles(id, roleIds) {
    return request.post(`/api/users/${id}/roles`, { roleIds })
  },

  /**
   * 获取用户角色
   * @param {number} id - 用户ID
   * @returns {Promise}
   */
  getUserRoles(id) {
    return request.get(`/api/users/${id}/roles`)
  },

  /**
   * 获取用户权限
   * @param {number} id - 用户ID
   * @returns {Promise}
   */
  getUserPermissions(id) {
    return request.get(`/api/users/${id}/permissions`)
  },

  /**
   * 搜索用户
   * @param {string} keyword - 搜索关键词
   * @param {Object} filters - 过滤条件
   * @returns {Promise}
   */
  searchUsers(keyword, filters = {}) {
    return request.get('/api/users/search', {
      params: { keyword, ...filters }
    })
  },

  /**
   * 获取用户统计信息
   * @returns {Promise}
   */
  getUserStats() {
    return request.get('/api/users/stats')
  },

  /**
   * 导出用户数据
   * @param {Object} params - 导出参数
   * @returns {Promise}
   */
  exportUsers(params = {}) {
    return request.download('/api/users/export', 'users.xlsx', { params })
  },

  /**
   * 导入用户数据
   * @param {FormData} formData - 文件数据
   * @returns {Promise}
   */
  importUsers(formData) {
    return request.upload('/api/users/import', formData)
  },

  /**
   * 获取用户活动日志
   * @param {number} id - 用户ID
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  getUserActivityLogs(id, params = {}) {
    return request.get(`/api/users/${id}/activity-logs`, { params })
  },

  /**
   * 验证用户名是否可用
   * @param {string} username - 用户名
   * @returns {Promise}
   */
  checkUsernameAvailable(username) {
    return request.get('/api/users/check-username', {
      params: { username }
    })
  },

  /**
   * 验证邮箱是否可用
   * @param {string} email - 邮箱
   * @returns {Promise}
   */
  checkEmailAvailable(email) {
    return request.get('/api/users/check-email', {
      params: { email }
    })
  },

  /**
   * 批量更新用户状态
   * @param {Array} ids - 用户ID数组
   * @param {boolean} enabled - 是否启用
   * @returns {Promise}
   */
  batchUpdateStatus(ids, enabled) {
    return request.post('/api/users/batch-status', { ids, enabled })
  },

  /**
   * 批量分配角色
   * @param {Array} userIds - 用户ID数组
   * @param {Array} roleIds - 角色ID数组
   * @returns {Promise}
   */
  batchAssignRoles(userIds, roleIds) {
    return request.post('/api/users/batch-assign-roles', { userIds, roleIds })
  },

  /**
   * 分配直接权限给用户
   * @param {number} id - 用户ID
   * @param {Array} permissionIds - 权限ID数组
   * @returns {Promise}
   */
  assignDirectPermissions(id, permissionIds) {
    return request.post(`/api/users/${id}/direct-permissions`, { permissionIds })
  },

  /**
   * 获取用户直接权限
   * @param {number} id - 用户ID
   * @returns {Promise}
   */
  getUserDirectPermissions(id) {
    return request.get(`/api/users/${id}/direct-permissions`)
  },

  /**
   * 移除用户直接权限
   * @param {number} id - 用户ID
   * @param {Array} permissionIds - 权限ID数组
   * @returns {Promise}
   */
  removeDirectPermissions(id, permissionIds) {
    return request.delete(`/api/users/${id}/direct-permissions`, { 
      data: { permissionIds } 
    })
  }
}

export default userAPI