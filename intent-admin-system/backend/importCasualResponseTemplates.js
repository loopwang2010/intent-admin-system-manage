const { sequelize, PreResponse, NonCoreIntent } = require('./src/models')
const fs = require('fs')
const path = require('path')

async function importCasualResponseTemplates() {
  try {
    console.log('🚀 开始导入随意回复模板数据...')
    
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    // 读取casual_response_templates.json文件
    const templateFilePath = path.join(__dirname, 'src/data/casual_response_templates.json')
    
    if (!fs.existsSync(templateFilePath)) {
      console.log('❌ casual_response_templates.json 文件不存在')
      return
    }

    const templateData = JSON.parse(fs.readFileSync(templateFilePath, 'utf8'))
    console.log(`📊 找到 ${Object.keys(templateData).length} 个分类的回复模板`)

    let totalImported = 0
    let templateCount = 0

    // 统计模板总数
    Object.values(templateData).forEach(responses => {
      if (Array.isArray(responses)) {
        templateCount += responses.length
      }
    })

    console.log(`📊 总计 ${templateCount} 个回复模板`)

    // 为每个分类的模板创建回复记录
    for (const [categoryName, responses] of Object.entries(templateData)) {
      if (!Array.isArray(responses)) continue

      console.log(`\\n📁 处理分类: ${categoryName} (${responses.length} 个模板)`)

      // 查找对应的非核心意图
      const intent = await NonCoreIntent.findOne({
        where: { name: categoryName }
      })

      let nonCoreIntentId = intent ? intent.id : null

      // 如果没有找到对应的非核心意图，创建一个
      if (!intent) {
        console.log(`  ⚠️  未找到对应的非核心意图: ${categoryName}，将创建新的意图`)
        
        try {
          const newIntent = await NonCoreIntent.create({
            name: categoryName,
            description: `${categoryName}相关的随意回复`,
            categoryId: 5, // 默认分配给"新闻资讯"分类，后续可以调整
            keywords: JSON.stringify([categoryName]),
            confidence: 0.8,
            priority: 3,
            status: 'active',
            language: 'zh-CN',
            version: '1.0.0'
          })
          nonCoreIntentId = newIntent.id
          console.log(`  ✅ 创建新意图: ${categoryName} (ID: ${nonCoreIntentId})`)
        } catch (error) {
          console.log(`  ❌ 创建意图失败: ${error.message}`)
          continue
        }
      }

      // 导入该分类的所有回复模板
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i]
        if (!response || typeof response !== 'string') continue

        try {
          // 检查是否已存在相同的回复
          const existing = await PreResponse.findOne({
            where: {
              nonCoreIntentId,
              content: response
            }
          })

          if (existing) {
            console.log(`  ⏭️  回复已存在: ${response.substring(0, 30)}...`)
            continue
          }

          // 创建新的回复模板
          await PreResponse.create({
            nonCoreIntentId,
            content: response,
            type: 'text',
            priority: i + 1, // 按顺序设置优先级
            status: 'active',
            language: 'zh-CN',
            version: '1.0.0'
          })

          totalImported++
          console.log(`  ✅ 导入回复 ${i + 1}/${responses.length}: ${response.substring(0, 50)}...`)

        } catch (error) {
          console.log(`  ❌ 导入回复失败: ${error.message}`)
        }
      }
    }

    // 统计最终结果
    const finalCount = await PreResponse.count()
    console.log(`\\n🎯 导入完成！`)
    console.log(`  - 本次导入: ${totalImported} 个回复模板`)
    console.log(`  - 数据库总计: ${finalCount} 个回复模板`)

    // 验证数据
    const byType = await PreResponse.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    })

    console.log(`\\n📊 回复模板类型分布:`)
    byType.forEach(item => {
      console.log(`  - ${item.type}: ${item.getDataValue('count')} 个`)
    })

    return {
      imported: totalImported,
      total: finalCount
    }

  } catch (error) {
    console.error('❌ 导入失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  importCasualResponseTemplates()
    .then((result) => {
      console.log(`\\n🎉 导入完成！导入了 ${result.imported} 个模板，数据库总计 ${result.total} 个回复模板`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('导入失败:', error)
      process.exit(1)
    })
}

module.exports = importCasualResponseTemplates