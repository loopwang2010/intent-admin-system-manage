const express = require('express')
const router = express.Router()
const historyVisualizationController = require('../controllers/historyVisualizationController')
const { authenticate, requirePermission } = require('../middleware/auth')

/**
 * 操作历史可视化路由
 * 需要相应权限才能访问
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route GET /api/history-visualization/users/:userId/timeline
 * @desc 获取用户操作时间线可视化
 * @access 需要审计查看权限
 */
router.get('/users/:userId/timeline', 
  requirePermission(['audit:read', 'data:visualize', '*']), 
  historyVisualizationController.getUserTimelineVisualization
)

/**
 * @route GET /api/history-visualization/resources/:resource/:resourceId/history
 * @desc 获取资源变更历史可视化
 * @access 需要审计查看权限
 */
router.get('/resources/:resource/:resourceId/history', 
  requirePermission(['audit:read', 'data:visualize', '*']), 
  historyVisualizationController.getResourceHistoryVisualization
)

/**
 * @route GET /api/history-visualization/activity-heatmap
 * @desc 获取系统活动热力图数据
 * @access 需要数据可视化权限
 */
router.get('/activity-heatmap', 
  requirePermission(['data:visualize', 'analytics:read', '*']), 
  historyVisualizationController.getActivityHeatmapData
)

/**
 * @route GET /api/history-visualization/operation-trends
 * @desc 获取操作趋势分析
 * @access 需要数据可视化权限
 */
router.get('/operation-trends', 
  requirePermission(['data:visualize', 'analytics:read', '*']), 
  historyVisualizationController.getOperationTrends
)

/**
 * @route GET /api/history-visualization/user-behavior
 * @desc 获取用户行为分析
 * @access 需要用户分析权限
 */
router.get('/user-behavior', 
  requirePermission(['user:analyze', 'analytics:read', '*']), 
  historyVisualizationController.getUserBehaviorAnalysis
)

/**
 * @route GET /api/history-visualization/resources/:resource/:resourceId/impact
 * @desc 获取数据变更影响分析
 * @access 需要审计查看权限
 */
router.get('/resources/:resource/:resourceId/impact', 
  requirePermission(['audit:read', 'data:analyze', '*']), 
  historyVisualizationController.getChangeImpactAnalysis
)

/**
 * @route GET /api/history-visualization/dashboard
 * @desc 获取可视化数据总览
 * @access 需要数据可视化权限
 */
router.get('/dashboard', 
  requirePermission(['data:visualize', 'analytics:read', '*']), 
  historyVisualizationController.getVisualizationDashboard
)

module.exports = router