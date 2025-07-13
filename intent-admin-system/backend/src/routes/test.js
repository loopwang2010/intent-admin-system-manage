const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// 测试意图识别
router.post('/intent', testController.testIntent);

// 批量测试
router.post('/batch', testController.batchTest);

// 获取测试历史
router.get('/history', testController.getTestHistory);

// 删除测试记录
router.delete('/:id', testController.deleteTestRecord);

module.exports = router; 