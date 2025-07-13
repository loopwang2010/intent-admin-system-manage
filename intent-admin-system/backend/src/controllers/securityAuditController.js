const securityAuditService = require('../services/securityAuditService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 安全审计控制器
 */
class SecurityAuditController {
  
  /**
   * 检测可疑活动
   */
  async detectSuspiciousActivities(req, res) {
    try {
      const {
        startDate,
        endDate,
        threshold
      } = req.body
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      if (threshold) options.threshold = threshold
      
      const result = await securityAuditService.detectSuspiciousActivities(options)
      
      // 记录安全审计操作
      await logOperation({
        operationType: OPERATION_TYPES.SECURITY_AUDIT,
        resource: 'system',
        resourceName: '可疑活动检测',
        metadata: { 
          action: 'detect_suspicious',
          detectedCount: result.summary.total,
          criticalCount: result.summary.critical,
          timeRange: options
        }
      }, req)
      
      res.json({
        success: true,
        message: '可疑活动检测完成',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '检测可疑活动失败',
        error: error.message
      })
    }
  }
  
  /**
   * 生成安全报告
   */
  async generateSecurityReport(req, res) {
    try {
      const {
        startDate,
        endDate,
        includeRecommendations = true
      } = req.body
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.includeRecommendations = includeRecommendations
      
      const report = await securityAuditService.generateSecurityReport(options)
      
      // 记录安全报告生成操作
      await logOperation({
        operationType: OPERATION_TYPES.SECURITY_AUDIT,
        resource: 'system',
        resourceName: '安全审计报告',
        metadata: { 
          action: 'generate_security_report',
          reportType: 'comprehensive',
          incidentCount: report.executive.totalIncidents,
          criticalIssues: report.executive.criticalIssues,
          timeRange: options,
          reportSize: JSON.stringify(report).length
        }
      }, req)
      
      res.json({
        success: true,
        message: '安全报告生成成功',
        data: report
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '生成安全报告失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取实时安全状态
   */
  async getRealtimeSecurityStatus(req, res) {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      // 获取最近1小时的安全状态
      const [suspiciousActivities, systemHealth] = await Promise.all([
        securityAuditService.detectSuspiciousActivities({
          startDate: oneHourAgo,
          endDate: now,
          threshold: {
            failedLogins: 3,
            highFrequency: 20,
            nightActivity: 5,
            bulkOperations: 10
          }
        }),
        securityAuditService.performSystemHealthCheck()
      ])
      
      const status = {
        timestamp: now.toISOString(),
        overallStatus: this.calculateOverallStatus(suspiciousActivities, systemHealth),
        alerts: {
          critical: suspiciousActivities.summary.critical,
          high: suspiciousActivities.summary.high,
          total: suspiciousActivities.summary.total
        },
        systemHealth: systemHealth,
        recentActivities: suspiciousActivities.activities.slice(0, 5),
        monitoring: {
          timeWindow: '1 hour',
          lastCheck: now.toISOString(),
          nextCheck: new Date(now.getTime() + 5 * 60 * 1000).toISOString()
        }
      }
      
      res.json({
        success: true,
        message: '获取实时安全状态成功',
        data: status
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取实时安全状态失败',
        error: error.message
      })
    }
  }
  
  /**
   * 安全趋势分析
   */
  async getSecurityTrends(req, res) {
    try {
      const {
        days = 30,
        granularity = 'day'
      } = req.query
      
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000)
      
      // 按时间段分析安全趋势
      const trends = await this.analyzeSecurityTrends(startDate, endDate, granularity)
      
      // 记录趋势分析操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '安全趋势分析',
        metadata: { 
          action: 'analyze_security_trends',
          days: parseInt(days),
          granularity,
          dataPoints: trends.timeline.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '安全趋势分析成功',
        data: trends
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '安全趋势分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 安全事件详情
   */
  async getSecurityIncidentDetails(req, res) {
    try {
      const { incidentType } = req.params
      const {
        startDate,
        endDate,
        limit = 50
      } = req.query
      
      const options = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date()
      }
      
      const suspiciousActivities = await securityAuditService.detectSuspiciousActivities(options)
      const incidents = suspiciousActivities.activities
        .filter(activity => !incidentType || activity.type === incidentType)
        .slice(0, parseInt(limit))
      
      const details = {
        incidentType: incidentType || 'all',
        timeRange: options,
        incidents: incidents,
        summary: {
          total: incidents.length,
          byRiskLevel: incidents.reduce((acc, incident) => {
            acc[incident.riskLevel] = (acc[incident.riskLevel] || 0) + 1
            return acc
          }, {}),
          byCategory: incidents.reduce((acc, incident) => {
            acc[incident.category] = (acc[incident.category] || 0) + 1
            return acc
          }, {})
        }
      }
      
      res.json({
        success: true,
        message: '获取安全事件详情成功',
        data: details
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取安全事件详情失败',
        error: error.message
      })
    }
  }
  
  /**
   * 安全配置建议
   */
  async getSecurityRecommendations(req, res) {
    try {
      const {
        category = 'all',
        priority = 'all'
      } = req.query
      
      // 获取最近7天的数据进行分析
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const report = await securityAuditService.generateSecurityReport({
        startDate,
        endDate,
        includeRecommendations: true
      })
      
      let recommendations = report.recommendations
      
      // 按分类过滤
      if (category !== 'all') {
        recommendations = recommendations.filter(rec => rec.category === category)
      }
      
      // 按优先级过滤
      if (priority !== 'all') {
        recommendations = recommendations.filter(rec => rec.priority === priority)
      }
      
      const result = {
        recommendations,
        categories: [...new Set(report.recommendations.map(r => r.category))],
        priorities: [...new Set(report.recommendations.map(r => r.priority))],
        summary: {
          total: recommendations.length,
          byPriority: recommendations.reduce((acc, rec) => {
            acc[rec.priority] = (acc[rec.priority] || 0) + 1
            return acc
          }, {}),
          byCategory: recommendations.reduce((acc, rec) => {
            acc[rec.category] = (acc[rec.category] || 0) + 1
            return acc
          }, {})
        },
        basedOnAnalysis: {
          timeRange: { startDate, endDate },
          totalIncidents: report.executive.totalIncidents,
          riskLevel: report.executive.overallRiskLevel
        }
      }
      
      res.json({
        success: true,
        message: '获取安全配置建议成功',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取安全配置建议失败',
        error: error.message
      })
    }
  }
  
  // 辅助方法
  
  calculateOverallStatus(suspiciousActivities, systemHealth) {
    if (suspiciousActivities.summary.critical > 0) return 'critical'
    if (suspiciousActivities.summary.high > 2) return 'warning'
    if (systemHealth.errors.status === 'warning') return 'warning'
    return 'healthy'
  }
  
  async analyzeSecurityTrends(startDate, endDate, granularity) {
    // 简化的趋势分析实现
    const { SystemLog } = require('../models')
    const { Op } = require('sequelize')
    
    let timeFormat
    switch (granularity) {
      case 'hour':
        timeFormat = '%Y-%m-%d %H:00:00'
        break
      case 'week':
        timeFormat = '%Y-%u'
        break
      case 'month':
        timeFormat = '%Y-%m'
        break
      default:
        timeFormat = '%Y-%m-%d'
    }
    
    const trends = await SystemLog.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat), 'period'],
        [require('../models').sequelize.fn('COUNT', '*'), 'totalOperations'],
        [require('../models').sequelize.fn('COUNT', require('../models').sequelize.literal('CASE WHEN success = false THEN 1 END')), 'failedOperations'],
        [require('../models').sequelize.fn('COUNT', require('../models').sequelize.literal('CASE WHEN operationType = "USER_LOGIN" AND success = false THEN 1 END')), 'failedLogins']
      ],
      group: [require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat)],
      order: [[require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat), 'ASC']]
    })
    
    return {
      timeline: trends.map(item => ({
        period: item.dataValues.period,
        totalOperations: parseInt(item.dataValues.totalOperations),
        failedOperations: parseInt(item.dataValues.failedOperations),
        failedLogins: parseInt(item.dataValues.failedLogins),
        successRate: item.dataValues.totalOperations > 0 ? 
          ((item.dataValues.totalOperations - item.dataValues.failedOperations) / item.dataValues.totalOperations * 100).toFixed(2) : 0
      })),
      analysis: {
        granularity,
        timeRange: { startDate, endDate },
        dataPoints: trends.length
      }
    }
  }
}

module.exports = new SecurityAuditController()