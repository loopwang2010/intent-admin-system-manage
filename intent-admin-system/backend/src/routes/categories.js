const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, requirePermission } = require('../middleware/auth');

// 应用认证中间件
router.use(authenticate);

// 获取所有分类
router.get('/', 
  requirePermission(['category:read', '*']),
  categoryController.getList
);

// 获取分类分析数据
router.get('/analytics', 
  requirePermission(['category:read', 'analytics:read', '*']),
  categoryController.getCategoryAnalytics
);

// 导出分类数据
router.get('/export', 
  requirePermission(['category:read', 'data:export', '*']),
  categoryController.export
);

// 创建新分类
router.post('/', 
  requirePermission(['category:create', '*']),
  categoryController.create
);

// 导入分类数据
router.post('/import', 
  requirePermission(['category:create', 'data:import', '*']),
  categoryController.import
);

// 批量操作
router.post('/batch', 
  requirePermission(['category:update', 'category:delete', '*']),
  categoryController.batchOperation
);

// 更新排序
router.put('/sort', 
  requirePermission(['category:update', '*']),
  categoryController.updateSort
);

// 获取分类详情
router.get('/:id', 
  requirePermission(['category:read', '*']),
  categoryController.getById
);

// 获取分类统计
router.get('/:id/stats', 
  requirePermission(['category:read', 'analytics:read', '*']),
  categoryController.getStats
);

// 获取分类趋势
router.get('/:id/trends', 
  requirePermission(['category:read', 'analytics:read', '*']),
  categoryController.getCategoryTrends
);

// 分析分类意图
router.post('/:id/analyze', 
  requirePermission(['category:read', 'analytics:read', '*']),
  categoryController.analyzeCategoryIntents
);

// 更新分类
router.put('/:id', 
  requirePermission(['category:update', '*']),
  categoryController.update
);

// 删除分类
router.delete('/:id', 
  requirePermission(['category:delete', '*']),
  categoryController.delete
);

module.exports = router; 