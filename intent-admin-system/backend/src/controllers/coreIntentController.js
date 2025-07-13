// 核心意图控制器 - 完整版本
const { CoreIntent, IntentCategory, PreResponse, sequelize } = require('../models')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')
const { Op } = require('sequelize')

// 获取核心意图列表
const getList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      categoryId = '',
      sortBy = 'id',
      sortOrder = 'ASC',
      includeResponses = 'false'
    } = req.query

    const where = {}

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { firstResponse: { [Op.like]: `%${search}%` } }
      ]
    }

    // 状态过滤
    if (status) {
      where.status = status
    }

    // 分类过滤
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    const options = {
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      include: [
        {
          model: IntentCategory,
          as: 'Category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    }

    // 是否包含回复模板
    if (includeResponses === 'true') {
      options.include.push({
        model: PreResponse,
        as: 'PreResponses',
        attributes: ['id', 'content', 'priority', 'status', 'usageCount']
      })
    }

    const { count, rows } = await CoreIntent.findAndCountAll(options)

    res.json({
      success: true,
      data: {
        intents: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取核心意图列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取核心意图列表失败',
      error: error.message
    })
  }
}

// 获取核心意图详情
const getById = async (req, res) => {
  try {
    const { id } = req.params
    const { includeResponses = 'true' } = req.query

    const options = {
      where: { id: parseInt(id) },
      include: [
        {
          model: IntentCategory,
          as: 'Category',
          attributes: ['id', 'name', 'nameEn', 'icon']
        }
      ]
    }

    if (includeResponses === 'true') {
      options.include.push({
        model: PreResponse,
        as: 'PreResponses',
        attributes: ['id', 'content', 'contentEn', 'type', 'priority', 'status', 'usageCount', 'successRate']
      })
    }

    const intent = await CoreIntent.findOne(options)

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '核心意图不存在'
      })
    }

    res.json({
      success: true,
      data: intent
    })
  } catch (error) {
    console.error('获取核心意图详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取核心意图详情失败',
      error: error.message
    })
  }
}

// 创建核心意图
const create = async (req, res) => {
  try {
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      categoryId,
      keywords = [],
      keywordsEn = [],
      confidence = 0.7,
      priority = 1,
      firstResponse,
      firstResponseEn,
      responseVariables = [],
      responseType = 'immediate',
      status = 'active',
      tags = [],
      version = '1.0.0'
    } = req.body

    // 验证必填字段
    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: '名称和分类ID为必填项'
      })
    }

    // 检查名称是否重复
    const existingIntent = await CoreIntent.findOne({
      where: { name, categoryId }
    })

    if (existingIntent) {
      return res.status(409).json({
        success: false,
        message: '该分类下已存在同名意图'
      })
    }

    // 验证分类是否存在
    const category = await IntentCategory.findByPk(categoryId)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '指定的分类不存在'
      })
    }

    const intentData = {
      name,
      nameEn,
      description,
      descriptionEn,
      categoryId,
      keywords: JSON.stringify(keywords),
      keywordsEn: JSON.stringify(keywordsEn),
      confidence,
      priority,
      firstResponse,
      firstResponseEn,
      responseVariables: JSON.stringify(responseVariables),
      responseType,
      status,
      tags: JSON.stringify(tags),
      version,
      createdBy: req.user?.id
    }

    const newIntent = await CoreIntent.create(intentData)

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.INTENT_CREATE,
      resource: 'core_intent',
      resourceId: newIntent.id,
      resourceName: newIntent.name,
      newValues: intentData,
      metadata: { action: 'create_core_intent' }
    }, req)

    // 获取完整数据返回
    const createdIntent = await CoreIntent.findByPk(newIntent.id, {
      include: [
        {
          model: IntentCategory,
          as: 'Category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    })

    res.status(201).json({
      success: true,
      message: '核心意图创建成功',
      data: createdIntent
    })
  } catch (error) {
    console.error('创建核心意图失败:', error)
    res.status(500).json({
      success: false,
      message: '创建核心意图失败',
      error: error.message
    })
  }
}

// 更新核心意图
const update = async (req, res) => {
  try {
    const { id } = req.params
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
      firstResponse,
      firstResponseEn,
      responseVariables,
      responseType,
      status,
      tags,
      version
    } = req.body

    const intent = await CoreIntent.findByPk(id)

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '核心意图不存在'
      })
    }

    // 如果更新名称，检查是否重复
    if (name && name !== intent.name) {
      const existingIntent = await CoreIntent.findOne({
        where: {
          name,
          categoryId: categoryId || intent.categoryId,
          id: { [Op.ne]: id }
        }
      })

      if (existingIntent) {
        return res.status(409).json({
          success: false,
          message: '该分类下已存在同名意图'
        })
      }
    }

    // 如果更新分类，验证分类是否存在
    if (categoryId && categoryId !== intent.categoryId) {
      const category = await IntentCategory.findByPk(categoryId)
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '指定的分类不存在'
        })
      }
    }

    const oldValues = intent.toJSON()
    const updateData = {}

    // 只更新提供的字段
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (description !== undefined) updateData.description = description
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords)
    if (keywordsEn !== undefined) updateData.keywordsEn = JSON.stringify(keywordsEn)
    if (confidence !== undefined) updateData.confidence = confidence
    if (priority !== undefined) updateData.priority = priority
    if (firstResponse !== undefined) updateData.firstResponse = firstResponse
    if (firstResponseEn !== undefined) updateData.firstResponseEn = firstResponseEn
    if (responseVariables !== undefined) updateData.responseVariables = JSON.stringify(responseVariables)
    if (responseType !== undefined) updateData.responseType = responseType
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)
    if (version !== undefined) updateData.version = version

    updateData.updatedBy = req.user?.id

    await intent.update(updateData)

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.INTENT_UPDATE,
      resource: 'core_intent',
      resourceId: intent.id,
      resourceName: intent.name,
      oldValues,
      newValues: updateData,
      metadata: { action: 'update_core_intent' }
    }, req)

    // 获取更新后的完整数据
    const updatedIntent = await CoreIntent.findByPk(id, {
      include: [
        {
          model: IntentCategory,
          as: 'Category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    })

    res.json({
      success: true,
      message: '核心意图更新成功',
      data: updatedIntent
    })
  } catch (error) {
    console.error('更新核心意图失败:', error)
    res.status(500).json({
      success: false,
      message: '更新核心意图失败',
      error: error.message
    })
  }
}

// 删除核心意图
const deleteIntent = async (req, res) => {
  try {
    const { id } = req.params
    const { force = 'false' } = req.query

    const intent = await CoreIntent.findByPk(id)

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '核心意图不存在'
      })
    }

    // 检查是否有关联的回复模板
    const responseCount = await PreResponse.count({
      where: { coreIntentId: id }
    })

    if (responseCount > 0 && force !== 'true') {
      return res.status(400).json({
        success: false,
        message: '该意图下还有回复模板，请先删除所有回复模板后再删除意图',
        data: {
          responseCount,
          canForceDelete: true
        }
      })
    }

    const oldValues = intent.toJSON()

    if (force === 'true' && responseCount > 0) {
      // 强制删除，先删除关联的回复模板
      await PreResponse.destroy({
        where: { coreIntentId: id }
      })
    }

    await intent.destroy()

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.INTENT_DELETE,
      resource: 'core_intent',
      resourceId: parseInt(id),
      resourceName: intent.name,
      oldValues,
      metadata: {
        action: 'delete_core_intent',
        force: force === 'true',
        deletedResponseCount: responseCount
      }
    }, req)

    res.json({
      success: true,
      message: `核心意图删除成功${responseCount > 0 ? `，同时删除了 ${responseCount} 个关联回复模板` : ''}`,
      data: {
        deletedResponseCount: responseCount
      }
    })
  } catch (error) {
    console.error('删除核心意图失败:', error)
    res.status(500).json({
      success: false,
      message: '删除核心意图失败',
      error: error.message
    })
  }
}

// 获取核心意图的首句回复
const getFirstResponse = async (req, res) => {
  try {
    const { id } = req.params
    const { language = 'zh' } = req.query

    const intent = await CoreIntent.findByPk(id, {
      attributes: ['id', 'name', 'firstResponse', 'firstResponseEn', 'responseVariables', 'responseType']
    })

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '核心意图不存在'
      })
    }

    const responseContent = language === 'en' ? intent.firstResponseEn : intent.firstResponse

    if (!responseContent) {
      return res.status(404).json({
        success: false,
        message: `该意图暂无${language === 'en' ? '英文' : '中文'}首句回复`
      })
    }

    res.json({
      success: true,
      data: {
        intentId: intent.id,
        intentName: intent.name,
        response: responseContent,
        variables: intent.responseVariables || [],
        responseType: intent.responseType
      }
    })
  } catch (error) {
    console.error('获取首句回复失败:', error)
    res.status(500).json({
      success: false,
      message: '获取首句回复失败',
      error: error.message
    })
  }
}

// 更新核心意图的首句回复
const updateFirstResponse = async (req, res) => {
  try {
    const { id } = req.params
    const {
      firstResponse,
      firstResponseEn,
      responseVariables = [],
      responseType = 'immediate'
    } = req.body

    const intent = await CoreIntent.findByPk(id)

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '核心意图不存在'
      })
    }

    const oldValues = {
      firstResponse: intent.firstResponse,
      firstResponseEn: intent.firstResponseEn,
      responseVariables: intent.responseVariables,
      responseType: intent.responseType
    }

    const updateData = {
      updatedBy: req.user?.id
    }

    if (firstResponse !== undefined) updateData.firstResponse = firstResponse
    if (firstResponseEn !== undefined) updateData.firstResponseEn = firstResponseEn
    if (responseVariables !== undefined) updateData.responseVariables = JSON.stringify(responseVariables)
    if (responseType !== undefined) updateData.responseType = responseType

    await intent.update(updateData)

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.INTENT_UPDATE,
      resource: 'core_intent',
      resourceId: intent.id,
      resourceName: intent.name,
      oldValues,
      newValues: updateData,
      metadata: { action: 'update_first_response' }
    }, req)

    res.json({
      success: true,
      message: '首句回复更新成功',
      data: {
        intentId: intent.id,
        firstResponse: intent.firstResponse,
        firstResponseEn: intent.firstResponseEn,
        responseVariables: intent.responseVariables,
        responseType: intent.responseType
      }
    })
  } catch (error) {
    console.error('更新首句回复失败:', error)
    res.status(500).json({
      success: false,
      message: '更新首句回复失败',
      error: error.message
    })
  }
}

// 批量操作
const batchOperation = async (req, res) => {
  try {
    const { operation, ids, data = {} } = req.body

    if (!operation || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '操作类型和ID列表为必填项'
      })
    }

    let result = {}

    switch (operation) {
      case 'delete':
        result = await batchDelete(ids, req)
        break
      case 'updateStatus':
        result = await batchUpdateStatus(ids, data.status, req)
        break
      case 'updateCategory':
        result = await batchUpdateCategory(ids, data.categoryId, req)
        break
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作类型'
        })
    }

    res.json({
      success: true,
      message: result.message,
      data: result.data
    })
  } catch (error) {
    console.error('批量操作失败:', error)
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    })
  }
}

// 批量删除
const batchDelete = async (ids, req) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }

  for (const id of ids) {
    try {
      const intent = await CoreIntent.findByPk(id)
      if (intent) {
        await intent.destroy()
        results.success++
      } else {
        results.failed++
        results.errors.push(`ID ${id}: 意图不存在`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`ID ${id}: ${error.message}`)
    }
  }

  return {
    message: `批量删除完成，成功${results.success}个，失败${results.failed}个`,
    data: results
  }
}

// 批量更新状态
const batchUpdateStatus = async (ids, status, req) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }

  for (const id of ids) {
    try {
      const intent = await CoreIntent.findByPk(id)
      if (intent) {
        await intent.update({ status, updatedBy: req.user?.id })
        results.success++
      } else {
        results.failed++
        results.errors.push(`ID ${id}: 意图不存在`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`ID ${id}: ${error.message}`)
    }
  }

  return {
    message: `批量更新状态完成，成功${results.success}个，失败${results.failed}个`,
    data: results
  }
}

// 批量更新分类
const batchUpdateCategory = async (ids, categoryId, req) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }

  // 验证分类是否存在
  const category = await IntentCategory.findByPk(categoryId)
  if (!category) {
    throw new Error('指定的分类不存在')
  }

  for (const id of ids) {
    try {
      const intent = await CoreIntent.findByPk(id)
      if (intent) {
        await intent.update({ categoryId, updatedBy: req.user?.id })
        results.success++
      } else {
        results.failed++
        results.errors.push(`ID ${id}: 意图不存在`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`ID ${id}: ${error.message}`)
    }
  }

  return {
    message: `批量更新分类完成，成功${results.success}个，失败${results.failed}个`,
    data: results
  }
}

// 更新排序
const updateSort = async (req, res) => {
  try {
    const { sortList } = req.body

    if (!Array.isArray(sortList) || sortList.length === 0) {
      return res.status(400).json({
        success: false,
        message: '排序列表不能为空'
      })
    }

    for (const item of sortList) {
      const { id, sortOrder } = item
      if (id && sortOrder !== undefined) {
        await CoreIntent.update(
          { sortOrder: parseInt(sortOrder) },
          { where: { id: parseInt(id) } }
        )
      }
    }

    res.json({
      success: true,
      message: '排序更新成功'
    })
  } catch (error) {
    console.error('更新排序失败:', error)
    res.status(500).json({
      success: false,
      message: '更新排序失败',
      error: error.message
    })
  }
}

// AI功能 - 智能推荐关键词
const suggestKeywords = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body

    // 这里可以实现AI关键词推荐逻辑
    // 暂时返回模拟数据
    const suggestedKeywords = [
      '智能推荐',
      'AI分析',
      '关键词优化'
    ]

    res.json({
      success: true,
      data: {
        keywords: suggestedKeywords
      }
    })
  } catch (error) {
    console.error('关键词推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '关键词推荐失败',
      error: error.message
    })
  }
}

// AI功能 - 检测意图冲突
const detectConflicts = async (req, res) => {
  try {
    const { threshold = 0.8 } = req.query

    // 这里可以实现意图冲突检测逻辑
    // 暂时返回模拟数据
    const conflicts = []

    res.json({
      success: true,
      data: {
        conflicts,
        threshold: parseFloat(threshold)
      }
    })
  } catch (error) {
    console.error('意图冲突检测失败:', error)
    res.status(500).json({
      success: false,
      message: '意图冲突检测失败',
      error: error.message
    })
  }
}

// AI功能 - 语义相似度分析
const analyzeSemantics = async (req, res) => {
  try {
    const { id } = req.params

    const intent = await CoreIntent.findByPk(id)
    if (!intent) {
      return res.status(404).json({
        success: false,
        message: '意图不存在'
      })
    }

    // 这里可以实现语义相似度分析逻辑
    // 暂时返回模拟数据
    const analysis = {
      intentId: id,
      semanticVector: [0.1, 0.2, 0.3],
      similarIntents: []
    }

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('语义分析失败:', error)
    res.status(500).json({
      success: false,
      message: '语义分析失败',
      error: error.message
    })
  }
}

// 导出数据
const exportData = async (req, res) => {
  try {
    const { format = 'json' } = req.query

    const intents = await CoreIntent.findAll({
      include: [
        {
          model: IntentCategory,
          as: 'Category',
          attributes: ['name']
        }
      ]
    })

    if (format === 'json') {
      res.json({
        success: true,
        data: intents
      })
    } else {
      // 可以添加其他格式的导出逻辑
      res.status(400).json({
        success: false,
        message: '不支持的导出格式'
      })
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    res.status(500).json({
      success: false,
      message: '导出数据失败',
      error: error.message
    })
  }
}

// 导入数据
const importData = async (req, res) => {
  try {
    const { intents, mode = 'create' } = req.body

    if (!Array.isArray(intents)) {
      return res.status(400).json({
        success: false,
        message: '数据格式错误'
      })
    }

    let imported = 0
    let skipped = 0

    for (const intentData of intents) {
      try {
        if (mode === 'create') {
          await CoreIntent.create(intentData)
          imported++
        } else if (mode === 'update') {
          await CoreIntent.update(intentData, {
            where: { id: intentData.id }
          })
          imported++
        }
      } catch (error) {
        skipped++
        console.error('导入意图失败:', intentData.name, error.message)
      }
    }

    res.json({
      success: true,
      message: `导入完成，成功${imported}个，跳过${skipped}个`,
      data: { imported, skipped }
    })
  } catch (error) {
    console.error('导入数据失败:', error)
    res.status(500).json({
      success: false,
      message: '导入数据失败',
      error: error.message
    })
  }
}

module.exports = {
  getList,
  getById,
  create,
  update,
  delete: deleteIntent,
  getFirstResponse,
  updateFirstResponse,
  batchOperation,
  updateSort,
  suggestKeywords,
  detectConflicts,
  analyzeSemantics,
  exportData,
  importData
}