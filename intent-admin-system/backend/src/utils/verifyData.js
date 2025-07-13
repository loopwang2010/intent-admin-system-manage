const { sequelize } = require('../models')

async function verifyDatabaseData() {
  try {
    console.log('🔌 连接数据库中...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const dbPath = sequelize.options.storage
    console.log(`📁 数据库文件路径: ${dbPath}`)
    
    // 原始SQL查询，确保查询到真实数据
    console.log('\n📊 === 使用原始SQL查询数据 ===')
    
    // 1. 查询所有表
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';")
    console.log('数据库中的表:', tables.map(t => t.name).join(', '))
    
    // 2. 查询核心意图数量
    const [coreCount] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents;')
    console.log(`核心意图表记录数: ${coreCount[0].count}`)
    
    // 3. 查询非核心意图数量  
    const [nonCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents;')
    console.log(`非核心意图表记录数: ${nonCoreCount[0].count}`)
    
    // 4. 查询意图类别数量
    const [categoryCount] = await sequelize.query('SELECT COUNT(*) as count FROM intent_categories;')
    console.log(`意图类别表记录数: ${categoryCount[0].count}`)
    
    // 5. 显示前几条核心意图数据
    console.log('\n🎯 === 核心意图数据示例 ===')
    const [coreIntents] = await sequelize.query('SELECT id, name, description, categoryId FROM core_intents LIMIT 10;')
    coreIntents.forEach(intent => {
      console.log(`ID: ${intent.id}, 名称: ${intent.name}, 描述: ${intent.description}, 类别ID: ${intent.categoryId}`)
    })
    
    // 6. 显示前几条非核心意图数据
    console.log('\n🗣️ === 非核心意图数据示例 ===')
    const [nonCoreIntents] = await sequelize.query('SELECT id, name, description, categoryId FROM non_core_intents LIMIT 10;')
    nonCoreIntents.forEach(intent => {
      console.log(`ID: ${intent.id}, 名称: ${intent.name}, 描述: ${intent.description}, 类别ID: ${intent.categoryId}`)
    })
    
    // 7. 检查关键词数据
    console.log('\n🔍 === 关键词数据检查 ===')
    const [keywordSample] = await sequelize.query('SELECT name, keywords FROM core_intents WHERE keywords IS NOT NULL LIMIT 3;')
    keywordSample.forEach(intent => {
      try {
        const keywords = JSON.parse(intent.keywords)
        console.log(`${intent.name}: ${keywords.length}个关键词 - ${keywords.slice(0, 5).join(', ')}...`)
      } catch (e) {
        console.log(`${intent.name}: 关键词格式错误`)
      }
    })
    
    console.log('\n✅ 数据验证完成!')
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

verifyDatabaseData() 