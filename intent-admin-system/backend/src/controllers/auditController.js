const auditService = require('../services/auditService')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

/**
 * 审计日志控制器
 */
class AuditController {
  
  /**
   * 获取审计日志列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        userId,
        operationType,
        resource,
        resourceId,
        success,
        level,
        ip,
        search
      } = req.query
      
      // 参数验证
      if (page < 1 || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: '分页参数无效'
        })
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        userId: userId ? parseInt(userId) : undefined,
        operationType,
        resource,
        resourceId: resourceId ? parseInt(resourceId) : undefined,
        success: success !== undefined ? success === 'true' : undefined,
        level,
        ip,
        search
      }
      
      const result = await auditService.getAuditLogs(options)
      
      res.json({
        success: true,
        message: '获取审计日志成功',
        data: result
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取审计日志失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取用户操作时间线
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getUserTimeline(req, res) {
    try {
      const { userId } = req.params
      const {
        limit = 100,
        startDate,
        endDate,
        resource
      } = req.query
      
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          message: '用户ID参数无效'
        })
      }
      
      // 权限检查：只能查看自己的时间线，或者管理员可以查看所有人的
      if (req.user.id !== parseInt(userId) && !req.user.permissions.includes('all')) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法查看该用户的操作时间线'
        })
      }
      
      const options = {
        limit: parseInt(limit),
        startDate,
        endDate,
        resource
      }
      
      const timeline = await auditService.getUserTimeline(parseInt(userId), options)
      
      res.json({
        success: true,
        message: '获取用户时间线成功',
        data: timeline
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取用户时间线失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取资源变更历史
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getResourceHistory(req, res) {
    try {
      const { resource, resourceId } = req.params
      
      if (!resource || !resourceId || isNaN(parseInt(resourceId))) {
        return res.status(400).json({
          success: false,
          message: '资源参数无效'
        })
      }
      
      const history = await auditService.getResourceHistory(resource, parseInt(resourceId))
      
      // 记录查看历史的操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'audit',
        resourceName: `${resource}_${resourceId}_history`,
        metadata: { 
          action: 'view_resource_history',
          targetResource: resource,
          targetResourceId: resourceId
        }
      }, req)
      
      res.json({
        success: true,
        message: '获取资源历史成功',
        data: history
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取资源历史失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取审计统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getAuditStats(req, res) {
    try {
      const {
        startDate,
        endDate,
        period = '30d'
      } = req.query
      
      let start, end
      
      if (startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        // 根据period参数设置默认时间范围
        end = new Date()
        switch (period) {
          case '1d':
            start = new Date(Date.now() - 24 * 60 * 60 * 1000)
            break
          case '7d':
            start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            break
          case '90d':
            start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            break
          default:
            start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
      
      const stats = await auditService.getAuditStats({ startDate: start, endDate: end })
      
      res.json({
        success: true,
        message: '获取审计统计成功',
        data: {
          ...stats,
          period: {
            startDate: start,
            endDate: end,
            days: Math.ceil((end - start) / (24 * 60 * 60 * 1000))
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取审计统计失败',
        error: error.message
      })
    }
  }
  
  /**
   * 检测可疑活动
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async detectSuspiciousActivity(req, res) {
    try {
      const {
        hours = 24,
        failureThreshold = 5,
        rapidAccessThreshold = 50
      } = req.query
      
      const options = {
        hours: parseInt(hours),
        failureThreshold: parseInt(failureThreshold),
        rapidAccessThreshold: parseInt(rapidAccessThreshold)
      }
      
      const suspiciousActivities = await auditService.detectSuspiciousActivity(options)
      
      // 记录安全检测操作
      await logOperation({
        operationType: OPERATION_TYPES.SYSTEM_MAINTENANCE,
        resource: 'system',
        resourceName: 'suspicious_activity_detection',
        metadata: {
          action: 'security_scan',
          parameters: options,
          foundActivities: suspiciousActivities.length
        }
      }, req)
      
      res.json({
        success: true,
        message: '可疑活动检测完成',
        data: {
          activities: suspiciousActivities,
          summary: {
            total: suspiciousActivities.length,
            high: suspiciousActivities.filter(a => a.severity === 'high').length,
            medium: suspiciousActivities.filter(a => a.severity === 'medium').length,
            low: suspiciousActivities.filter(a => a.severity === 'low').length
          },
          scanParams: options
        }
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
   * 导出审计日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async exportAuditLogs(req, res) {
    try {
      const {
        format = 'json',
        startDate,
        endDate,
        userId,
        operationType,
        resource
      } = req.query
      
      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: '不支持的导出格式'
        })
      }
      
      // 限制导出数据量
      const options = {
        page: 1,
        limit: 10000, // 最多导出10000条记录
        startDate,
        endDate,
        userId: userId ? parseInt(userId) : undefined,
        operationType,
        resource
      }
      
      const result = await auditService.getAuditLogs(options)
      
      // 记录导出操作
      await logOperation({
        operationType: OPERATION_TYPES.DATA_EXPORT,
        resource: 'audit',
        resourceName: 'audit_logs_export',
        metadata: {
          format,
          filters: options,
          recordCount: result.logs.length
        }
      }, req)
      
      if (format === 'csv') {
        // CSV格式导出
        const csvData = this.convertToCSV(result.logs)
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`)
        res.send(csvData)
      } else {
        // JSON格式导出
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.json`)
        res.json({
          exportInfo: {
            timestamp: new Date().toISOString(),
            totalRecords: result.logs.length,
            filters: options
          },
          data: result.logs
        })
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '导出审计日志失败',
        error: error.message
      })
    }
  }
  
  /**
   * 清理旧日志（管理员操作）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async cleanupOldLogs(req, res) {
    try {
      const { days = 90 } = req.body
      
      // 只有管理员可以执行此操作
      if (!req.user.permissions.includes('all')) {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有管理员可以清理日志'
        })
      }
      
      if (days < 30) {
        return res.status(400).json({
          success: false,
          message: '至少保留30天的日志'
        })
      }
      
      const deletedCount = await auditService.cleanupOldLogs(parseInt(days))
      
      // 记录清理操作
      await logOperation({
        operationType: OPERATION_TYPES.SYSTEM_MAINTENANCE,
        resource: 'system',
        resourceName: 'log_cleanup',
        metadata: {
          action: 'cleanup_old_logs',
          retentionDays: days,
          deletedCount
        }
      }, req)
      
      res.json({
        success: true,
        message: '日志清理完成',
        data: {
          deletedCount,
          retentionDays: days
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '清理日志失败',
        error: error.message
      })
    }
  }
  
  /**
   * 获取操作类型列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getOperationTypes(req, res) {
    try {
      const { OPERATION_TYPES, OPERATION_DESCRIPTIONS } = require('../constants/operationTypes')
      
      const operationTypes = Object.keys(OPERATION_TYPES).map(key => ({
        code: OPERATION_TYPES[key],
        name: OPERATION_DESCRIPTIONS[OPERATION_TYPES[key]] || OPERATION_TYPES[key],
        category: this.categorizeOperationType(OPERATION_TYPES[key])
      }))
      
      res.json({
        success: true,
        message: '获取操作类型成功',
        data: operationTypes
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取操作类型失败',
        error: error.message
      })
    }
  }
  
  /**
   * 将日志数据转换为CSV格式
   * @param {Array} logs - 日志数据
   * @returns {string} CSV字符串
   */
  convertToCSV(logs) {
    if (!logs || logs.length === 0) return ''
    
    const headers = [
      'ID', '时间', '用户ID', '用户名', '操作类型', '操作描述', 
      '资源类型', '资源ID', '资源名称', '是否成功', 'IP地址', 
      '响应状态', '响应时间(ms)', '错误信息'
    ]
    
    const csvRows = [headers.join(',')]
    
    logs.forEach(log => {
      const row = [
        log.id,
        log.createdAt,
        log.userId || '',
        log.User?.username || '',
        log.operationType,
        `"${(log.operationDescription || '').replace(/"/g, '""')}"`,
        log.resource,
        log.resourceId || '',
        `"${(log.resourceName || '').replace(/"/g, '""')}"`,
        log.success ? '是' : '否',
        log.ip || '',
        log.responseStatus || '',
        log.responseTime || '',
        `"${(log.errorMessage || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }
  
  /**
   * 对操作类型进行分类
   * @param {string} operationType - 操作类型
   * @returns {string} 分类
   */
  categorizeOperationType(operationType) {
    if (operationType.includes('USER')) return '用户管理'
    if (operationType.includes('INTENT')) return '意图管理'
    if (operationType.includes('CATEGORY')) return '分类管理'
    if (operationType.includes('RESPONSE')) return '回复管理'
    if (operationType.includes('TEST')) return '测试功能'
    if (operationType.includes('DATA')) return '数据操作'
    if (operationType.includes('SYSTEM')) return '系统操作'
    if (operationType.includes('PERMISSION') || operationType.includes('ROLE')) return '权限管理'
    return '其他'
  }
}

module.exports = new AuditController()