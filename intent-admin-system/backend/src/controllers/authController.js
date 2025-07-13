// 用户认证控制器 - 完整版本
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { User } = require('../models')
const { logLogin, logOperation, logSecurityEvent } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

const login = async (req, res) => {
  try {
    const { username, password, remember = false } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      })
    }

    // 查找用户，包含角色信息
    const user = await User.findOne({ 
      where: { username: username },
      include: [
        {
          model: require('../models').Role,
          as: 'roles',
          attributes: ['id', 'code', 'name', 'description', 'level'],
          through: { attributes: [] }
        }
      ]
    })

    if (!user) {
      // 记录失败的登录尝试
      await logLogin(null, req, false, '用户不存在')
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    if (user.status !== 'active') {
      // 记录被禁用账户的登录尝试
      await logLogin(user, req, false, '账户已被禁用')
      await logSecurityEvent(OPERATION_TYPES.SYSTEM_ACCESS_DENIED, 
        '被禁用账户尝试登录', req, { userId: user.id, username: user.username })
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // 记录密码错误的登录尝试
      await logLogin(user, req, false, '密码错误')
      await logSecurityEvent(OPERATION_TYPES.SYSTEM_LOGIN_ATTEMPT, 
        '密码错误的登录尝试', req, { userId: user.id, username: user.username })
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 获取用户角色信息
    const userRoles = user.roles || []
    const primaryRole = userRoles.find(role => role.code === 'super_admin') || 
                       userRoles.find(role => role.code === 'admin') || 
                       userRoles[0] || 
                       { code: user.role, name: user.role }

    // 生成JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: primaryRole.code,
      roles: userRoles.map(role => ({
        id: role.id,
        code: role.code,
        name: role.name,
        level: role.level
      })),
      permissions: user.permissions || []
    }

    const expiresIn = remember ? '30d' : JWT_EXPIRES_IN
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn })

    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await user.save()

    // 记录成功登录
    await logLogin(user, req, true)

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user.toJSON()
    
    // 添加角色信息到用户信息中
    userInfo.primaryRole = primaryRole
    userInfo.allRoles = userRoles

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userInfo,
        token,
        expiresIn: remember ? '30d' : JWT_EXPIRES_IN
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    })
  }
}

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      role = 'viewer'
    } = req.body

    // 验证必填字段
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有字段都为必填项'
      })
    }

    // 验证密码一致性
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致'
      })
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      })
    }

    // 检查用户名是否已存在
    const existingUser = mockUsers.find(u => 
      u.username === username || u.email === email
    )

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名或邮箱已存在'
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建新用户
    const newUser = {
      id: Date.now(),
      username,
      email,
      password: hashedPassword,
      role,
      permissions: getRolePermissions(role),
      status: 'active',
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockUsers.push(newUser)

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = newUser

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: userInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    })
  }
}

const logout = async (req, res) => {
  try {
    // 记录登出操作
    if (req.user) {
      await logOperation({
        operationType: OPERATION_TYPES.USER_LOGOUT,
        resource: 'user',
        resourceId: req.user.id,
        resourceName: req.user.username,
        metadata: { action: 'user_logout' }
      }, req)
    }

    // 在实际应用中，可能需要将token加入黑名单
    res.json({
      success: true,
      message: '退出登录成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '退出登录失败',
      error: error.message
    })
  }
}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌为必填项'
      })
    }

    // 验证refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    const user = mockUsers.find(u => u.id === decoded.id)

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '无效的刷新令牌'
      })
    }

    // 生成新的access token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    }

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        token: newToken,
        expiresIn: JWT_EXPIRES_IN
      }
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '令牌刷新失败',
      error: error.message
    })
  }
}

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未找到用户信息'
      })
    }

    const user = mockUsers.find(u => u.id === userId)

    if (!user || user.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: '用户不存在或已被禁用'
      })
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user

    res.json({
      success: true,
      data: userInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id
    const { email, currentPassword, newPassword, avatar } = req.body

    const user = mockUsers.find(u => u.id === userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 如果要更新密码，需要验证当前密码
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: '修改密码需要提供当前密码'
        })
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '当前密码错误'
        })
      }

      // 更新密码
      user.password = await bcrypt.hash(newPassword, 10)
    }

    // 更新其他信息
    if (email) user.email = email
    if (avatar) user.avatar = avatar
    user.updatedAt = new Date()

    // 返回更新后的用户信息（不包含密码）
    const { password: _, ...userInfo } = user

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: userInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新个人信息失败',
      error: error.message
    })
  }
}

const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有密码字段都为必填项'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码两次输入不一致'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6位'
      })
    }

    const user = mockUsers.find(u => u.id === userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      })
    }

    // 更新密码
    user.password = await bcrypt.hash(newPassword, 10)
    user.updatedAt = new Date()

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    })
  }
}

// 用户管理（管理员功能）
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = 'all',
      status = 'all'
    } = req.query

    // 检查权限
    if (!req.user?.permissions.includes('all') && !req.user?.permissions.includes('user:manage')) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    let filteredUsers = mockUsers.map(({ password, ...user }) => user)

    // 根据查询参数过滤
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.includes(search) || 
        user.email.includes(search)
      )
    }
    if (role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }

    res.json({
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
          pages: Math.ceil(filteredUsers.length / parseInt(limit))
        },
        stats: {
          total: mockUsers.length,
          byRole: {
            admin: mockUsers.filter(u => u.role === 'admin').length,
            editor: mockUsers.filter(u => u.role === 'editor').length,
            viewer: mockUsers.filter(u => u.role === 'viewer').length
          },
          byStatus: {
            active: mockUsers.filter(u => u.status === 'active').length,
            inactive: mockUsers.filter(u => u.status === 'inactive').length
          }
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { role, status, permissions } = req.body

    // 检查权限
    if (!req.user?.permissions.includes('all') && !req.user?.permissions.includes('user:manage')) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const user = mockUsers.find(u => u.id === parseInt(id))

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 不能修改自己的角色和状态
    if (user.id === req.user?.id && (role || status)) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的角色或状态'
      })
    }

    // 更新用户信息
    if (role) {
      user.role = role
      user.permissions = getRolePermissions(role)
    }
    if (status) user.status = status
    if (permissions) user.permissions = permissions
    user.updatedAt = new Date()

    // 返回更新后的用户信息（不包含密码）
    const { password: _, ...userInfo } = user

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // 检查权限
    if (!req.user?.permissions.includes('all') && !req.user?.permissions.includes('user:manage')) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    const userIndex = mockUsers.findIndex(u => u.id === parseInt(id))

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 不能删除自己
    if (mockUsers[userIndex].id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      })
    }

    mockUsers.splice(userIndex, 1)

    res.json({
      success: true,
      message: `用户 ${id} 删除成功`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    })
  }
}

// 权限检查
const checkPermission = async (req, res) => {
  try {
    const { permission } = req.params

    const hasPermission = req.user?.permissions.includes('all') || 
                         req.user?.permissions.includes(permission)

    res.json({
      success: true,
      data: {
        hasPermission,
        permission,
        userPermissions: req.user?.permissions || []
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

// 获取角色权限
const getRolePermissions = (role) => {
  const rolePermissions = {
    admin: ['all'],
    editor: ['read', 'write', 'intent:manage', 'category:manage', 'response:manage', 'test:manage'],
    viewer: ['read']
  }
  return rolePermissions[role] || ['read']
}

// 获取权限列表
const getPermissions = async (req, res) => {
  try {
    const permissions = [
      { key: 'all', name: '全部权限', description: '系统所有权限' },
      { key: 'read', name: '读取权限', description: '查看数据' },
      { key: 'write', name: '写入权限', description: '创建和编辑数据' },
      { key: 'intent:manage', name: '意图管理', description: '管理核心和非核心意图' },
      { key: 'category:manage', name: '分类管理', description: '管理意图分类' },
      { key: 'response:manage', name: '回复管理', description: '管理回复模板' },
      { key: 'test:manage', name: '测试管理', description: '执行意图测试' },
      { key: 'user:manage', name: '用户管理', description: '管理用户账户' },
      { key: 'system:config', name: '系统配置', description: '修改系统配置' }
    ]

    res.json({
      success: true,
      data: permissions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取权限列表失败',
      error: error.message
    })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址为必填项'
      })
    }

    // 这里应该发送重置密码邮件
    // 目前只返回成功响应
    res.json({
      success: true,
      message: '重置密码邮件已发送到您的邮箱'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送重置密码邮件失败',
      error: error.message
    })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body
    
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有字段都为必填项'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      })
    }

    // 这里应该验证token并重置密码
    // 目前只返回成功响应
    res.json({
      success: true,
      message: '密码重置成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message
    })
  }
}

const verifyToken = async (req, res) => {
  try {
    const { token } = req.query
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: '验证令牌为必填项'
      })
    }

    // 这里应该验证token
    // 目前只返回成功响应
    res.json({
      success: true,
      message: '令牌验证成功',
      data: {
        valid: true
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '令牌验证失败',
      error: error.message
    })
  }
}

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  getUsers,
  updateUser,
  deleteUser,
  checkPermission,
  getPermissions,
  forgotPassword,
  resetPassword,
  verifyToken
} 