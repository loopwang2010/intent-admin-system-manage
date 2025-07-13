const permissionService = require('../services/permissionService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 权限管理控制器
 */
class PermissionController {
  
  /**
   * 获取权限列表
   */
  async getPermissions(req, res) {
    try {
      const {
        page = 1,
        limit = 100,
        search,
        module,
        action,
        category,
        status = 'active'
      } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        module,
        action,
        category,
        status
      }
      
      const result = await permissionService.getPermissions(options)
      
      res.json({
        success: true,
        message: '获取权限列表成功',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取权限列表失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取用户权限
   */
  async getUserPermissions(req, res) {
    try {
      const { userId } = req.params
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        })
      }
      
      // 权限检查：只能查看自己的权限，或者管理员可以查看所有人的
      if (req.user.id !== parseInt(userId)) {
        const hasPermission = await permissionService.userHasPermission(req.user.id, [
          'user:manage', 'permission:read', '*'
        ])
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: '权限不足，无法查看该用户权限'
          })
        }
      }
      
      const permissions = await permissionService.getUserPermissions(parseInt(userId))
      const roles = await permissionService.getUserRoles(parseInt(userId))
      
      res.json({
        success: true,
        message: '获取用户权限成功',
        data: {
          permissions,
          roles
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户权限失败',
        error: error.message
      })
    }
  }
  
  /**
   * 检查用户权限
   */
  async checkUserPermission(req, res) {
    try {
      const { userId } = req.params
      const { permissions } = req.body
      
      if (!userId || !permissions) {
        return res.status(400).json({
          success: false,
          message: '用户ID和权限列表不能为空'
        })
      }
      
      const hasPermission = await permissionService.userHasPermission(
        parseInt(userId), 
        permissions
      )
      
      res.json({
        success: true,
        message: '权限检查完成',
        data: {
          hasPermission,
          checkedPermissions: permissions
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      })
    }
  }
  
  /**
   * 分配权限给角色
   */
  async assignPermissionToRole(req, res) {
    try {
      const { roleId } = req.params
      const { permissionIds, reason } = req.body
      
      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          message: '角色ID和权限ID列表不能为空'
        })
      }
      
      // 记录操作前的状态
      const oldPermissions = await permissionService.getRoles({ 
        page: 1, 
        limit: 1 
      }).then(result => 
        result.roles.find(r => r.id === parseInt(roleId))?.Permissions || []
      )
      
      await permissionService.updateRole(parseInt(roleId), {
        permissionIds
      }, req.user.id)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.PERMISSION_GRANT,
        resource: 'role',
        resourceId: parseInt(roleId),
        resourceName: `角色权限分配`,
        oldValues: { permissionIds: oldPermissions.map(p => p.id) },
        newValues: { permissionIds },
        metadata: { reason, permissionCount: permissionIds.length }
      }, req)
      
      res.json({
        success: true,
        message: '权限分配成功',
        data: {
          roleId: parseInt(roleId),
          assignedPermissions: permissionIds.length
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '权限分配失败',
        error: error.message
      })
    }
  }
  
  /**
   * 初始化系统权限
   */
  async initializeSystemPermissions(req, res) {
    try {
      await permissionService.initializeSystemPermissions()
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.SYSTEM_CONFIG_UPDATE,
        resource: 'system',
        resourceName: 'permission_initialization',
        metadata: { action: 'initialize_system_permissions' }
      }, req)
      
      res.json({
        success: true,
        message: '系统权限初始化完成'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '系统权限初始化失败',
        error: error.message
      })
    }
  }
  
  /**
   * 验证权限依赖
   */
  async validatePermissionDependencies(req, res) {
    try {
      const { permissionCodes } = req.body
      
      if (!permissionCodes || !Array.isArray(permissionCodes)) {
        return res.status(400).json({
          success: false,
          message: '权限代码列表不能为空'
        })
      }
      
      const result = await permissionService.validatePermissionDependencies(permissionCodes)
      
      res.json({
        success: true,
        message: '权限依赖验证完成',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '权限依赖验证失败',
        error: error.message
      })
    }
  }
}

module.exports = new PermissionController()