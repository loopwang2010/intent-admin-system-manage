const { 
  Permission, 
  Role, 
  RolePermission, 
  User, 
  UserRole 
} = require('../models')
const { 
  SYSTEM_PERMISSIONS, 
  SYSTEM_ROLES 
} = require('../constants/permissions')
const { Op } = require('sequelize')

/**
 * 权限管理服务
 * 提供权限和角色的管理功能
 */
class PermissionService {
  
  /**
   * 初始化系统权限和角色
   */
  async initializeSystemPermissions() {
    try {
      // 初始化系统权限
      for (const permissionData of SYSTEM_PERMISSIONS) {
        const [permission, created] = await Permission.findOrCreate({
          where: { code: permissionData.code },
          defaults: {
            ...permissionData,
            isSystem: true,
            status: 'active'
          }
        })
        
        if (created) {
          console.log(`创建系统权限: ${permission.code}`)
        }
      }
      
      // 初始化系统角色
      for (const roleData of SYSTEM_ROLES) {
        const [role, created] = await Role.findOrCreate({
          where: { code: roleData.code },
          defaults: {
            code: roleData.code,
            name: roleData.name,
            description: roleData.description,
            level: roleData.level,
            isSystem: roleData.isSystem,
            isDefault: roleData.isDefault || false,
            color: roleData.color,
            icon: roleData.icon,
            status: 'active'
          }
        })
        
        if (created) {
          console.log(`创建系统角色: ${role.code}`)
          
          // 为角色分配权限
          if (roleData.permissions.includes('*')) {
            // 超级管理员拥有所有权限
            const allPermissions = await Permission.findAll()
            await role.setPermissions(allPermissions)
          } else {
            // 根据权限代码分配权限
            const permissions = await Permission.findAll({
              where: {
                code: { [Op.in]: roleData.permissions }
              }
            })
            await role.setPermissions(permissions)
          }
        }
      }
      
      console.log('系统权限和角色初始化完成')
      return true
    } catch (error) {
      console.error('初始化系统权限失败:', error)
      throw error
    }
  }
  
  /**
   * 获取用户的所有权限
   * @param {number} userId - 用户ID
   * @returns {Array} 权限列表
   */
  async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          where: { status: 'active' },
          required: false,
          through: { attributes: [] },
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      })
      
      if (!user) {
        throw new Error('用户不存在')
      }
      
      const permissions = new Set()
      
      // 收集所有角色的权限
      user.roles.forEach(role => {
        role.permissions.forEach(permission => {
          permissions.add(permission.code)
        })
      })
      
      return Array.from(permissions)
    } catch (error) {
      throw new Error(`获取用户权限失败: ${error.message}`)
    }
  }
  
  /**
   * 检查用户是否拥有指定权限
   * @param {number} userId - 用户ID
   * @param {string|Array} requiredPermissions - 需要的权限
   * @returns {boolean} 是否拥有权限
   */
  async userHasPermission(userId, requiredPermissions) {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      
      // 如果用户拥有超级权限，直接返回true
      if (userPermissions.includes('*')) {
        return true
      }
      
      // 将单个权限转换为数组
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions]
      
      // 检查是否拥有任一权限
      return permissions.some(permission => userPermissions.includes(permission))
    } catch (error) {
      console.error('检查用户权限失败:', error)
      return false
    }
  }
  
  /**
   * 为用户分配角色
   * @param {number} userId - 用户ID
   * @param {number|Array} roleIds - 角色ID或角色ID数组
   * @param {number} assignedBy - 分配者ID
   * @param {Object} options - 其他选项
   */
  async assignRoleToUser(userId, roleIds, assignedBy, options = {}) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error('用户不存在')
      }
      
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds]
      
      for (const roleId of roles) {
        const role = await Role.findByPk(roleId)
        if (!role) {
          throw new Error(`角色 ${roleId} 不存在`)
        }
        
        // 检查是否已存在
        const existingUserRole = await UserRole.findOne({
          where: { userId, roleId }
        })
        
        if (existingUserRole) {
          // 更新现有关联
          await existingUserRole.update({
            status: 'active',
            assignedBy,
            assignedAt: new Date(),
            ...options
          })
        } else {
          // 创建新关联
          await UserRole.create({
            userId,
            roleId,
            assignedBy,
            assignedAt: new Date(),
            status: 'active',
            ...options
          })
        }
      }
      
      return true
    } catch (error) {
      throw new Error(`分配角色失败: ${error.message}`)
    }
  }
  
  /**
   * 移除用户角色
   * @param {number} userId - 用户ID
   * @param {number|Array} roleIds - 角色ID或角色ID数组
   */
  async removeRoleFromUser(userId, roleIds) {
    try {
      const roles = Array.isArray(roleIds) ? roleIds : [roleIds]
      
      await UserRole.update(
        { status: 'inactive' },
        {
          where: {
            userId,
            roleId: { [Op.in]: roles }
          }
        }
      )
      
      return true
    } catch (error) {
      throw new Error(`移除角色失败: ${error.message}`)
    }
  }
  
  /**
   * 获取角色列表
   * @param {Object} options - 查询选项
   */
  async getRoles(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status = 'active',
        isSystem
      } = options
      
      const where = {}
      
      if (status) where.status = status
      if (isSystem !== undefined) where.isSystem = isSystem
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      }
      
      const { count, rows } = await Role.findAndCountAll({
        where,
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'code', 'name']
        }],
        order: [['level', 'DESC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        distinct: true  // 确保count只计算不重复的Role记录
      })
      
      return {
        roles: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      throw new Error(`获取角色列表失败: ${error.message}`)
    }
  }
  
  /**
   * 获取权限列表
   * @param {Object} options - 查询选项
   */
  async getPermissions(options = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        search,
        module,
        action,
        category,
        status = 'active'
      } = options
      
      const where = {}
      
      if (status) where.status = status
      if (module) where.module = module
      if (action) where.action = action
      if (category) where.category = category
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      }
      
      const { count, rows } = await Permission.findAndCountAll({
        where,
        order: [['category', 'ASC'], ['level', 'ASC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
      })
      
      // 按分类分组
      const groupedPermissions = {}
      rows.forEach(permission => {
        const category = permission.category || '其他'
        if (!groupedPermissions[category]) {
          groupedPermissions[category] = []
        }
        groupedPermissions[category].push(permission)
      })
      
      return {
        permissions: rows,
        groupedPermissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      throw new Error(`获取权限列表失败: ${error.message}`)
    }
  }
  
  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @param {number} createdBy - 创建者ID
   */
  async createRole(roleData, createdBy) {
    try {
      const {
        code,
        name,
        description,
        level = 1,
        color,
        icon,
        permissionIds = []
      } = roleData
      
      // 检查角色代码是否已存在
      const existingRole = await Role.findOne({ where: { code } })
      if (existingRole) {
        throw new Error('角色代码已存在')
      }
      
      // 创建角色
      const role = await Role.create({
        code,
        name,
        description,
        level,
        color,
        icon,
        isSystem: false,
        status: 'active',
        createdBy
      })
      
      // 分配权限
      if (permissionIds.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: { [Op.in]: permissionIds } }
        })
        await role.setPermissions(permissions)
      }
      
      return role
    } catch (error) {
      throw new Error(`创建角色失败: ${error.message}`)
    }
  }
  
  /**
   * 更新角色
   * @param {number} roleId - 角色ID
   * @param {Object} roleData - 角色数据
   * @param {number} updatedBy - 更新者ID
   */
  async updateRole(roleId, roleData, updatedBy) {
    try {
      const role = await Role.findByPk(roleId)
      if (!role) {
        throw new Error('角色不存在')
      }
      
      // 系统角色不能修改某些字段
      if (role.isSystem) {
        delete roleData.code
        delete roleData.isSystem
      }
      
      // 更新角色基本信息
      await role.update({
        ...roleData,
        updatedBy
      })
      
      // 更新权限
      if (roleData.permissionIds) {
        const permissions = await Permission.findAll({
          where: { id: { [Op.in]: roleData.permissionIds } }
        })
        await role.setPermissions(permissions)
      }
      
      return role
    } catch (error) {
      throw new Error(`更新角色失败: ${error.message}`)
    }
  }
  
  /**
   * 删除角色
   * @param {number} roleId - 角色ID
   */
  async deleteRole(roleId) {
    try {
      const role = await Role.findByPk(roleId)
      if (!role) {
        throw new Error('角色不存在')
      }
      
      if (role.isSystem) {
        throw new Error('系统角色不能删除')
      }
      
      // 检查是否有用户使用此角色
      const userCount = await UserRole.count({
        where: { roleId, status: 'active' }
      })
      
      if (userCount > 0) {
        throw new Error(`还有 ${userCount} 个用户使用此角色，不能删除`)
      }
      
      await role.destroy()
      return true
    } catch (error) {
      throw new Error(`删除角色失败: ${error.message}`)
    }
  }
  
  /**
   * 获取用户的角色信息
   * @param {number} userId - 用户ID
   */
  async getUserRoles(userId) {
    try {
      const userRoles = await UserRole.findAll({
        where: { userId, status: 'active' },
        include: [{
          model: Role,
          as: 'Role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }],
        order: [['isPrimary', 'DESC'], [{ model: Role, as: 'Role' }, 'level', 'DESC']]
      })
      
      return userRoles.map(userRole => ({
        ...userRole.toJSON(),
        role: userRole.Role
      }))
    } catch (error) {
      throw new Error(`获取用户角色失败: ${error.message}`)
    }
  }
  
  /**
   * 生成权限验证中间件
   * @param {string|Array} requiredPermissions - 需要的权限
   */
  generatePermissionMiddleware(requiredPermissions) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            success: false,
            message: '用户未认证'
          })
        }
        
        const hasPermission = await this.userHasPermission(req.user.id, requiredPermissions)
        
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: '权限不足',
            requiredPermissions
          })
        }
        
        next()
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: '权限检查失败',
          error: error.message
        })
      }
    }
  }
  
  /**
   * 权限依赖检查
   * @param {Array} permissionCodes - 权限代码列表
   */
  async validatePermissionDependencies(permissionCodes) {
    try {
      const permissions = await Permission.findAll({
        where: { code: { [Op.in]: permissionCodes } }
      })
      
      const missingDependencies = []
      
      for (const permission of permissions) {
        if (permission.dependencies) {
          const dependencies = JSON.parse(permission.dependencies)
          const missingDeps = dependencies.filter(dep => !permissionCodes.includes(dep))
          if (missingDeps.length > 0) {
            missingDependencies.push({
              permission: permission.code,
              missing: missingDeps
            })
          }
        }
      }
      
      return {
        valid: missingDependencies.length === 0,
        missingDependencies
      }
    } catch (error) {
      throw new Error(`权限依赖检查失败: ${error.message}`)
    }
  }
}

module.exports = new PermissionService()