const fs = require('fs');
const db = require('./src/models');
const { Op } = require('sequelize');

async function smartMatchFirstResponses() {
  try {
    console.log('开始智能匹配首句回复...');
    
    // 读取提取的数据
    const firstResponsesData = JSON.parse(fs.readFileSync('./firstResponsesData.json', 'utf8'));
    
    // 连接数据库
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取所有核心意图和非核心意图
    const allCoreIntents = await db.CoreIntent.findAll({
      attributes: ['id', 'name']
    });
    
    const allNonCoreIntents = await db.NonCoreIntent.findAll({
      attributes: ['id', 'name']
    });

    console.log(`数据库中的意图：核心意图 ${allCoreIntents.length} 个，非核心意图 ${allNonCoreIntents.length} 个`);

    // 智能匹配函数
    function findBestMatch(csvIntentName, dbIntents) {
      // 完全匹配
      let exactMatch = dbIntents.find(intent => intent.name === csvIntentName);
      if (exactMatch) return exactMatch;

      // 包含匹配（数据库名称包含CSV名称）
      let containsMatch = dbIntents.find(intent => intent.name.includes(csvIntentName));
      if (containsMatch) return containsMatch;

      // 被包含匹配（CSV名称包含数据库名称）
      let reverseContainsMatch = dbIntents.find(intent => csvIntentName.includes(intent.name));
      if (reverseContainsMatch) return reverseContainsMatch;

      // 关键词匹配
      const csvKeywords = csvIntentName.split(/[^\u4e00-\u9fa5a-zA-Z0-9]/).filter(k => k.length > 0);
      let keywordMatch = dbIntents.find(intent => {
        const intentKeywords = intent.name.split(/[^\u4e00-\u9fa5a-zA-Z0-9]/).filter(k => k.length > 0);
        return csvKeywords.some(csvKw => intentKeywords.some(intentKw => 
          csvKw === intentKw || csvKw.includes(intentKw) || intentKw.includes(csvKw)
        ));
      });
      if (keywordMatch) return keywordMatch;

      return null;
    }

    // 匹配核心意图
    console.log('\n========== 匹配核心意图 ==========');
    const coreMatches = [];
    
    for (const csvIntent of firstResponsesData.core) {
      const match = findBestMatch(csvIntent.intentName, allCoreIntents);
      
      if (match) {
        coreMatches.push({
          csvId: csvIntent.intentId,
          csvName: csvIntent.intentName,
          dbId: match.id,
          dbName: match.name,
          firstResponse: csvIntent.firstResponse,
          subtype: csvIntent.subtype
        });
        console.log(`✅ "${csvIntent.intentName}" -> "${match.name}" (ID: ${match.id})`);
      } else {
        console.log(`❌ 未找到匹配: "${csvIntent.intentName}"`);
      }
    }

    // 匹配非核心意图
    console.log('\n========== 匹配非核心意图 ==========');
    const nonCoreMatches = [];
    
    for (const csvIntent of firstResponsesData.nonCore) {
      const match = findBestMatch(csvIntent.intentName, allNonCoreIntents);
      
      if (match) {
        nonCoreMatches.push({
          csvId: csvIntent.intentId,
          csvName: csvIntent.intentName,
          dbId: match.id,
          dbName: match.name,
          firstResponse: csvIntent.firstResponse,
          subtype: csvIntent.subtype
        });
        console.log(`✅ "${csvIntent.intentName}" -> "${match.name}" (ID: ${match.id})`);
      } else {
        console.log(`❌ 未找到匹配: "${csvIntent.intentName}"`);
      }
    }

    console.log(`\n匹配结果: 核心意图 ${coreMatches.length}/${firstResponsesData.core.length}, 非核心意图 ${nonCoreMatches.length}/${firstResponsesData.nonCore.length}`);

    // 更新数据库
    let coreUpdated = 0;
    let nonCoreUpdated = 0;

    if (coreMatches.length > 0) {
      console.log('\n正在更新核心意图首句回复...');
      for (const match of coreMatches) {
        try {
          console.log(`正在更新 ID: ${match.dbId}, 名称: "${match.dbName}", 首句回复: "${match.firstResponse}"`);
          
          const [updatedRows] = await db.CoreIntent.update(
            { 
              firstResponse: match.firstResponse,
              responseType: 'immediate'
            },
            { 
              where: { id: match.dbId }
            }
          );
          
          console.log(`更新结果: ${updatedRows} 行受影响`);
          
          if (updatedRows > 0) {
            coreUpdated++;
            console.log(`✅ 更新成功 "${match.dbName}" (ID: ${match.dbId}): "${match.firstResponse}"`);
          } else {
            console.log(`⚠️  更新失败，没有行受影响: "${match.dbName}" (ID: ${match.dbId})`);
          }
        } catch (error) {
          console.error(`❌ 更新异常 "${match.dbName}":`, error.message);
        }
      }
    }

    if (nonCoreMatches.length > 0) {
      console.log('\n正在更新非核心意图首句回复...');
      for (const match of nonCoreMatches) {
        try {
          const [updatedRows] = await db.NonCoreIntent.update(
            { 
              firstResponse: match.firstResponse,
              responseType: 'immediate'
            },
            { 
              where: { id: match.dbId }
            }
          );
          
          if (updatedRows > 0) {
            nonCoreUpdated++;
            console.log(`✅ 更新 "${match.dbName}" (ID: ${match.dbId}): "${match.firstResponse}"`);
          }
        } catch (error) {
          console.error(`❌ 更新失败 "${match.dbName}":`, error.message);
        }
      }
    }

    // 统计最终结果
    console.log('\n========== 最终结果 ==========');
    console.log(`✅ 核心意图成功更新: ${coreUpdated} 条`);
    console.log(`✅ 非核心意图成功更新: ${nonCoreUpdated} 条`);

    // 验证更新结果
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

    console.log(`\n📈 数据库中现有首句回复:`);
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
      limit: 8,
      attributes: ['id', 'name', 'firstResponse']
    });

    if (updatedCoreIntents.length > 0) {
      console.log('核心意图首句回复:');
      updatedCoreIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} (ID:${intent.id}): "${intent.firstResponse}"`);
      });
    }

    return {
      coreMatches: coreMatches.length,
      nonCoreMatches: nonCoreMatches.length,
      coreUpdated,
      nonCoreUpdated,
      totalCoreWithFirstResponse: coreIntentsWithFirstResponse,
      totalNonCoreWithFirstResponse: nonCoreIntentsWithFirstResponse
    };

  } catch (error) {
    console.error('智能匹配失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  smartMatchFirstResponses()
    .then((result) => {
      console.log('\n🎉 智能匹配和更新完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('操作失败:', error);
      process.exit(1);
    });
}

module.exports = smartMatchFirstResponses;