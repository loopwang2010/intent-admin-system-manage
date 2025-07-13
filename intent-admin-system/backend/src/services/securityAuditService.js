const { SystemLog, User, sequelize } = require('../models')
const { Op } = require('sequelize')

/**
 * 安全审计服务
 * 提供安全相关的审计分析功能
 */
class SecurityAuditService {
  
  /**
   * 检测可疑活动
   * @param {Object} options - 检测选项
   */
  async detectSuspiciousActivities(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // 默认最近24小时
        endDate = new Date(),
        threshold = {
          failedLogins: 5,        // 失败登录次数阈值
          highFrequency: 100,     // 高频操作阈值
          nightActivity: 10,      // 夜间活动阈值
          bulkOperations: 50      // 批量操作阈值
        }
      } = options
      
      const suspiciousActivities = []
      
      // 1. 检测多次失败登录
      const failedLogins = await this.detectFailedLogins(startDate, endDate, threshold.failedLogins)
      suspiciousActivities.push(...failedLogins)
      
      // 2. 检测高频操作
      const highFrequencyOps = await this.detectHighFrequencyOperations(startDate, endDate, threshold.highFrequency)
      suspiciousActivities.push(...highFrequencyOps)
      
      // 3. 检测异常时间活动
      const nightActivities = await this.detectNightTimeActivities(startDate, endDate, threshold.nightActivity)
      suspiciousActivities.push(...nightActivities)
      
      // 4. 检测批量敏感操作
      const bulkOperations = await this.detectBulkSensitiveOperations(startDate, endDate, threshold.bulkOperations)
      suspiciousActivities.push(...bulkOperations)
      
      // 5. 检测权限滥用
      const privilegeAbuse = await this.detectPrivilegeAbuse(startDate, endDate)
      suspiciousActivities.push(...privilegeAbuse)
      
      // 按风险等级排序
      return {
        activities: suspiciousActivities.sort((a, b) => this.getRiskScore(b) - this.getRiskScore(a)),
        summary: {
          total: suspiciousActivities.length,
          critical: suspiciousActivities.filter(a => a.riskLevel === 'critical').length,
          high: suspiciousActivities.filter(a => a.riskLevel === 'high').length,
          medium: suspiciousActivities.filter(a => a.riskLevel === 'medium').length,
          low: suspiciousActivities.filter(a => a.riskLevel === 'low').length,
          timeRange: { startDate, endDate }
        }
      }
    } catch (error) {
      throw new Error(`检测可疑活动失败: ${error.message}`)
    }
  }
  
  /**
   * 生成安全报告
   * @param {Object} options - 报告选项
   */
  async generateSecurityReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 默认最近7天
        endDate = new Date(),
        includeRecommendations = true
      } = options
      
      // 并行获取各种安全数据
      const [
        suspiciousActivities,
        loginAnalysis,
        operationStatistics,
        userBehaviorAnalysis,
        systemHealthCheck
      ] = await Promise.all([
        this.detectSuspiciousActivities({ startDate, endDate }),
        this.analyzeLoginPatterns(startDate, endDate),
        this.analyzeOperationStatistics(startDate, endDate),
        this.analyzeUserBehavior(startDate, endDate),
        this.performSystemHealthCheck()
      ])
      
      const report = {
        reportInfo: {
          generatedAt: new Date().toISOString(),
          timeRange: { startDate, endDate },
          reportType: 'comprehensive_security_audit'
        },
        executive: {
          overallRiskLevel: this.calculateOverallRiskLevel(suspiciousActivities),
          totalIncidents: suspiciousActivities.summary.total,
          criticalIssues: suspiciousActivities.summary.critical,
          keyFindings: this.extractKeyFindings(suspiciousActivities, loginAnalysis, operationStatistics)
        },
        suspicious: suspiciousActivities,
        authentication: loginAnalysis,
        operations: operationStatistics,
        userBehavior: userBehaviorAnalysis,
        systemHealth: systemHealthCheck,
        recommendations: includeRecommendations ? this.generateSecurityRecommendations(
          suspiciousActivities,
          loginAnalysis,
          operationStatistics,
          systemHealthCheck
        ) : []
      }
      
      return report
    } catch (error) {
      throw new Error(`生成安全报告失败: ${error.message}`)
    }
  }
  
  /**
   * 检测失败登录
   */
  async detectFailedLogins(startDate, endDate, threshold) {
    const failedLogins = await SystemLog.findAll({
      where: {
        operationType: 'USER_LOGIN',
        success: false,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'userId',
        'ipAddress',
        [sequelize.fn('COUNT', '*'), 'attempts'],
        [sequelize.fn('MIN', sequelize.col('createdAt')), 'firstAttempt'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastAttempt']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username', 'email'],
        required: false
      }],
      group: ['userId', 'ipAddress'],
      having: sequelize.where(sequelize.fn('COUNT', '*'), Op.gte, threshold),
      order: [[sequelize.literal('attempts'), 'DESC']]
    })
    
    return failedLogins.map(item => ({
      type: 'failed_login_attempts',
      riskLevel: item.dataValues.attempts >= threshold * 2 ? 'critical' : 'high',
      description: `用户 ${item.User?.username || 'Unknown'} 从IP ${item.ipAddress} 连续登录失败 ${item.dataValues.attempts} 次`,
      details: {
        userId: item.userId,
        username: item.User?.username,
        ipAddress: item.ipAddress,
        attempts: parseInt(item.dataValues.attempts),
        timeSpan: new Date(item.dataValues.lastAttempt) - new Date(item.dataValues.firstAttempt),
        firstAttempt: item.dataValues.firstAttempt,
        lastAttempt: item.dataValues.lastAttempt
      },
      timestamp: item.dataValues.lastAttempt,
      category: 'authentication'
    }))
  }
  
  /**
   * 检测高频操作
   */
  async detectHighFrequencyOperations(startDate, endDate, threshold) {
    const highFrequencyOps = await SystemLog.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        userId: { [Op.ne]: null }
      },
      attributes: [
        'userId',
        'operationType',
        [sequelize.fn('COUNT', '*'), 'operationCount'],
        [sequelize.fn('MIN', sequelize.col('createdAt')), 'firstOperation'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastOperation']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username'],
        required: false
      }],
      group: ['userId', 'operationType'],
      having: sequelize.where(sequelize.fn('COUNT', '*'), Op.gte, threshold),
      order: [[sequelize.literal('operationCount'), 'DESC']]
    })
    
    return highFrequencyOps.map(item => ({
      type: 'high_frequency_operations',
      riskLevel: item.dataValues.operationCount >= threshold * 2 ? 'high' : 'medium',
      description: `用户 ${item.User?.username || 'Unknown'} 在短时间内执行了 ${item.dataValues.operationCount} 次 ${item.operationType} 操作`,
      details: {
        userId: item.userId,
        username: item.User?.username,
        operationType: item.operationType,
        operationCount: parseInt(item.dataValues.operationCount),
        timeSpan: new Date(item.dataValues.lastOperation) - new Date(item.dataValues.firstOperation),
        opsPerMinute: this.calculateOpsPerMinute(
          item.dataValues.operationCount,
          item.dataValues.firstOperation,
          item.dataValues.lastOperation
        )
      },
      timestamp: item.dataValues.lastOperation,
      category: 'operation_frequency'
    }))
  }
  
  /**
   * 检测夜间活动
   */
  async detectNightTimeActivities(startDate, endDate, threshold) {
    const nightActivities = await SystemLog.findAll({
      where: [
        {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        sequelize.where(
          sequelize.fn('HOUR', sequelize.col('createdAt')),
          { [Op.or]: [{ [Op.between]: [22, 23] }, { [Op.between]: [0, 5] }] }
        )
      ],
      attributes: [
        'userId',
        [sequelize.fn('COUNT', '*'), 'nightOperations'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT operationType')), 'operationTypes']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username'],
        required: false
      }],
      group: ['userId'],
      having: sequelize.where(sequelize.fn('COUNT', '*'), Op.gte, threshold),
      order: [[sequelize.literal('nightOperations'), 'DESC']]
    })
    
    return nightActivities.map(item => ({
      type: 'night_time_activity',
      riskLevel: item.dataValues.nightOperations >= threshold * 2 ? 'medium' : 'low',
      description: `用户 ${item.User?.username || 'Unknown'} 在夜间(22:00-06:00)进行了 ${item.dataValues.nightOperations} 次操作`,
      details: {
        userId: item.userId,
        username: item.User?.username,
        nightOperations: parseInt(item.dataValues.nightOperations),
        operationTypes: parseInt(item.dataValues.operationTypes)
      },
      timestamp: new Date(),
      category: 'time_pattern'
    }))
  }
  
  /**
   * 检测批量敏感操作
   */
  async detectBulkSensitiveOperations(startDate, endDate, threshold) {
    const sensitiveOps = [
      'USER_DELETE', 'ROLE_DELETE', 'PERMISSION_DELETE',
      'INTENT_DELETE', 'CATEGORY_DELETE', 'BULK_DELETE'
    ]
    
    const bulkOps = await SystemLog.findAll({
      where: {
        operationType: { [Op.in]: sensitiveOps },
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'userId',
        'operationType',
        [sequelize.fn('COUNT', '*'), 'operationCount']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username'],
        required: false
      }],
      group: ['userId', 'operationType'],
      having: sequelize.where(sequelize.fn('COUNT', '*'), Op.gte, Math.min(threshold, 10)),
      order: [[sequelize.literal('operationCount'), 'DESC']]
    })
    
    return bulkOps.map(item => ({
      type: 'bulk_sensitive_operations',
      riskLevel: 'high',
      description: `用户 ${item.User?.username || 'Unknown'} 执行了 ${item.dataValues.operationCount} 次敏感删除操作 ${item.operationType}`,
      details: {
        userId: item.userId,
        username: item.User?.username,
        operationType: item.operationType,
        operationCount: parseInt(item.dataValues.operationCount)
      },
      timestamp: new Date(),
      category: 'sensitive_operations'
    }))
  }
  
  /**
   * 检测权限滥用
   */
  async detectPrivilegeAbuse(startDate, endDate) {
    // 检测超出正常权限范围的操作
    const privilegeAbuse = await SystemLog.findAll({
      where: {
        operationType: {
          [Op.in]: ['PERMISSION_ASSIGN', 'ROLE_ASSIGN', 'USER_PROMOTE']
        },
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'userId',
        'operationType',
        [sequelize.fn('COUNT', '*'), 'operationCount']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username', 'role'],
        required: false
      }],
      group: ['userId', 'operationType'],
      having: sequelize.where(sequelize.fn('COUNT', '*'), Op.gte, 5)
    })
    
    return privilegeAbuse.map(item => ({
      type: 'privilege_abuse',
      riskLevel: 'high',
      description: `用户 ${item.User?.username || 'Unknown'} 频繁执行权限相关操作 ${item.operationType}`,
      details: {
        userId: item.userId,
        username: item.User?.username,
        userRole: item.User?.role,
        operationType: item.operationType,
        operationCount: parseInt(item.dataValues.operationCount)
      },
      timestamp: new Date(),
      category: 'privilege_escalation'
    }))
  }
  
  /**
   * 分析登录模式
   */
  async analyzeLoginPatterns(startDate, endDate) {
    const [successfulLogins, failedLogins, uniqueIPs] = await Promise.all([
      SystemLog.count({
        where: {
          operationType: 'USER_LOGIN',
          success: true,
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      SystemLog.count({
        where: {
          operationType: 'USER_LOGIN',
          success: false,
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      SystemLog.count({
        where: {
          operationType: 'USER_LOGIN',
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        distinct: true,
        col: 'ipAddress'
      })
    ])
    
    const totalLogins = successfulLogins + failedLogins
    const successRate = totalLogins > 0 ? (successfulLogins / totalLogins * 100).toFixed(2) : 0
    
    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      successRate: parseFloat(successRate),
      uniqueIPs,
      riskIndicators: {
        lowSuccessRate: successRate < 80,
        highFailureCount: failedLogins > 50,
        suspiciousIPCount: uniqueIPs > 20
      }
    }
  }
  
  /**
   * 分析操作统计
   */
  async analyzeOperationStatistics(startDate, endDate) {
    const stats = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        'operationType',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN success = true THEN 1 ELSE 0 END')), 'successCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN success = false THEN 1 ELSE 0 END')), 'failureCount']
      ],
      group: ['operationType'],
      order: [[sequelize.literal('count'), 'DESC']]
    })
    
    return {
      operationTypes: stats.map(item => ({
        type: item.operationType,
        total: parseInt(item.dataValues.count),
        successful: parseInt(item.dataValues.successCount),
        failed: parseInt(item.dataValues.failureCount),
        successRate: item.dataValues.count > 0 ? 
          (item.dataValues.successCount / item.dataValues.count * 100).toFixed(2) : 0
      })),
      summary: {
        totalOperations: stats.reduce((sum, item) => sum + parseInt(item.dataValues.count), 0),
        totalTypes: stats.length,
        averageSuccessRate: stats.length > 0 ? 
          stats.reduce((sum, item) => {
            const rate = item.dataValues.count > 0 ? 
              item.dataValues.successCount / item.dataValues.count : 0
            return sum + rate
          }, 0) / stats.length * 100 : 0
      }
    }
  }
  
  /**
   * 分析用户行为
   */
  async analyzeUserBehavior(startDate, endDate) {
    const userStats = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        userId: { [Op.ne]: null }
      },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', '*'), 'totalOperations'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT operationType')), 'operationTypes'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT ipAddress')), 'uniqueIPs']
      ],
      include: [{
        model: User,
        as: 'User',
        attributes: ['username', 'role'],
        required: false
      }],
      group: ['userId'],
      order: [[sequelize.literal('totalOperations'), 'DESC']],
      limit: 20
    })
    
    return {
      activeUsers: userStats.map(item => ({
        userId: item.userId,
        username: item.User?.username,
        role: item.User?.role,
        totalOperations: parseInt(item.dataValues.totalOperations),
        operationTypes: parseInt(item.dataValues.operationTypes),
        uniqueIPs: parseInt(item.dataValues.uniqueIPs),
        riskFactors: {
          highActivity: item.dataValues.totalOperations > 500,
          multipleIPs: item.dataValues.uniqueIPs > 3,
          diverseOperations: item.dataValues.operationTypes > 10
        }
      })),
      summary: {
        totalActiveUsers: userStats.length,
        averageOperationsPerUser: userStats.length > 0 ? 
          userStats.reduce((sum, item) => sum + parseInt(item.dataValues.totalOperations), 0) / userStats.length : 0
      }
    }
  }
  
  /**
   * 系统健康检查
   */
  async performSystemHealthCheck() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const [recentErrors, systemLoad, databaseHealth] = await Promise.all([
      SystemLog.count({
        where: {
          success: false,
          createdAt: { [Op.gte]: oneHourAgo }
        }
      }),
      this.checkSystemLoad(),
      this.checkDatabaseHealth()
    ])
    
    return {
      errors: {
        recentCount: recentErrors,
        threshold: 50,
        status: recentErrors > 50 ? 'warning' : 'healthy'
      },
      system: systemLoad,
      database: databaseHealth,
      timestamp: now.toISOString()
    }
  }
  
  // 辅助方法
  
  getRiskScore(activity) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 }
    return scores[activity.riskLevel] || 0
  }
  
  calculateOpsPerMinute(count, first, last) {
    const minutes = Math.max(1, (new Date(last) - new Date(first)) / (1000 * 60))
    return (count / minutes).toFixed(2)
  }
  
  calculateOverallRiskLevel(suspiciousActivities) {
    const { summary } = suspiciousActivities
    if (summary.critical > 0) return 'critical'
    if (summary.high > 2) return 'high'
    if (summary.medium > 5) return 'medium'
    return 'low'
  }
  
  extractKeyFindings(suspicious, login, operations) {
    const findings = []
    
    if (suspicious.summary.critical > 0) {
      findings.push(`发现 ${suspicious.summary.critical} 个严重安全威胁`)
    }
    
    if (login.riskIndicators.lowSuccessRate) {
      findings.push(`登录成功率异常低: ${login.successRate}%`)
    }
    
    if (login.riskIndicators.highFailureCount) {
      findings.push(`登录失败次数过多: ${login.failedLogins} 次`)
    }
    
    const lowSuccessOps = operations.operationTypes.filter(op => op.successRate < 80)
    if (lowSuccessOps.length > 0) {
      findings.push(`${lowSuccessOps.length} 种操作类型成功率低于80%`)
    }
    
    return findings
  }
  
  generateSecurityRecommendations(suspicious, login, operations, systemHealth) {
    const recommendations = []
    
    if (suspicious.summary.critical > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'immediate_action',
        title: '立即处理严重安全威胁',
        description: '发现严重安全威胁，需要立即调查和处理',
        actions: ['暂停可疑用户账户', '强制密码重置', '启用额外安全监控']
      })
    }
    
    if (login.riskIndicators.highFailureCount) {
      recommendations.push({
        priority: 'high',
        category: 'authentication',
        title: '加强登录安全控制',
        description: '登录失败次数过多，建议加强认证安全',
        actions: ['启用账户锁定机制', '实施IP白名单', '添加验证码验证']
      })
    }
    
    if (systemHealth.errors.status === 'warning') {
      recommendations.push({
        priority: 'medium',
        category: 'system_stability',
        title: '提升系统稳定性',
        description: '系统错误率偏高，需要优化系统稳定性',
        actions: ['检查系统日志', '优化数据库查询', '增加监控告警']
      })
    }
    
    return recommendations
  }
  
  async checkSystemLoad() {
    // 简化的系统负载检查
    return {
      status: 'healthy',
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    }
  }
  
  async checkDatabaseHealth() {
    try {
      await sequelize.authenticate()
      return {
        status: 'healthy',
        connectionTime: Date.now()
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      }
    }
  }
}

module.exports = new SecurityAuditService()