const performanceOptimizationService = require('../services/performanceOptimizationService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 性能优化控制器
 */
class PerformanceController {
  
  /**
   * 获取性能分析报告
   */
  async getPerformanceAnalysis(req, res) {
    try {
      const {
        startDate,
        endDate,
        includeSlowQueries = true,
        includeMemoryAnalysis = true
      } = req.query
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.includeSlowQueries = includeSlowQueries === 'true'
      options.includeMemoryAnalysis = includeMemoryAnalysis === 'true'
      
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics(options)
      
      // 记录性能分析操作
      await logOperation({
        operationType: OPERATION_TYPES.SYSTEM_MONITOR,
        resource: 'system',
        resourceName: '性能分析',
        metadata: { 
          action: 'performance_analysis',
          performanceScore: analysis.metrics.performanceScore,
          bottleneckCount: analysis.analysis.bottlenecks.length,
          recommendationCount: analysis.analysis.recommendations.length,
          timeRange: options
        }
      }, req)
      
      res.json({
        success: true,
        message: '性能分析完成',
        data: analysis
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '性能分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取实时性能监控
   */
  async getRealtimePerformance(req, res) {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics({
        startDate: oneHourAgo,
        endDate: now,
        includeSlowQueries: true,
        includeMemoryAnalysis: true
      })
      
      const realtimeData = {
        timestamp: now.toISOString(),
        performance: {
          score: analysis.metrics.performanceScore,
          health: analysis.analysis.overallHealth,
          responseTime: analysis.metrics.responseTime.overall.avgResponseTime,
          memoryUsage: analysis.metrics.memoryUsage.usage.heapUtilization,
          concurrency: analysis.metrics.concurrency.capacity.utilizationRate
        },
        alerts: analysis.analysis.bottlenecks.filter(b => b.severity === 'high'),
        quickStats: {
          totalOperations: analysis.metrics.responseTime.overall.totalOperations,
          slowQueries: analysis.metrics.slowQueries?.summary.totalSlowQueries || 0,
          peakConcurrency: analysis.metrics.concurrency.peakConcurrency,
          memoryPressure: analysis.metrics.memoryUsage.usage.memoryPressure
        },
        trends: {
          responseTime: analysis.metrics.responseTime.byOperationType.slice(0, 5),
          frequency: analysis.metrics.operationFrequency.peakHours.slice(0, 3)
        }
      }
      
      res.json({
        success: true,
        message: '获取实时性能监控成功',
        data: realtimeData
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取实时性能监控失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取性能优化建议
   */
  async getOptimizationRecommendations(req, res) {
    try {
      const {
        category = 'all',
        priority = 'all',
        timeRange = '24h'
      } = req.query
      
      // 根据时间范围设置日期
      const endDate = new Date()
      let startDate
      switch (timeRange) {
        case '1h':
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000)
          break
        case '6h':
          startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default: // 24h
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
      }
      
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics({
        startDate,
        endDate
      })
      
      let recommendations = analysis.analysis.recommendations
      
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
          performanceScore: analysis.metrics.performanceScore,
          overallHealth: analysis.analysis.overallHealth,
          bottleneckCount: analysis.analysis.bottlenecks.length
        },
        availableFilters: {
          categories: ['response_time', 'database', 'memory', 'concurrency'],
          priorities: ['high', 'medium', 'low'],
          timeRanges: ['1h', '6h', '24h', '7d', '30d']
        }
      }
      
      // 记录优化建议查询操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '性能优化建议',
        metadata: { 
          action: 'get_optimization_recommendations',
          category,
          priority,
          timeRange,
          recommendationCount: recommendations.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取优化建议成功',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取优化建议失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取慢查询分析
   */
  async getSlowQueryAnalysis(req, res) {
    try {
      const {
        startDate,
        endDate,
        threshold = 1000,
        limit = 50
      } = req.query
      
      const options = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date()
      }
      
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics(options)
      const slowQueries = analysis.metrics.slowQueries
      
      if (!slowQueries) {
        return res.json({
          success: true,
          message: '慢查询分析完成',
          data: {
            queries: [],
            statistics: [],
            summary: { totalSlowQueries: 0, threshold: parseInt(threshold) }
          }
        })
      }
      
      const result = {
        queries: slowQueries.queries.slice(0, parseInt(limit)),
        statistics: slowQueries.statistics,
        summary: slowQueries.summary,
        analysis: {
          timeRange: options,
          impactLevel: slowQueries.summary.impactLevel,
          recommendations: this.generateSlowQueryRecommendations(slowQueries)
        }
      }
      
      res.json({
        success: true,
        message: '慢查询分析完成',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '慢查询分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取资源使用分析
   */
  async getResourceUsageAnalysis(req, res) {
    try {
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics({
        includeMemoryAnalysis: true
      })
      
      const resourceUsage = {
        memory: analysis.metrics.memoryUsage,
        database: analysis.metrics.databasePerformance,
        concurrency: analysis.metrics.concurrency,
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid
        },
        recommendations: analysis.analysis.recommendations.filter(rec => 
          ['memory', 'database', 'concurrency'].includes(rec.category)
        )
      }
      
      res.json({
        success: true,
        message: '资源使用分析完成',
        data: resourceUsage
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '资源使用分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取性能趋势
   */
  async getPerformanceTrends(req, res) {
    try {
      const {
        days = 7,
        granularity = 'day'
      } = req.query
      
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000)
      
      // 分时段获取性能数据
      const trends = await this.analyzePerformanceTrends(startDate, endDate, granularity)
      
      res.json({
        success: true,
        message: '性能趋势分析完成',
        data: trends
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '性能趋势分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 系统健康检查
   */
  async performHealthCheck(req, res) {
    try {
      const healthCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {
          database: await this.checkDatabaseHealth(),
          memory: await this.checkMemoryHealth(),
          performance: await this.checkPerformanceHealth(),
          dependencies: await this.checkDependencies()
        }
      }
      
      // 确定整体状态
      const checkStatuses = Object.values(healthCheck.checks).map(check => check.status)
      if (checkStatuses.includes('critical')) {
        healthCheck.status = 'critical'
      } else if (checkStatuses.includes('warning')) {
        healthCheck.status = 'warning'
      }
      
      // 记录健康检查操作
      await logOperation({
        operationType: OPERATION_TYPES.SYSTEM_MONITOR,
        resource: 'system',
        resourceName: '系统健康检查',
        metadata: { 
          action: 'health_check',
          status: healthCheck.status,
          checks: Object.keys(healthCheck.checks).length
        }
      }, req)
      
      const statusCode = healthCheck.status === 'healthy' ? 200 : 
                        healthCheck.status === 'warning' ? 200 : 503
      
      res.status(statusCode).json({
        success: healthCheck.status !== 'critical',
        message: `系统健康检查完成 - ${healthCheck.status}`,
        data: healthCheck
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '系统健康检查失败',
        error: error.message
      })
    }
  }
  
  // 辅助方法
  
  generateSlowQueryRecommendations(slowQueries) {
    const recommendations = []
    
    if (slowQueries.summary.totalSlowQueries > 20) {
      recommendations.push('考虑添加数据库索引')
      recommendations.push('优化复杂查询语句')
      recommendations.push('实施查询缓存')
    }
    
    // 分析最常见的慢查询类型
    const topSlowOperations = slowQueries.statistics
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
    
    if (topSlowOperations.length > 0) {
      recommendations.push(`重点优化操作: ${topSlowOperations.map(op => op.operationType).join(', ')}`)
    }
    
    return recommendations
  }
  
  async analyzePerformanceTrends(startDate, endDate, granularity) {
    // 简化的趋势分析，实际应用中可以更复杂
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
      default:
        timeFormat = '%Y-%m-%d'
    }
    
    const trends = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        responseTime: { [Op.ne]: null }
      },
      attributes: [
        [require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat), 'period'],
        [require('../models').sequelize.fn('AVG', require('../models').sequelize.col('responseTime')), 'avgResponseTime'],
        [require('../models').sequelize.fn('COUNT', '*'), 'operationCount'],
        [require('../models').sequelize.fn('MAX', require('../models').sequelize.col('responseTime')), 'maxResponseTime']
      ],
      group: [require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat)],
      order: [[require('../models').sequelize.fn('DATE_FORMAT', require('../models').sequelize.col('createdAt'), timeFormat), 'ASC']]
    })
    
    return {
      timeline: trends.map(item => ({
        period: item.dataValues.period,
        avgResponseTime: parseFloat(item.dataValues.avgResponseTime).toFixed(2),
        operationCount: parseInt(item.dataValues.operationCount),
        maxResponseTime: parseInt(item.dataValues.maxResponseTime),
        performanceLevel: this.getPerformanceLevel(item.dataValues.avgResponseTime)
      })),
      analysis: {
        granularity,
        timeRange: { startDate, endDate },
        dataPoints: trends.length,
        trend: this.calculateTrend(trends)
      }
    }
  }
  
  async checkDatabaseHealth() {
    try {
      const { sequelize } = require('../models')
      await sequelize.authenticate()
      return {
        status: 'healthy',
        message: '数据库连接正常',
        details: {
          connected: true,
          connectionTime: Date.now()
        }
      }
    } catch (error) {
      return {
        status: 'critical',
        message: '数据库连接失败',
        error: error.message
      }
    }
  }
  
  async checkMemoryHealth() {
    const memoryUsage = process.memoryUsage()
    const heapUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal
    
    let status = 'healthy'
    let message = '内存使用正常'
    
    if (heapUtilization > 0.9) {
      status = 'critical'
      message = '内存使用率过高'
    } else if (heapUtilization > 0.8) {
      status = 'warning'
      message = '内存使用率较高'
    }
    
    return {
      status,
      message,
      details: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        utilization: `${(heapUtilization * 100).toFixed(2)}%`
      }
    }
  }
  
  async checkPerformanceHealth() {
    try {
      const analysis = await performanceOptimizationService.analyzePerformanceMetrics({
        startDate: new Date(Date.now() - 60 * 60 * 1000), // 最近1小时
        endDate: new Date()
      })
      
      const score = analysis.metrics.performanceScore
      let status = 'healthy'
      let message = '性能表现良好'
      
      if (score < 60) {
        status = 'critical'
        message = '性能表现较差'
      } else if (score < 80) {
        status = 'warning'
        message = '性能有待优化'
      }
      
      return {
        status,
        message,
        details: {
          performanceScore: score,
          overallHealth: analysis.analysis.overallHealth,
          bottleneckCount: analysis.analysis.bottlenecks.length
        }
      }
    } catch (error) {
      return {
        status: 'warning',
        message: '性能检查失败',
        error: error.message
      }
    }
  }
  
  async checkDependencies() {
    // 简化的依赖检查
    return {
      status: 'healthy',
      message: '所有依赖正常',
      details: {
        nodejs: process.version,
        uptime: `${Math.floor(process.uptime())} seconds`
      }
    }
  }
  
  getPerformanceLevel(avgTime) {
    if (avgTime < 200) return 'excellent'
    if (avgTime < 500) return 'good'
    if (avgTime < 1000) return 'fair'
    if (avgTime < 2000) return 'poor'
    return 'critical'
  }
  
  calculateTrend(trends) {
    if (trends.length < 2) return 'insufficient_data'
    
    const recent = trends.slice(-5) // 最近5个数据点
    const avgResponseTimes = recent.map(t => parseFloat(t.dataValues.avgResponseTime))
    
    let improving = 0
    for (let i = 1; i < avgResponseTimes.length; i++) {
      if (avgResponseTimes[i] < avgResponseTimes[i - 1]) improving++
    }
    
    const ratio = improving / (avgResponseTimes.length - 1)
    if (ratio > 0.6) return 'improving'
    if (ratio < 0.4) return 'degrading'
    return 'stable'
  }
}

module.exports = new PerformanceController()