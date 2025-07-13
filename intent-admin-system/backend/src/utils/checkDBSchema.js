const { sequelize } = require('../models');

async function checkDBSchema() {
  console.log('🔍 === 检查数据库结构 ===\n');
  
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 检查所有表
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\n📊 数据库表:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    // 检查核心意图表结构
    console.log('\n🎯 核心意图表结构:');
    const [coreColumns] = await sequelize.query("PRAGMA table_info(core_intents)");
    coreColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
    });
    
    // 检查非核心意图表结构
    console.log('\n💬 非核心意图表结构:');
    const [nonCoreColumns] = await sequelize.query("PRAGMA table_info(non_core_intents)");
    nonCoreColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
    });
    
    // 检查回复模板表结构
    console.log('\n📝 回复模板表结构:');
    const [responseColumns] = await sequelize.query("PRAGMA table_info(pre_responses)");
    responseColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
    });
    
    // 统计数据
    console.log('\n📊 数据统计:');
    const [coreCount] = await sequelize.query("SELECT COUNT(*) as count FROM core_intents");
    const [nonCoreCount] = await sequelize.query("SELECT COUNT(*) as count FROM non_core_intents");
    const [responseCount] = await sequelize.query("SELECT COUNT(*) as count FROM pre_responses");
    const [categoryCount] = await sequelize.query("SELECT COUNT(*) as count FROM intent_categories");
    
    console.log(`🎯 核心意图: ${coreCount[0].count} 个`);
    console.log(`💬 非核心意图: ${nonCoreCount[0].count} 个`);
    console.log(`📝 回复模板: ${responseCount[0].count} 个`);
    console.log(`📁 分类: ${categoryCount[0].count} 个`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

if (require.main === module) {
  checkDBSchema()
    .then(() => {
      console.log('\n✅ 检查完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 检查失败:', error);
      process.exit(1);
    });
}

module.exports = { checkDBSchema }; 