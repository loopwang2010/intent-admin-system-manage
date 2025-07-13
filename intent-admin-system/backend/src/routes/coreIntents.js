const express = require('express')
const router = express.Router()
const coreIntentController = require('../controllers/coreIntentController')
const { authenticate, requirePermission } = require('../middleware/auth')

// 应用认证中间件
router.use(authenticate)

// 基础CRUD路由
router.get('/', 
  requirePermission(['intent:read', '*']),
  coreIntentController.getList
)
router.get('/:id', 
  requirePermission(['intent:read', '*']),
  coreIntentController.getById
)
router.post('/', 
  requirePermission(['intent:create', '*']),
  coreIntentController.create
)
router.put('/:id', 
  requirePermission(['intent:update', '*']),
  coreIntentController.update
)
router.delete('/:id', 
  requirePermission(['intent:delete', '*']),
  coreIntentController.delete
)

// 首句回复路由
router.get('/:id/first-response', 
  requirePermission(['intent:read', '*']),
  coreIntentController.getFirstResponse
)
router.put('/:id/first-response', 
  requirePermission(['intent:update', '*']),
  coreIntentController.updateFirstResponse
)

// 批量操作路由
router.post('/batch', 
  requirePermission(['intent:update', 'intent:delete', '*']),
  coreIntentController.batchOperation
)

// 排序路由
router.put('/sort/update', coreIntentController.updateSort)

// AI功能路由
router.post('/ai/suggest-keywords', coreIntentController.suggestKeywords)
router.get('/ai/detect-conflicts', coreIntentController.detectConflicts)
router.get('/:id/ai/semantics', coreIntentController.analyzeSemantics)

// 数据导入导出路由
router.get('/export/data', coreIntentController.exportData)
router.post('/import/data', coreIntentController.importData)

module.exports = router 