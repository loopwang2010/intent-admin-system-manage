const jwt = require('jsonwebtoken')
const permissionService = require('../services/permissionService')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      })
    }
    return res.status(500).json({
      success: false,
      message: '认证失败'
    })
  }
}

const authorize = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        })
      }

      // 简化的角色检查：直接检查用户角色
      if (roles.includes(req.user.role)) {
        return next()
      }

      // 对于权限系统的高级检查（可选）
      try {
        const hasPermission = await permissionService.userHasPermission(req.user.id, roles)
        if (hasPermission) {
          return next()
        }
      } catch (permError) {
        console.log('权限服务检查失败，使用基础角色检查:', permError.message)
      }

      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问该资源',
        requiredRoles: roles,
        userRole: req.user.role
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      })
    }
  }
}

// 新增：检查具体权限的中间件生成器
const requirePermission = (permission) => {
  return permissionService.generatePermissionMiddleware(permission)
}

// 新增：检查多个权限中任一个的中间件生成器
const requireAnyPermission = (permissions) => {
  return permissionService.generatePermissionMiddleware(permissions)
}

// 新增：检查所有权限的中间件生成器
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        })
      }
      
      const userPermissions = await permissionService.getUserPermissions(req.user.id)
      
      // 检查是否拥有超级权限
      if (userPermissions.includes('*')) {
        return next()
      }
      
      // 检查是否拥有所有要求的权限
      const hasAllPermissions = permissions.every(permission => 
        userPermissions.includes(permission)
      )
      
      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: '权限不足，需要所有指定权限',
          requiredPermissions: permissions
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

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
} 