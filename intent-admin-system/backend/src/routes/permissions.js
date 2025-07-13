const express = require('express')
const router = express.Router()
const permissionController = require('../controllers/permissionController')
const { authenticate, requirePermission } = require('../middleware/auth')

/**
 * 权限管理路由
 * 需要高级权限才能访问
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route GET /api/permissions
 * @desc 获取权限列表
 * @access 需要权限管理或读取权限
 */
router.get('/', 
  requirePermission(['permission:read', 'role:read', '*']), 
  permissionController.getPermissions
)

/**
 * @route GET /api/permissions/users/:userId
 * @desc 获取用户权限
 * @access 用户可以查看自己的，管理员可以查看所有
 */
router.get('/users/:userId', 
  permissionController.getUserPermissions
)

/**
 * @route POST /api/permissions/users/:userId/check
 * @desc 检查用户权限
 * @access 需要权限读取权限
 */
router.post('/users/:userId/check', 
  requirePermission(['permission:read', '*']), 
  permissionController.checkUserPermission
)

/**
 * @route POST /api/permissions/roles/:roleId/assign
 * @desc 为角色分配权限
 * @access 需要权限分配权限
 */
router.post('/roles/:roleId/assign', 
  requirePermission(['permission:assign', '*']), 
  permissionController.assignPermissionToRole
)

/**
 * @route POST /api/permissions/validate-dependencies
 * @desc 验证权限依赖
 * @access 需要权限读取权限
 */
router.post('/validate-dependencies', 
  requirePermission(['permission:read', '*']), 
  permissionController.validatePermissionDependencies
)

/**
 * @route POST /api/permissions/initialize
 * @desc 初始化系统权限
 * @access 仅超级管理员
 */
router.post('/initialize', 
  requirePermission(['*']), 
  permissionController.initializeSystemPermissions
)

module.exports = router