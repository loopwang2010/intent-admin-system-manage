const { sequelize } = require('../models')

async function checkDatabase() {
  try {
    console.log('正在连接数据库...')
    await sequelize.authenticate()
    console.log('数据库连接成功!')
    
    const { 
      IntentCategory, 
      CoreIntent, 
      NonCoreIntent, 
      PreResponse, 
      SystemLog,
      DataStatistics 
    } = require('../models')
    
    // 检查意图类别
    console.log('\n=== 意图类别 ===')
    const categories = await IntentCategory.findAll({ order: [['sortOrder', 'ASC']] })
    console.log(`总数: ${categories.length}`)
    categories.forEach(cat => {
      console.log(`${cat.id}. ${cat.name} (${cat.icon}) - ${cat.description}`)
    })
    
    // 检查核心意图
    console.log('\n=== 核心意图 ===')
    const coreIntents = await CoreIntent.findAll({ 
      include: [{ model: IntentCategory, as: 'category' }],
      order: [['categoryId', 'ASC'], ['priority', 'ASC']]
    })
    console.log(`总数: ${coreIntents.length}`)
    coreIntents.forEach(intent => {
      console.log(`${intent.id}. ${intent.name} [${intent.category.name}] - 置信度:${intent.confidence}, 优先级:${intent.priority}`)
      console.log(`   关键词: ${JSON.stringify(intent.keywords)}`)
    })
    
    // 检查非核心意图
    console.log('\n=== 非核心意图 ===')
    const nonCoreIntents = await NonCoreIntent.findAll({ 
      include: [{ model: IntentCategory, as: 'category' }],
      order: [['categoryId', 'ASC']]
    })
    console.log(`总数: ${nonCoreIntents.length}`)
    nonCoreIntents.forEach(intent => {
      console.log(`${intent.id}. ${intent.name} [${intent.category.name}] - 置信度:${intent.confidence}`)
      console.log(`   关键词: ${JSON.stringify(intent.keywords)}`)
      console.log(`   回复: ${intent.response}`)
    })
    
    // 检查先行回复
    console.log('\n=== 先行回复 ===')
    const preResponses = await PreResponse.findAll({ 
      include: [{ model: CoreIntent, as: 'coreIntent' }],
      order: [['coreIntentId', 'ASC'], ['priority', 'ASC']]
    })
    console.log(`总数: ${preResponses.length}`)
    preResponses.forEach(response => {
      console.log(`${response.id}. [${response.coreIntent.name}] 优先级:${response.priority} - ${response.content}`)
    })
    
    // 检查系统日志
    console.log('\n=== 系统日志 ===')
    const logs = await SystemLog.findAll({ order: [['createdAt', 'DESC']] })
    console.log(`总数: ${logs.length}`)
    logs.forEach(log => {
      console.log(`${log.id}. [${log.level}] ${log.message} - ${log.source}`)
    })
    
    // 检查数据统计
    console.log('\n=== 数据统计 ===')
    const stats = await DataStatistics.findAll({ order: [['date', 'DESC']] })
    console.log(`总数: ${stats.length}`)
    stats.forEach(stat => {
      console.log(`${stat.id}. ${stat.date} - 总请求:${stat.totalRequests}, 成功:${stat.successRequests}, 失败:${stat.failureRequests}`)
    })
    
    // 检查重复项
    console.log('\n=== 重复检查 ===')
    
    // 检查类别名称重复
    const duplicateCategories = await sequelize.query(`
      SELECT name, COUNT(*) as count 
      FROM intent_categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT })
    
    if (duplicateCategories.length > 0) {
      console.log('发现重复的类别名称:')
      duplicateCategories.forEach(dup => console.log(`  ${dup.name}: ${dup.count}次`))
    } else {
      console.log('✓ 类别名称无重复')
    }
    
    // 检查核心意图名称重复
    const duplicateCoreIntents = await sequelize.query(`
      SELECT name, COUNT(*) as count 
      FROM core_intents 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT })
    
    if (duplicateCoreIntents.length > 0) {
      console.log('发现重复的核心意图名称:')
      duplicateCoreIntents.forEach(dup => console.log(`  ${dup.name}: ${dup.count}次`))
    } else {
      console.log('✓ 核心意图名称无重复')
    }
    
    // 检查非核心意图名称重复
    const duplicateNonCoreIntents = await sequelize.query(`
      SELECT name, COUNT(*) as count 
      FROM non_core_intents 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT })
    
    if (duplicateNonCoreIntents.length > 0) {
      console.log('发现重复的非核心意图名称:')
      duplicateNonCoreIntents.forEach(dup => console.log(`  ${dup.name}: ${dup.count}次`))
    } else {
      console.log('✓ 非核心意图名称无重复')
    }
    
    console.log('\n数据库检查完成!')
    process.exit(0)
  } catch (error) {
    console.error('数据库检查失败:', error)
    process.exit(1)
  }
}

// 运行检查
checkDatabase() 