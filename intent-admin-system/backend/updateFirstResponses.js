const fs = require('fs');
const db = require('./src/models');
const { Op } = require('sequelize');

async function updateFirstResponses() {
  try {
    console.log('开始更新首句回复到数据库...');
    
    // 读取提取的数据
    const firstResponsesData = JSON.parse(fs.readFileSync('./firstResponsesData.json', 'utf8'));
    
    console.log(`准备更新: 核心意图 ${firstResponsesData.core.length} 条, 非核心意图 ${firstResponsesData.nonCore.length} 条`);
    
    // 连接数据库
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    let coreUpdated = 0;
    let nonCoreUpdated = 0;
    let coreErrors = 0;
    let nonCoreErrors = 0;

    // 更新核心意图的首句回复
    console.log('\n正在更新核心意图首句回复...');
    for (const item of firstResponsesData.core) {
      try {
        const [updatedRows] = await db.CoreIntent.update(
          { 
            firstResponse: item.firstResponse,
            responseType: 'immediate'
          },
          { 
            where: { id: item.intentId }
          }
        );
        
        if (updatedRows > 0) {
          coreUpdated++;
          console.log(`✅ 更新核心意图 "${item.intentName}" (ID: ${item.intentId}): "${item.firstResponse}"`);
        } else {
          console.log(`⚠️  核心意图 "${item.intentName}" (ID: ${item.intentId}) 未找到`);
        }
      } catch (error) {
        coreErrors++;
        console.error(`❌ 更新核心意图 "${item.intentName}" 失败:`, error.message);
      }
    }

    // 更新非核心意图的首句回复  
    console.log('\n正在更新非核心意图首句回复...');
    for (const item of firstResponsesData.nonCore) {
      try {
        const [updatedRows] = await db.NonCoreIntent.update(
          { 
            firstResponse: item.firstResponse,
            responseType: 'immediate'
          },
          { 
            where: { id: item.intentId }
          }
        );
        
        if (updatedRows > 0) {
          nonCoreUpdated++;
          console.log(`✅ 更新非核心意图 "${item.intentName}" (ID: ${item.intentId}): "${item.firstResponse}"`);
        } else {
          console.log(`⚠️  非核心意图 "${item.intentName}" (ID: ${item.intentId}) 未找到`);
        }
      } catch (error) {
        nonCoreErrors++;
        console.error(`❌ 更新非核心意图 "${item.intentName}" 失败:`, error.message);
      }
    }

    // 统计结果
    console.log('\n========== 更新结果统计 ==========');
    console.log(`✅ 核心意图成功更新: ${coreUpdated} 条`);
    console.log(`✅ 非核心意图成功更新: ${nonCoreUpdated} 条`);
    console.log(`❌ 核心意图更新失败: ${coreErrors} 条`);
    console.log(`❌ 非核心意图更新失败: ${nonCoreErrors} 条`);
    console.log(`📊 总成功率: ${((coreUpdated + nonCoreUpdated) / (firstResponsesData.core.length + firstResponsesData.nonCore.length) * 100).toFixed(1)}%`);

    // 验证更新结果
    console.log('\n正在验证更新结果...');
    
    const coreIntentsWithFirstResponse = await db.CoreIntent.count({
      where: {
        firstResponse: {
          [Op.ne]: null
        }
      }
    });
    
    const nonCoreIntentsWithFirstResponse = await db.NonCoreIntent.count({
      where: {
        firstResponse: {
          [Op.ne]: null
        }
      }
    });

    console.log(`📈 数据库中现有首句回复:`);
    console.log(`   - 核心意图: ${coreIntentsWithFirstResponse} 条`);
    console.log(`   - 非核心意图: ${nonCoreIntentsWithFirstResponse} 条`);

    // 显示更新后的样例数据
    console.log('\n========== 更新后的样例数据 ==========');
    const updatedCoreIntents = await db.CoreIntent.findAll({
      where: {
        firstResponse: {
          [Op.ne]: null
        }
      },
      limit: 5,
      attributes: ['id', 'name', 'firstResponse', 'responseType']
    });

    console.log('核心意图首句回复样例:');
    updatedCoreIntents.forEach((intent, index) => {
      console.log(`${index + 1}. ${intent.name} (ID:${intent.id}): "${intent.firstResponse}"`);
    });

    const updatedNonCoreIntents = await db.NonCoreIntent.findAll({
      where: {
        firstResponse: {
          [Op.ne]: null
        }
      },
      limit: 5,
      attributes: ['id', 'name', 'firstResponse', 'responseType']
    });

    if (updatedNonCoreIntents.length > 0) {
      console.log('\n非核心意图首句回复样例:');
      updatedNonCoreIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} (ID:${intent.id}): "${intent.firstResponse}"`);
      });
    }

    return {
      coreUpdated,
      nonCoreUpdated,
      coreErrors,
      nonCoreErrors,
      totalCoreWithFirstResponse: coreIntentsWithFirstResponse,
      totalNonCoreWithFirstResponse: nonCoreIntentsWithFirstResponse
    };

  } catch (error) {
    console.error('更新首句回复失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateFirstResponses()
    .then((result) => {
      console.log('\n🎉 首句回复更新完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('更新失败:', error);
      process.exit(1);
    });
}

module.exports = updateFirstResponses;