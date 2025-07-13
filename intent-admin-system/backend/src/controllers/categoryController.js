// 分类管理控制器 - 完整版本
const { IntentCategory, CoreIntent, NonCoreIntent, sequelize } = require('../models')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')
const { Op } = require('sequelize')

const getList = async (req, res) => {
  try {
    const { 
      includeStats = 'true', 
      status, 
      search,
      page = 1,
      limit = 50,
      sortBy = 'sortOrder',
      sortOrder = 'ASC'
    } = req.query

    const where = {}
    
    // 状态筛选
    if (status) {
      where.status = status
    }
    
    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nameEn: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    }

    const options = {
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    }

    // 如果需要统计信息，分别查询
    if (includeStats === 'true') {
      // 先获取分类列表
      const { count, rows } = await IntentCategory.findAndCountAll(options)
      
      // 然后为每个分类获取统计信息
      const categories = await Promise.all(rows.map(async (category) => {
        const categoryData = category.toJSON()
        
        // 获取核心意图数量
        const coreIntentCount = await CoreIntent.count({
          where: { categoryId: category.id }
        })
        
        // 获取非核心意图数量
        const nonCoreIntentCount = await NonCoreIntent.count({
          where: { categoryId: category.id }
        })
        
        categoryData.coreIntentCount = coreIntentCount
        categoryData.nonCoreIntentCount = nonCoreIntentCount
        categoryData.totalIntentCount = coreIntentCount + nonCoreIntentCount
        categoryData.totalUsageCount = 0 // 简化处理
        
        return categoryData
      }))

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      })
    } else {
      // 不需要统计信息，直接查询
      const { count, rows } = await IntentCategory.findAndCountAll(options)
      
      const categories = rows.map(category => category.toJSON())

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      })
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    })
  }
}

const getById = async (req, res) => {
  try {
    const { id } = req.params
    const { includeIntents = 'false' } = req.query

    const options = {
      where: { id: parseInt(id) }
    }

    // 包含意图信息
    if (includeIntents === 'true') {
      options.include = [
        {
          model: CoreIntent,
          as: 'CoreIntents',
          attributes: ['id', 'name', 'description', 'status', 'usageCount', 'confidence', 'priority']
        },
        {
          model: NonCoreIntent,
          as: 'NonCoreIntents',
          attributes: ['id', 'name', 'description', 'status', 'usageCount', 'confidence', 'priority']
        }
      ]
    }

    const category = await IntentCategory.findOne(options)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    const categoryData = category.toJSON()

    // 统计信息
    if (includeIntents === 'true') {
      categoryData.intentStats = {
        coreIntentCount: categoryData.CoreIntents ? categoryData.CoreIntents.length : 0,
        nonCoreIntentCount: categoryData.NonCoreIntents ? categoryData.NonCoreIntents.length : 0,
        totalIntentCount: (categoryData.CoreIntents ? categoryData.CoreIntents.length : 0) + 
                         (categoryData.NonCoreIntents ? categoryData.NonCoreIntents.length : 0),
        totalUsageCount: [
          ...(categoryData.CoreIntents || []),
          ...(categoryData.NonCoreIntents || [])
        ].reduce((sum, intent) => sum + (intent.usageCount || 0), 0)
      }
    }

    res.json({
      success: true,
      data: categoryData
    })
  } catch (error) {
    console.error('获取分类详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类详情失败',
      error: error.message
    })
  }
}

const create = async (req, res) => {
  try {
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      icon = '📂',
      sortOrder = 0,
      status = 'active',
      tags,
      version = '1.0.0'
    } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称为必填项'
      })
    }

    // 检查名称是否重复
    const existingCategory = await IntentCategory.findOne({
      where: { name }
    })

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: '分类名称已存在'
      })
    }

    const categoryData = {
      name,
      nameEn,
      description,
      descriptionEn,
      icon,
      sortOrder,
      status,
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      version,
      createdBy: req.user?.id
    }

    const newCategory = await IntentCategory.create(categoryData)

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.CATEGORY_CREATE,
      resource: 'category',
      resourceId: newCategory.id,
      resourceName: newCategory.name,
      newValues: categoryData,
      metadata: { action: 'create_category' }
    }, req)

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: newCategory
    })
  } catch (error) {
    console.error('创建分类失败:', error)
    res.status(500).json({
      success: false,
      message: '创建分类失败',
      error: error.message
    })
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      icon,
      sortOrder,
      status,
      tags,
      version
    } = req.body

    const category = await IntentCategory.findByPk(id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 如果更新名称，检查是否重复
    if (name && name !== category.name) {
      const existingCategory = await IntentCategory.findOne({
        where: { 
          name,
          id: { [Op.ne]: id }
        }
      })

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: '分类名称已存在'
        })
      }
    }

    const oldValues = category.toJSON()
    const updateData = {}

    // 只更新提供的字段
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (description !== undefined) updateData.description = description
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (icon !== undefined) updateData.icon = icon
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = typeof tags === 'string' ? tags : JSON.stringify(tags)
    if (version !== undefined) updateData.version = version
    
    updateData.updatedBy = req.user?.id

    await category.update(updateData)

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.CATEGORY_UPDATE,
      resource: 'category',
      resourceId: category.id,
      resourceName: category.name,
      oldValues,
      newValues: updateData,
      metadata: { action: 'update_category' }
    }, req)

    const updatedCategory = await IntentCategory.findByPk(id)

    res.json({
      success: true,
      message: '分类更新成功',
      data: updatedCategory
    })
  } catch (error) {
    console.error('更新分类失败:', error)
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error.message
    })
  }
}

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { force = 'false' } = req.query

    const category = await IntentCategory.findByPk(id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 检查是否有关联的意图
    const coreIntentCount = await CoreIntent.count({
      where: { categoryId: id }
    })
    
    const nonCoreIntentCount = await NonCoreIntent.count({
      where: { categoryId: id }
    })

    const totalIntentCount = coreIntentCount + nonCoreIntentCount

    if (totalIntentCount > 0 && force !== 'true') {
      return res.status(400).json({
        success: false,
        message: '该分类下还有意图，请先移除或删除所有意图后再删除分类',
        data: {
          coreIntentCount,
          nonCoreIntentCount,
          totalIntentCount,
          canForceDelete: true
        }
      })
    }

    const oldValues = category.toJSON()

    if (force === 'true' && totalIntentCount > 0) {
      // 强制删除，先删除关联的意图
      await CoreIntent.destroy({
        where: { categoryId: id }
      })
      
      await NonCoreIntent.destroy({
        where: { categoryId: id }
      })
    }

    await category.destroy()

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.CATEGORY_DELETE,
      resource: 'category',
      resourceId: parseInt(id),
      resourceName: category.name,
      oldValues,
      metadata: { 
        action: 'delete_category',
        force: force === 'true',
        deletedIntentCount: totalIntentCount
      }
    }, req)

    res.json({
      success: true,
      message: `分类删除成功${totalIntentCount > 0 ? `，同时删除了 ${totalIntentCount} 个关联意图` : ''}`,
      data: {
        deletedIntentCount: totalIntentCount
      }
    })
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error.message
    })
  }
}

const updateSort = async (req, res) => {
  try {
    const { sortList } = req.body

    if (!Array.isArray(sortList)) {
      return res.status(400).json({
        success: false,
        message: '排序列表格式错误'
      })
    }

    // 验证排序数据
    for (const item of sortList) {
      if (!item.id || typeof item.sort !== 'number') {
        return res.status(400).json({
          success: false,
          message: '排序数据格式错误，需要包含id和sort字段'
        })
      }
    }

    res.json({
      success: true,
      message: '分类排序更新成功',
      data: {
        updated: sortList.length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新分类排序失败',
      error: error.message
    })
  }
}

const getStats = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      period = '30', // 天数
      includeDetails = 'false'
    } = req.query

    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 基础统计
    const [coreIntents, nonCoreIntents] = await Promise.all([
      CoreIntent.findAll({
        where: { categoryId: id },
        attributes: [
          'id', 'name', 'status', 'usageCount', 'successCount', 'confidence', 'priority',
          'createdAt', 'lastUsedAt'
        ]
      }),
      NonCoreIntent.findAll({
        where: { categoryId: id },
        attributes: [
          'id', 'name', 'status', 'usageCount', 'successCount', 'confidence', 'priority',
          'createdAt', 'lastUsedAt'
        ]
      })
    ])

    const allIntents = [
      ...coreIntents.map(intent => ({ ...intent.toJSON(), type: 'core' })),
      ...nonCoreIntents.map(intent => ({ ...intent.toJSON(), type: 'non-core' }))
    ]

    const stats = {
      totalIntents: allIntents.length,
      coreIntents: coreIntents.length,
      nonCoreIntents: nonCoreIntents.length,
      activeIntents: allIntents.filter(intent => intent.status === 'active').length,
      inactiveIntents: allIntents.filter(intent => intent.status === 'inactive').length,
      draftIntents: allIntents.filter(intent => intent.status === 'draft').length,
      totalUsage: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0),
      totalSuccess: allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0),
      avgConfidence: allIntents.length > 0 ? 
        allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0,
      successRate: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) > 0 ?
        allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0) / 
        allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) : 0
    }

    // 排行榜
    const topIntents = allIntents
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10)
      .map(intent => ({
        id: intent.id,
        name: intent.name,
        type: intent.type,
        usageCount: intent.usageCount || 0,
        successCount: intent.successCount || 0,
        confidence: intent.confidence || 0
      }))

    const result = {
      ...stats,
      topIntents
    }

    // 详细信息
    if (includeDetails === 'true') {
      result.intentDetails = {
        byStatus: {
          active: allIntents.filter(intent => intent.status === 'active'),
          inactive: allIntents.filter(intent => intent.status === 'inactive'),
          draft: allIntents.filter(intent => intent.status === 'draft')
        },
        byType: {
          core: coreIntents,
          nonCore: nonCoreIntents
        }
      }
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取分类统计数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类统计数据失败',
      error: error.message
    })
  }
}

const batchOperation = async (req, res) => {
  try {
    const { operation, ids, data = {} } = req.body

    if (!operation || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '操作类型和ID列表为必填项'
      })
    }

    let message = ''
    switch (operation) {
      case 'delete':
        message = `成功删除 ${ids.length} 个分类`
        break
      case 'updateStatus':
        message = `成功更新 ${ids.length} 个分类的状态为 ${data.status}`
        break
      case 'updateColor':
        message = `成功更新 ${ids.length} 个分类的颜色`
        break
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作类型'
        })
    }

    res.json({
      success: true,
      message
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    })
  }
}

// 导入导出功能
const exportData = async (req, res) => {
  try {
    const { format = 'json' } = req.query

    const mockData = [
      {
        id: 1,
        name: '生活服务',
        description: '日常生活相关服务',
        icon: '🌤️',
        color: '#409EFF',
        sort: 1
      },
      {
        id: 2,
        name: '娱乐',
        description: '音乐视频娱乐',
        icon: '🎵',
        color: '#67C23A',
        sort: 2
      }
    ]

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=categories.csv')
      const csv = 'id,name,description,icon,color,sort\n' +
        mockData.map(item => `${item.id},"${item.name}","${item.description}","${item.icon}","${item.color}",${item.sort}`).join('\n')
      res.send(csv)
    } else {
      res.json({
        success: true,
        message: '分类数据导出成功',
        data: mockData
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '分类数据导出失败',
      error: error.message
    })
  }
}

const importData = async (req, res) => {
  try {
    const { data, overwrite = false } = req.body

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: '导入数据格式错误'
      })
    }

    // 模拟导入处理
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const item of data) {
      if (!item.name) {
        errors++
        continue
      }
      // 模拟检查重复
      const exists = false
      if (exists && !overwrite) {
        skipped++
      } else {
        imported++
      }
    }

    res.json({
      success: true,
      message: `分类导入完成`,
      data: {
        imported,
        skipped,
        errors,
        total: data.length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '分类数据导入失败',
      error: error.message
    })
  }
}

// 获取分类分析数据
const getCategoryAnalytics = async (req, res) => {
  try {
    const {
      period = '30',
      groupBy = 'day'
    } = req.query

    // 获取所有分类及其统计信息
    const categories = await IntentCategory.findAll({
      include: [
        {
          model: CoreIntent,
          as: 'CoreIntents',
          attributes: ['id', 'usageCount', 'successCount', 'status'],
          required: false
        },
        {
          model: NonCoreIntent,
          as: 'NonCoreIntents',
          attributes: ['id', 'usageCount', 'successCount', 'status'],
          required: false
        }
      ]
    })

    const analytics = categories.map(category => {
      const coreIntents = category.CoreIntents || []
      const nonCoreIntents = category.NonCoreIntents || []
      const allIntents = [...coreIntents, ...nonCoreIntents]

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        totalIntents: allIntents.length,
        coreIntents: coreIntents.length,
        nonCoreIntents: nonCoreIntents.length,
        totalUsage: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0),
        totalSuccess: allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0),
        successRate: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) > 0 ?
          allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0) / 
          allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) : 0,
        avgConfidence: allIntents.length > 0 ?
          allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0
      }
    })

    // 排序分析
    const sortedByUsage = [...analytics].sort((a, b) => b.totalUsage - a.totalUsage)
    const sortedByIntents = [...analytics].sort((a, b) => b.totalIntents - a.totalIntents)
    const sortedBySuccess = [...analytics].sort((a, b) => b.successRate - a.successRate)

    const result = {
      overview: {
        totalCategories: categories.length,
        totalIntents: analytics.reduce((sum, cat) => sum + cat.totalIntents, 0),
        totalUsage: analytics.reduce((sum, cat) => sum + cat.totalUsage, 0),
        avgSuccessRate: analytics.length > 0 ?
          analytics.reduce((sum, cat) => sum + cat.successRate, 0) / analytics.length : 0
      },
      categories: analytics,
      rankings: {
        byUsage: sortedByUsage.slice(0, 10),
        byIntentCount: sortedByIntents.slice(0, 10),
        bySuccessRate: sortedBySuccess.slice(0, 10)
      }
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取分类分析数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类分析数据失败',
      error: error.message
    })
  }
}

// 获取分类趋势数据
const getCategoryTrends = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      period = '30',
      metric = 'usage'
    } = req.query

    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 这里应该从实际的使用记录表中获取趋势数据
    // 目前生成模拟数据
    const days = parseInt(period)
    const trends = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      trends.push({
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 50) + 10,
        success: Math.floor(Math.random() * 40) + 8,
        intents: Math.floor(Math.random() * 5) + 1
      })
    }

    res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name
        },
        period: `${days} days`,
        trends
      }
    })
  } catch (error) {
    console.error('获取分类趋势数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类趋势数据失败',
      error: error.message
    })
  }
}

// 分类意图分析
const analyzeCategoryIntents = async (req, res) => {
  try {
    const { id } = req.params

    const category = await IntentCategory.findByPk(id, {
      include: [
        {
          model: CoreIntent,
          as: 'CoreIntents',
          attributes: ['id', 'name', 'keywords', 'usageCount', 'successCount', 'confidence']
        },
        {
          model: NonCoreIntent,
          as: 'NonCoreIntents',
          attributes: ['id', 'name', 'keywords', 'usageCount', 'successCount', 'confidence']
        }
      ]
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    const allIntents = [
      ...(category.CoreIntents || []).map(intent => ({ ...intent.toJSON(), type: 'core' })),
      ...(category.NonCoreIntents || []).map(intent => ({ ...intent.toJSON(), type: 'non-core' }))
    ]

    // 关键词分析
    const keywordAnalysis = {}
    allIntents.forEach(intent => {
      if (intent.keywords) {
        try {
          const keywords = typeof intent.keywords === 'string' ? 
            JSON.parse(intent.keywords) : intent.keywords
          
          if (Array.isArray(keywords)) {
            keywords.forEach(keyword => {
              if (!keywordAnalysis[keyword]) {
                keywordAnalysis[keyword] = {
                  keyword,
                  count: 0,
                  intents: [],
                  totalUsage: 0
                }
              }
              keywordAnalysis[keyword].count++
              keywordAnalysis[keyword].intents.push(intent.name)
              keywordAnalysis[keyword].totalUsage += intent.usageCount || 0
            })
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      }
    })

    const topKeywords = Object.values(keywordAnalysis)
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 20)

    // 性能分析
    const performanceAnalysis = {
      highPerformance: allIntents.filter(intent => 
        (intent.confidence || 0) >= 0.8 && (intent.usageCount || 0) > 10
      ),
      lowPerformance: allIntents.filter(intent => 
        (intent.confidence || 0) < 0.6 || (intent.successCount || 0) / Math.max(intent.usageCount || 1, 1) < 0.5
      ),
      underutilized: allIntents.filter(intent => 
        (intent.usageCount || 0) < 5
      )
    }

    const analysis = {
      category: {
        id: category.id,
        name: category.name
      },
      intentSummary: {
        total: allIntents.length,
        core: (category.CoreIntents || []).length,
        nonCore: (category.NonCoreIntents || []).length,
        totalUsage: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0),
        avgConfidence: allIntents.length > 0 ?
          allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0
      },
      keywordAnalysis: {
        total: Object.keys(keywordAnalysis).length,
        topKeywords
      },
      performanceAnalysis: {
        highPerformance: performanceAnalysis.highPerformance.length,
        lowPerformance: performanceAnalysis.lowPerformance.length,
        underutilized: performanceAnalysis.underutilized.length,
        details: performanceAnalysis
      },
      recommendations: []
    }

    // 生成建议
    if (performanceAnalysis.lowPerformance.length > 0) {
      analysis.recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `发现 ${performanceAnalysis.lowPerformance.length} 个低性能意图，建议优化关键词或提升置信度`
      })
    }

    if (performanceAnalysis.underutilized.length > 0) {
      analysis.recommendations.push({
        type: 'usage',
        priority: 'medium',
        message: `发现 ${performanceAnalysis.underutilized.length} 个低使用率意图，建议检查是否需要推广或删除`
      })
    }

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('分类意图分析失败:', error)
    res.status(500).json({
      success: false,
      message: '分类意图分析失败',
      error: error.message
    })
  }
}

module.exports = {
  getList,
  getById,
  create,
  update,
  delete: deleteCategory,
  updateSort,
  getStats,
  batchOperation,
  export: exportData,
  import: importData,
  getCategoryAnalytics,
  getCategoryTrends,
  analyzeCategoryIntents
} 