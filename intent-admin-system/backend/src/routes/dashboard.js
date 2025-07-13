const express = require('express');
const router = express.Router();

// 简单的占位符处理器
const getStats = (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      totalIntents: 0, 
      totalTests: 0, 
      successRate: 0,
      categories: 0
    } 
  });
};

router.get('/stats', getStats);

module.exports = router; 