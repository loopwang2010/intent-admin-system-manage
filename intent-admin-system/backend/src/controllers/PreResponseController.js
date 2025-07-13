const { PreResponse, CoreIntent, IntentCategory } = require('../models');
const { Op } = require('sequelize');

class PreResponseController {
  // 获取所有回复模板
  async getAllPreResponses(req, res) {
    try {
      const { page = 1, limit = 20, coreIntentId, search, status } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (coreIntentId) whereClause.coreIntentId = coreIntentId;
      if (status) whereClause.status = status;
      if (search) {
        whereClause[Op.or] = [
          { content: { [Op.like]: `%${search}%` } },
          { type: { [Op.like]: `%${search}%` } }
        ];
      }

      const { rows: preResponses, count } = await PreResponse.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: CoreIntent,
            attributes: ['id', 'name'],
            include: [
              {
                model: IntentCategory,
                attributes: ['id', 'name', 'icon']
              }
            ]
          }
        ],
        order: [['priority', 'DESC'], ['usageCount', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: '获取回复模板列表成功',
        data: preResponses,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('获取回复模板列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取回复模板列表失败',
        error: error.message
      });
    }
  }

  // 创建回复模板
  async createPreResponse(req, res) {
    try {
      const { content, type, coreIntentId, priority, variables } = req.body;

      // 验证核心意图是否存在
      const coreIntent = await CoreIntent.findByPk(coreIntentId);
      if (!coreIntent) {
        return res.status(400).json({
          success: false,
          message: '指定的核心意图不存在'
        });
      }

      const preResponse = await PreResponse.create({
        content,
        type: type || 'text',
        coreIntentId,
        priority: priority || 1,
        variables: JSON.stringify(variables || []),
        status: 'active',
        usageCount: 0
      });

      const result = await PreResponse.findByPk(preResponse.id, {
        include: [
          {
            model: CoreIntent,
            attributes: ['id', 'name'],
            include: [
              {
                model: IntentCategory,
                attributes: ['id', 'name', 'icon']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '创建回复模板成功',
        data: result
      });
    } catch (error) {
      console.error('创建回复模板失败:', error);
      res.status(500).json({
        success: false,
        message: '创建回复模板失败',
        error: error.message
      });
    }
  }

  // 更新回复模板
  async updatePreResponse(req, res) {
    try {
      const { id } = req.params;
      const { content, type, coreIntentId, priority, variables, status } = req.body;

      const preResponse = await PreResponse.findByPk(id);
      if (!preResponse) {
        return res.status(404).json({
          success: false,
          message: '回复模板不存在'
        });
      }

      // 如果更新核心意图，验证是否存在
      if (coreIntentId) {
        const coreIntent = await CoreIntent.findByPk(coreIntentId);
        if (!coreIntent) {
          return res.status(400).json({
            success: false,
            message: '指定的核心意图不存在'
          });
        }
      }

      await preResponse.update({
        content: content || preResponse.content,
        type: type || preResponse.type,
        coreIntentId: coreIntentId || preResponse.coreIntentId,
        priority: priority !== undefined ? priority : preResponse.priority,
        variables: variables ? JSON.stringify(variables) : preResponse.variables,
        status: status || preResponse.status
      });

      const result = await PreResponse.findByPk(id, {
        include: [
          {
            model: CoreIntent,
            attributes: ['id', 'name'],
            include: [
              {
                model: IntentCategory,
                attributes: ['id', 'name', 'icon']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        message: '更新回复模板成功',
        data: result
      });
    } catch (error) {
      console.error('更新回复模板失败:', error);
      res.status(500).json({
        success: false,
        message: '更新回复模板失败',
        error: error.message
      });
    }
  }

  // 删除回复模板
  async deletePreResponse(req, res) {
    try {
      const { id } = req.params;

      const preResponse = await PreResponse.findByPk(id);
      if (!preResponse) {
        return res.status(404).json({
          success: false,
          message: '回复模板不存在'
        });
      }

      await preResponse.destroy();

      res.json({
        success: true,
        message: '删除回复模板成功'
      });
    } catch (error) {
      console.error('删除回复模板失败:', error);
      res.status(500).json({
        success: false,
        message: '删除回复模板失败',
        error: error.message
      });
    }
  }

  // 批量更新模板状态
  async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的模板ID列表'
        });
      }

      const result = await PreResponse.update(
        { status },
        {
          where: {
            id: { [Op.in]: ids }
          }
        }
      );

      res.json({
        success: true,
        message: `批量更新 ${result[0]} 个回复模板状态成功`,
        updatedCount: result[0]
      });
    } catch (error) {
      console.error('批量更新状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新状态失败',
        error: error.message
      });
    }
  }

  // 获取模板详情
  async getPreResponseDetail(req, res) {
    try {
      const { id } = req.params;

      const preResponse = await PreResponse.findByPk(id, {
        include: [
          {
            model: CoreIntent,
            attributes: ['id', 'name'],
            include: [
              {
                model: IntentCategory,
                attributes: ['id', 'name', 'icon']
              }
            ]
          }
        ]
      });

      if (!preResponse) {
        return res.status(404).json({
          success: false,
          message: '回复模板不存在'
        });
      }

      res.json({
        success: true,
        message: '获取回复模板详情成功',
        data: preResponse
      });
    } catch (error) {
      console.error('获取回复模板详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取回复模板详情失败',
        error: error.message
      });
    }
  }

  // 根据核心意图获取回复模板
  async getResponsesByCoreIntent(req, res) {
    try {
      const { coreIntentId } = req.params;
      const { status = 'active' } = req.query;

      const responses = await PreResponse.findAll({
        where: {
          coreIntentId,
          status
        },
        order: [['priority', 'DESC'], ['usageCount', 'DESC']]
      });

      res.json({
        success: true,
        message: '获取意图回复模板成功',
        data: responses
      });
    } catch (error) {
      console.error('获取意图回复模板失败:', error);
      res.status(500).json({
        success: false,
        message: '获取意图回复模板失败',
        error: error.message
      });
    }
  }

  // 模板使用统计
  async getUsageStats(req, res) {
    try {
      const stats = await PreResponse.findAll({
        attributes: [
          'id',
          'content',
          'type',
          'usageCount',
          'lastUsedAt'
        ],
        include: [
          {
            model: CoreIntent,
            attributes: ['id', 'name']
          }
        ],
        order: [['usageCount', 'DESC']],
        limit: 20
      });

      res.json({
        success: true,
        message: '获取使用统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取使用统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取使用统计失败',
        error: error.message
      });
    }
  }
}

module.exports = new PreResponseController(); 