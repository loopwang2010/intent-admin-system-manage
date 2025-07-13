const { SystemLog, User } = require('../models')
const { Op } = require('sequelize')
const { OPERATION_TYPES, OPERATION_DESCRIPTIONS } = require('../constants/operationTypes')

/**
 * 审计服务类
 * 提供审计日志的查询、分析和管理功能
 */
class AuditService {
  
  /**
   * 获取审计日志列表
   * @param {Object} options - 查询选项
   * @returns {Object} 日志列表和分页信息
   */
  async getAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      userId,
      operationType,
      resource,
      resourceId,
      success,
      level,
      ip,
      search
    } = options
    
    const offset = (page - 1) * limit
    const where = {}
    
    // 构建查询条件
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate)
      }
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate)
      }
    }
    
    if (userId) where.userId = userId
    if (operationType) where.operationType = operationType
    if (resource) where.resource = resource
    if (resourceId) where.resourceId = resourceId
    if (success !== undefined) where.success = success
    if (level) where.level = level
    if (ip) where.ip = { [Op.like]: `%${ip}%` }
    
    // 搜索功能
    if (search) {
      where[Op.or] = [
        { resourceName: { [Op.like]: `%${search}%` } },
        { operationType: { [Op.like]: `%${search}%` } },
        { path: { [Op.like]: `%${search}%` } },
        { errorMessage: { [Op.like]: `%${search}%` } }
      ]
    }
    
    try {
      const { count, rows } = await SystemLog.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'email', 'role'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      })
      
      // 处理日志数据，添加描述信息
      const logs = rows.map(log => {
        const logData = log.toJSON()
        return {
          ...logData,
          operationDescription: OPERATION_DESCRIPTIONS[logData.operationType] || logData.operationType,
          details: this.parseJSONField(logData.details),
          oldValues: this.parseJSONField(logData.oldValues),
          newValues: this.parseJSONField(logData.newValues),
          metadata: this.parseJSONField(logData.metadata)
        }
      })
      
      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      throw new Error(`获取审计日志失败: ${error.message}`)
    }
  }
  
  /**
   * 获取用户操作时间线
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Array} 用户操作时间线
   */
  async getUserTimeline(userId, options = {}) {
    const {
      limit = 100,
      startDate,
      endDate,
      resource
    } = options
    
    const where = { userId }
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    }
    
    if (resource) where.resource = resource
    
    try {
      const logs = await SystemLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      })
      
      return logs.map(log => {
        const logData = log.toJSON()
        return {
          id: logData.id,
          timestamp: logData.createdAt,
          operationType: logData.operationType,
          operationDescription: OPERATION_DESCRIPTIONS[logData.operationType] || logData.operationType,
          resource: logData.resource,
          resourceId: logData.resourceId,
          resourceName: logData.resourceName,
          success: logData.success,
          ip: logData.ip,
          details: this.parseJSONField(logData.details),
          changes: this.getChangeSummary(logData)
        }
      })
    } catch (error) {
      throw new Error(`获取用户时间线失败: ${error.message}`)
    }
  }
  
  /**
   * 获取资源变更历史
   * @param {string} resource - 资源类型
   * @param {number} resourceId - 资源ID
   * @returns {Array} 变更历史
   */
  async getResourceHistory(resource, resourceId) {
    try {
      const logs = await SystemLog.findAll({
        where: {
          resource,
          resourceId,
          operationType: {
            [Op.notIn]: ['READ'] // 排除读取操作
          }
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'role'],
          required: false
        }],
        order: [['createdAt', 'DESC']]
      })
      
      return logs.map(log => {
        const logData = log.toJSON()
        return {
          id: logData.id,
          timestamp: logData.createdAt,
          operationType: logData.operationType,
          operationDescription: OPERATION_DESCRIPTIONS[logData.operationType] || logData.operationType,
          user: logData.User,
          oldValues: this.parseJSONField(logData.oldValues),
          newValues: this.parseJSONField(logData.newValues),
          changes: this.getDetailedChanges(logData),
          success: logData.success,
          ip: logData.ip
        }
      })
    } catch (error) {
      throw new Error(`获取资源历史失败: ${error.message}`)
    }
  }
  
  /**
   * 获取审计统计信息
   * @param {Object} options - 统计选项
   * @returns {Object} 统计信息
   */
  async getAuditStats(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 默认30天
      endDate = new Date()
    } = options
    
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
      
      // 总操作数
      const totalOperations = await SystemLog.count({ where: whereClause })
      
      // 成功操作数
      const successfulOperations = await SystemLog.count({
        where: { ...whereClause, success: true }
      })
      
      // 失败操作数
      const failedOperations = await SystemLog.count({
        where: { ...whereClause, success: false }
      })
      
      // 按操作类型统计
      const operationTypeStats = await SystemLog.findAll({
        where: whereClause,
        attributes: [
          'operationType',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['operationType'],
        order: [[SystemLog.sequelize.literal('count'), 'DESC']],
        limit: 10
      })
      
      // 按资源类型统计
      const resourceStats = await SystemLog.findAll({
        where: whereClause,
        attributes: [
          'resource',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['resource'],
        order: [[SystemLog.sequelize.literal('count'), 'DESC']]
      })
      
      // 按用户统计
      const userStats = await SystemLog.findAll({
        where: { ...whereClause, userId: { [Op.ne]: null } },
        attributes: [
          'userId',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        include: [{
          model: User,
          as: 'User',
          attributes: ['username', 'role']
        }],
        group: ['userId'],
        order: [[SystemLog.sequelize.literal('count'), 'DESC']],
        limit: 10
      })
      
      // 按小时统计（最近24小时）
      const hourlyStats = await SystemLog.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [SystemLog.sequelize.fn('DATE_FORMAT', SystemLog.sequelize.col('createdAt'), '%H'), 'hour'],
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [SystemLog.sequelize.fn('DATE_FORMAT', SystemLog.sequelize.col('createdAt'), '%H')],
        order: [['hour', 'ASC']]
      })
      
      // IP统计
      const ipStats = await SystemLog.findAll({
        where: { ...whereClause, ip: { [Op.ne]: null } },
        attributes: [
          'ip',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['ip'],
        order: [[SystemLog.sequelize.literal('count'), 'DESC']],
        limit: 10
      })
      
      return {
        summary: {
          totalOperations,
          successfulOperations,
          failedOperations,
          successRate: totalOperations > 0 ? (successfulOperations / totalOperations * 100).toFixed(2) : 0
        },
        operationTypes: operationTypeStats.map(item => ({
          type: item.operationType,
          description: OPERATION_DESCRIPTIONS[item.operationType] || item.operationType,
          count: parseInt(item.dataValues.count)
        })),
        resources: resourceStats.map(item => ({
          resource: item.resource,
          count: parseInt(item.dataValues.count)
        })),
        users: userStats.map(item => ({
          userId: item.userId,
          username: item.User?.username || 'Unknown',
          role: item.User?.role || 'Unknown',
          count: parseInt(item.dataValues.count)
        })),
        hourlyActivity: hourlyStats.map(item => ({
          hour: parseInt(item.dataValues.hour),
          count: parseInt(item.dataValues.count)
        })),
        topIPs: ipStats.map(item => ({
          ip: item.ip,
          count: parseInt(item.dataValues.count)
        }))
      }
    } catch (error) {
      throw new Error(`获取审计统计失败: ${error.message}`)
    }
  }
  
  /**
   * 检测可疑活动
   * @param {Object} options - 检测选项
   * @returns {Array} 可疑活动列表
   */
  async detectSuspiciousActivity(options = {}) {
    const {
      hours = 24,
      failureThreshold = 5,
      rapidAccessThreshold = 50
    } = options
    
    const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    try {
      const suspiciousActivities = []
      
      // 1. 检测频繁失败的登录尝试
      const failedLogins = await SystemLog.findAll({
        where: {
          operationType: OPERATION_TYPES.USER_LOGIN,
          success: false,
          createdAt: { [Op.gte]: timeWindow }
        },
        attributes: [
          'ip',
          'resourceName',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['ip', 'resourceName'],
        having: SystemLog.sequelize.literal(`COUNT(*) >= ${failureThreshold}`)
      })
      
      failedLogins.forEach(item => {
        suspiciousActivities.push({
          type: 'REPEATED_LOGIN_FAILURES',
          description: `IP ${item.ip} 对用户 ${item.resourceName} 进行了 ${item.dataValues.count} 次失败的登录尝试`,
          severity: 'high',
          ip: item.ip,
          count: parseInt(item.dataValues.count),
          timeWindow: hours
        })
      })
      
      // 2. 检测异常高频访问
      const rapidAccess = await SystemLog.findAll({
        where: {
          createdAt: { [Op.gte]: timeWindow }
        },
        attributes: [
          'ip',
          'userId',
          [SystemLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['ip', 'userId'],
        having: SystemLog.sequelize.literal(`COUNT(*) >= ${rapidAccessThreshold}`)
      })
      
      rapidAccess.forEach(item => {
        suspiciousActivities.push({
          type: 'RAPID_ACCESS',
          description: `IP ${item.ip} 在 ${hours} 小时内进行了 ${item.dataValues.count} 次操作`,
          severity: 'medium',
          ip: item.ip,
          userId: item.userId,
          count: parseInt(item.dataValues.count),
          timeWindow: hours
        })
      })
      
      // 3. 检测权限提升操作
      const privilegeEscalation = await SystemLog.findAll({
        where: {
          operationType: {
            [Op.in]: [OPERATION_TYPES.USER_ROLE_CHANGE, OPERATION_TYPES.PERMISSION_GRANT]
          },
          createdAt: { [Op.gte]: timeWindow }
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['username', 'role']
        }],
        order: [['createdAt', 'DESC']]
      })
      
      privilegeEscalation.forEach(item => {
        suspiciousActivities.push({
          type: 'PRIVILEGE_ESCALATION',
          description: `用户 ${item.User?.username || 'Unknown'} 进行了权限相关操作`,
          severity: 'high',
          userId: item.userId,
          operationType: item.operationType,
          timestamp: item.createdAt
        })
      })
      
      return suspiciousActivities
    } catch (error) {
      throw new Error(`检测可疑活动失败: ${error.message}`)
    }
  }
  
  /**
   * 清理旧日志
   * @param {number} days - 保留天数
   * @returns {number} 删除的记录数
   */
  async cleanupOldLogs(days = 90) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    try {
      const deletedCount = await SystemLog.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate }
        }
      })
      
      return deletedCount
    } catch (error) {
      throw new Error(`清理旧日志失败: ${error.message}`)
    }
  }
  
  /**
   * 解析JSON字段
   * @param {string} jsonString - JSON字符串
   * @returns {Object|null} 解析后的对象
   */
  parseJSONField(jsonString) {
    if (!jsonString) return null
    try {
      return JSON.parse(jsonString)
    } catch (e) {
      return null
    }
  }
  
  /**
   * 获取变更摘要
   * @param {Object} logData - 日志数据
   * @returns {Object} 变更摘要
   */
  getChangeSummary(logData) {
    const oldValues = this.parseJSONField(logData.oldValues)
    const newValues = this.parseJSONField(logData.newValues)
    
    if (!oldValues || !newValues) return null
    
    const changes = {}
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
    
    allKeys.forEach(key => {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        }
      }
    })
    
    return Object.keys(changes).length > 0 ? changes : null
  }
  
  /**
   * 获取详细变更信息
   * @param {Object} logData - 日志数据
   * @returns {Array} 详细变更列表
   */
  getDetailedChanges(logData) {
    const oldValues = this.parseJSONField(logData.oldValues)
    const newValues = this.parseJSONField(logData.newValues)
    
    if (!oldValues || !newValues) return []
    
    const changes = []
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
    
    allKeys.forEach(key => {
      if (oldValues[key] !== newValues[key]) {
        changes.push({
          field: key,
          oldValue: oldValues[key],
          newValue: newValues[key],
          type: this.getChangeType(oldValues[key], newValues[key])
        })
      }
    })
    
    return changes
  }
  
  /**
   * 获取变更类型
   * @param {*} oldValue - 旧值
   * @param {*} newValue - 新值
   * @returns {string} 变更类型
   */
  getChangeType(oldValue, newValue) {
    if (oldValue === null || oldValue === undefined) return 'added'
    if (newValue === null || newValue === undefined) return 'removed'
    return 'modified'
  }
}

module.exports = new AuditService()