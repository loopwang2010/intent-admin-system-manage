const { CoreIntent, NonCoreIntent, IntentCategory } = require('../models')
const { Op } = require('sequelize')

class AIService {
  constructor() {
    // 模拟语义向量计算
    this.stopWords = new Set(['的', '了', '在', '是', '我', '你', '他', '她', '它', '和', '与', '或', '但', '然而'])
  }

  // 计算文本的简单语义向量（实际应用中可以使用更复杂的NLP模型）
  calculateSemanticVector(text) {
    if (!text) return []
    
    // 简单的词频向量
    const words = text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、数字
      .split(/\s+/)
      .filter(word => word.length > 0 && !this.stopWords.has(word))
    
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    
    // 转换为向量（取前20个最频繁的词）
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
    
    return sortedWords.map(([word, count]) => ({ word, weight: count / words.length }))
  }

  // 计算两个向量之间的余弦相似度
  calculateCosineSimilarity(vector1, vector2) {
    if (!vector1.length || !vector2.length) return 0
    
    // 创建词汇表
    const vocab = new Set([
      ...vector1.map(v => v.word),
      ...vector2.map(v => v.word)
    ])
    
    // 转换为数值向量
    const v1 = Array.from(vocab).map(word => {
      const item = vector1.find(v => v.word === word)
      return item ? item.weight : 0
    })
    
    const v2 = Array.from(vocab).map(word => {
      const item = vector2.find(v => v.word === word)
      return item ? item.weight : 0
    })
    
    // 计算余弦相似度
    const dotProduct = v1.reduce((sum, a, i) => sum + a * v2[i], 0)
    const magnitude1 = Math.sqrt(v1.reduce((sum, a) => sum + a * a, 0))
    const magnitude2 = Math.sqrt(v2.reduce((sum, a) => sum + a * a, 0))
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0
    
    return dotProduct / (magnitude1 * magnitude2)
  }

  // 智能推荐相似意图
  async recommendSimilarIntents(inputText, type = 'all', limit = 5) {
    try {
      const inputVector = this.calculateSemanticVector(inputText)
      const recommendations = []
      
      if (type === 'all' || type === 'core') {
        const coreIntents = await CoreIntent.findAll({
          include: [{ model: IntentCategory, as: 'Category' }],
          where: { status: 'active' }
        })
        
        for (const intent of coreIntents) {
          const keywords = intent.keywords ? JSON.parse(intent.keywords) : []
          const keywordText = keywords.join(' ')
          const intentVector = this.calculateSemanticVector(keywordText)
          const similarity = this.calculateCosineSimilarity(inputVector, intentVector)
          
          if (similarity > 0.1) { // 阈值过滤
            recommendations.push({
              id: intent.id,
              name: intent.name,
              type: 'core',
              category: intent.Category?.name,
              similarity: parseFloat(similarity.toFixed(3)),
              keywords: keywords.slice(0, 5)
            })
          }
        }
      }
      
      if (type === 'all' || type === 'non_core') {
        const nonCoreIntents = await NonCoreIntent.findAll({
          include: [{ model: IntentCategory, as: 'Category' }],
          where: { status: 'active' }
        })
        
        for (const intent of nonCoreIntents) {
          const keywords = intent.keywords ? JSON.parse(intent.keywords) : []
          const keywordText = keywords.join(' ')
          const intentVector = this.calculateSemanticVector(keywordText)
          const similarity = this.calculateCosineSimilarity(inputVector, intentVector)
          
          if (similarity > 0.1) {
            recommendations.push({
              id: intent.id,
              name: intent.name,
              type: 'non_core',
              category: intent.Category?.name,
              similarity: parseFloat(similarity.toFixed(3)),
              keywords: keywords.slice(0, 5),
              response: intent.response
            })
          }
        }
      }
      
      // 按相似度排序并限制数量
      return recommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        
    } catch (error) {
      console.error('智能推荐失败:', error)
      return []
    }
  }

  // 检测意图冲突
  async detectIntentConflicts(threshold = 0.8) {
    try {
      const conflicts = []
      
      // 获取所有活跃意图
      const [coreIntents, nonCoreIntents] = await Promise.all([
        CoreIntent.findAll({
          where: { status: 'active' },
          include: [{ model: IntentCategory, as: 'Category' }]
        }),
        NonCoreIntent.findAll({
          where: { status: 'active' },
          include: [{ model: IntentCategory, as: 'Category' }]
        })
      ])
      
      const allIntents = [
        ...coreIntents.map(intent => ({
          ...intent.toJSON(),
          type: 'core'
        })),
        ...nonCoreIntents.map(intent => ({
          ...intent.toJSON(),
          type: 'non_core'
        }))
      ]
      
      // 计算所有意图对之间的相似度
      for (let i = 0; i < allIntents.length; i++) {
        for (let j = i + 1; j < allIntents.length; j++) {
          const intent1 = allIntents[i]
          const intent2 = allIntents[j]
          
          const keywords1 = intent1.keywords ? JSON.parse(intent1.keywords) : []
          const keywords2 = intent2.keywords ? JSON.parse(intent2.keywords) : []
          
          const vector1 = this.calculateSemanticVector(keywords1.join(' '))
          const vector2 = this.calculateSemanticVector(keywords2.join(' '))
          
          const similarity = this.calculateCosineSimilarity(vector1, vector2)
          
          if (similarity >= threshold) {
            conflicts.push({
              intent1: {
                id: intent1.id,
                name: intent1.name,
                type: intent1.type,
                category: intent1.Category?.name,
                keywords: keywords1.slice(0, 5)
              },
              intent2: {
                id: intent2.id,
                name: intent2.name,
                type: intent2.type,
                category: intent2.Category?.name,
                keywords: keywords2.slice(0, 5)
              },
              similarity: parseFloat(similarity.toFixed(3)),
              riskLevel: similarity >= 0.95 ? 'high' : similarity >= 0.8 ? 'medium' : 'low'
            })
          }
        }
      }
      
      return conflicts.sort((a, b) => b.similarity - a.similarity)
      
    } catch (error) {
      console.error('意图冲突检测失败:', error)
      return []
    }
  }

  // 自动生成关键词
  async generateKeywords(intentName, description = '', existingKeywords = []) {
    try {
      const suggestions = []
      
      // 基于意图名称生成
      if (intentName) {
        const nameWords = intentName.split(/\s+/)
        suggestions.push(...nameWords.filter(word => word.length > 1))
      }
      
      // 基于描述生成
      if (description) {
        const descWords = description
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 1 && !this.stopWords.has(word))
        suggestions.push(...descWords)
      }
      
      // 基于相似意图推荐
      const similarIntents = await this.recommendSimilarIntents(intentName + ' ' + description, 'all', 3)
      for (const similar of similarIntents) {
        if (similar.keywords) {
          suggestions.push(...similar.keywords)
        }
      }
      
      // 去重并过滤
      const uniqueKeywords = [...new Set(suggestions)]
        .filter(keyword => 
          keyword.length > 1 && 
          !existingKeywords.includes(keyword) &&
          !this.stopWords.has(keyword)
        )
        .slice(0, 10)
      
      return uniqueKeywords
      
    } catch (error) {
      console.error('关键词生成失败:', error)
      return []
    }
  }

  // 分析意图语义关系
  async analyzeSemanticRelations(intentId, type = 'core') {
    try {
      const IntentModel = type === 'core' ? CoreIntent : NonCoreIntent
      const targetIntent = await IntentModel.findByPk(intentId, {
        include: [{ model: IntentCategory, as: 'Category' }]
      })
      
      if (!targetIntent) {
        throw new Error('意图不存在')
      }
      
      const targetKeywords = targetIntent.keywords ? JSON.parse(targetIntent.keywords) : []
      const targetVector = this.calculateSemanticVector(targetKeywords.join(' '))
      
      const relations = []
      
      // 获取同类型的其他意图
      const otherIntents = await IntentModel.findAll({
        where: { 
          id: { [Op.ne]: intentId },
          status: 'active'
        },
        include: [{ model: IntentCategory, as: 'Category' }]
      })
      
      for (const intent of otherIntents) {
        const keywords = intent.keywords ? JSON.parse(intent.keywords) : []
        const vector = this.calculateSemanticVector(keywords.join(' '))
        const similarity = this.calculateCosineSimilarity(targetVector, vector)
        
        if (similarity > 0.1) {
          relations.push({
            id: intent.id,
            name: intent.name,
            category: intent.Category?.name,
            similarity: parseFloat(similarity.toFixed(3)),
            relation: this.categorizeRelation(similarity),
            keywords: keywords.slice(0, 5)
          })
        }
      }
      
      return {
        target: {
          id: targetIntent.id,
          name: targetIntent.name,
          type,
          category: targetIntent.Category?.name,
          keywords: targetKeywords.slice(0, 5)
        },
        relations: relations.sort((a, b) => b.similarity - a.similarity)
      }
      
    } catch (error) {
      console.error('语义关系分析失败:', error)
      return null
    }
  }

  // 分类语义关系
  categorizeRelation(similarity) {
    if (similarity >= 0.8) return 'very_similar'
    if (similarity >= 0.6) return 'similar'
    if (similarity >= 0.4) return 'related'
    if (similarity >= 0.2) return 'weakly_related'
    return 'different'
  }

  // 模拟意图识别（实际应用中应该使用训练好的模型）
  async recognizeIntent(inputText, threshold = 0.6) {
    try {
      const inputVector = this.calculateSemanticVector(inputText)
      const results = []
      
      // 搜索核心意图
      const coreIntents = await CoreIntent.findAll({
        where: { status: 'active' },
        include: [{ model: IntentCategory, as: 'Category' }]
      })
      
      for (const intent of coreIntents) {
        const keywords = intent.keywords ? JSON.parse(intent.keywords) : []
        const intentVector = this.calculateSemanticVector(keywords.join(' '))
        const confidence = this.calculateCosineSimilarity(inputVector, intentVector)
        
        if (confidence >= threshold) {
          results.push({
            id: intent.id,
            name: intent.name,
            type: 'core',
            category: intent.Category?.name,
            confidence: parseFloat(confidence.toFixed(3)),
            matchedKeywords: this.findMatchedKeywords(inputText, keywords)
          })
        }
      }
      
      // 搜索非核心意图
      const nonCoreIntents = await NonCoreIntent.findAll({
        where: { status: 'active' },
        include: [{ model: IntentCategory, as: 'Category' }]
      })
      
      for (const intent of nonCoreIntents) {
        const keywords = intent.keywords ? JSON.parse(intent.keywords) : []
        const intentVector = this.calculateSemanticVector(keywords.join(' '))
        const confidence = this.calculateCosineSimilarity(inputVector, intentVector)
        
        if (confidence >= threshold) {
          results.push({
            id: intent.id,
            name: intent.name,
            type: 'non_core',
            category: intent.Category?.name,
            confidence: parseFloat(confidence.toFixed(3)),
            matchedKeywords: this.findMatchedKeywords(inputText, keywords),
            response: intent.response
          })
        }
      }
      
      return results.sort((a, b) => b.confidence - a.confidence)
      
    } catch (error) {
      console.error('意图识别失败:', error)
      return []
    }
  }

  // 找到匹配的关键词
  findMatchedKeywords(inputText, keywords) {
    const inputLower = inputText.toLowerCase()
    return keywords.filter(keyword => 
      inputLower.includes(keyword.toLowerCase())
    )
  }
}

module.exports = new AIService() 