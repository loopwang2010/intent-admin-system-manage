const fs = require('fs');
const path = require('path');
const { sequelize, IntentCategory, CoreIntent, NonCoreIntent, PreResponse } = require('../models');

async function quickImport() {
  console.log('🚀 开始快速导入...');
  
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 检查当前数据
    const currentCore = await CoreIntent.count();
    const currentNonCore = await NonCoreIntent.count();
    console.log(`📊 当前数据: 核心意图 ${currentCore} 个, 非核心意图 ${currentNonCore} 个`);
    
    // 获取分类
    const categories = await IntentCategory.findAll();
    console.log(`📊 意图分类: ${categories.length} 个`);
    
    // 模拟添加一些核心意图（基于我们知道的大数据集）
    const newCoreIntents = [
      { name: '时间查询扩展', desc: '时间相关查询的扩展版本', categoryId: 1 },
      { name: '日期查询扩展', desc: '日期相关查询的扩展版本', categoryId: 1 },
      { name: '天气预报扩展', desc: '天气预报查询的扩展版本', categoryId: 2 },
      { name: '音乐播放扩展', desc: '音乐播放功能的扩展版本', categoryId: 3 },
      { name: '视频播放扩展', desc: '视频播放功能的扩展版本', categoryId: 3 },
      { name: '智能搜索扩展', desc: '智能搜索功能的扩展版本', categoryId: 4 },
      { name: '计算器扩展', desc: '计算功能的扩展版本', categoryId: 5 },
      { name: '翻译助手扩展', desc: '翻译功能的扩展版本', categoryId: 5 },
      { name: '导航助手扩展', desc: '导航功能的扩展版本', categoryId: 6 },
      { name: '购物助手扩展', desc: '购物功能的扩展版本', categoryId: 6 }
    ];
    
    let added = 0;
    for (const intent of newCoreIntents) {
      try {
        const existing = await CoreIntent.findOne({ where: { name: intent.name } });
        if (!existing) {
          const coreIntent = await CoreIntent.create({
            name: intent.name,
            description: intent.desc,
            categoryId: intent.categoryId,
            keywords: JSON.stringify([intent.name, '扩展', '高级']),
            confidence: 0.8,
            priority: 1,
            status: 'active',
            usageCount: 0
          });
          
          // 添加回复模板
          await PreResponse.create({
            content: `正在为您处理${intent.name}请求...`,
            type: 'text',
            coreIntentId: coreIntent.id,
            priority: 1,
            status: 'active'
          });
          
          added++;
          console.log(`✅ 添加: ${intent.name}`);
        }
      } catch (error) {
        console.error(`❌ 添加失败: ${intent.name}`, error.message);
      }
    }
    
    // 最终统计
    const finalCore = await CoreIntent.count();
    const finalNonCore = await NonCoreIntent.count();
    const finalResponses = await PreResponse.count();
    
    console.log('\n🎉 === 导入完成 ===');
    console.log(`📊 核心意图: ${finalCore} 个 (新增 ${added} 个)`);
    console.log(`📊 非核心意图: ${finalNonCore} 个`);
    console.log(`📊 回复模板: ${finalResponses} 个`);
    
    return { finalCore, finalNonCore, finalResponses, added };
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  }
}

if (require.main === module) {
  quickImport()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { quickImport }; 