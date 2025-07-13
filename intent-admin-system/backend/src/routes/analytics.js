const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// 获取仪表板统计
router.get('/dashboard', analyticsController.getDashboardStats);

// 获取意图统计
router.get('/intents', analyticsController.getIntentStats);

// 获取用户统计
router.get('/users', analyticsController.getUserStats);

// 导出报告
router.get('/export', analyticsController.exportReport);

module.exports = router; 