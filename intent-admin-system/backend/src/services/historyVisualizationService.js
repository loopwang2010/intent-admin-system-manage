const { SystemLog, User, sequelize } = require('../models')
const { Op } = require('sequelize')
const auditService = require('./auditService')

/**
 * 操作历史可视化服务
 * 提供数据可视化相关的数据处理和分析功能
 */
class HistoryVisualizationService {
  
  /**
   * 获取用户操作时间线数据（可视化格式）
   * @param {number} userId - 用户ID
   * @param {Object} options - 选项
   */
  async getUserTimelineVisualization(userId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        groupBy = 'day' // hour, day, week, month
      } = options
      
      const timeline = await auditService.getUserTimeline(userId, {
        startDate,
        endDate,
        limit: 1000
      })
      
      // 按时间分组聚合数据
      const grouped = this.groupTimelineData(timeline, groupBy)
      
      // 生成可视化数据
      const visualization = {
        timelineData: grouped,
        summary: {
          totalOperations: timeline.length,
          dateRange: { startDate, endDate },
          groupBy,
          operationTypes: this.getOperationTypesSummary(timeline),
          activityPattern: this.getActivityPattern(timeline),
          resourceDistribution: this.getResourceDistribution(timeline)
        }
      }
      
      return visualization
    } catch (error) {
      throw new Error(`获取用户时间线可视化数据失败: ${error.message}`)
    }
  }
  
  /**
   * 获取资源变更历史可视化
   * @param {string} resource - 资源类型
   * @param {number} resourceId - 资源ID
   */
  async getResourceHistoryVisualization(resource, resourceId) {
    try {
      const history = await auditService.getResourceHistory(resource, resourceId)
      
      // 构建变更时间线
      const changeTimeline = history.map(log => ({
        timestamp: log.timestamp,
        operationType: log.operationType,
        operationDescription: log.operationDescription,
        user: log.user,
        changes: log.changes,
        success: log.success,
        changeCount: log.changes ? log.changes.length : 0
      }))
      
      // 分析变更模式
      const changeAnalysis = {
        totalChanges: history.length,
        changeFrequency: this.calculateChangeFrequency(history),
        topModifiers: this.getTopModifiers(history),
        changeTypes: this.getChangeTypes(history),
        fieldChangeFrequency: this.getFieldChangeFrequency(history)
      }
      
      return {
        timeline: changeTimeline,
        analysis: changeAnalysis,
        visualization: {
          changesByDate: this.groupChangesByDate(history),
          changesByUser: this.groupChangesByUser(history),
          changesByType: this.groupChangesByType(history)
        }
      }
    } catch (error) {
      throw new Error(`获取资源历史可视化数据失败: ${error.message}`)
    }
  }
  
  /**
   * 获取系统活动热力图数据
   * @param {Object} options - 选项
   */
  async getActivityHeatmapData(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        granularity = 'hour' // hour, day
      } = options
      
      let timeFormat, timeUnit
      if (granularity === 'hour') {
        timeFormat = '%Y-%m-%d %H:00:00'
        timeUnit = 'hour'
      } else {
        timeFormat = '%Y-%m-%d'
        timeUnit = 'day'
      }
      
      const heatmapData = await SystemLog.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'timeSlot'],
          [sequelize.fn('COUNT', '*'), 'activityCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = true THEN 1 END')), 'successCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = false THEN 1 END')), 'errorCount']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'ASC']]
      })
      
      return {
        heatmapData: heatmapData.map(item => ({
          timeSlot: item.dataValues.timeSlot,
          activityCount: parseInt(item.dataValues.activityCount),
          successCount: parseInt(item.dataValues.successCount),
          errorCount: parseInt(item.dataValues.errorCount),
          successRate: item.dataValues.activityCount > 0 
            ? (item.dataValues.successCount / item.dataValues.activityCount * 100).toFixed(2)
            : 0
        })),
        summary: {
          timeUnit,
          granularity,
          dateRange: { startDate, endDate },
          totalSlots: heatmapData.length
        }
      }
    } catch (error) {
      throw new Error(`获取活动热力图数据失败: ${error.message}`)
    }
  }
  
  /**
   * 获取操作趋势分析
   * @param {Object} options - 选项
   */
  async getOperationTrends(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        interval = 'day' // day, week, month
      } = options
      
      let timeFormat, intervalUnit
      switch (interval) {
        case 'week':
          timeFormat = '%Y-%u'
          intervalUnit = 'week'
          break
        case 'month':
          timeFormat = '%Y-%m'
          intervalUnit = 'month'
          break
        default:
          timeFormat = '%Y-%m-%d'
          intervalUnit = 'day'
      }
      
      // 获取总体趋势
      const overallTrend = await SystemLog.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'period'],
          [sequelize.fn('COUNT', '*'), 'totalOperations'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = true THEN 1 END')), 'successOperations'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = false THEN 1 END')), 'failedOperations'],
          [sequelize.fn('COUNT', sequelize.literal('DISTINCT userId')), 'activeUsers']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'ASC']]
      })
      
      // 获取操作类型趋势
      const operationTypeTrends = await SystemLog.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'period'],
          'operationType',
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [
          sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat),
          'operationType'
        ],
        order: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), timeFormat), 'ASC'],
          ['operationType', 'ASC']
        ]
      })
      
      return {
        overallTrend: overallTrend.map(item => ({
          period: item.dataValues.period,
          totalOperations: parseInt(item.dataValues.totalOperations),
          successOperations: parseInt(item.dataValues.successOperations),
          failedOperations: parseInt(item.dataValues.failedOperations),
          activeUsers: parseInt(item.dataValues.activeUsers),
          successRate: item.dataValues.totalOperations > 0
            ? (item.dataValues.successOperations / item.dataValues.totalOperations * 100).toFixed(2)
            : 0
        })),
        operationTypeTrends: this.groupOperationTypeTrends(operationTypeTrends),
        analysis: {
          interval: intervalUnit,
          dateRange: { startDate, endDate },
          trendDirection: this.analyzeTrendDirection(overallTrend)
        }
      }
    } catch (error) {
      throw new Error(`获取操作趋势分析失败: ${error.message}`)
    }
  }
  
  /**
   * 获取用户行为分析
   * @param {Object} options - 选项
   */
  async getUserBehaviorAnalysis(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        limit = 20
      } = options
      
      // 用户活跃度分析
      const userActivity = await SystemLog.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          },
          userId: { [Op.ne]: null }
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', '*'), 'totalOperations'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = true THEN 1 END')), 'successOperations'],
          [sequelize.fn('COUNT', sequelize.literal('DISTINCT operationType')), 'operationTypes'],
          [sequelize.fn('MIN', sequelize.col('createdAt')), 'firstActivity'],
          [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastActivity']
        ],
        include: [{
          model: User,
          as: 'User',
          attributes: ['username', 'role']
        }],
        group: ['userId'],
        order: [[sequelize.literal('totalOperations'), 'DESC']],
        limit: parseInt(limit)
      })
      
      // 操作模式分析
      const operationPatterns = await this.getUserOperationPatterns(startDate, endDate)
      
      // 时间模式分析
      const timePatterns = await this.getUserTimePatterns(startDate, endDate)
      
      return {
        userActivity: userActivity.map(item => ({
          userId: item.userId,
          username: item.User?.username || 'Unknown',
          role: item.User?.role || 'Unknown',
          totalOperations: parseInt(item.dataValues.totalOperations),
          successOperations: parseInt(item.dataValues.successOperations),
          operationTypes: parseInt(item.dataValues.operationTypes),
          firstActivity: item.dataValues.firstActivity,
          lastActivity: item.dataValues.lastActivity,
          successRate: item.dataValues.totalOperations > 0
            ? (item.dataValues.successOperations / item.dataValues.totalOperations * 100).toFixed(2)
            : 0,
          avgOperationsPerDay: this.calculateAvgOperationsPerDay(
            item.dataValues.firstActivity,
            item.dataValues.lastActivity,
            item.dataValues.totalOperations
          )
        })),
        operationPatterns,
        timePatterns,
        summary: {
          analysisDateRange: { startDate, endDate },
          totalActiveUsers: userActivity.length
        }
      }
    } catch (error) {
      throw new Error(`获取用户行为分析失败: ${error.message}`)
    }
  }
  
  /**
   * 获取数据变更影响分析
   * @param {string} resource - 资源类型
   * @param {number} resourceId - 资源ID
   */
  async getChangeImpactAnalysis(resource, resourceId) {
    try {
      const history = await auditService.getResourceHistory(resource, resourceId)
      
      // 分析变更频率
      const changeFrequency = this.analyzeChangeFrequency(history)
      
      // 分析变更影响
      const impactAnalysis = this.analyzeChangeImpact(history)
      
      // 分析变更质量
      const qualityAnalysis = this.analyzeChangeQuality(history)
      
      return {
        changeFrequency,
        impactAnalysis,
        qualityAnalysis,
        recommendations: this.generateChangeRecommendations(
          changeFrequency,
          impactAnalysis,
          qualityAnalysis
        )
      }
    } catch (error) {
      throw new Error(`获取变更影响分析失败: ${error.message}`)
    }
  }
  
  // 辅助方法
  
  /**
   * 按时间分组时间线数据
   */
  groupTimelineData(timeline, groupBy) {
    const grouped = {}
    
    timeline.forEach(item => {
      let key
      const date = new Date(item.timestamp)
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default: // day
          key = date.toISOString().split('T')[0]
      }
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(item)
    })
    
    return Object.entries(grouped).map(([period, operations]) => ({
      period,
      operationCount: operations.length,
      operations: operations.slice(0, 10), // 限制显示数量
      successCount: operations.filter(op => op.success).length,
      operationTypes: [...new Set(operations.map(op => op.operationType))]
    }))
  }
  
  /**
   * 获取操作类型摘要
   */
  getOperationTypesSummary(timeline) {
    const types = {}
    timeline.forEach(item => {
      if (!types[item.operationType]) {
        types[item.operationType] = 0
      }
      types[item.operationType]++
    })
    
    return Object.entries(types)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 获取活动模式
   */
  getActivityPattern(timeline) {
    const hourCounts = new Array(24).fill(0)
    const dayCounts = new Array(7).fill(0)
    
    timeline.forEach(item => {
      const date = new Date(item.timestamp)
      hourCounts[date.getHours()]++
      dayCounts[date.getDay()]++
    })
    
    return {
      hourlyPattern: hourCounts.map((count, hour) => ({ hour, count })),
      dailyPattern: dayCounts.map((count, day) => ({ 
        day: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day], 
        count 
      }))
    }
  }
  
  /**
   * 获取资源分布
   */
  getResourceDistribution(timeline) {
    const resources = {}
    timeline.forEach(item => {
      if (!resources[item.resource]) {
        resources[item.resource] = 0
      }
      resources[item.resource]++
    })
    
    return Object.entries(resources)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 计算变更频率
   */
  calculateChangeFrequency(history) {
    if (history.length === 0) return 0
    
    const first = new Date(history[history.length - 1].timestamp)
    const last = new Date(history[0].timestamp)
    const days = Math.max(1, (last - first) / (1000 * 60 * 60 * 24))
    
    return (history.length / days).toFixed(2)
  }
  
  /**
   * 获取顶级修改者
   */
  getTopModifiers(history) {
    const modifiers = {}
    history.forEach(item => {
      const userId = item.user?.id || 'unknown'
      const username = item.user?.username || 'Unknown'
      if (!modifiers[userId]) {
        modifiers[userId] = { username, count: 0 }
      }
      modifiers[userId].count++
    })
    
    return Object.entries(modifiers)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }
  
  /**
   * 获取变更类型
   */
  getChangeTypes(history) {
    const types = {}
    history.forEach(item => {
      const type = item.operationType
      if (!types[type]) {
        types[type] = 0
      }
      types[type]++
    })
    
    return Object.entries(types)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 获取字段变更频率
   */
  getFieldChangeFrequency(history) {
    const fields = {}
    history.forEach(item => {
      if (item.changes) {
        item.changes.forEach(change => {
          if (!fields[change.field]) {
            fields[change.field] = 0
          }
          fields[change.field]++
        })
      }
    })
    
    return Object.entries(fields)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 按日期分组变更
   */
  groupChangesByDate(history) {
    const groups = {}
    history.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = 0
      }
      groups[date]++
    })
    
    return Object.entries(groups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  
  /**
   * 按用户分组变更
   */
  groupChangesByUser(history) {
    const groups = {}
    history.forEach(item => {
      const username = item.user?.username || 'Unknown'
      if (!groups[username]) {
        groups[username] = 0
      }
      groups[username]++
    })
    
    return Object.entries(groups)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 按类型分组变更
   */
  groupChangesByType(history) {
    const groups = {}
    history.forEach(item => {
      const type = item.operationType
      if (!groups[type]) {
        groups[type] = 0
      }
      groups[type]++
    })
    
    return Object.entries(groups)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }
  
  /**
   * 分组操作类型趋势
   */
  groupOperationTypeTrends(trends) {
    const grouped = {}
    trends.forEach(item => {
      const period = item.dataValues.period
      const operationType = item.operationType
      const count = parseInt(item.dataValues.count)
      
      if (!grouped[period]) {
        grouped[period] = {}
      }
      grouped[period][operationType] = count
    })
    
    return grouped
  }
  
  /**
   * 分析趋势方向
   */
  analyzeTrendDirection(trend) {
    if (trend.length < 2) return 'insufficient_data'
    
    const recent = trend.slice(-7) // 最近7个数据点
    const increases = recent.reduce((acc, curr, idx) => {
      if (idx > 0) {
        return acc + (curr.dataValues.totalOperations > recent[idx - 1].dataValues.totalOperations ? 1 : 0)
      }
      return acc
    }, 0)
    
    const ratio = increases / (recent.length - 1)
    
    if (ratio > 0.6) return 'increasing'
    if (ratio < 0.4) return 'decreasing'
    return 'stable'
  }
  
  /**
   * 计算平均每日操作数
   */
  calculateAvgOperationsPerDay(firstActivity, lastActivity, totalOperations) {
    const days = Math.max(1, (new Date(lastActivity) - new Date(firstActivity)) / (1000 * 60 * 60 * 24))
    return (totalOperations / days).toFixed(2)
  }
  
  /**
   * 获取用户操作模式
   */
  async getUserOperationPatterns(startDate, endDate) {
    // 这里可以实现更复杂的模式分析
    return {
      commonSequences: [],
      operationClusters: [],
      anomalies: []
    }
  }
  
  /**
   * 获取用户时间模式
   */
  async getUserTimePatterns(startDate, endDate) {
    // 这里可以实现时间模式分析
    return {
      peakHours: [],
      workingDays: [],
      sessionDuration: 0
    }
  }
  
  /**
   * 分析变更频率
   */
  analyzeChangeFrequency(history) {
    return {
      totalChanges: history.length,
      avgChangesPerDay: this.calculateChangeFrequency(history),
      changeVelocity: 'normal' // 可以根据阈值判断
    }
  }
  
  /**
   * 分析变更影响
   */
  analyzeChangeImpact(history) {
    return {
      highImpactChanges: history.filter(h => h.operationType.includes('DELETE')).length,
      mediumImpactChanges: history.filter(h => h.operationType.includes('UPDATE')).length,
      lowImpactChanges: history.filter(h => h.operationType.includes('CREATE')).length
    }
  }
  
  /**
   * 分析变更质量
   */
  analyzeChangeQuality(history) {
    const successfulChanges = history.filter(h => h.success).length
    const failedChanges = history.length - successfulChanges
    
    return {
      successRate: history.length > 0 ? (successfulChanges / history.length * 100).toFixed(2) : 0,
      failureRate: history.length > 0 ? (failedChanges / history.length * 100).toFixed(2) : 0,
      qualityScore: successfulChanges > failedChanges ? 'good' : 'needs_improvement'
    }
  }
  
  /**
   * 生成变更建议
   */
  generateChangeRecommendations(frequency, impact, quality) {
    const recommendations = []
    
    if (parseFloat(frequency.avgChangesPerDay) > 10) {
      recommendations.push('变更频率较高，建议建立变更审核流程')
    }
    
    if (impact.highImpactChanges > impact.lowImpactChanges) {
      recommendations.push('高影响变更较多，建议加强测试和备份')
    }
    
    if (parseFloat(quality.successRate) < 90) {
      recommendations.push('变更成功率偏低，建议加强变更前验证')
    }
    
    return recommendations
  }
}

module.exports = new HistoryVisualizationService()