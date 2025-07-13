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

// 获取分类树结构
router.get('/tree', 
  requirePermission(['category:read', '*']),
  categoryController.getCategoryTree
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

// 获取父分类选项 - 必须在 /:id 路由之前
router.get('/parents', 
  requirePermission(['category:read', '*']),
  categoryController.getParentOptions
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

// 获取分类面包屑路径
router.get('/:id/breadcrumb', 
  requirePermission(['category:read', '*']),
  categoryController.getCategoryBreadcrumb
);

// 获取分类的回复内容
router.get('/:id/responses', 
  requirePermission(['category:read', 'response:read', '*']),
  categoryController.getCategoryResponses
);

// 获取AI推荐回复内容
router.get('/:id/responses/recommendations', 
  requirePermission(['category:read', 'response:read', '*']),
  categoryController.getAIRecommendedResponses
);

// 添加分类回复内容
router.post('/:id/responses', 
  requirePermission(['category:update', 'response:create', '*']),
  categoryController.addCategoryResponse
);

// 批量更新分类回复内容
router.put('/:id/responses/batch', 
  requirePermission(['category:update', 'response:update', '*']),
  categoryController.batchUpdateCategoryResponses
);

// 获取子分类列表
router.get('/:id/children', 
  requirePermission(['category:read', '*']),
  categoryController.getChildCategories
);

// 更新单个分类回复内容
router.put('/:id/responses/:responseId', 
  requirePermission(['category:update', 'response:update', '*']),
  categoryController.updateCategoryResponse
);

// 删除分类回复内容
router.delete('/:id/responses/:responseId', 
  requirePermission(['category:update', 'response:delete', '*']),
  categoryController.deleteCategoryResponse
);

// 移动分类到新父分类
router.put('/:id/move', 
  requirePermission(['category:update', '*']),
  categoryController.moveCategory
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