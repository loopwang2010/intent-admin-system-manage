const { sequelize, IntentCategory, CoreIntent, NonCoreIntent, PreResponse } = require('../models');

class DashboardController {
  // 获取仪表板统计数据
  async getDashboardStats(req, res) {
    try {
      const [
        categoriesCount,
        coreIntentsCount,
        nonCoreIntentsCount,
        responsesCount,
        activeCoreIntents,
        activeNonCoreIntents,
        categoryStats
      ] = await Promise.all([
        IntentCategory.count({ where: { status: 'active' } }),
        CoreIntent.count(),
        NonCoreIntent.count(),
        PreResponse.count(),
        CoreIntent.count({ where: { status: 'active' } }),
        NonCoreIntent.count({ where: { status: 'active' } }),
        this.getCategoryStatistics()
      ]);

      // 计算使用率
      const coreIntentUsageRate = coreIntentsCount > 0 ? (activeCoreIntents / coreIntentsCount * 100).toFixed(1) : 0;
      const nonCoreIntentUsageRate = nonCoreIntentsCount > 0 ? (activeNonCoreIntents / nonCoreIntentsCount * 100).toFixed(1) : 0;

      res.json({
        success: true,
        message: '获取仪表板统计成功',
        data: {
          overview: {
            totalCategories: categoriesCount,
            totalCoreIntents: coreIntentsCount,
            totalNonCoreIntents: nonCoreIntentsCount,
            totalResponses: responsesCount,
            activeCoreIntents,
            activeNonCoreIntents,
            coreIntentUsageRate: parseFloat(coreIntentUsageRate),
            nonCoreIntentUsageRate: parseFloat(nonCoreIntentUsageRate)
          },
          categoryStats,
          systemHealth: {
            database: 'connected',
            responseTime: Date.now() - req.startTime,
            uptime: process.uptime()
          }
        }
      });
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取仪表板统计失败',
        error: error.message
      });
    }
  }

  // 获取分类统计
  async getCategoryStatistics() {
    try {
      const categoryStats = await IntentCategory.findAll({
        attributes: [
          'id',
          'name',
          'icon',
          [sequelize.literal('(SELECT COUNT(*) FROM core_intents WHERE core_intents.categoryId = IntentCategory.id)'), 'coreIntentsCount'],
          [sequelize.literal('(SELECT COUNT(*) FROM non_core_intents WHERE non_core_intents.categoryId = IntentCategory.id)'), 'nonCoreIntentsCount']
        ],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      return categoryStats.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        coreIntentsCount: parseInt(category.getDataValue('coreIntentsCount')) || 0,
        nonCoreIntentsCount: parseInt(category.getDataValue('nonCoreIntentsCount')) || 0,
        totalIntents: (parseInt(category.getDataValue('coreIntentsCount')) || 0) + (parseInt(category.getDataValue('nonCoreIntentsCount')) || 0)
      }));
    } catch (error) {
      console.error('获取分类统计失败:', error);
      return [];
    }
  }

  // 获取最近活动
  async getRecentActivities(req, res) {
    try {
      const { limit = 10 } = req.query;

      // 获取最近创建的意图
      const recentCoreIntents = await CoreIntent.findAll({
        include: [
          {
            model: IntentCategory,
            attributes: ['name', 'icon']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit) / 2,
        attributes: ['id', 'name', 'createdAt']
      });

      const recentNonCoreIntents = await NonCoreIntent.findAll({
        include: [
          {
            model: IntentCategory,
            attributes: ['name', 'icon']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit) / 2,
        attributes: ['id', 'name', 'createdAt']
      });

      // 合并并排序
      const activities = [
        ...recentCoreIntents.map(intent => ({
          type: 'core_intent',
          id: intent.id,
          name: intent.name,
          category: intent.IntentCategory?.name,
          icon: intent.IntentCategory?.icon,
          createdAt: intent.createdAt
        })),
        ...recentNonCoreIntents.map(intent => ({
          type: 'non_core_intent',
          id: intent.id,
          name: intent.name,
          category: intent.IntentCategory?.name,
          icon: intent.IntentCategory?.icon,
          createdAt: intent.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, parseInt(limit));

      res.json({
        success: true,
        message: '获取最近活动成功',
        data: activities
      });
    } catch (error) {
      console.error('获取最近活动失败:', error);
      res.status(500).json({
        success: false,
        message: '获取最近活动失败',
        error: error.message
      });
    }
  }

  // 获取热门意图
  async getPopularIntents(req, res) {
    try {
      const { limit = 10 } = req.query;

      const popularCoreIntents = await CoreIntent.findAll({
        include: [
          {
            model: IntentCategory,
            attributes: ['name', 'icon']
          }
        ],
        order: [['usageCount', 'DESC'], ['name', 'ASC']],
        limit: parseInt(limit),
        attributes: ['id', 'name', 'usageCount', 'lastUsedAt']
      });

      const popularNonCoreIntents = await NonCoreIntent.findAll({
        include: [
          {
            model: IntentCategory,
            attributes: ['name', 'icon']
          }
        ],
        order: [['usageCount', 'DESC'], ['name', 'ASC']],
        limit: parseInt(limit),
        attributes: ['id', 'name', 'usageCount', 'lastUsedAt']
      });

      res.json({
        success: true,
        message: '获取热门意图成功',
        data: {
          coreIntents: popularCoreIntents.map(intent => ({
            id: intent.id,
            name: intent.name,
            usageCount: intent.usageCount,
            lastUsedAt: intent.lastUsedAt,
            category: intent.IntentCategory?.name,
            icon: intent.IntentCategory?.icon
          })),
          nonCoreIntents: popularNonCoreIntents.map(intent => ({
            id: intent.id,
            name: intent.name,
            usageCount: intent.usageCount,
            lastUsedAt: intent.lastUsedAt,
            category: intent.IntentCategory?.name,
            icon: intent.IntentCategory?.icon
          }))
        }
      });
    } catch (error) {
      console.error('获取热门意图失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门意图失败',
        error: error.message
      });
    }
  }

  // 获取系统性能指标
  async getPerformanceMetrics(req, res) {
    try {
      const dbStartTime = Date.now();
      await sequelize.authenticate();
      const dbResponseTime = Date.now() - dbStartTime;

      const memoryUsage = process.memoryUsage();

      const metrics = {
        database: {
          responseTime: dbResponseTime,
          status: 'connected'
        },
        system: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
          },
          nodeVersion: process.version,
          platform: process.platform
        },
        application: {
          requestCount: req.app.locals.requestCount || 0,
          errorCount: req.app.locals.errorCount || 0,
          averageResponseTime: req.app.locals.averageResponseTime || 0
        }
      };

      res.json({
        success: true,
        message: '获取性能指标成功',
        data: metrics
      });
    } catch (error) {
      console.error('获取性能指标失败:', error);
      res.status(500).json({
        success: false,
        message: '获取性能指标失败',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController(); 