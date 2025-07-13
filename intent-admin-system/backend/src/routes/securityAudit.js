const express = require('express')
const router = express.Router()
const securityAuditController = require('../controllers/securityAuditController')
const { authenticate, requirePermission } = require('../middleware/auth')

/**
 * 安全审计路由
 * 需要高级安全权限才能访问
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route POST /api/security-audit/suspicious-activities
 * @desc 检测可疑活动
 * @access 需要安全审计权限
 */
router.post('/suspicious-activities', 
  requirePermission(['security:audit', '*']), 
  securityAuditController.detectSuspiciousActivities
)

/**
 * @route POST /api/security-audit/security-report
 * @desc 生成安全报告
 * @access 需要安全审计权限
 */
router.post('/security-report', 
  requirePermission(['security:audit', '*']), 
  securityAuditController.generateSecurityReport
)

/**
 * @route GET /api/security-audit/realtime-status
 * @desc 获取实时安全状态
 * @access 需要安全监控权限
 */
router.get('/realtime-status', 
  requirePermission(['security:monitor', 'security:audit', '*']), 
  securityAuditController.getRealtimeSecurityStatus
)

/**
 * @route GET /api/security-audit/trends
 * @desc 安全趋势分析
 * @access 需要安全分析权限
 */
router.get('/trends', 
  requirePermission(['security:analyze', 'security:audit', '*']), 
  securityAuditController.getSecurityTrends
)

/**
 * @route GET /api/security-audit/incidents/:incidentType?
 * @desc 获取安全事件详情
 * @access 需要安全审计权限
 */
router.get('/incidents/:incidentType?', 
  requirePermission(['security:audit', '*']), 
  securityAuditController.getSecurityIncidentDetails
)

/**
 * @route GET /api/security-audit/recommendations
 * @desc 获取安全配置建议
 * @access 需要安全审计权限
 */
router.get('/recommendations', 
  requirePermission(['security:audit', '*']), 
  securityAuditController.getSecurityRecommendations
)

module.exports = router