const express = require('express')
const router = express.Router()
const auditController = require('../controllers/auditController')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * 审计日志路由
 * 所有路由都需要认证，部分需要特定权限
 */

// 应用认证中间件到所有路由
router.use(authenticate)

/**
 * @route GET /api/audit/logs
 * @desc 获取审计日志列表
 * @access 需要审计查看权限
 */
router.get('/logs', 
  authorize(['all', 'audit:read']), 
  auditController.getAuditLogs
)

/**
 * @route GET /api/audit/logs/export
 * @desc 导出审计日志
 * @access 需要审计导出权限
 */
router.get('/logs/export', 
  authorize(['all', 'audit:export']), 
  auditController.exportAuditLogs
)

/**
 * @route GET /api/audit/users/:userId/timeline
 * @desc 获取用户操作时间线
 * @access 用户可以查看自己的，管理员可以查看所有
 */
router.get('/users/:userId/timeline', 
  auditController.getUserTimeline
)

/**
 * @route GET /api/audit/resources/:resource/:resourceId/history
 * @desc 获取资源变更历史
 * @access 需要审计查看权限
 */
router.get('/resources/:resource/:resourceId/history', 
  authorize(['all', 'audit:read']), 
  auditController.getResourceHistory
)

/**
 * @route GET /api/audit/stats
 * @desc 获取审计统计信息
 * @access 需要审计查看权限
 */
router.get('/stats', 
  authorize(['all', 'audit:read']), 
  auditController.getAuditStats
)

/**
 * @route GET /api/audit/security/suspicious
 * @desc 检测可疑活动
 * @access 需要安全管理权限
 */
router.get('/security/suspicious', 
  authorize(['all', 'security:manage']), 
  auditController.detectSuspiciousActivity
)

/**
 * @route GET /api/audit/operation-types
 * @desc 获取操作类型列表
 * @access 需要审计查看权限
 */
router.get('/operation-types', 
  authorize(['all', 'audit:read']), 
  auditController.getOperationTypes
)

/**
 * @route POST /api/audit/cleanup
 * @desc 清理旧日志
 * @access 仅管理员
 */
router.post('/cleanup', 
  authorize(['all']), 
  auditController.cleanupOldLogs
)

module.exports = router