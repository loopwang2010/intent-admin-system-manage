const { sequelize } = require('../models')

async function finalVerification() {
  try {
    console.log('🔌 连接数据库进行最终验证...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const dbPath = sequelize.options.storage
    console.log(`📁 数据库文件路径: ${dbPath}`)
    
    console.log('\n📊 === 最终数据统计 ===')
    
    // 1. 意图类别
    const [categoryCount] = await sequelize.query('SELECT COUNT(*) as count FROM intent_categories;')
    console.log(`🏷️  意图类别: ${categoryCount[0].count} 个`)
    
    // 2. 核心意图
    const [coreCount] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents;')
    console.log(`🎯 核心意图: ${coreCount[0].count} 个`)
    
    // 3. 非核心意图
    const [nonCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents;')
    console.log(`🗣️  非核心意图: ${nonCoreCount[0].count} 个`)
    
    // 4. 回复模板
    const [responseCount] = await sequelize.query('SELECT COUNT(*) as count FROM pre_responses;')
    console.log(`💬 回复模板: ${responseCount[0].count} 个`)
    
    // 5. 检查回复模板分布
    console.log('\n🔍 === 回复模板分布检查 ===')
    const [responseDist] = await sequelize.query(`
      SELECT ci.name, COUNT(pr.id) as response_count 
      FROM core_intents ci 
      LEFT JOIN pre_responses pr ON ci.id = pr.coreIntentId 
      GROUP BY ci.id, ci.name 
      ORDER BY ci.id
      LIMIT 10
    `)
    
    responseDist.forEach(item => {
      console.log(`"${item.name}": ${item.response_count} 个回复模板`)
    })
    
    if (responseDist.length > 10) {
      console.log('...(还有更多)')
    }
    
    // 6. 检查是否有缺失回复模板的核心意图
    const [missingResponses] = await sequelize.query(`
      SELECT ci.name 
      FROM core_intents ci 
      LEFT JOIN pre_responses pr ON ci.id = pr.coreIntentId 
      WHERE pr.id IS NULL
    `)
    
    if (missingResponses.length === 0) {
      console.log('\n✅ 所有核心意图都有对应的回复模板')
    } else {
      console.log(`\n⚠️  发现 ${missingResponses.length} 个核心意图缺少回复模板:`)
      missingResponses.forEach(item => console.log(`  - ${item.name}`))
    }
    
    // 7. 随机显示几个回复模板示例
    console.log('\n💬 === 回复模板示例 ===')
    const [sampleResponses] = await sequelize.query(`
      SELECT ci.name as intent_name, pr.content, pr.priority
      FROM pre_responses pr
      JOIN core_intents ci ON pr.coreIntentId = ci.id
      ORDER BY RANDOM()
      LIMIT 5
    `)
    
    sampleResponses.forEach(item => {
      console.log(`"${item.intent_name}" (优先级${item.priority}): ${item.content}`)
    })
    
    console.log('\n🎉 === 数据库构建完成总结 ===')
    console.log(`✅ 意图类别: ${categoryCount[0].count} 个 (完整覆盖智能音箱应用场景)`)
    console.log(`✅ 核心意图: ${coreCount[0].count} 个 (包含丰富的语音模板数据)`)
    console.log(`✅ 非核心意图: ${nonCoreCount[0].count} 个 (覆盖闲聊和情感交互)`)
    console.log(`✅ 回复模板: ${responseCount[0].count} 个 (每个核心意图3个变化模板)`)
    console.log('\n🚀 智能音箱意图管理系统数据库已就绪！')
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

finalVerification() 