const winston = require('winston')
const path = require('path')
require('dotenv').config()

// 创建 winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'intent-admin-system' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.env.LOG_DIR || './logs', 'error.log'), 
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE?.replace('m', '')) * 1024 * 1024 || 10 * 1024 * 1024,
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14
    }),
    new winston.transports.File({ 
      filename: path.join(process.env.LOG_DIR || './logs', 'combined.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE?.replace('m', '')) * 1024 * 1024 || 10 * 1024 * 1024,
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 14
    })
  ]
})

// 在开发环境中添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// 操作日志记录
const logAction = async (userId, action, resource, resourceId = null, details = null, level = 'info') => {
  logger.log({
    level,
    message: `User action: ${action} on ${resource}`,
    userId,
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString()
  })
}

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substr(2, 9)
  
  req.requestId = requestId
  
  logger.info({
    message: 'HTTP Request',
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  })
  
  const originalJson = res.json
  res.json = function(data) {
    const duration = Date.now() - startTime
    
    logger.info({
      message: 'HTTP Response',
      requestId,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    })
    
    return originalJson.call(this, data)
  }
  
  next()
}

// 操作日志中间件工厂
const createActionLogger = (resource) => {
  return (action) => {
    return (req, res, next) => {
      logger.info({
        message: `Resource action: ${action}`,
        resource,
        action,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id || null,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      })
      next()
    }
  }
}

// 错误日志记录
const logError = (error, req, userId = null) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    name: error.name,
    userId: userId || req.user?.id || null,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  })
}

// 安全日志记录
const logSecurity = (event, req, details = {}) => {
  logger.warn({
    message: `Security event: ${event}`,
    event,
    userId: req.user?.id || null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    details,
    timestamp: new Date().toISOString()
  })
}

// 数据库操作日志
const logDatabase = (operation, table, data = {}) => {
  logger.info({
    message: `Database operation: ${operation}`,
    operation,
    table,
    data,
    timestamp: new Date().toISOString()
  })
}

module.exports = {
  logger,
  logAction,
  requestLogger,
  createActionLogger,
  logError,
  logSecurity,
  logDatabase
} 