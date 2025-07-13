const { CoreIntent, NonCoreIntent, IntentCategory, PreResponse } = require('../models');
const { Op } = require('sequelize');

class IntentTestController {
  // 意图识别测试
  async testIntent(req, res) {
    try {
      const { text, confidence = 0.6 } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要测试的文本'
        });
      }

      // 模拟意图识别算法
      const results = await this.performIntentRecognition(text, confidence);

      // 更新使用次数
      if (results.matched.length > 0) {
        await this.updateUsageCount(results.matched[0]);
      }

      res.json({
        success: true,
        message: '意图识别测试完成',
        data: {
          inputText: text,
          confidence: confidence,
          timestamp: new Date(),
          results
        }
      });
    } catch (error) {
      console.error('意图识别测试失败:', error);
      res.status(500).json({
        success: false,
        message: '意图识别测试失败',
        error: error.message
      });
    }
  }

  // 执行意图识别
  async performIntentRecognition(text, minConfidence) {
    const searchText = text.toLowerCase();
    
    // 搜索核心意图
    const coreIntents = await CoreIntent.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: IntentCategory,
          attributes: ['id', 'name', 'icon']
        },
        {
          model: PreResponse,
          attributes: ['id', 'content', 'type', 'priority'],
          where: { status: 'active' },
          required: false,
          order: [['priority', 'DESC']]
        }
      ]
    });

    // 搜索非核心意图
    const nonCoreIntents = await NonCoreIntent.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: IntentCategory,
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    const matched = [];
    const candidates = [];

    // 检查核心意图
    for (const intent of coreIntents) {
      const confidence = this.calculateConfidence(searchText, intent);
      const result = {
        type: 'core',
        id: intent.id,
        name: intent.name,
        description: intent.description,
        confidence: confidence,
        category: intent.IntentCategory,
        responses: intent.PreResponses || []
      };

      if (confidence >= minConfidence) {
        matched.push(result);
      } else if (confidence > 0.3) {
        candidates.push(result);
      }
    }

    // 检查非核心意图
    for (const intent of nonCoreIntents) {
      const confidence = this.calculateConfidence(searchText, intent);
      const result = {
        type: 'non_core',
        id: intent.id,
        name: intent.name,
        description: intent.description,
        confidence: confidence,
        category: intent.IntentCategory,
        responses: []
      };

      if (confidence >= minConfidence) {
        matched.push(result);
      } else if (confidence > 0.3) {
        candidates.push(result);
      }
    }

    // 按置信度排序
    matched.sort((a, b) => b.confidence - a.confidence);
    candidates.sort((a, b) => b.confidence - a.confidence);

    return {
      matched: matched.slice(0, 5), // 最多返回5个匹配结果
      candidates: candidates.slice(0, 10) // 最多返回10个候选结果
    };
  }

  // 计算置信度
  calculateConfidence(text, intent) {
    let confidence = 0;
    const intentName = intent.name.toLowerCase();
    const intentDesc = (intent.description || '').toLowerCase();
    
    // 解析关键词
    let keywords = [];
    try {
      keywords = JSON.parse(intent.keywords || '[]');
    } catch (e) {
      keywords = [];
    }

    // 名称完全匹配
    if (text === intentName) {
      confidence = Math.max(confidence, 0.95);
    }
    // 名称包含匹配
    else if (text.includes(intentName) || intentName.includes(text)) {
      confidence = Math.max(confidence, 0.8);
    }

    // 描述匹配
    if (intentDesc && (text.includes(intentDesc) || intentDesc.includes(text))) {
      confidence = Math.max(confidence, 0.7);
    }

    // 关键词匹配
    if (keywords.length > 0) {
      let keywordMatches = 0;
      for (const keyword of keywords) {
        if (typeof keyword === 'string' && text.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
      if (keywordMatches > 0) {
        const keywordConfidence = Math.min(0.9, 0.4 + (keywordMatches / keywords.length) * 0.5);
        confidence = Math.max(confidence, keywordConfidence);
      }
    }

    // 模糊匹配
    if (confidence < 0.5) {
      const similarity = this.calculateStringSimilarity(text, intentName);
      if (similarity > 0.6) {
        confidence = Math.max(confidence, similarity * 0.6);
      }
    }

    return Math.round(confidence * 100) / 100;
  }

  // 计算字符串相似度
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // 计算编辑距离
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 更新使用次数
  async updateUsageCount(result) {
    try {
      if (result.type === 'core') {
        await CoreIntent.update(
          { 
            usageCount: require('sequelize').literal('usageCount + 1'),
            lastUsedAt: new Date()
          },
          { where: { id: result.id } }
        );
      } else if (result.type === 'non_core') {
        await NonCoreIntent.update(
          {
            usageCount: require('sequelize').literal('usageCount + 1'),
            lastUsedAt: new Date()
          },
          { where: { id: result.id } }
        );
      }
    } catch (error) {
      console.error('更新使用次数失败:', error);
    }
  }

  // 批量测试
  async batchTest(req, res) {
    try {
      const { texts, confidence = 0.6 } = req.body;

      if (!Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要测试的文本数组'
        });
      }

      if (texts.length > 100) {
        return res.status(400).json({
          success: false,
          message: '批量测试最多支持100条文本'
        });
      }

      const results = [];
      for (const text of texts) {
        if (text && text.trim().length > 0) {
          const result = await this.performIntentRecognition(text.trim(), confidence);
          results.push({
            inputText: text.trim(),
            ...result
          });
        }
      }

      res.json({
        success: true,
        message: '批量意图识别测试完成',
        data: {
          confidence: confidence,
          timestamp: new Date(),
          total: results.length,
          results
        }
      });
    } catch (error) {
      console.error('批量意图识别测试失败:', error);
      res.status(500).json({
        success: false,
        message: '批量意图识别测试失败',
        error: error.message
      });
    }
  }

  // 获取测试历史
  async getTestHistory(req, res) {
    try {
      // 这里可以实现测试历史功能，暂时返回空数据
      res.json({
        success: true,
        message: '获取测试历史成功',
        data: {
          total: 0,
          history: []
        }
      });
    } catch (error) {
      console.error('获取测试历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取测试历史失败',
        error: error.message
      });
    }
  }

  // 获取推荐回复
  async getRecommendedResponse(req, res) {
    try {
      const { intentId, type = 'core' } = req.params;

      if (type === 'core') {
        const responses = await PreResponse.findAll({
          where: {
            coreIntentId: intentId,
            status: 'active'
          },
          order: [['priority', 'DESC'], ['usageCount', 'DESC']],
          limit: 5
        });

        res.json({
          success: true,
          message: '获取推荐回复成功',
          data: responses
        });
      } else {
        res.json({
          success: true,
          message: '非核心意图暂无预设回复',
          data: []
        });
      }
    } catch (error) {
      console.error('获取推荐回复失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐回复失败',
        error: error.message
      });
    }
  }
}

module.exports = new IntentTestController(); 