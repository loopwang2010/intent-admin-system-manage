const permissionService = require('../services/permissionService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 角色管理控制器
 */
class RoleController {
  
  /**
   * 获取角色列表
   */
  async getRoles(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status = 'active',
        isSystem
      } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        isSystem: isSystem !== undefined ? isSystem === 'true' : undefined
      }
      
      const result = await permissionService.getRoles(options)
      
      res.json({
        success: true,
        message: '获取角色列表成功',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取角色列表失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取角色详情
   */
  async getRoleById(req, res) {
    try {
      const { roleId } = req.params
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: '角色ID不能为空'
        })
      }
      
      const result = await permissionService.getRoles({
        page: 1,
        limit: 1
      })
      
      const role = result.roles.find(r => r.id === parseInt(roleId))
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        })
      }
      
      res.json({
        success: true,
        message: '获取角色详情成功',
        data: role
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取角色详情失败',
        error: error.message
      })
    }
  }
  
  /**
   * 创建角色
   */
  async createRole(req, res) {
    try {
      const {
        code,
        name,
        description,
        level,
        color,
        icon,
        permissionIds = []
      } = req.body
      
      // 基本验证
      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: '角色代码和名称不能为空'
        })
      }
      
      // 验证权限依赖
      if (permissionIds.length > 0) {
        const { Permission } = require('../models')
        const permissions = await Permission.findAll({
          where: { id: permissionIds }
        })
        
        const permissionCodes = permissions.map(p => p.code)
        const dependencyResult = await permissionService.validatePermissionDependencies(permissionCodes)
        
        if (!dependencyResult.valid) {
          return res.status(400).json({
            success: false,
            message: '权限依赖不满足',
            data: dependencyResult.missingDependencies
          })
        }
      }
      
      const role = await permissionService.createRole({
        code,
        name,
        description,
        level,
        color,
        icon,
        permissionIds
      }, req.user.id)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_ASSIGN,
        resource: 'role',
        resourceId: role.id,
        resourceName: role.name,
        newValues: { code, name, description, level, permissionIds },
        metadata: { 
          action: 'create_role',
          permissionCount: permissionIds.length
        }
      }, req)
      
      res.status(201).json({
        success: true,
        message: '角色创建成功',
        data: role
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色创建失败',
        error: error.message
      })
    }
  }
  
  /**
   * 更新角色
   */
  async updateRole(req, res) {
    try {
      const { roleId } = req.params
      const updateData = req.body
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: '角色ID不能为空'
        })
      }
      
      // 获取更新前的角色信息
      const { Role } = require('../models')
      const oldRole = await Role.findByPk(roleId, {
        include: [{
          model: require('../models').Permission,
          as: 'Permissions',
          through: { attributes: [] }
        }]
      })
      
      if (!oldRole) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        })
      }
      
      // 验证权限依赖（如果有权限更新）
      if (updateData.permissionIds && updateData.permissionIds.length > 0) {
        const { Permission } = require('../models')
        const permissions = await Permission.findAll({
          where: { id: updateData.permissionIds }
        })
        
        const permissionCodes = permissions.map(p => p.code)
        const dependencyResult = await permissionService.validatePermissionDependencies(permissionCodes)
        
        if (!dependencyResult.valid) {
          return res.status(400).json({
            success: false,
            message: '权限依赖不满足',
            data: dependencyResult.missingDependencies
          })
        }
      }
      
      const updatedRole = await permissionService.updateRole(
        parseInt(roleId), 
        updateData, 
        req.user.id
      )
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_ASSIGN,
        resource: 'role',
        resourceId: parseInt(roleId),
        resourceName: oldRole.name,
        oldValues: {
          name: oldRole.name,
          description: oldRole.description,
          level: oldRole.level,
          permissions: oldRole.Permissions.map(p => p.id)
        },
        newValues: updateData,
        metadata: { 
          action: 'update_role',
          changes: Object.keys(updateData)
        }
      }, req)
      
      res.json({
        success: true,
        message: '角色更新成功',
        data: updatedRole
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色更新失败',
        error: error.message
      })
    }
  }
  
  /**
   * 删除角色
   */
  async deleteRole(req, res) {
    try {
      const { roleId } = req.params
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: '角色ID不能为空'
        })
      }
      
      // 获取角色信息用于日志记录
      const { Role } = require('../models')
      const role = await Role.findByPk(roleId)
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: '角色不存在'
        })
      }
      
      await permissionService.deleteRole(parseInt(roleId))
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_REMOVE,
        resource: 'role',
        resourceId: parseInt(roleId),
        resourceName: role.name,
        oldValues: {
          code: role.code,
          name: role.name,
          description: role.description
        },
        metadata: { action: 'delete_role' }
      }, req)
      
      res.json({
        success: true,
        message: '角色删除成功'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色删除失败',
        error: error.message
      })
    }
  }
  
  /**
   * 为用户分配角色
   */
  async assignRoleToUser(req, res) {
    try {
      const { userId } = req.params
      const { roleIds, reason, isPrimary = false } = req.body
      
      if (!userId || !roleIds || !Array.isArray(roleIds)) {
        return res.status(400).json({
          success: false,
          message: '用户ID和角色ID列表不能为空'
        })
      }
      
      // 获取用户当前角色用于日志记录
      const oldRoles = await permissionService.getUserRoles(parseInt(userId))
      
      await permissionService.assignRoleToUser(
        parseInt(userId),
        roleIds,
        req.user.id,
        { reason, isPrimary }
      )
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_ASSIGN,
        resource: 'user',
        resourceId: parseInt(userId),
        resourceName: `用户角色分配`,
        oldValues: { 
          roleIds: oldRoles.map(ur => ur.roleId) 
        },
        newValues: { 
          roleIds, 
          isPrimary 
        },
        metadata: { 
          reason,
          action: 'assign_roles',
          roleCount: roleIds.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '角色分配成功',
        data: {
          userId: parseInt(userId),
          assignedRoles: roleIds.length
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色分配失败',
        error: error.message
      })
    }
  }
  
  /**
   * 移除用户角色
   */
  async removeRoleFromUser(req, res) {
    try {
      const { userId } = req.params
      const { roleIds, reason } = req.body
      
      if (!userId || !roleIds || !Array.isArray(roleIds)) {
        return res.status(400).json({
          success: false,
          message: '用户ID和角色ID列表不能为空'
        })
      }
      
      await permissionService.removeRoleFromUser(parseInt(userId), roleIds)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_REMOVE,
        resource: 'user',
        resourceId: parseInt(userId),
        resourceName: `用户角色移除`,
        oldValues: { roleIds },
        newValues: { removed: true },
        metadata: { 
          reason,
          action: 'remove_roles',
          roleCount: roleIds.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '角色移除成功',
        data: {
          userId: parseInt(userId),
          removedRoles: roleIds.length
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色移除失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取用户角色
   */
  async getUserRoles(req, res) {
    try {
      const { userId } = req.params
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        })
      }
      
      // 权限检查：只能查看自己的角色，或者管理员可以查看所有人的
      if (req.user.id !== parseInt(userId)) {
        const hasPermission = await permissionService.userHasPermission(req.user.id, [
          'user:manage', 'role:read', '*'
        ])
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: '权限不足，无法查看该用户角色'
          })
        }
      }
      
      const userRoles = await permissionService.getUserRoles(parseInt(userId))
      
      res.json({
        success: true,
        message: '获取用户角色成功',
        data: userRoles
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户角色失败',
        error: error.message
      })
    }
  }
  
  /**
   * 复制角色
   */
  async copyRole(req, res) {
    try {
      const { roleId } = req.params
      const { newCode, newName, newDescription } = req.body
      
      if (!roleId || !newCode || !newName) {
        return res.status(400).json({
          success: false,
          message: '角色ID、新代码和新名称不能为空'
        })
      }
      
      // 获取原角色信息
      const { Role, Permission } = require('../models')
      const originalRole = await Role.findByPk(roleId, {
        include: [{
          model: Permission,
          as: 'Permissions',
          through: { attributes: [] }
        }]
      })
      
      if (!originalRole) {
        return res.status(404).json({
          success: false,
          message: '原角色不存在'
        })
      }
      
      // 创建新角色
      const newRole = await permissionService.createRole({
        code: newCode,
        name: newName,
        description: newDescription || `复制自 ${originalRole.name}`,
        level: originalRole.level,
        color: originalRole.color,
        icon: originalRole.icon,
        permissionIds: originalRole.Permissions.map(p => p.id)
      }, req.user.id)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.ROLE_ASSIGN,
        resource: 'role',
        resourceId: newRole.id,
        resourceName: newRole.name,
        metadata: { 
          action: 'copy_role',
          originalRoleId: parseInt(roleId),
          originalRoleName: originalRole.name,
          copiedPermissions: originalRole.Permissions.length
        }
      }, req)
      
      res.status(201).json({
        success: true,
        message: '角色复制成功',
        data: newRole
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '角色复制失败',
        error: error.message
      })
    }
  }
}

module.exports = new RoleController()