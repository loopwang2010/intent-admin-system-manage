const { SystemLog } = require('../models')
const { 
  OPERATION_TYPES, 
  getOperationTypeFromRoute, 
  getResourceTypeFromRoute 
} = require('../constants/operationTypes')
const { v4: uuidv4 } = require('uuid')

// 需要脱敏的字段
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'credential']

// 不需要记录日志的路径
const EXCLUDED_PATHS = [
  '/health',
  '/favicon.ico',
  '/static',
  '/public'
]

// 不需要记录的方法
const EXCLUDED_METHODS = ['OPTIONS']

/**
 * 数据脱敏处理
 * @param {Object} data - 需要脱敏的数据
 * @returns {Object} 脱敏后的数据
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data
  
  const sanitized = { ...data }
  
  Object.keys(sanitized).forEach(key => {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key])
    }
  })
  
  return sanitized
}

/**
 * 获取客户端IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} IP地址
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         'unknown'
}

/**
 * 生成请求ID
 * @returns {string} 唯一请求ID
 */
const generateRequestId = () => {
  return uuidv4()
}

/**
 * 从请求中提取资源ID
 * @param {Object} req - Express请求对象
 * @returns {number|null} 资源ID
 */
const extractResourceId = (req) => {
  // 从URL参数中提取ID
  if (req.params.id) return parseInt(req.params.id)
  
  // 从请求体中提取ID
  if (req.body.id) return parseInt(req.body.id)
  
  // 从查询参数中提取ID
  if (req.query.id) return parseInt(req.query.id)
  
  return null
}

/**
 * 从请求中提取资源名称
 * @param {Object} req - Express请求对象
 * @param {string} resource - 资源类型
 * @returns {string|null} 资源名称
 */
const extractResourceName = (req, resource) => {
  // 从请求体中提取名称字段
  if (req.body.name) return req.body.name
  if (req.body.username) return req.body.username
  if (req.body.title) return req.body.title
  
  return null
}

/**
 * 异步写入日志到数据库
 * @param {Object} logData - 日志数据
 */
const writeLogAsync = async (logData) => {
  try {
    await SystemLog.create(logData)
  } catch (error) {
    // 日志写入失败不应该影响主业务
    console.error('写入审计日志失败:', error.message)
  }
}

/**
 * 审计日志中间件
 * 记录所有API操作的详细信息
 */
const auditLogger = (req, res, next) => {
  // 跳过不需要记录的请求
  if (EXCLUDED_METHODS.includes(req.method) || 
      EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next()
  }
  
  const startTime = Date.now()
  const requestId = generateRequestId()
  
  // 在请求对象上添加requestId，方便其他地方使用
  req.requestId = requestId
  req.sessionId = req.session?.id || req.headers['x-session-id'] || 'unknown'
  
  // 记录请求开始信息
  const baseLogData = {
    requestId,
    sessionId: req.sessionId,
    userId: req.user?.id || null,
    method: req.method,
    path: req.path,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || '',
    level: 'audit'
  }
  
  // 保存原始的res.send方法
  const originalSend = res.send
  const originalJson = res.json
  const originalEnd = res.end
  
  // 重写响应方法来捕获响应信息
  const wrapResponse = (originalMethod) => {
    return function(body) {
      const responseTime = Date.now() - startTime
      const success = res.statusCode < 400
      
      // 获取操作类型和资源信息
      const operationType = getOperationTypeFromRoute(req.method, req.path, req.body)
      const resource = getResourceTypeFromRoute(req.path)
      const resourceId = extractResourceId(req)
      const resourceName = extractResourceName(req, resource)
      
      // 构建完整的日志数据
      const logData = {
        ...baseLogData,
        action: req.method,
        operationType,
        resource,
        resourceId,
        resourceName,
        responseStatus: res.statusCode,
        responseTime,
        success,
        details: JSON.stringify({
          query: sanitizeData(req.query),
          params: sanitizeData(req.params),
          body: sanitizeData(req.body),
          headers: sanitizeData({
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer']
          })
        }),
        metadata: JSON.stringify({
          url: req.originalUrl,
          baseUrl: req.baseUrl,
          protocol: req.protocol,
          hostname: req.hostname,
          contentLength: req.headers['content-length'],
          responseSize: body ? Buffer.byteLength(JSON.stringify(body)) : 0
        })
      }
      
      // 如果操作失败，记录错误信息
      if (!success && body) {
        try {
          const errorInfo = typeof body === 'string' ? JSON.parse(body) : body
          logData.errorCode = errorInfo.code || res.statusCode.toString()
          logData.errorMessage = errorInfo.message || errorInfo.error || 'Unknown error'
        } catch (e) {
          logData.errorMessage = body.toString().substring(0, 500)
        }
      }
      
      // 异步写入日志
      setImmediate(() => writeLogAsync(logData))
      
      // 调用原始方法
      return originalMethod.call(this, body)
    }
  }
  
  // 重写响应方法
  res.send = wrapResponse(originalSend)
  res.json = wrapResponse(originalJson)
  res.end = wrapResponse(originalEnd)
  
  next()
}

/**
 * 记录特定操作的详细变更
 * @param {Object} options - 选项
 * @param {string} options.operationType - 操作类型
 * @param {string} options.resource - 资源类型
 * @param {number} options.resourceId - 资源ID
 * @param {string} options.resourceName - 资源名称
 * @param {Object} options.oldValues - 修改前的值
 * @param {Object} options.newValues - 修改后的值
 * @param {Object} options.metadata - 额外元数据
 * @param {Object} req - Express请求对象
 */
const logOperation = async (options, req) => {
  const {
    operationType,
    resource,
    resourceId,
    resourceName,
    oldValues,
    newValues,
    metadata = {}
  } = options
  
  try {
    const logData = {
      requestId: req.requestId || generateRequestId(),
      sessionId: req.sessionId || 'unknown',
      userId: req.user?.id || null,
      action: req.method || 'MANUAL',
      operationType,
      resource,
      resourceId,
      resourceName,
      method: req.method,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.headers?.['user-agent'] || '',
      oldValues: oldValues ? JSON.stringify(sanitizeData(oldValues)) : null,
      newValues: newValues ? JSON.stringify(sanitizeData(newValues)) : null,
      level: 'audit',
      success: true,
      metadata: JSON.stringify(metadata)
    }
    
    await SystemLog.create(logData)
  } catch (error) {
    console.error('记录操作日志失败:', error.message)
  }
}

/**
 * 记录登录操作
 * @param {Object} user - 用户对象
 * @param {Object} req - Express请求对象
 * @param {boolean} success - 登录是否成功
 * @param {string} reason - 失败原因
 */
const logLogin = async (user, req, success = true, reason = null) => {
  try {
    const logData = {
      requestId: req.requestId || generateRequestId(),
      sessionId: req.sessionId || 'unknown',
      userId: user?.id || null,
      action: 'LOGIN',
      operationType: OPERATION_TYPES.USER_LOGIN,
      resource: 'user',
      resourceId: user?.id || null,
      resourceName: user?.username || req.body?.username || 'unknown',
      method: req.method,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      level: success ? 'info' : 'warning',
      success,
      errorMessage: success ? null : reason,
      metadata: JSON.stringify({
        loginTime: new Date().toISOString(),
        rememberMe: req.body?.remember || false
      })
    }
    
    await SystemLog.create(logData)
  } catch (error) {
    console.error('记录登录日志失败:', error.message)
  }
}

/**
 * 记录安全事件
 * @param {string} eventType - 事件类型
 * @param {string} description - 事件描述
 * @param {Object} req - Express请求对象
 * @param {Object} metadata - 额外信息
 */
const logSecurityEvent = async (eventType, description, req, metadata = {}) => {
  try {
    const logData = {
      requestId: req.requestId || generateRequestId(),
      sessionId: req.sessionId || 'unknown',
      userId: req.user?.id || null,
      action: 'SECURITY',
      operationType: eventType,
      resource: 'system',
      method: req.method,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      level: 'warning',
      success: false,
      errorMessage: description,
      metadata: JSON.stringify(metadata)
    }
    
    await SystemLog.create(logData)
  } catch (error) {
    console.error('记录安全事件日志失败:', error.message)
  }
}

module.exports = {
  auditLogger,
  logOperation,
  logLogin,
  logSecurityEvent,
  sanitizeData,
  getClientIP
}