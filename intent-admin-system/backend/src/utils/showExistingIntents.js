const { sequelize, CoreIntent, NonCoreIntent } = require('../models');

async function showExistingIntents() {
  console.log('📋 === 查看现有意图数据 ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 查看核心意图
    console.log('🎯 现有核心意图:');
    const coreIntents = await CoreIntent.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']]
    });
    
    coreIntents.forEach((intent, index) => {
      console.log(`  ${index + 1}. [ID:${intent.id}] ${intent.name} - ${intent.description?.substring(0, 50)}...`);
    });
    
    console.log(`\n📊 核心意图总数: ${coreIntents.length}`);
    
    // 查看非核心意图
    console.log('\n💬 现有非核心意图:');
    const nonCoreIntents = await NonCoreIntent.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']]
    });
    
    nonCoreIntents.forEach((intent, index) => {
      console.log(`  ${index + 1}. [ID:${intent.id}] ${intent.name} - ${intent.description?.substring(0, 50)}...`);
    });
    
    console.log(`\n📊 非核心意图总数: ${nonCoreIntents.length}`);
    
    // 查看一些具体的意图名称，看看是否与CSV中的匹配
    console.log('\n🔍 检查是否与CSV数据匹配:');
    const csvSubtypes = ['时间查询', '日期查询', '天气查询', '播放功能', '设置提醒'];
    
    for (const subtype of csvSubtypes) {
      const existing = await CoreIntent.findOne({ where: { name: subtype } });
      if (existing) {
        console.log(`  ✅ ${subtype} - 已存在 (ID: ${existing.id})`);
      } else {
        console.log(`  ❌ ${subtype} - 不存在`);
      }
    }
    
  } catch (error) {
    console.error('❌ 查看失败:', error);
  }
}

if (require.main === module) {
  showExistingIntents()
    .then(() => {
      console.log('\n✅ 查看完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 查看失败:', error);
      process.exit(1);
    });
}

module.exports = { showExistingIntents }; 