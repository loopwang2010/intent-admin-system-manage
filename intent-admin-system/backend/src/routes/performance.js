const express = require('express')
const router = express.Router()
const performanceController = require('../controllers/performanceController')
const { authenticate, requirePermission } = require('../middleware/auth')

/**
 * 性能优化路由
 * 需要系统管理权限才能访问
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route GET /api/performance/analysis
 * @desc 获取性能分析报告
 * @access 需要系统监控权限
 */
router.get('/analysis', 
  requirePermission(['system:monitor', 'performance:analyze', '*']), 
  performanceController.getPerformanceAnalysis
)

/**
 * @route GET /api/performance/realtime
 * @desc 获取实时性能监控
 * @access 需要系统监控权限
 */
router.get('/realtime', 
  requirePermission(['system:monitor', 'performance:monitor', '*']), 
  performanceController.getRealtimePerformance
)

/**
 * @route GET /api/performance/recommendations
 * @desc 获取性能优化建议
 * @access 需要性能分析权限
 */
router.get('/recommendations', 
  requirePermission(['performance:analyze', 'system:optimize', '*']), 
  performanceController.getOptimizationRecommendations
)

/**
 * @route GET /api/performance/slow-queries
 * @desc 获取慢查询分析
 * @access 需要性能分析权限
 */
router.get('/slow-queries', 
  requirePermission(['performance:analyze', 'database:monitor', '*']), 
  performanceController.getSlowQueryAnalysis
)

/**
 * @route GET /api/performance/resource-usage
 * @desc 获取资源使用分析
 * @access 需要系统监控权限
 */
router.get('/resource-usage', 
  requirePermission(['system:monitor', 'performance:monitor', '*']), 
  performanceController.getResourceUsageAnalysis
)

/**
 * @route GET /api/performance/trends
 * @desc 获取性能趋势
 * @access 需要性能分析权限
 */
router.get('/trends', 
  requirePermission(['performance:analyze', 'analytics:read', '*']), 
  performanceController.getPerformanceTrends
)

/**
 * @route GET /api/performance/health-check
 * @desc 系统健康检查
 * @access 需要系统监控权限
 */
router.get('/health-check', 
  requirePermission(['system:monitor', 'system:health', '*']), 
  performanceController.performHealthCheck
)

module.exports = router