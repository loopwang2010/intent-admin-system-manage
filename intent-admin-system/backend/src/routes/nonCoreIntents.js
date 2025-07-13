const express = require('express');
const router = express.Router();
const nonCoreIntentController = require('../controllers/NonCoreIntentController');
const { authenticate, requirePermission } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 基础CRUD路由
router.get('/', nonCoreIntentController.getAllNonCoreIntents);
router.get('/statistics', nonCoreIntentController.getStatistics);
router.get('/:id', nonCoreIntentController.getNonCoreIntentDetail);
router.post('/', nonCoreIntentController.createNonCoreIntent);
router.put('/:id', nonCoreIntentController.updateNonCoreIntent);
router.delete('/:id', nonCoreIntentController.deleteNonCoreIntent);

// 批量操作
router.patch('/batch/status', nonCoreIntentController.batchUpdateStatus);
router.post('/batch', nonCoreIntentController.batchOperation);

// 首句回复相关路由
router.get('/:id/first-response', nonCoreIntentController.getFirstResponse);
router.put('/:id/first-response', nonCoreIntentController.updateFirstResponse);

// 数据导入导出
router.get('/export/data', nonCoreIntentController.exportData);
router.post('/import/data', nonCoreIntentController.importData);

// AI功能
router.post('/ai/suggest-keywords', nonCoreIntentController.suggestKeywords);
router.get('/ai/detect-conflicts', nonCoreIntentController.detectConflicts);

module.exports = router; 