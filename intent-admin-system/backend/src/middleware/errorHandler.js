const { logger } = require('./logger')

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// 验证错误类
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

// 认证错误类
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

// 权限错误类
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

// 资源未找到错误类
class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

// 冲突错误类
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

// 数据库错误处理
const handleDatabaseError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }))
    return new ValidationError('数据验证失败', errors)
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return new ConflictError('数据已存在，违反唯一约束')
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new ValidationError('外键约束错误，关联数据不存在')
  }
  
  if (error.name === 'SequelizeConnectionError') {
    return new AppError('数据库连接失败', 500, 'DATABASE_CONNECTION_ERROR')
  }
  
  // 其他数据库错误
  return new AppError('数据库操作失败', 500, 'DATABASE_ERROR')
}

// JWT 错误处理
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('认证令牌已过期')
  }
  
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的认证令牌')
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('认证令牌尚未生效')
  }
  
  return new AuthenticationError('认证失败')
}

// 开发环境错误响应
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      code: err.code,
      stack: err.stack,
      details: err.errors || null
    },
    timestamp: new Date().toISOString()
  })
}

// 生产环境错误响应
const sendErrorProd = (err, res) => {
  // 操作性错误：发送详细信息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || null,
      timestamp: new Date().toISOString()
    })
  } else {
    // 编程错误：不泄露错误详情
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    })
  }
}

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    code: err.code,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || null,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  })

  let error = { ...err }
  error.message = err.message

  // 处理特定类型的错误
  if (err.name && err.name.startsWith('Sequelize')) {
    error = handleDatabaseError(error)
  }
  
  if (err.name && (err.name.includes('JsonWebToken') || err.name.includes('Token'))) {
    error = handleJWTError(error)
  }
  
  // 处理 Joi 验证错误
  if (err.isJoi) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    error = new ValidationError('请求参数验证失败', errors)
  }
  
  // 处理 MongoDB 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    error = new ConflictError(`${field} 已存在`)
  }
  
  // 处理 Cast 错误
  if (err.name === 'CastError') {
    error = new ValidationError('无效的数据格式')
  }

  // 发送错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res)
  } else {
    sendErrorProd(error, res)
  }
}

// 处理未捕获的异步错误
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 错误处理中间件
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`接口 ${req.originalUrl} 未找到`)
  next(error)
}

// 进程异常处理
process.on('uncaughtException', (err) => {
  logger.error({
    message: 'Uncaught Exception',
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  })
  
  // 优雅关闭
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  logger.error({
    message: 'Unhandled Promise Rejection',
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  })
  
  // 优雅关闭
  process.exit(1)
})

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  globalErrorHandler,
  asyncErrorHandler,
  notFoundHandler
}