const { TestRecord, DataStatistics, CoreIntent, NonCoreIntent, IntentCategory } = require('../models')
const { Op } = require('sequelize')

class AnalyticsService {
  // 获取使用趋势分析
  async getUsageTrends(days = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      
      const dailyStats = await DataStatistics.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'ASC']]
      })
      
      // 填充缺失的日期
      const trends = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const stat = dailyStats.find(s => s.date === dateStr)
        
        trends.push({
          date: dateStr,
          totalTests: stat?.totalTests || 0,
          successfulTests: stat?.successfulTests || 0,
          successRate: stat?.totalTests ? 
            parseFloat(((stat.successfulTests / stat.totalTests) * 100).toFixed(2)) : 0,
          avgResponseTime: stat?.avgResponseTime || 0
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return trends
      
    } catch (error) {
      console.error('获取使用趋势失败:', error)
      return []
    }
  }

  // 获取识别准确率统计
  async getAccuracyStats(period = 'week') {
    try {
      let startDate = new Date()
      
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        default:
          startDate.setDate(startDate.getDate() - 7)
      }
      
      const testRecords = await TestRecord.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        include: [
          {
            model: CoreIntent,
            as: 'CoreIntent',
            required: false
          },
          {
            model: NonCoreIntent,
            as: 'NonCoreIntent', 
            required: false
          }
        ]
      })
      
      const stats = {
        total: testRecords.length,
        successful: testRecords.filter(r => r.isSuccessful).length,
        failed: testRecords.filter(r => !r.isSuccessful).length,
        accuracyRate: 0,
        avgResponseTime: 0,
        intentStats: {},
        categoryStats: {},
        confidenceDistribution: {
          high: 0,    // > 0.8
          medium: 0,  // 0.6 - 0.8
          low: 0      // < 0.6
        }
      }
      
      if (stats.total > 0) {
        stats.accuracyRate = parseFloat(((stats.successful / stats.total) * 100).toFixed(2))
        stats.avgResponseTime = Math.round(
          testRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) / stats.total
        )
        
        // 统计置信度分布
        testRecords.forEach(record => {
          const confidence = record.confidence || 0
          if (confidence > 0.8) {
            stats.confidenceDistribution.high++
          } else if (confidence >= 0.6) {
            stats.confidenceDistribution.medium++
          } else {
            stats.confidenceDistribution.low++
          }
        })
        
        // 统计各意图的表现
        const intentGroups = {}
        testRecords.forEach(record => {
          const intentId = record.matchedIntentId
          const intentType = record.matchedIntentType
          
          if (intentId && intentType) {
            const key = `${intentType}_${intentId}`
            if (!intentGroups[key]) {
              intentGroups[key] = {
                total: 0,
                successful: 0,
                avgConfidence: 0,
                confidenceSum: 0
              }
            }
            
            intentGroups[key].total++
            if (record.isSuccessful) {
              intentGroups[key].successful++
            }
            intentGroups[key].confidenceSum += (record.confidence || 0)
          }
        })
        
        for (const [key, group] of Object.entries(intentGroups)) {
          group.successRate = parseFloat(((group.successful / group.total) * 100).toFixed(2))
          group.avgConfidence = parseFloat((group.confidenceSum / group.total).toFixed(3))
          stats.intentStats[key] = group
        }
      }
      
      return stats
      
    } catch (error) {
      console.error('获取准确率统计失败:', error)
      return null
    }
  }

  // 获取热门意图排行
  async getTopIntents(limit = 10, period = 'week') {
    try {
      let startDate = new Date()
      
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
      }
      
      const testRecords = await TestRecord.findAll({
        where: {
          createdAt: { [Op.gte]: startDate },
          matchedIntentId: { [Op.not]: null }
        },
        attributes: [
          'matchedIntentId',
          'matchedIntentType',
          [TestRecord.sequelize.fn('COUNT', '*'), 'usage_count'],
          [TestRecord.sequelize.fn('AVG', TestRecord.sequelize.col('confidence')), 'avg_confidence'],
          [TestRecord.sequelize.fn('SUM', TestRecord.sequelize.literal('CASE WHEN is_successful = 1 THEN 1 ELSE 0 END')), 'success_count']
        ],
        group: ['matchedIntentId', 'matchedIntentType'],
        order: [[TestRecord.sequelize.literal('usage_count'), 'DESC']],
        limit
      })
      
      const topIntents = []
      
      for (const record of testRecords) {
        const intentId = record.matchedIntentId
        const intentType = record.matchedIntentType
        
        let intent = null
        if (intentType === 'core') {
          intent = await CoreIntent.findByPk(intentId, {
            include: [{ model: IntentCategory, as: 'Category' }]
          })
        } else if (intentType === 'non_core') {
          intent = await NonCoreIntent.findByPk(intentId, {
            include: [{ model: IntentCategory, as: 'Category' }]
          })
        }
        
        if (intent) {
          const usageCount = parseInt(record.dataValues.usage_count)
          const successCount = parseInt(record.dataValues.success_count)
          
          topIntents.push({
            id: intent.id,
            name: intent.name,
            type: intentType,
            category: intent.Category?.name,
            usageCount,
            successCount,
            successRate: parseFloat(((successCount / usageCount) * 100).toFixed(2)),
            avgConfidence: parseFloat(parseFloat(record.dataValues.avg_confidence).toFixed(3))
          })
        }
      }
      
      return topIntents
      
    } catch (error) {
      console.error('获取热门意图失败:', error)
      return []
    }
  }

  // 获取分类统计
  async getCategoryStats() {
    try {
      const categories = await IntentCategory.findAll({
        include: [
          {
            model: CoreIntent,
            as: 'CoreIntents',
            where: { status: 'active' },
            required: false
          },
          {
            model: NonCoreIntent,
            as: 'NonCoreIntents',
            where: { status: 'active' },
            required: false
          }
        ]
      })
      
      const categoryStats = []
      
      for (const category of categories) {
        const coreCount = category.CoreIntents?.length || 0
        const nonCoreCount = category.NonCoreIntents?.length || 0
        const totalIntents = coreCount + nonCoreCount
        
        // 获取该分类的使用统计
        const coreIntentIds = category.CoreIntents?.map(i => i.id) || []
        const nonCoreIntentIds = category.NonCoreIntents?.map(i => i.id) || []
        
        const [coreUsage, nonCoreUsage] = await Promise.all([
          coreIntentIds.length > 0 ? TestRecord.count({
            where: {
              matchedIntentId: { [Op.in]: coreIntentIds },
              matchedIntentType: 'core',
              createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }) : 0,
          nonCoreIntentIds.length > 0 ? TestRecord.count({
            where: {
              matchedIntentId: { [Op.in]: nonCoreIntentIds },
              matchedIntentType: 'non_core',
              createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }) : 0
        ])
        
        categoryStats.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          coreIntents: coreCount,
          nonCoreIntents: nonCoreCount,
          totalIntents,
          weeklyUsage: coreUsage + nonCoreUsage,
          status: category.status
        })
      }
      
      return categoryStats.sort((a, b) => b.totalIntents - a.totalIntents)
      
    } catch (error) {
      console.error('获取分类统计失败:', error)
      return []
    }
  }

  // 获取用户行为分析
  async getUserBehaviorAnalysis(userId = null, days = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      
      const whereClause = {
        createdAt: { [Op.between]: [startDate, endDate] }
      }
      
      if (userId) {
        whereClause.userId = userId
      }
      
      const testRecords = await TestRecord.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      })
      
      const analysis = {
        totalTests: testRecords.length,
        uniqueUsers: new Set(testRecords.map(r => r.userId)).size,
        avgTestsPerUser: 0,
        popularTimeSlots: {},
        commonQueries: {},
        failurePatterns: [],
        userEngagement: {
          highlyActive: 0,    // > 50 tests
          moderatelyActive: 0, // 10-50 tests
          lightlyActive: 0     // < 10 tests
        }
      }
      
      if (testRecords.length > 0) {
        analysis.avgTestsPerUser = parseFloat((testRecords.length / analysis.uniqueUsers).toFixed(2))
        
        // 分析时间段偏好
        testRecords.forEach(record => {
          const hour = new Date(record.createdAt).getHours()
          const timeSlot = this.getTimeSlot(hour)
          analysis.popularTimeSlots[timeSlot] = (analysis.popularTimeSlots[timeSlot] || 0) + 1
        })
        
        // 分析常见查询
        const queryWords = {}
        testRecords.forEach(record => {
          const words = record.inputText.split(/\s+/)
          words.forEach(word => {
            if (word.length > 1) {
              queryWords[word] = (queryWords[word] || 0) + 1
            }
          })
        })
        
        analysis.commonQueries = Object.entries(queryWords)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .reduce((obj, [word, count]) => {
            obj[word] = count
            return obj
          }, {})
        
        // 分析失败模式
        const failedTests = testRecords.filter(r => !r.isSuccessful)
        const failureReasons = {}
        
        failedTests.forEach(record => {
          const key = record.inputText.slice(0, 20) + '...'
          if (!failureReasons[key]) {
            failureReasons[key] = {
              count: 0,
              examples: []
            }
          }
          failureReasons[key].count++
          if (failureReasons[key].examples.length < 3) {
            failureReasons[key].examples.push(record.inputText)
          }
        })
        
        analysis.failurePatterns = Object.entries(failureReasons)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 5)
          .map(([pattern, data]) => ({
            pattern,
            count: data.count,
            examples: data.examples
          }))
        
        // 用户活跃度分析
        if (!userId) {
          const userTestCounts = {}
          testRecords.forEach(record => {
            if (record.userId) {
              userTestCounts[record.userId] = (userTestCounts[record.userId] || 0) + 1
            }
          })
          
          Object.values(userTestCounts).forEach(count => {
            if (count > 50) {
              analysis.userEngagement.highlyActive++
            } else if (count >= 10) {
              analysis.userEngagement.moderatelyActive++
            } else {
              analysis.userEngagement.lightlyActive++
            }
          })
        }
      }
      
      return analysis
      
    } catch (error) {
      console.error('用户行为分析失败:', error)
      return null
    }
  }

  // 获取时间段
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 24) return 'evening'
    return 'night'
  }

  // 更新每日统计
  async updateDailyStatistics(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      const dayRecords = await TestRecord.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      })
      
      const totalTests = dayRecords.length
      const successfulTests = dayRecords.filter(r => r.isSuccessful).length
      const avgResponseTime = totalTests > 0 ? 
        Math.round(dayRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) / totalTests) : 0
      
      // 统计热门意图
      const intentCounts = {}
      dayRecords.forEach(record => {
        if (record.matchedIntentId && record.matchedIntentType) {
          const key = `${record.matchedIntentType}_${record.matchedIntentId}`
          intentCounts[key] = (intentCounts[key] || 0) + 1
        }
      })
      
      const topIntents = Object.entries(intentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, count]) => {
          obj[key] = count
          return obj
        }, {})
      
      // 更新或创建统计记录
      await DataStatistics.upsert({
        date: dateStr,
        totalTests,
        successfulTests,
        avgResponseTime,
        topIntents: JSON.stringify(topIntents)
      })
      
      return true
      
    } catch (error) {
      console.error('更新每日统计失败:', error)
      return false
    }
  }

  // 生成A/B测试报告
  async generateABTestReport(abTestGroup, days = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      
      // 获取A/B测试相关的回复模板使用情况
      const testRecords = await TestRecord.findAll({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          metadata: {
            [Op.like]: `%"abTestGroup":"${abTestGroup}"%`
          }
        }
      })
      
      const report = {
        testGroup: abTestGroup,
        period: `${days} days`,
        totalTests: testRecords.length,
        successRate: 0,
        avgResponseTime: 0,
        userSatisfaction: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        performanceMetrics: {
          avgConfidence: 0,
          responseTimeDistribution: {
            fast: 0,     // < 500ms
            medium: 0,   // 500-1000ms
            slow: 0      // > 1000ms
          }
        }
      }
      
      if (testRecords.length > 0) {
        const successfulTests = testRecords.filter(r => r.isSuccessful).length
        report.successRate = parseFloat(((successfulTests / testRecords.length) * 100).toFixed(2))
        
        report.avgResponseTime = Math.round(
          testRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) / testRecords.length
        )
        
        // 用户满意度统计
        testRecords.forEach(record => {
          if (record.feedback) {
            report.userSatisfaction[record.feedback]++
          }
          
          // 响应时间分布
          const responseTime = record.responseTime || 0
          if (responseTime < 500) {
            report.performanceMetrics.responseTimeDistribution.fast++
          } else if (responseTime <= 1000) {
            report.performanceMetrics.responseTimeDistribution.medium++
          } else {
            report.performanceMetrics.responseTimeDistribution.slow++
          }
        })
        
        report.performanceMetrics.avgConfidence = parseFloat(
          (testRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / testRecords.length).toFixed(3)
        )
      }
      
      return report
      
    } catch (error) {
      console.error('生成A/B测试报告失败:', error)
      return null
    }
  }
}

module.exports = new AnalyticsService() 