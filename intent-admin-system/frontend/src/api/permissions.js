import request from './index'

/**
 * 权限管理相关API
 */
export const permissionAPI = {
  // 获取权限列表
  getPermissions(params = {}) {
    return request({
      method: 'GET',
      url: '/api/permissions',
      params
    })
  },

  // 获取用户权限
  getUserPermissions(userId) {
    return request({
      method: 'GET',
      url: `/api/permissions/users/${userId}`
    })
  },

  // 检查用户权限
  checkUserPermission(userId, data) {
    return request({
      method: 'POST',
      url: `/api/permissions/users/${userId}/check`,
      data
    })
  },

  // 为角色分配权限
  assignPermissionToRole(roleId, data) {
    return request({
      method: 'POST',
      url: `/api/permissions/roles/${roleId}/assign`,
      data
    })
  },

  // 验证权限依赖
  validatePermissionDependencies(data) {
    return request({
      method: 'POST',
      url: '/api/permissions/validate-dependencies',
      data
    })
  },

  // 初始化系统权限
  initializeSystemPermissions() {
    return request({
      method: 'POST',
      url: '/api/permissions/initialize'
    })
  }
}

/**
 * 角色管理相关API
 */
export const roleAPI = {
  // 获取角色列表
  getRoles(params = {}) {
    return request({
      method: 'GET',
      url: '/api/roles',
      params
    })
  },

  // 获取角色详情
  getRoleById(roleId) {
    return request({
      method: 'GET',
      url: `/api/roles/${roleId}`
    })
  },

  // 创建角色
  createRole(data) {
    return request({
      method: 'POST',
      url: '/api/roles',
      data
    })
  },

  // 更新角色
  updateRole(roleId, data) {
    return request({
      method: 'PUT',
      url: `/api/roles/${roleId}`,
      data
    })
  },

  // 删除角色
  deleteRole(roleId) {
    return request({
      method: 'DELETE',
      url: `/api/roles/${roleId}`
    })
  },

  // 复制角色
  copyRole(roleId, data) {
    return request({
      method: 'POST',
      url: `/api/roles/${roleId}/copy`,
      data
    })
  },

  // 为用户分配角色
  assignRoleToUser(userId, data) {
    return request({
      method: 'POST',
      url: `/api/roles/users/${userId}/assign`,
      data
    })
  },

  // 移除用户角色
  removeRoleFromUser(userId, data) {
    return request({
      method: 'POST',
      url: `/api/roles/users/${userId}/remove`,
      data
    })
  },

  // 获取用户角色
  getUserRoles(userId) {
    return request({
      method: 'GET',
      url: `/api/roles/users/${userId}`
    })
  }
}