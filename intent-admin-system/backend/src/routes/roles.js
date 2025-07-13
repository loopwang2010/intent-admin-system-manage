const express = require('express')
const router = express.Router()
const roleController = require('../controllers/roleController')
const { authenticate, requirePermission } = require('../middleware/auth')

/**
 * 角色管理路由
 * 需要相应权限才能访问
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route GET /api/roles
 * @desc 获取角色列表
 * @access 需要角色读取权限
 */
router.get('/', 
  requirePermission(['role:read', 'user:manage', '*']), 
  roleController.getRoles
)

/**
 * @route GET /api/roles/:roleId
 * @desc 获取角色详情
 * @access 需要角色读取权限
 */
router.get('/:roleId', 
  requirePermission(['role:read', 'user:manage', '*']), 
  roleController.getRoleById
)

/**
 * @route POST /api/roles
 * @desc 创建角色
 * @access 需要角色创建权限
 */
router.post('/', 
  requirePermission(['role:create', 'role:manage', '*']), 
  roleController.createRole
)

/**
 * @route PUT /api/roles/:roleId
 * @desc 更新角色
 * @access 需要角色更新权限
 */
router.put('/:roleId', 
  requirePermission(['role:update', 'role:manage', '*']), 
  roleController.updateRole
)

/**
 * @route DELETE /api/roles/:roleId
 * @desc 删除角色
 * @access 需要角色删除权限
 */
router.delete('/:roleId', 
  requirePermission(['role:delete', 'role:manage', '*']), 
  roleController.deleteRole
)

/**
 * @route POST /api/roles/:roleId/copy
 * @desc 复制角色
 * @access 需要角色创建权限
 */
router.post('/:roleId/copy', 
  requirePermission(['role:create', 'role:manage', '*']), 
  roleController.copyRole
)

/**
 * @route POST /api/roles/users/:userId/assign
 * @desc 为用户分配角色
 * @access 需要角色分配权限
 */
router.post('/users/:userId/assign', 
  requirePermission(['role:assign', 'user:manage', '*']), 
  roleController.assignRoleToUser
)

/**
 * @route POST /api/roles/users/:userId/remove
 * @desc 移除用户角色
 * @access 需要角色分配权限
 */
router.post('/users/:userId/remove', 
  requirePermission(['role:assign', 'user:manage', '*']), 
  roleController.removeRoleFromUser
)

/**
 * @route GET /api/roles/users/:userId
 * @desc 获取用户角色
 * @access 用户可以查看自己的，管理员可以查看所有
 */
router.get('/users/:userId', 
  roleController.getUserRoles
)

module.exports = router