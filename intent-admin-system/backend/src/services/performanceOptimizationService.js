const { SystemLog, User, sequelize } = require('../models')
const { Op } = require('sequelize')

/**
 * 性能优化服务
 * 提供系统性能分析和优化建议
 */
class PerformanceOptimizationService {
  
  /**
   * 分析系统性能指标
   * @param {Object} options - 分析选项
   */
  async analyzePerformanceMetrics(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate = new Date(),
        includeSlowQueries = true,
        includeMemoryAnalysis = true
      } = options
      
      const metrics = {}
      
      // 1. 响应时间分析
      metrics.responseTime = await this.analyzeResponseTimes(startDate, endDate)
      
      // 2. 操作频率分析
      metrics.operationFrequency = await this.analyzeOperationFrequency(startDate, endDate)
      
      // 3. 数据库性能分析
      metrics.databasePerformance = await this.analyzeDatabasePerformance(startDate, endDate)
      
      // 4. 慢查询分析
      if (includeSlowQueries) {
        metrics.slowQueries = await this.analyzeSlowQueries(startDate, endDate)
      }
      
      // 5. 内存使用分析
      if (includeMemoryAnalysis) {
        metrics.memoryUsage = await this.analyzeMemoryUsage()
      }
      
      // 6. 并发性能分析
      metrics.concurrency = await this.analyzeConcurrencyPerformance(startDate, endDate)
      
      // 7. 生成性能评分
      metrics.performanceScore = this.calculatePerformanceScore(metrics)
      
      return {
        metrics,
        analysis: {
          timeRange: { startDate, endDate },
          overallHealth: this.getOverallHealth(metrics),
          bottlenecks: this.identifyBottlenecks(metrics),
          recommendations: this.generatePerformanceRecommendations(metrics)
        }
      }
    } catch (error) {
      throw new Error(`性能指标分析失败: ${error.message}`)
    }
  }
  
  /**
   * 分析响应时间
   */
  async analyzeResponseTimes(startDate, endDate) {
    const responseData = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        responseTime: { [Op.ne]: null }
      },
      attributes: [
        'operationType',
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime'],
        [sequelize.fn('MIN', sequelize.col('responseTime')), 'minResponseTime'],
        [sequelize.fn('MAX', sequelize.col('responseTime')), 'maxResponseTime'],
        [sequelize.fn('COUNT', '*'), 'operationCount']
      ],
      group: ['operationType'],
      order: [[sequelize.literal('avgResponseTime'), 'DESC']]
    })
    
    const overallStats = await SystemLog.findOne({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        responseTime: { [Op.ne]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'overallAvg'],
        [sequelize.fn('COUNT', '*'), 'totalOperations']
      ]
    })
    
    return {
      byOperationType: responseData.map(item => ({
        operationType: item.operationType,
        avgResponseTime: parseFloat(item.dataValues.avgResponseTime).toFixed(2),
        minResponseTime: parseInt(item.dataValues.minResponseTime),
        maxResponseTime: parseInt(item.dataValues.maxResponseTime),
        operationCount: parseInt(item.dataValues.operationCount),
        performanceLevel: this.getPerformanceLevel(item.dataValues.avgResponseTime)
      })),
      overall: {
        avgResponseTime: overallStats ? parseFloat(overallStats.dataValues.overallAvg).toFixed(2) : 0,
        totalOperations: overallStats ? parseInt(overallStats.dataValues.totalOperations) : 0
      }
    }
  }
  
  /**
   * 分析操作频率
   */
  async analyzeOperationFrequency(startDate, endDate) {
    const frequencyData = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:00:00'), 'hour'],
        [sequelize.fn('COUNT', '*'), 'operationCount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:00:00')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:00:00'), 'ASC']]
    })
    
    const peakHours = frequencyData
      .map(item => ({
        hour: item.dataValues.hour,
        count: parseInt(item.dataValues.operationCount)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    const avgOperationsPerHour = frequencyData.length > 0 ? 
      frequencyData.reduce((sum, item) => sum + parseInt(item.dataValues.operationCount), 0) / frequencyData.length : 0
    
    return {
      timeline: frequencyData.map(item => ({
        hour: item.dataValues.hour,
        operationCount: parseInt(item.dataValues.operationCount),
        loadLevel: this.getLoadLevel(parseInt(item.dataValues.operationCount), avgOperationsPerHour)
      })),
      peakHours,
      averagePerHour: avgOperationsPerHour.toFixed(2),
      loadDistribution: this.calculateLoadDistribution(frequencyData)
    }
  }
  
  /**
   * 分析数据库性能
   */
  async analyzeDatabasePerformance(startDate, endDate) {
    try {
      // 查询执行时间统计
      const queryStats = await this.getQueryExecutionStats(startDate, endDate)
      
      // 连接池状态
      const connectionStats = await this.getConnectionPoolStats()
      
      // 表大小和索引分析
      const tableStats = await this.getTableSizeStats()
      
      return {
        queryExecution: queryStats,
        connectionPool: connectionStats,
        tableSize: tableStats,
        recommendations: this.generateDatabaseRecommendations(queryStats, connectionStats, tableStats)
      }
    } catch (error) {
      return {
        error: error.message,
        queryExecution: { avgTime: 0, slowQueries: 0 },
        connectionPool: { active: 0, idle: 0 },
        tableSize: { totalSize: 0, largestTable: 'unknown' }
      }
    }
  }
  
  /**
   * 分析慢查询
   */
  async analyzeSlowQueries(startDate, endDate) {
    const slowThreshold = 1000 // 1秒
    
    const slowQueries = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        responseTime: { [Op.gte]: slowThreshold }
      },
      attributes: [
        'operationType',
        'resource',
        'responseTime',
        'createdAt',
        'metadata'
      ],
      order: [['responseTime', 'DESC']],
      limit: 20
    })
    
    const slowQueryStats = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        responseTime: { [Op.gte]: slowThreshold }
      },
      attributes: [
        'operationType',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgTime']
      ],
      group: ['operationType'],
      order: [[sequelize.literal('count'), 'DESC']]
    })
    
    return {
      queries: slowQueries.map(query => ({
        operationType: query.operationType,
        resource: query.resource,
        responseTime: query.responseTime,
        timestamp: query.createdAt,
        metadata: query.metadata ? JSON.parse(query.metadata) : null
      })),
      statistics: slowQueryStats.map(stat => ({
        operationType: stat.operationType,
        count: parseInt(stat.dataValues.count),
        avgTime: parseFloat(stat.dataValues.avgTime).toFixed(2)
      })),
      summary: {
        totalSlowQueries: slowQueries.length,
        threshold: slowThreshold,
        impactLevel: this.calculateSlowQueryImpact(slowQueries.length)
      }
    }
  }
  
  /**
   * 分析内存使用
   */
  async analyzeMemoryUsage() {
    const memoryUsage = process.memoryUsage()
    const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'
    
    return {
      heapUsed: formatBytes(memoryUsage.heapUsed),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      external: formatBytes(memoryUsage.external),
      arrayBuffers: formatBytes(memoryUsage.arrayBuffers || 0),
      rss: formatBytes(memoryUsage.rss),
      usage: {
        heapUtilization: (memoryUsage.heapUsed / memoryUsage.heapTotal * 100).toFixed(2) + '%',
        memoryPressure: this.calculateMemoryPressure(memoryUsage)
      },
      recommendations: this.generateMemoryRecommendations(memoryUsage)
    }
  }
  
  /**
   * 分析并发性能
   */
  async analyzeConcurrencyPerformance(startDate, endDate) {
    // 分析同时段操作数量
    const concurrentOps = await SystemLog.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:%i:00'), 'minute'],
        [sequelize.fn('COUNT', '*'), 'operationCount'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT userId')), 'concurrentUsers']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d %H:%i:00')],
      order: [[sequelize.literal('operationCount'), 'DESC']],
      limit: 100
    })
    
    const maxConcurrent = concurrentOps.length > 0 ? 
      Math.max(...concurrentOps.map(op => parseInt(op.dataValues.operationCount))) : 0
    
    const avgConcurrent = concurrentOps.length > 0 ? 
      concurrentOps.reduce((sum, op) => sum + parseInt(op.dataValues.operationCount), 0) / concurrentOps.length : 0
    
    return {
      peakConcurrency: maxConcurrent,
      averageConcurrency: avgConcurrent.toFixed(2),
      concurrencyTimeline: concurrentOps.slice(0, 20).map(op => ({
        minute: op.dataValues.minute,
        operations: parseInt(op.dataValues.operationCount),
        users: parseInt(op.dataValues.concurrentUsers),
        load: this.getConcurrencyLoad(parseInt(op.dataValues.operationCount), avgConcurrent)
      })),
      capacity: {
        current: maxConcurrent,
        recommended: Math.ceil(maxConcurrent * 1.5),
        utilizationRate: (avgConcurrent / maxConcurrent * 100).toFixed(2) + '%'
      }
    }
  }
  
  // 辅助方法
  
  calculatePerformanceScore(metrics) {
    let score = 100
    
    // 响应时间评分
    const avgResponseTime = parseFloat(metrics.responseTime.overall.avgResponseTime)
    if (avgResponseTime > 2000) score -= 30
    else if (avgResponseTime > 1000) score -= 20
    else if (avgResponseTime > 500) score -= 10
    
    // 慢查询评分
    if (metrics.slowQueries && metrics.slowQueries.summary.totalSlowQueries > 10) {
      score -= metrics.slowQueries.summary.totalSlowQueries * 2
    }
    
    // 内存使用评分
    const memoryPressure = metrics.memoryUsage.usage.memoryPressure
    if (memoryPressure === 'high') score -= 25
    else if (memoryPressure === 'medium') score -= 15
    
    // 并发性能评分
    const utilizationRate = parseFloat(metrics.concurrency.capacity.utilizationRate)
    if (utilizationRate > 90) score -= 20
    else if (utilizationRate > 80) score -= 10
    
    return Math.max(0, Math.min(100, score))
  }
  
  getOverallHealth(metrics) {
    const score = metrics.performanceScore
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    if (score >= 40) return 'poor'
    return 'critical'
  }
  
  identifyBottlenecks(metrics) {
    const bottlenecks = []
    
    // 响应时间瓶颈
    const slowOps = metrics.responseTime.byOperationType
      .filter(op => parseFloat(op.avgResponseTime) > 1000)
      .slice(0, 3)
    
    if (slowOps.length > 0) {
      bottlenecks.push({
        type: 'response_time',
        severity: 'high',
        description: `${slowOps.length} 种操作类型响应时间超过1秒`,
        affectedOperations: slowOps.map(op => op.operationType)
      })
    }
    
    // 内存瓶颈
    if (metrics.memoryUsage.usage.memoryPressure === 'high') {
      bottlenecks.push({
        type: 'memory',
        severity: 'medium',
        description: '内存使用率过高',
        details: metrics.memoryUsage.usage
      })
    }
    
    // 并发瓶颈
    const utilizationRate = parseFloat(metrics.concurrency.capacity.utilizationRate)
    if (utilizationRate > 85) {
      bottlenecks.push({
        type: 'concurrency',
        severity: utilizationRate > 95 ? 'high' : 'medium',
        description: '并发处理能力接近上限',
        details: metrics.concurrency.capacity
      })
    }
    
    return bottlenecks
  }
  
  generatePerformanceRecommendations(metrics) {
    const recommendations = []
    
    // 响应时间优化
    const slowOps = metrics.responseTime.byOperationType
      .filter(op => parseFloat(op.avgResponseTime) > 500)
    
    if (slowOps.length > 0) {
      recommendations.push({
        category: 'response_time',
        priority: 'high',
        title: '优化慢操作',
        description: '存在响应时间较慢的操作类型',
        actions: [
          '添加数据库索引',
          '优化查询语句',
          '实施缓存策略',
          '考虑异步处理'
        ],
        affectedOperations: slowOps.map(op => op.operationType)
      })
    }
    
    // 数据库优化
    if (metrics.databasePerformance.recommendations?.length > 0) {
      recommendations.push({
        category: 'database',
        priority: 'medium',
        title: '数据库性能优化',
        description: '数据库存在性能优化空间',
        actions: metrics.databasePerformance.recommendations
      })
    }
    
    // 内存优化
    if (metrics.memoryUsage.recommendations?.length > 0) {
      recommendations.push({
        category: 'memory',
        priority: 'medium',
        title: '内存使用优化',
        description: '内存使用可以进一步优化',
        actions: metrics.memoryUsage.recommendations
      })
    }
    
    // 并发优化
    const utilizationRate = parseFloat(metrics.concurrency.capacity.utilizationRate)
    if (utilizationRate > 80) {
      recommendations.push({
        category: 'concurrency',
        priority: utilizationRate > 90 ? 'high' : 'medium',
        title: '并发处理能力扩展',
        description: '当前并发处理能力使用率较高',
        actions: [
          '增加服务器资源',
          '实施负载均衡',
          '优化并发处理逻辑',
          '考虑水平扩展'
        ]
      })
    }
    
    return recommendations
  }
  
  getPerformanceLevel(avgTime) {
    if (avgTime < 200) return 'excellent'
    if (avgTime < 500) return 'good'
    if (avgTime < 1000) return 'fair'
    if (avgTime < 2000) return 'poor'
    return 'critical'
  }
  
  getLoadLevel(count, avg) {
    const ratio = count / avg
    if (ratio > 2) return 'high'
    if (ratio > 1.5) return 'medium'
    return 'normal'
  }
  
  calculateLoadDistribution(data) {
    const total = data.reduce((sum, item) => sum + parseInt(item.dataValues.operationCount), 0)
    return {
      total,
      peak: Math.max(...data.map(item => parseInt(item.dataValues.operationCount))),
      valley: Math.min(...data.map(item => parseInt(item.dataValues.operationCount))),
      variance: this.calculateVariance(data.map(item => parseInt(item.dataValues.operationCount)))
    }
  }
  
  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }
  
  calculateMemoryPressure(memoryUsage) {
    const utilization = memoryUsage.heapUsed / memoryUsage.heapTotal
    if (utilization > 0.9) return 'high'
    if (utilization > 0.7) return 'medium'
    return 'low'
  }
  
  generateMemoryRecommendations(memoryUsage) {
    const recommendations = []
    const utilization = memoryUsage.heapUsed / memoryUsage.heapTotal
    
    if (utilization > 0.8) {
      recommendations.push('增加堆内存大小')
      recommendations.push('检查内存泄漏')
      recommendations.push('优化对象生命周期')
    }
    
    if (memoryUsage.external > memoryUsage.heapUsed) {
      recommendations.push('检查外部内存使用')
      recommendations.push('优化缓冲区使用')
    }
    
    return recommendations
  }
  
  getConcurrencyLoad(current, average) {
    const ratio = current / average
    if (ratio > 2) return 'overload'
    if (ratio > 1.5) return 'high'
    if (ratio > 1.2) return 'medium'
    return 'normal'
  }
  
  calculateSlowQueryImpact(count) {
    if (count > 50) return 'critical'
    if (count > 20) return 'high'
    if (count > 10) return 'medium'
    return 'low'
  }
  
  // 模拟数据库相关方法（实际应用中需要根据数据库类型实现）
  
  async getQueryExecutionStats(startDate, endDate) {
    return {
      avgTime: 45.2,
      slowQueries: 12,
      totalQueries: 1500,
      cacheHitRate: 85.6
    }
  }
  
  async getConnectionPoolStats() {
    return {
      active: 8,
      idle: 12,
      total: 20,
      maxConnections: 50,
      utilizationRate: '40%'
    }
  }
  
  async getTableSizeStats() {
    return {
      totalSize: '245 MB',
      largestTable: 'SystemLog',
      tableCount: 15,
      indexSize: '58 MB'
    }
  }
  
  generateDatabaseRecommendations(queryStats, connectionStats, tableStats) {
    const recommendations = []
    
    if (queryStats.slowQueries > 10) {
      recommendations.push('优化慢查询')
      recommendations.push('添加合适的索引')
    }
    
    if (queryStats.cacheHitRate < 80) {
      recommendations.push('优化查询缓存')
    }
    
    if (parseFloat(connectionStats.utilizationRate) > 80) {
      recommendations.push('增加连接池大小')
    }
    
    return recommendations
  }
}

module.exports = new PerformanceOptimizationService()