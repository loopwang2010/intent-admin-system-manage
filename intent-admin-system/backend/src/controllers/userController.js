const { User, Role, Permission, UserRole } = require('../models')
const bcrypt = require('bcrypt')
const { Op } = require('sequelize')

/**
 * 用户控制器
 */
class UserController {
  /**
   * 获取用户列表（支持分页、搜索、过滤）
   */
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        size = 20,
        keyword = '',
        roleId = '',
        status = ''
      } = req.query

      const offset = (page - 1) * size
      const where = {}

      // 关键词搜索
      if (keyword) {
        where[Op.or] = [
          { username: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { realName: { [Op.like]: `%${keyword}%` } }
        ]
      }

      // 状态过滤
      if (status) {
        where.status = status
      }

      // 查询用户
      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }],
        offset: parseInt(offset),
        limit: parseInt(size),
        order: [['createdAt', 'DESC']]
      })

      // 如果有角色过滤，需要额外处理
      let filteredRows = rows
      if (roleId) {
        filteredRows = rows.filter(user => 
          user.roles.some(role => role.id === parseInt(roleId))
        )
      }

      res.json({
        success: true,
        data: {
          list: filteredRows,
          total: count,
          page: parseInt(page),
          size: parseInt(size)
        }
      })
    } catch (error) {
      console.error('获取用户列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: error.message
      })
    }
  }

  /**
   * 根据ID获取用户详情
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      console.error('获取用户详情失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户详情失败',
        error: error.message
      })
    }
  }

  /**
   * 创建用户
   */
  async createUser(req, res) {
    try {
      const {
        username,
        email,
        password,
        realName,
        phone,
        department,
        position,
        status = 'active',
        roleIds = [],
        remark
      } = req.body

      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.username === username ? '用户名已存在' : '邮箱已存在'
        })
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10)

      // 创建用户
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        realName,
        phone,
        department,
        position,
        status,
        remark
      })

      // 分配角色
      if (roleIds && roleIds.length > 0) {
        const roles = await Role.findAll({
          where: { id: roleIds }
        })
        await user.setRoles(roles)
      }

      // 返回用户信息（不包含密码）
      const userWithRoles = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      })

      res.status(201).json({
        success: true,
        data: userWithRoles,
        message: '用户创建成功'
      })
    } catch (error) {
      console.error('创建用户失败:', error)
      res.status(500).json({
        success: false,
        message: '创建用户失败',
        error: error.message
      })
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params
      const {
        email,
        realName,
        phone,
        department,
        position,
        status,
        roleIds,
        remark
      } = req.body

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查邮箱是否被其他用户使用
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { email, id: { [Op.ne]: id } }
        })
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: '邮箱已被其他用户使用'
          })
        }
      }

      // 更新用户信息
      await user.update({
        email,
        realName,
        phone,
        department,
        position,
        status,
        remark
      })

      // 更新角色
      if (roleIds !== undefined) {
        const roles = await Role.findAll({
          where: { id: roleIds }
        })
        await user.setRoles(roles)
      }

      // 返回更新后的用户信息
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      })

      res.json({
        success: true,
        data: updatedUser,
        message: '用户更新成功'
      })
    } catch (error) {
      console.error('更新用户失败:', error)
      res.status(500).json({
        success: false,
        message: '更新用户失败',
        error: error.message
      })
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查是否为当前登录用户
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除当前登录用户'
        })
      }

      await user.destroy()

      res.json({
        success: true,
        message: '用户删除成功'
      })
    } catch (error) {
      console.error('删除用户失败:', error)
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      })
    }
  }

  /**
   * 切换用户状态
   */
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params
      const { enabled } = req.body

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      await user.update({
        status: enabled ? 'active' : 'inactive'
      })

      res.json({
        success: true,
        message: `用户${enabled ? '启用' : '禁用'}成功`
      })
    } catch (error) {
      console.error('切换用户状态失败:', error)
      res.status(500).json({
        success: false,
        message: '切换用户状态失败',
        error: error.message
      })
    }
  }

  /**
   * 重置用户密码
   */
  async resetPassword(req, res) {
    try {
      const { id } = req.params
      const { password } = req.body

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await user.update({ password: hashedPassword })

      res.json({
        success: true,
        message: '密码重置成功'
      })
    } catch (error) {
      console.error('重置密码失败:', error)
      res.status(500).json({
        success: false,
        message: '重置密码失败',
        error: error.message
      })
    }
  }

  /**
   * 分配角色
   */
  async assignRoles(req, res) {
    try {
      const { id } = req.params
      const { roleIds } = req.body

      const user = await User.findByPk(id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      const roles = await Role.findAll({
        where: { id: roleIds }
      })

      await user.setRoles(roles)

      res.json({
        success: true,
        message: '角色分配成功'
      })
    } catch (error) {
      console.error('分配角色失败:', error)
      res.status(500).json({
        success: false,
        message: '分配角色失败',
        error: error.message
      })
    }
  }

  /**
   * 获取用户角色
   */
  async getUserRoles(req, res) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }]
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      res.json({
        success: true,
        data: user.roles
      })
    } catch (error) {
      console.error('获取用户角色失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户角色失败',
        error: error.message
      })
    }
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(req, res) {
    try {
      const { id } = req.params

      const user = await User.findByPk(id, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 合并所有角色的权限
      const permissions = new Map()
      user.roles.forEach(role => {
        role.permissions.forEach(permission => {
          permissions.set(permission.id, permission)
        })
      })

      res.json({
        success: true,
        data: {
          rolePermissions: Array.from(permissions.values()),
          directPermissions: [] // 如果有直接权限，在这里添加
        }
      })
    } catch (error) {
      console.error('获取用户权限失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户权限失败',
        error: error.message
      })
    }
  }

  /**
   * 批量删除用户
   */
  async batchDeleteUsers(req, res) {
    try {
      const { ids } = req.body

      // 检查是否包含当前登录用户
      if (ids.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: '不能删除当前登录用户'
        })
      }

      const deletedCount = await User.destroy({
        where: { id: ids }
      })

      res.json({
        success: true,
        message: `成功删除 ${deletedCount} 个用户`
      })
    } catch (error) {
      console.error('批量删除用户失败:', error)
      res.status(500).json({
        success: false,
        message: '批量删除用户失败',
        error: error.message
      })
    }
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(req, res) {
    try {
      const { ids, enabled } = req.body

      const updatedCount = await User.update(
        { status: enabled ? 'active' : 'inactive' },
        { where: { id: ids } }
      )

      res.json({
        success: true,
        message: `成功${enabled ? '启用' : '禁用'} ${updatedCount[0]} 个用户`
      })
    } catch (error) {
      console.error('批量更新状态失败:', error)
      res.status(500).json({
        success: false,
        message: '批量更新状态失败',
        error: error.message
      })
    }
  }

  /**
   * 批量分配角色
   */
  async batchAssignRoles(req, res) {
    try {
      const { userIds, roleIds } = req.body

      const users = await User.findAll({
        where: { id: userIds }
      })

      const roles = await Role.findAll({
        where: { id: roleIds }
      })

      for (const user of users) {
        await user.setRoles(roles)
      }

      res.json({
        success: true,
        message: `成功为 ${users.length} 个用户分配角色`
      })
    } catch (error) {
      console.error('批量分配角色失败:', error)
      res.status(500).json({
        success: false,
        message: '批量分配角色失败',
        error: error.message
      })
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(req, res) {
    try {
      const { keyword, ...filters } = req.query

      const where = {}

      if (keyword) {
        where[Op.or] = [
          { username: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { realName: { [Op.like]: `%${keyword}%` } }
        ]
      }

      // 应用其他过滤条件
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          where[key] = filters[key]
        }
      })

      const users = await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }],
        order: [['createdAt', 'DESC']]
      })

      res.json({
        success: true,
        data: users
      })
    } catch (error) {
      console.error('搜索用户失败:', error)
      res.status(500).json({
        success: false,
        message: '搜索用户失败',
        error: error.message
      })
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(req, res) {
    try {
      const total = await User.count()
      const active = await User.count({ where: { status: 'active' } })
      const inactive = await User.count({ where: { status: 'inactive' } })

      res.json({
        success: true,
        data: {
          total,
          active,
          inactive
        }
      })
    } catch (error) {
      console.error('获取用户统计失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户统计失败',
        error: error.message
      })
    }
  }

  /**
   * 检查用户名是否可用
   */
  async checkUsernameAvailable(req, res) {
    try {
      const { username } = req.query

      const user = await User.findOne({ where: { username } })
      
      res.json({
        success: true,
        data: { available: !user }
      })
    } catch (error) {
      console.error('检查用户名失败:', error)
      res.status(500).json({
        success: false,
        message: '检查用户名失败',
        error: error.message
      })
    }
  }

  /**
   * 检查邮箱是否可用
   */
  async checkEmailAvailable(req, res) {
    try {
      const { email } = req.query

      const user = await User.findOne({ where: { email } })
      
      res.json({
        success: true,
        data: { available: !user }
      })
    } catch (error) {
      console.error('检查邮箱失败:', error)
      res.status(500).json({
        success: false,
        message: '检查邮箱失败',
        error: error.message
      })
    }
  }
}

module.exports = new UserController()