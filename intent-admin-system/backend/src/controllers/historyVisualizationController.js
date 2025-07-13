const historyVisualizationService = require('../services/historyVisualizationService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 操作历史可视化控制器
 */
class HistoryVisualizationController {
  
  /**
   * 获取用户操作时间线可视化
   */
  async getUserTimelineVisualization(req, res) {
    try {
      const { userId } = req.params
      const {
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        })
      }
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.groupBy = groupBy
      
      const visualization = await historyVisualizationService.getUserTimelineVisualization(
        parseInt(userId), 
        options
      )
      
      res.json({
        success: true,
        message: '获取用户时间线可视化成功',
        data: visualization
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户时间线可视化失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取资源变更历史可视化
   */
  async getResourceHistoryVisualization(req, res) {
    try {
      const { resource, resourceId } = req.params
      
      if (!resource || !resourceId) {
        return res.status(400).json({
          success: false,
          message: '资源类型和资源ID不能为空'
        })
      }
      
      const visualization = await historyVisualizationService.getResourceHistoryVisualization(
        resource, 
        parseInt(resourceId)
      )
      
      res.json({
        success: true,
        message: '获取资源历史可视化成功',
        data: visualization
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取资源历史可视化失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取系统活动热力图数据
   */
  async getActivityHeatmapData(req, res) {
    try {
      const {
        startDate,
        endDate,
        granularity = 'hour'
      } = req.query
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.granularity = granularity
      
      const heatmapData = await historyVisualizationService.getActivityHeatmapData(options)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '活动热力图数据',
        metadata: { 
          action: 'export_heatmap',
          granularity,
          dataPoints: heatmapData.heatmapData.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取活动热力图数据成功',
        data: heatmapData
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取活动热力图数据失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取操作趋势分析
   */
  async getOperationTrends(req, res) {
    try {
      const {
        startDate,
        endDate,
        interval = 'day'
      } = req.query
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.interval = interval
      
      const trends = await historyVisualizationService.getOperationTrends(options)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '操作趋势分析',
        metadata: { 
          action: 'export_trends',
          interval,
          dataPoints: trends.overallTrend.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取操作趋势分析成功',
        data: trends
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取操作趋势分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取用户行为分析
   */
  async getUserBehaviorAnalysis(req, res) {
    try {
      const {
        startDate,
        endDate,
        limit = 20
      } = req.query
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      options.limit = parseInt(limit)
      
      const analysis = await historyVisualizationService.getUserBehaviorAnalysis(options)
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '用户行为分析',
        metadata: { 
          action: 'export_user_behavior',
          userCount: analysis.userActivity.length,
          analysisType: 'comprehensive'
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取用户行为分析成功',
        data: analysis
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户行为分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取数据变更影响分析
   */
  async getChangeImpactAnalysis(req, res) {
    try {
      const { resource, resourceId } = req.params
      
      if (!resource || !resourceId) {
        return res.status(400).json({
          success: false,
          message: '资源类型和资源ID不能为空'
        })
      }
      
      const analysis = await historyVisualizationService.getChangeImpactAnalysis(
        resource, 
        parseInt(resourceId)
      )
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource,
        resourceId: parseInt(resourceId),
        resourceName: '变更影响分析',
        metadata: { 
          action: 'export_impact_analysis',
          recommendationCount: analysis.recommendations.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取变更影响分析成功',
        data: analysis
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取变更影响分析失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取可视化数据总览
   */
  async getVisualizationDashboard(req, res) {
    try {
      const {
        startDate,
        endDate
      } = req.query
      
      const options = {}
      if (startDate) options.startDate = new Date(startDate)
      if (endDate) options.endDate = new Date(endDate)
      
      // 并行获取多种数据
      const [
        heatmapData,
        trends,
        userBehavior
      ] = await Promise.all([
        historyVisualizationService.getActivityHeatmapData(options),
        historyVisualizationService.getOperationTrends(options),
        historyVisualizationService.getUserBehaviorAnalysis({ ...options, limit: 10 })
      ])
      
      const dashboard = {
        heatmap: heatmapData,
        trends: trends,
        userBehavior: userBehavior,
        summary: {
          totalOperations: trends.overallTrend.reduce((sum, item) => sum + item.totalOperations, 0),
          totalUsers: userBehavior.userActivity.length,
          timeRange: options,
          lastUpdated: new Date().toISOString()
        }
      }
      
      // 记录操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'system',
        resourceName: '可视化仪表板',
        metadata: { 
          action: 'export_dashboard',
          components: ['heatmap', 'trends', 'userBehavior'],
          dataSize: JSON.stringify(dashboard).length
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取可视化仪表板成功',
        data: dashboard
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取可视化仪表板失败',
        error: error.message
      })
    }
  }
}

module.exports = new HistoryVisualizationController()