const { sequelize } = require('../models')

async function checkDatabaseContent() {
  try {
    console.log('🔌 正在连接数据库...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const { 
      IntentCategory, 
      CoreIntent, 
      NonCoreIntent, 
      PreResponse,
      SystemLog,
      DataStatistics
    } = require('../models')
    
    // 1. 检查表结构
    console.log('\n📊 === 数据库表结构 ===')
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log('数据库中的表：', tables)
    
    // 2. 检查各表的记录数量
    console.log('\n📈 === 各表记录数量 ===')
    
    const categoriesCount = await IntentCategory.count()
    console.log(`意图类别表 (intent_categories): ${categoriesCount} 条记录`)
    
    const coreIntentsCount = await CoreIntent.count()
    console.log(`核心意图表 (core_intents): ${coreIntentsCount} 条记录`)
    
    const nonCoreIntentsCount = await NonCoreIntent.count()
    console.log(`非核心意图表 (non_core_intents): ${nonCoreIntentsCount} 条记录`)
    
    const preResponsesCount = await PreResponse.count()
    console.log(`先行回复表 (pre_responses): ${preResponsesCount} 条记录`)
    
    const systemLogsCount = await SystemLog.count()
    console.log(`系统日志表 (system_logs): ${systemLogsCount} 条记录`)
    
    const dataStatsCount = await DataStatistics.count()
    console.log(`数据统计表 (data_statistics): ${dataStatsCount} 条记录`)
    
    // 3. 查看部分核心意图数据
    if (coreIntentsCount > 0) {
      console.log('\n🎯 === 核心意图样本数据 ===')
      const sampleCoreIntents = await CoreIntent.findAll({
        limit: 5,
        include: [{
          model: require('../models').IntentCategory,
          as: 'category'
        }]
      })
      
      sampleCoreIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} [${intent.category?.name || '未分类'}]`)
        console.log(`   描述: ${intent.description}`)
        console.log(`   关键词数量: ${intent.keywords ? intent.keywords.length : 0}`)
        console.log(`   置信度: ${intent.confidence}`)
        console.log('---')
      })
    }
    
    // 4. 查看部分非核心意图数据
    if (nonCoreIntentsCount > 0) {
      console.log('\n💬 === 非核心意图样本数据 ===')
      const sampleNonCoreIntents = await NonCoreIntent.findAll({
        limit: 5,
        include: [{
          model: require('../models').IntentCategory,
          as: 'category'
        }]
      })
      
      sampleNonCoreIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} [${intent.category?.name || '未分类'}]`)
        console.log(`   描述: ${intent.description}`)
        console.log(`   关键词数量: ${intent.keywords ? intent.keywords.length : 0}`)
        console.log(`   回复: ${intent.response}`)
        console.log('---')
      })
    }
    
    // 5. 使用原生SQL查询确认
    console.log('\n🔍 === 原生SQL查询验证 ===')
    
    const [coreResults] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents')
    console.log(`SQL查询 - 核心意图表记录数: ${coreResults[0].count}`)
    
    const [nonCoreResults] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents')
    console.log(`SQL查询 - 非核心意图表记录数: ${nonCoreResults[0].count}`)
    
    // 6. 查看表的实际列信息
    console.log('\n📋 === 核心意图表结构 ===')
    const [coreTableInfo] = await sequelize.query('PRAGMA table_info(core_intents)')
    coreTableInfo.forEach(column => {
      console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`)
    })
    
    console.log('\n📋 === 非核心意图表结构 ===')
    const [nonCoreTableInfo] = await sequelize.query('PRAGMA table_info(non_core_intents)')
    nonCoreTableInfo.forEach(column => {
      console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 检查数据库内容失败:', error)
    process.exit(1)
  }
}

// 运行检查
checkDatabaseContent() 