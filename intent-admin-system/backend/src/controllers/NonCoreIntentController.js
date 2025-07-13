const { NonCoreIntent, IntentCategory } = require('../models');
const { Op } = require('sequelize');

class NonCoreIntentController {
  // 获取所有非核心意图
  async getAllNonCoreIntents(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        categoryId, 
        search, 
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const whereClause = {};
      if (categoryId) whereClause.categoryId = categoryId;
      if (status) whereClause.status = status;
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { nameEn: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { descriptionEn: { [Op.like]: `%${search}%` } }
        ];
      }

      const { rows: nonCoreIntents, count } = await NonCoreIntent.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: IntentCategory,
            as: 'Category',
            attributes: ['id', 'name', 'nameEn', 'icon']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: '获取非核心意图列表成功',
        data: nonCoreIntents,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('获取非核心意图列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取非核心意图列表失败',
        error: error.message
      });
    }
  }

  // 创建非核心意图
  async createNonCoreIntent(req, res) {
    try {
      const { 
        name, 
        nameEn,
        description, 
        descriptionEn,
        categoryId, 
        keywords, 
        keywordsEn,
        confidence, 
        priority,
        response,
        responseEn,
        firstResponse,
        firstResponseEn,
        responseVariables,
        responseType = 'immediate',
        tags,
        version = '1.0.0',
        language = 'zh-CN'
      } = req.body;

      // 验证必填字段
      if (!name || !categoryId) {
        return res.status(400).json({
          success: false,
          message: '意图名称和分类为必填项'
        });
      }

      // 检查意图名是否已存在
      const existingIntent = await NonCoreIntent.findOne({
        where: { name }
      });

      if (existingIntent) {
        return res.status(400).json({
          success: false,
          message: '意图名称已存在'
        });
      }

      // 验证分类是否存在
      const category = await IntentCategory.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: '指定的分类不存在'
        });
      }

      const nonCoreIntent = await NonCoreIntent.create({
        name,
        nameEn,
        description,
        descriptionEn,
        categoryId,
        keywords: keywords || [],
        keywordsEn: keywordsEn || [],
        confidence: confidence || 0.6,
        priority: priority || 1,
        response,
        responseEn,
        firstResponse,
        firstResponseEn,
        responseVariables: responseVariables || [],
        responseType,
        tags: tags || [],
        version,
        language,
        status: 'active',
        usageCount: 0,
        successCount: 0,
        createdBy: req.user?.id
      });

      const result = await NonCoreIntent.findByPk(nonCoreIntent.id, {
        include: [
          {
            model: IntentCategory,
            attributes: ['id', 'name', 'icon']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '创建非核心意图成功',
        data: result
      });
    } catch (error) {
      console.error('创建非核心意图失败:', error);
      res.status(500).json({
        success: false,
        message: '创建非核心意图失败',
        error: error.message
      });
    }
  }

  // 更新非核心意图
  async updateNonCoreIntent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const nonCoreIntent = await NonCoreIntent.findByPk(id);
      if (!nonCoreIntent) {
        return res.status(404).json({
          success: false,
          message: '非核心意图不存在'
        });
      }

      // 如果更新分类，验证分类是否存在
      if (updateData.categoryId && updateData.categoryId !== nonCoreIntent.categoryId) {
        const category = await IntentCategory.findByPk(updateData.categoryId);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: '指定的分类不存在'
          });
        }
      }

      // 过滤掉不应该更新的字段
      const allowedFields = [
        'name', 'nameEn', 'description', 'descriptionEn', 'categoryId',
        'keywords', 'keywordsEn', 'confidence', 'priority', 'response',
        'responseEn', 'firstResponse', 'firstResponseEn', 'responseVariables',
        'responseType', 'tags', 'status', 'language'
      ];
      
      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          filteredData[field] = updateData[field];
        }
      });
      
      filteredData.updatedBy = req.user?.id;

      await nonCoreIntent.update(filteredData);

      const result = await NonCoreIntent.findByPk(id, {
        include: [
          {
            model: IntentCategory,
            attributes: ['id', 'name', 'icon']
          }
        ]
      });

      res.json({
        success: true,
        message: '更新非核心意图成功',
        data: result
      });
    } catch (error) {
      console.error('更新非核心意图失败:', error);
      res.status(500).json({
        success: false,
        message: '更新非核心意图失败',
        error: error.message
      });
    }
  }

  // 删除非核心意图
  async deleteNonCoreIntent(req, res) {
    try {
      const { id } = req.params;

      const nonCoreIntent = await NonCoreIntent.findByPk(id);
      if (!nonCoreIntent) {
        return res.status(404).json({
          success: false,
          message: '非核心意图不存在'
        });
      }

      await nonCoreIntent.destroy();

      res.json({
        success: true,
        message: '删除非核心意图成功'
      });
    } catch (error) {
      console.error('删除非核心意图失败:', error);
      res.status(500).json({
        success: false,
        message: '删除非核心意图失败',
        error: error.message
      });
    }
  }

  // 批量更新意图状态
  async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的意图ID列表'
        });
      }

      const result = await NonCoreIntent.update(
        { status },
        {
          where: {
            id: { [Op.in]: ids }
          }
        }
      );

      res.json({
        success: true,
        message: `批量更新 ${result[0]} 个非核心意图状态成功`,
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

  // 获取意图详情
  async getNonCoreIntentDetail(req, res) {
    try {
      const { id } = req.params;

      const nonCoreIntent = await NonCoreIntent.findByPk(id, {
        include: [
          {
            model: IntentCategory,
            attributes: ['id', 'name', 'icon']
          }
        ]
      });

      if (!nonCoreIntent) {
        return res.status(404).json({
          success: false,
          message: '非核心意图不存在'
        });
      }

      res.json({
        success: true,
        message: '获取非核心意图详情成功',
        data: nonCoreIntent
      });
    } catch (error) {
      console.error('获取非核心意图详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取非核心意图详情失败',
        error: error.message
      });
    }
  }

  // 获取非核心意图的首句回复
  async getFirstResponse(req, res) {
    try {
      const { id } = req.params;
      const { language = 'zh' } = req.query;

      const intent = await NonCoreIntent.findByPk(id, {
        attributes: ['id', 'name', 'firstResponse', 'firstResponseEn', 'responseVariables', 'responseType']
      });

      if (!intent) {
        return res.status(404).json({
          success: false,
          message: '非核心意图不存在'
        });
      }

      const responseContent = language === 'en' ? intent.firstResponseEn : intent.firstResponse;

      res.json({
        success: true,
        data: {
          intentId: intent.id,
          intentName: intent.name,
          response: responseContent,
          variables: intent.responseVariables || [],
          responseType: intent.responseType
        }
      });
    } catch (error) {
      console.error('获取首句回复失败:', error);
      res.status(500).json({
        success: false,
        message: '获取首句回复失败',
        error: error.message
      });
    }
  }

  // 更新非核心意图的首句回复
  async updateFirstResponse(req, res) {
    try {
      const { id } = req.params;
      const { firstResponse, firstResponseEn, responseVariables, responseType } = req.body;

      const intent = await NonCoreIntent.findByPk(id);
      if (!intent) {
        return res.status(404).json({
          success: false,
          message: '非核心意图不存在'
        });
      }

      await intent.update({
        firstResponse,
        firstResponseEn,
        responseVariables: responseVariables || [],
        responseType: responseType || 'immediate'
      });

      res.json({
        success: true,
        message: '更新首句回复成功',
        data: {
          intentId: intent.id,
          firstResponse: intent.firstResponse,
          firstResponseEn: intent.firstResponseEn,
          responseVariables: intent.responseVariables,
          responseType: intent.responseType
        }
      });
    } catch (error) {
      console.error('更新首句回复失败:', error);
      res.status(500).json({
        success: false,
        message: '更新首句回复失败',
        error: error.message
      });
    }
  }

  // 获取非核心意图统计数据
  async getStatistics(req, res) {
    try {
      const totalCount = await NonCoreIntent.count();
      const activeCount = await NonCoreIntent.count({
        where: { status: 'active' }
      });
      
      // 暂时不统计firstResponse相关数据，因为表中没有这个字段
      const withFirstResponseCount = 0;

      const avgConfidenceResult = await NonCoreIntent.findOne({
        attributes: [
          [NonCoreIntent.sequelize.fn('AVG', NonCoreIntent.sequelize.col('confidence')), 'avgConfidence']
        ]
      });

      const avgConfidence = parseFloat(avgConfidenceResult?.dataValues?.avgConfidence || 0) * 100;

      // 按分类统计
      const categoryStats = await NonCoreIntent.findAll({
        attributes: [
          'categoryId',
          [NonCoreIntent.sequelize.fn('COUNT', NonCoreIntent.sequelize.col('NonCoreIntent.id')), 'count']
        ],
        include: [
          {
            model: IntentCategory,
            as: 'Category',
            attributes: ['name', 'nameEn']
          }
        ],
        group: ['categoryId', 'Category.id']
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalCount,
            activeCount,
            inactiveCount: totalCount - activeCount,
            withFirstResponseCount,
            avgConfidence: Math.round(avgConfidence * 10) / 10
          },
          categoryStats
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        error: error.message
      });
    }
  }

  // 批量操作
  async batchOperation(req, res) {
    try {
      const { operation, ids, data = {} } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的意图ID列表'
        });
      }

      let result;
      switch (operation) {
        case 'updateStatus':
          result = await NonCoreIntent.update(
            { status: data.status, updatedBy: req.user?.id },
            { where: { id: { [Op.in]: ids } } }
          );
          break;
        case 'updateCategory':
          result = await NonCoreIntent.update(
            { categoryId: data.categoryId, updatedBy: req.user?.id },
            { where: { id: { [Op.in]: ids } } }
          );
          break;
        case 'updateTags':
          result = await NonCoreIntent.update(
            { tags: data.tags, updatedBy: req.user?.id },
            { where: { id: { [Op.in]: ids } } }
          );
          break;
        case 'delete':
          result = await NonCoreIntent.destroy({
            where: { id: { [Op.in]: ids } }
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: '不支持的操作类型'
          });
      }

      res.json({
        success: true,
        message: `批量${operation}操作成功`,
        affectedRows: result[0] || result
      });
    } catch (error) {
      console.error('批量操作失败:', error);
      res.status(500).json({
        success: false,
        message: '批量操作失败',
        error: error.message
      });
    }
  }

  // 导出数据
  async exportData(req, res) {
    try {
      const { format = 'json', categoryId, status } = req.query;
      
      const whereClause = {};
      if (categoryId) whereClause.categoryId = categoryId;
      if (status) whereClause.status = status;

      const intents = await NonCoreIntent.findAll({
        where: whereClause,
        include: [
          {
            model: IntentCategory,
            as: 'Category',
            attributes: ['id', 'name', 'nameEn']
          }
        ]
      });

      if (format === 'csv') {
        // 生成CSV格式
        const csvHeaders = ['ID', '名称', '英文名称', '描述', '分类', '关键词', '置信度', '状态'];
        const csvRows = intents.map(intent => [
          intent.id,
          intent.name,
          intent.nameEn || '',
          intent.description || '',
          intent.Category?.name || '',
          (intent.keywords || []).join(';'),
          intent.confidence,
          intent.status
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="non_core_intents.csv"');
        res.send(csvContent);
      } else {
        // 默认JSON格式
        res.json({
          success: true,
          data: intents,
          total: intents.length,
          exportTime: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      res.status(500).json({
        success: false,
        message: '导出数据失败',
        error: error.message
      });
    }
  }

  // 导入数据
  async importData(req, res) {
    try {
      const { intents, mode = 'create' } = req.body;

      if (!Array.isArray(intents) || intents.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的意图数据'
        });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const intentData of intents) {
        try {
          if (mode === 'update') {
            // 尝试更新现有记录
            const existing = await NonCoreIntent.findOne({
              where: { name: intentData.name }
            });
            
            if (existing) {
              await existing.update({
                ...intentData,
                updatedBy: req.user?.id
              });
              results.success++;
            } else if (mode === 'create_if_not_exists') {
              await NonCoreIntent.create({
                ...intentData,
                createdBy: req.user?.id
              });
              results.success++;
            } else {
              results.failed++;
              results.errors.push(`意图 "${intentData.name}" 不存在`);
            }
          } else {
            // 创建新记录
            await NonCoreIntent.create({
              ...intentData,
              createdBy: req.user?.id
            });
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`处理意图 "${intentData.name}" 失败: ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `导入完成，成功: ${results.success}，失败: ${results.failed}`,
        data: results
      });
    } catch (error) {
      console.error('导入数据失败:', error);
      res.status(500).json({
        success: false,
        message: '导入数据失败',
        error: error.message
      });
    }
  }

  // AI功能 - 关键词推荐
  async suggestKeywords(req, res) {
    try {
      const { name, description, categoryId } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '请提供意图名称'
        });
      }

      // 简单的关键词推荐逻辑
      const suggestedKeywords = [];
      
      // 从名称中提取关键词
      const nameWords = name.split(/\s+/).filter(word => word.length > 1);
      suggestedKeywords.push(...nameWords);
      
      // 从描述中提取关键词
      if (description) {
        const descWords = description.split(/\s+/).filter(word => word.length > 2);
        suggestedKeywords.push(...descWords.slice(0, 3));
      }

      // 根据分类推荐相关关键词
      if (categoryId) {
        const category = await IntentCategory.findByPk(categoryId);
        if (category) {
          // 查找同分类下的其他意图的常用关键词
          const relatedIntents = await NonCoreIntent.findAll({
            where: { categoryId },
            limit: 10,
            order: [['usageCount', 'DESC']]
          });

          const commonKeywords = [];
          relatedIntents.forEach(intent => {
            if (intent.keywords) {
              commonKeywords.push(...intent.keywords);
            }
          });

          // 统计关键词频率
          const keywordFreq = {};
          commonKeywords.forEach(keyword => {
            keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
          });

          // 添加高频关键词
          const frequentKeywords = Object.entries(keywordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([keyword]) => keyword);
          
          suggestedKeywords.push(...frequentKeywords);
        }
      }

      // 去重并限制数量
      const uniqueKeywords = [...new Set(suggestedKeywords)].slice(0, 8);

      res.json({
        success: true,
        data: {
          suggestedKeywords: uniqueKeywords,
          total: uniqueKeywords.length
        }
      });
    } catch (error) {
      console.error('关键词推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '关键词推荐失败',
        error: error.message
      });
    }
  }

  // AI功能 - 意图冲突检测
  async detectConflicts(req, res) {
    try {
      const { threshold = 0.8 } = req.query;

      const allIntents = await NonCoreIntent.findAll({
        where: { status: 'active' },
        attributes: ['id', 'name', 'keywords', 'categoryId']
      });

      const conflicts = [];

      // 简单的冲突检测逻辑
      for (let i = 0; i < allIntents.length; i++) {
        for (let j = i + 1; j < allIntents.length; j++) {
          const intent1 = allIntents[i];
          const intent2 = allIntents[j];

          const keywords1 = intent1.keywords || [];
          const keywords2 = intent2.keywords || [];

          if (keywords1.length === 0 || keywords2.length === 0) continue;

          // 计算关键词重叠度
          const commonKeywords = keywords1.filter(k1 => 
            keywords2.some(k2 => k2.toLowerCase() === k1.toLowerCase())
          );

          const similarity = commonKeywords.length / Math.min(keywords1.length, keywords2.length);

          if (similarity >= threshold) {
            conflicts.push({
              intent1: {
                id: intent1.id,
                name: intent1.name,
                keywords: keywords1
              },
              intent2: {
                id: intent2.id,
                name: intent2.name,
                keywords: keywords2
              },
              similarity: Math.round(similarity * 100) / 100,
              commonKeywords,
              riskLevel: similarity >= 0.9 ? 'high' : similarity >= 0.7 ? 'medium' : 'low'
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          conflicts,
          total: conflicts.length,
          riskLevels: {
            high: conflicts.filter(c => c.riskLevel === 'high').length,
            medium: conflicts.filter(c => c.riskLevel === 'medium').length,
            low: conflicts.filter(c => c.riskLevel === 'low').length
          }
        }
      });
    } catch (error) {
      console.error('意图冲突检测失败:', error);
      res.status(500).json({
        success: false,
        message: '意图冲突检测失败',
        error: error.message
      });
    }
  }
}

module.exports = new NonCoreIntentController(); 