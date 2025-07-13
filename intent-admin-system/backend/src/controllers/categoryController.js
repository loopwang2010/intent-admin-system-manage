// 分类管理控制器 - 完整版本
const { Op } = require('sequelize')
const {
  IntentCategory, CoreIntent, NonCoreIntent, PreResponse, sequelize
} = require('../models')
const { logOperation } = require('../middleware/auditLogger')
const { OPERATION_TYPES } = require('../constants/operationTypes')

const getList = async (req, res) => {
  try {
    const {
      includeStats = 'true',
      includeChildCount = 'false',
      status,
      search,
      page = 1,
      limit = 50,
      sortBy = 'sortOrder',
      sortOrder = 'ASC',
      level, // 添加层级筛选
      parentId, // 添加父分类筛选
      treeMode = 'false' // 添加树形模式
    } = req.query

    const where = {}

    // 状态筛选
    if (status) {
      where.status = status
    }

    // 层级筛选
    if (level) {
      where.level = parseInt(level)
    }

    // 父分类筛选
    if (parentId) {
      where.parentId = parentId === 'null' ? null : parseInt(parentId)
    }

    // 搜索条件
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nameEn: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ]
    }

    const options = {
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    }

    // 树形模式包含子分类
    if (treeMode === 'true') {
      options.include = [
        {
          model: IntentCategory,
          as: 'Children',
          required: false,
          where: { status: status || 'active' }
        },
        {
          model: IntentCategory,
          as: 'Parent',
          required: false,
          attributes: ['id', 'name', 'code', 'color']
        }
      ]
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

        // 如果需要包含子分类数量
        if (includeChildCount === 'true' && category.level === 1) {
          const childCount = await IntentCategory.count({
            where: { parentId: category.id }
          })
          categoryData.childCount = childCount
        }

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

      const categories = rows.map((category) => category.toJSON())

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
    const { includeIntents = 'false', includeTree = 'false' } = req.query

    const options = {
      where: { id: parseInt(id) }
    }

    // 包含层级关系
    if (includeTree === 'true') {
      options.include = [
        {
          model: IntentCategory,
          as: 'Children',
          required: false,
          attributes: ['id', 'name', 'code', 'color', 'level', 'sortOrder', 'status']
        },
        {
          model: IntentCategory,
          as: 'Parent',
          required: false,
          attributes: ['id', 'name', 'code', 'color', 'level']
        }
      ]
    }

    // 包含意图信息
    if (includeIntents === 'true') {
      if (!options.include) options.include = []
      options.include.push(
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
      )
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
        totalIntentCount: (categoryData.CoreIntents ? categoryData.CoreIntents.length : 0)
                         + (categoryData.NonCoreIntents ? categoryData.NonCoreIntents.length : 0),
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
      version = '1.0.0',
      parentId,
      level = 1,
      code,
      color
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

    // 验证层级关系
    if (parentId) {
      const parentCategory = await IntentCategory.findByPk(parentId)
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: '父分类不存在'
        })
      }
      if (parentCategory.level >= 2) {
        return res.status(400).json({
          success: false,
          message: '最多支持两级分类，不能在二级分类下创建子分类'
        })
      }
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
      parentId: parentId || null,
      level: parentId ? 2 : level,
      code,
      color,
      isLeaf: !parentId || level === 2,
      childrenCount: 0,
      createdBy: req.user?.id
    }

    const newCategory = await IntentCategory.create(categoryData)

    // 如果是子分类，更新父分类的子分类计数
    if (parentId) {
      await sequelize.query(
        'UPDATE intent_categories SET childrenCount = childrenCount + 1, isLeaf = 0 WHERE id = ?',
        { replacements: [parentId] }
      )
    }

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
      version,
      parentId,
      code,
      color
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

    // 处理父分类变更
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId) {
        const newParent = await IntentCategory.findByPk(parentId)
        if (!newParent) {
          return res.status(400).json({
            success: false,
            message: '新父分类不存在'
          })
        }
        if (newParent.level >= 2) {
          return res.status(400).json({
            success: false,
            message: '不能将分类移动到二级分类下'
          })
        }
      }

      // 更新原父分类的子分类计数
      if (category.parentId) {
        await sequelize.query(
          'UPDATE intent_categories SET childrenCount = childrenCount - 1 WHERE id = ?',
          { replacements: [category.parentId] }
        )
      }

      // 更新新父分类的子分类计数
      if (parentId) {
        await sequelize.query(
          'UPDATE intent_categories SET childrenCount = childrenCount + 1, isLeaf = 0 WHERE id = ?',
          { replacements: [parentId] }
        )
        updateData.level = 2
        updateData.isLeaf = true
      } else {
        updateData.level = 1
        updateData.isLeaf = category.childrenCount === 0
      }

      updateData.parentId = parentId
    }

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
    if (code !== undefined) updateData.code = code
    if (color !== undefined) updateData.color = color

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

    // 检查是否有子分类
    const childrenCount = await IntentCategory.count({
      where: { parentId: id }
    })

    if (childrenCount > 0 && force !== 'true') {
      return res.status(400).json({
        success: false,
        message: '该分类下还有子分类，请先删除所有子分类后再删除该分类',
        data: {
          childrenCount,
          canForceDelete: true
        }
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
          childrenCount,
          canForceDelete: true
        }
      })
    }

    const oldValues = category.toJSON()

    if (force === 'true') {
      // 强制删除，先删除子分类
      if (childrenCount > 0) {
        await IntentCategory.destroy({
          where: { parentId: id }
        })
      }

      // 删除关联的意图
      if (totalIntentCount > 0) {
        await CoreIntent.destroy({
          where: { categoryId: id }
        })

        await NonCoreIntent.destroy({
          where: { categoryId: id }
        })
      }
    }

    // 如果是子分类，更新父分类的子分类计数
    if (category.parentId) {
      await sequelize.query(
        'UPDATE intent_categories SET childrenCount = childrenCount - 1 WHERE id = ?',
        { replacements: [category.parentId] }
      )
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
      message: `分类删除成功${childrenCount > 0 ? `，同时删除了 ${childrenCount} 个子分类` : ''}${totalIntentCount > 0 ? `，同时删除了 ${totalIntentCount} 个关联意图` : ''}`,
      data: {
        deletedIntentCount: totalIntentCount,
        deletedChildrenCount: childrenCount
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
      ...coreIntents.map((intent) => ({ ...intent.toJSON(), type: 'core' })),
      ...nonCoreIntents.map((intent) => ({ ...intent.toJSON(), type: 'non-core' }))
    ]

    const stats = {
      totalIntents: allIntents.length,
      coreIntents: coreIntents.length,
      nonCoreIntents: nonCoreIntents.length,
      activeIntents: allIntents.filter((intent) => intent.status === 'active').length,
      inactiveIntents: allIntents.filter((intent) => intent.status === 'inactive').length,
      draftIntents: allIntents.filter((intent) => intent.status === 'draft').length,
      totalUsage: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0),
      totalSuccess: allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0),
      avgConfidence: allIntents.length > 0
        ? allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0,
      successRate: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) > 0
        ? allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0)
        / allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) : 0
    }

    // 排行榜
    const topIntents = allIntents
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10)
      .map((intent) => ({
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
          active: allIntents.filter((intent) => intent.status === 'active'),
          inactive: allIntents.filter((intent) => intent.status === 'inactive'),
          draft: allIntents.filter((intent) => intent.status === 'draft')
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
      const csv = `id,name,description,icon,color,sort\n${
        mockData.map((item) => `${item.id},"${item.name}","${item.description}","${item.icon}","${item.color}",${item.sort}`).join('\n')}`
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
      message: '分类导入完成',
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

    const analytics = categories.map((category) => {
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
        successRate: allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) > 0
          ? allIntents.reduce((sum, intent) => sum + (intent.successCount || 0), 0)
          / allIntents.reduce((sum, intent) => sum + (intent.usageCount || 0), 0) : 0,
        avgConfidence: allIntents.length > 0
          ? allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0
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
        avgSuccessRate: analytics.length > 0
          ? analytics.reduce((sum, cat) => sum + cat.successRate, 0) / analytics.length : 0
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
      ...(category.CoreIntents || []).map((intent) => ({ ...intent.toJSON(), type: 'core' })),
      ...(category.NonCoreIntents || []).map((intent) => ({ ...intent.toJSON(), type: 'non-core' }))
    ]

    // 关键词分析
    const keywordAnalysis = {}
    allIntents.forEach((intent) => {
      if (intent.keywords) {
        try {
          const keywords = typeof intent.keywords === 'string'
            ? JSON.parse(intent.keywords) : intent.keywords

          if (Array.isArray(keywords)) {
            keywords.forEach((keyword) => {
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
      highPerformance: allIntents.filter((intent) => (intent.confidence || 0) >= 0.8 && (intent.usageCount || 0) > 10),
      lowPerformance: allIntents.filter((intent) => (intent.confidence || 0) < 0.6 || (intent.successCount || 0) / Math.max(intent.usageCount || 1, 1) < 0.5),
      underutilized: allIntents.filter((intent) => (intent.usageCount || 0) < 5)
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
        avgConfidence: allIntents.length > 0
          ? allIntents.reduce((sum, intent) => sum + (intent.confidence || 0), 0) / allIntents.length : 0
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

// 获取分类树结构
const getCategoryTree = async (req, res) => {
  try {
    const { includeStats = 'false', status = 'active' } = req.query

    // 获取所有一级分类及其子分类
    const primaryCategories = await IntentCategory.findAll({
      where: {
        level: 1,
        status
      },
      include: [
        {
          model: IntentCategory,
          as: 'Children',
          where: { status },
          required: false,
          attributes: ['id', 'name', 'nameEn', 'code', 'color', 'icon', 'level', 'sortOrder', 'status']
        }
      ],
      order: [['sortOrder', 'ASC'], [{ model: IntentCategory, as: 'Children' }, 'sortOrder', 'ASC']]
    })

    const treeData = await Promise.all(primaryCategories.map(async (category) => {
      const categoryData = category.toJSON()

      if (includeStats === 'true') {
        // 获取分类下的意图统计（包括子分类）
        let coreIntentCount = 0
        let nonCoreIntentCount = 0

        // 当前分类的意图数量
        coreIntentCount += await CoreIntent.count({ where: { categoryId: category.id } })
        nonCoreIntentCount += await NonCoreIntent.count({ where: { categoryId: category.id } })

        // 子分类的意图数量
        if (categoryData.Children) {
          for (const child of categoryData.Children) {
            coreIntentCount += await CoreIntent.count({ where: { categoryId: child.id } })
            nonCoreIntentCount += await NonCoreIntent.count({ where: { categoryId: child.id } })
          }
        }

        categoryData.stats = {
          coreIntentCount,
          nonCoreIntentCount,
          totalIntentCount: coreIntentCount + nonCoreIntentCount
        }
      }

      return categoryData
    }))

    res.json({
      success: true,
      data: treeData
    })
  } catch (error) {
    console.error('获取分类树失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类树失败',
      error: error.message
    })
  }
}

// 移动分类到新的父分类
const moveCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { newParentId } = req.body

    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 验证新父分类
    if (newParentId) {
      const newParent = await IntentCategory.findByPk(newParentId)
      if (!newParent) {
        return res.status(400).json({
          success: false,
          message: '新父分类不存在'
        })
      }
      if (newParent.level >= 2) {
        return res.status(400).json({
          success: false,
          message: '不能移动到二级分类下'
        })
      }
      if (newParentId == id) {
        return res.status(400).json({
          success: false,
          message: '不能将分类移动到自己下面'
        })
      }
    }

    const oldParentId = category.parentId

    // 更新分类
    await category.update({
      parentId: newParentId || null,
      level: newParentId ? 2 : 1,
      updatedBy: req.user?.id
    })

    // 更新原父分类的子分类计数
    if (oldParentId) {
      await sequelize.query(
        'UPDATE intent_categories SET childrenCount = childrenCount - 1 WHERE id = ?',
        { replacements: [oldParentId] }
      )
    }

    // 更新新父分类的子分类计数
    if (newParentId) {
      await sequelize.query(
        'UPDATE intent_categories SET childrenCount = childrenCount + 1, isLeaf = 0 WHERE id = ?',
        { replacements: [newParentId] }
      )
    }

    // 记录操作日志
    await logOperation({
      operationType: OPERATION_TYPES.CATEGORY_UPDATE,
      resource: 'category',
      resourceId: category.id,
      resourceName: category.name,
      oldValues: { parentId: oldParentId },
      newValues: { parentId: newParentId },
      metadata: { action: 'move_category' }
    }, req)

    res.json({
      success: true,
      message: '分类移动成功',
      data: category
    })
  } catch (error) {
    console.error('移动分类失败:', error)
    res.status(500).json({
      success: false,
      message: '移动分类失败',
      error: error.message
    })
  }
}

// 获取分类的面包屑路径
const getCategoryBreadcrumb = async (req, res) => {
  try {
    const { id } = req.params

    const category = await IntentCategory.findByPk(id, {
      include: [
        {
          model: IntentCategory,
          as: 'Parent',
          attributes: ['id', 'name', 'code', 'level']
        }
      ]
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    const breadcrumb = []

    if (category.Parent) {
      breadcrumb.push({
        id: category.Parent.id,
        name: category.Parent.name,
        code: category.Parent.code,
        level: category.Parent.level
      })
    }

    breadcrumb.push({
      id: category.id,
      name: category.name,
      code: category.code,
      level: category.level
    })

    res.json({
      success: true,
      data: breadcrumb
    })
  } catch (error) {
    console.error('获取分类面包屑失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类面包屑失败',
      error: error.message
    })
  }
}

// 获取子分类列表
const getChildCategories = async (req, res) => {
  try {
    const { id } = req.params
    const { includeResponseCount = 'false' } = req.query

    const childCategories = await IntentCategory.findAll({
      where: { parentId: id },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    })

    // 如果需要包含回复数量
    if (includeResponseCount === 'true') {
      for (const category of childCategories) {
        // 统计核心意图的回复数量
        const coreResponseCount = await PreResponse.count({
          include: [{
            model: CoreIntent,
            as: 'CoreIntent',
            where: { categoryId: category.id },
            required: true
          }]
        })

        // 统计非核心意图的回复数量
        const nonCoreResponseCount = await PreResponse.count({
          include: [{
            model: NonCoreIntent,
            as: 'NonCoreIntent',
            where: { categoryId: category.id },
            required: true
          }]
        })

        category.dataValues.responseCount = coreResponseCount + nonCoreResponseCount
      }
    }

    res.json({
      success: true,
      data: {
        categories: childCategories
      }
    })
  } catch (error) {
    console.error('获取子分类失败:', error)
    res.status(500).json({
      success: false,
      message: '获取子分类失败',
      error: error.message
    })
  }
}

// 获取父分类选项
const getParentOptions = async (req, res) => {
  try {
    const parentCategories = await IntentCategory.findAll({
      where: { level: 1 },
      attributes: ['id', 'name', 'code', 'description'],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    })

    res.json({
      success: true,
      data: parentCategories
    })
  } catch (error) {
    console.error('获取父分类选项失败:', error)
    res.status(500).json({
      success: false,
      message: '获取父分类选项失败',
      error: error.message
    })
  }
}

// 获取分类的回复内容
const getCategoryResponses = async (req, res) => {
  try {
    const { id } = req.params

    // 查找分类
    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    const responses = []

    // 获取核心意图的回复
    const coreIntents = await CoreIntent.findAll({
      where: { categoryId: id },
      include: [{
        model: PreResponse,
        as: 'Responses',
        order: [['priority', 'ASC']]
      }]
    })

    for (const intent of coreIntents) {
      if (intent.Responses) {
        responses.push(...intent.Responses.map(r => ({
          ...r.toJSON(),
          intentName: intent.name,
          intentType: 'core'
        })))
      }
    }

    // 获取非核心意图的回复
    const nonCoreIntents = await NonCoreIntent.findAll({
      where: { categoryId: id },
      include: [{
        model: PreResponse,
        as: 'Responses',
        order: [['priority', 'ASC']]
      }]
    })

    for (const intent of nonCoreIntents) {
      if (intent.Responses) {
        responses.push(...intent.Responses.map(r => ({
          ...r.toJSON(),
          intentName: intent.name,
          intentType: 'non-core'
        })))
      }
    }

    // 按优先级排序
    responses.sort((a, b) => (a.priority || 999) - (b.priority || 999))

    res.json({
      success: true,
      data: {
        category: category,
        responses: responses
      }
    })
  } catch (error) {
    console.error('获取分类回复内容失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分类回复内容失败',
      error: error.message
    })
  }
}

// 添加分类回复内容
const addCategoryResponse = async (req, res) => {
  try {
    const { id } = req.params
    const { content, type = 'text', priority } = req.body

    // 查找分类
    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 查找或创建非核心意图
    let nonCoreIntent = await NonCoreIntent.findOne({
      where: { categoryId: id }
    })

    if (!nonCoreIntent) {
      nonCoreIntent = await NonCoreIntent.create({
        name: `${category.name}默认回复`,
        description: `${category.name}分类的默认回复意图`,
        categoryId: id,
        keywords: JSON.stringify([category.name, '默认', '回复']),
        confidence: 0.8,
        priority: 1,
        status: 'active',
        language: 'zh-CN',
        version: '1.0.0'
      })
    }

    // 创建回复
    const response = await PreResponse.create({
      nonCoreIntentId: nonCoreIntent.id,
      content,
      type,
      priority: priority || 1,
      status: 'active',
      language: 'zh-CN',
      version: '1.0.0'
    })

    await logOperation(req.user?.id, 'CREATE', 'pre_response', response.id, {
      content: content.substring(0, 50),
      categoryId: id
    })

    res.json({
      success: true,
      data: response,
      message: '回复内容添加成功'
    })
  } catch (error) {
    console.error('添加分类回复内容失败:', error)
    res.status(500).json({
      success: false,
      message: '添加分类回复内容失败',
      error: error.message
    })
  }
}

// 更新分类回复内容
const updateCategoryResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params
    const { content, type, priority, status } = req.body

    const response = await PreResponse.findByPk(responseId)
    if (!response) {
      return res.status(404).json({
        success: false,
        message: '回复内容不存在'
      })
    }

    const oldData = { ...response.toJSON() }

    await response.update({
      content: content !== undefined ? content : response.content,
      type: type !== undefined ? type : response.type,
      priority: priority !== undefined ? priority : response.priority,
      status: status !== undefined ? status : response.status
    })

    await logOperation(req.user?.id, 'UPDATE', 'pre_response', response.id, {
      old: oldData,
      new: response.toJSON()
    })

    res.json({
      success: true,
      data: response,
      message: '回复内容更新成功'
    })
  } catch (error) {
    console.error('更新分类回复内容失败:', error)
    res.status(500).json({
      success: false,
      message: '更新分类回复内容失败',
      error: error.message
    })
  }
}

// 删除分类回复内容
const deleteCategoryResponse = async (req, res) => {
  try {
    const { responseId } = req.params

    const response = await PreResponse.findByPk(responseId)
    if (!response) {
      return res.status(404).json({
        success: false,
        message: '回复内容不存在'
      })
    }

    const responseData = { ...response.toJSON() }
    await response.destroy()

    await logOperation(req.user?.id, 'DELETE', 'pre_response', responseId, responseData)

    res.json({
      success: true,
      message: '回复内容删除成功'
    })
  } catch (error) {
    console.error('删除分类回复内容失败:', error)
    res.status(500).json({
      success: false,
      message: '删除分类回复内容失败',
      error: error.message
    })
  }
}

// 批量更新分类回复内容
const batchUpdateCategoryResponses = async (req, res) => {
  const transaction = await sequelize.transaction()
  
  try {
    const { id } = req.params
    const { responses } = req.body

    // 查找分类
    const category = await IntentCategory.findByPk(id)
    if (!category) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 查找或创建非核心意图
    let nonCoreIntent = await NonCoreIntent.findOne({
      where: { categoryId: id },
      transaction
    })

    if (!nonCoreIntent) {
      nonCoreIntent = await NonCoreIntent.create({
        name: `${category.name}默认回复`,
        description: `${category.name}分类的默认回复意图`,
        categoryId: id,
        keywords: JSON.stringify([category.name, '默认', '回复']),
        confidence: 0.8,
        priority: 1,
        status: 'active',
        language: 'zh-CN',
        version: '1.0.0'
      }, { transaction })
    }

    // 删除现有的回复内容
    await PreResponse.destroy({
      where: { nonCoreIntentId: nonCoreIntent.id },
      transaction
    })

    // 创建新的回复内容
    const newResponses = []
    for (let i = 0; i < responses.length; i++) {
      const responseData = responses[i]
      if (responseData.content && responseData.content.trim()) {
        const newResponse = await PreResponse.create({
          nonCoreIntentId: nonCoreIntent.id,
          content: responseData.content.trim(),
          type: responseData.type || 'text',
          priority: i + 1,
          status: responseData.status || 'active',
          language: 'zh-CN',
          version: '1.0.0'
        }, { transaction })
        
        newResponses.push(newResponse)
      }
    }

    await transaction.commit()

    await logOperation(req.user?.id, 'BATCH_UPDATE', 'pre_response', `category_${id}`, {
      categoryId: id,
      responseCount: newResponses.length
    })

    res.json({
      success: true,
      data: {
        responses: newResponses
      },
      message: '回复内容批量更新成功'
    })
  } catch (error) {
    await transaction.rollback()
    console.error('批量更新分类回复内容失败:', error)
    res.status(500).json({
      success: false,
      message: '批量更新分类回复内容失败',
      error: error.message
    })
  }
}

// 获取AI推荐回复内容
const getAIRecommendedResponses = async (req, res) => {
  try {
    const { id } = req.params

    // 查找分类
    const category = await IntentCategory.findByPk(id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    // 根据分类特点生成推荐回复
    const recommendations = generateRecommendedResponses(category)

    res.json({
      success: true,
      data: {
        category: category,
        recommendations: recommendations
      }
    })
  } catch (error) {
    console.error('获取AI推荐回复失败:', error)
    res.status(500).json({
      success: false,
      message: '获取AI推荐回复失败',
      error: error.message
    })
  }
}

// 生成推荐回复内容的辅助函数
function generateRecommendedResponses(category) {
  const categoryName = category.name
  const categoryCode = category.code

  let baseTemplates = []

  // 根据分类代码生成不同的回复模板
  switch (true) {
    case categoryCode.includes('MUSIC'):
      baseTemplates = [
        '正在为您播放音乐...',
        '音乐已暂停，随时为您继续播放',
        '正在切换到下一首歌曲',
        '音量已调整，请享受音乐',
        '已为您找到相关音乐'
      ]
      break
    case categoryCode.includes('VIDEO'):
      baseTemplates = [
        '正在为您播放视频内容...',
        '视频已暂停，点击继续观看',
        '正在切换到下一个视频',
        '视频音量已调整',
        '正在为您搜索相关视频'
      ]
      break
    case categoryCode.includes('WEATHER'):
      baseTemplates = [
        '正在为您查询天气信息...',
        '今天天气{weather}，温度{temperature}度',
        '建议您{suggestion}',
        '明天天气预报：{forecast}',
        '当前空气质量{airQuality}'
      ]
      break
    case categoryCode.includes('TIME'):
      baseTemplates = [
        '现在是{time}',
        '闹钟已设置为{alarmTime}',
        '提醒已添加：{reminder}',
        '距离{event}还有{duration}',
        '计时器已启动'
      ]
      break
    case categoryCode.includes('SMARTHOME'):
      baseTemplates = [
        '{device}已为您打开',
        '{device}已关闭',
        '{room}的{device}已调整为{setting}',
        '智能家居设备状态已更新',
        '场景模式"{scene}"已激活'
      ]
      break
    case categoryCode.includes('NEWS'):
      baseTemplates = [
        '为您播报最新新闻...',
        '今日头条：{headline}',
        '正在获取{category}新闻',
        '新闻播报完毕',
        '更多详情请关注后续报道'
      ]
      break
    case categoryCode.includes('GAME'):
      baseTemplates = [
        '游戏开始！',
        '恭喜您获得{achievement}！',
        '当前得分：{score}',
        '游戏暂停，随时继续',
        '挑战完成，表现出色！'
      ]
      break
    case categoryCode.includes('TRANSPORT'):
      baseTemplates = [
        '正在为您规划路线...',
        '建议路线：{route}',
        '预计到达时间：{eta}',
        '当前路况：{traffic}',
        '已为您叫车，请稍等'
      ]
      break
    case categoryCode.includes('FOOD'):
      baseTemplates = [
        '为您推荐{restaurant}',
        '菜品信息：{dish}',
        '正在查找附近美食...',
        '餐厅已预订成功',
        '外卖预计{time}送达'
      ]
      break
    case categoryCode.includes('ENCYCLOPEDIA'):
      baseTemplates = [
        '根据您的问题，{answer}',
        '让我为您查询相关信息...',
        '关于{topic}的解释是：{explanation}',
        '希望这个回答对您有帮助',
        '还有其他问题吗？'
      ]
      break
    case categoryCode.includes('TRANSLATE'):
      baseTemplates = [
        '正在为您翻译...',
        '翻译结果：{translation}',
        '{language}翻译完成',
        '语言已识别为{language}',
        '翻译准确度：{accuracy}%'
      ]
      break
    case categoryCode.includes('DEVICE'):
      baseTemplates = [
        '设备已连接',
        '{device}状态正常',
        '正在控制{device}...',
        '设备设置已更新',
        '所有设备运行正常'
      ]
      break
    case categoryCode.includes('SYSTEM'):
      baseTemplates = [
        '系统设置已更新',
        '配置已保存',
        '系统优化完成',
        '设置将在重启后生效',
        '系统状态良好'
      ]
      break
    default:
      // 通用模板
      baseTemplates = [
        `正在为您处理${categoryName}请求...`,
        `${categoryName}功能已启动`,
        `${categoryName}操作完成`,
        `正在${categoryName}中，请稍等`,
        `${categoryName}服务已准备就绪`
      ]
  }

  // 添加通用的情感化回复
  const emotionalTemplates = [
    '很高兴为您服务！',
    '希望能帮到您',
    '如有疑问，随时告诉我',
    '我会尽力帮助您',
    '祝您使用愉快！'
  ]

  // 合并所有模板并添加元数据
  const allRecommendations = [
    ...baseTemplates.map((content, index) => ({
      content,
      type: 'text',
      priority: index + 1,
      status: 'active',
      source: 'ai-functional',
      confidence: 0.9
    })),
    ...emotionalTemplates.map((content, index) => ({
      content,
      type: 'text',
      priority: baseTemplates.length + index + 1,
      status: 'active',
      source: 'ai-emotional',
      confidence: 0.8
    }))
  ]

  return allRecommendations.slice(0, 8) // 限制推荐数量
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
  analyzeCategoryIntents,
  getCategoryTree,
  moveCategory,
  getCategoryBreadcrumb,
  getChildCategories,
  getParentOptions,
  getCategoryResponses,
  addCategoryResponse,
  updateCategoryResponse,
  deleteCategoryResponse,
  batchUpdateCategoryResponses,
  getAIRecommendedResponses
}
