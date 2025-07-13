const fs = require('fs');
const db = require('./src/models');

async function directSQLUpdate() {
  try {
    console.log('开始直接SQL更新首句回复...');
    
    // 读取提取的数据
    const firstResponsesData = JSON.parse(fs.readFileSync('./firstResponsesData.json', 'utf8'));
    
    // 连接数据库
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    let coreUpdated = 0;
    let coreErrors = 0;

    console.log('\n正在更新核心意图首句回复...');
    
    for (const item of firstResponsesData.core) {
      try {
        const sql = `
          UPDATE core_intents 
          SET firstResponse = ?, responseType = ? 
          WHERE name = ?
        `;
        
        const [results, metadata] = await db.sequelize.query(sql, {
          replacements: [item.firstResponse, 'immediate', item.intentName],
          type: db.sequelize.QueryTypes.UPDATE
        });
        
        if (metadata > 0) {
          coreUpdated++;
          console.log(`✅ 更新成功 "${item.intentName}": "${item.firstResponse}"`);
        } else {
          console.log(`⚠️  未找到意图: "${item.intentName}"`);
        }
      } catch (error) {
        coreErrors++;
        console.error(`❌ 更新失败 "${item.intentName}":`, error.message);
      }
    }

    // 验证更新结果
    console.log('\n正在验证更新结果...');
    
    const [results] = await db.sequelize.query(`
      SELECT COUNT(*) as count 
      FROM core_intents 
      WHERE firstResponse IS NOT NULL AND firstResponse != ''
    `);
    
    const coreIntentsWithFirstResponse = results[0].count;

    console.log(`\n========== 更新结果 ==========`);
    console.log(`✅ 核心意图成功更新: ${coreUpdated} 条`);
    console.log(`❌ 核心意图更新失败: ${coreErrors} 条`);
    console.log(`📈 数据库中现有首句回复: ${coreIntentsWithFirstResponse} 条`);

    // 显示更新后的数据
    const [sampleResults] = await db.sequelize.query(`
      SELECT id, name, firstResponse 
      FROM core_intents 
      WHERE firstResponse IS NOT NULL AND firstResponse != ''
      LIMIT 10
    `);

    if (sampleResults.length > 0) {
      console.log('\n========== 更新后的数据样例 ==========');
      sampleResults.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} (ID:${intent.id}): "${intent.firstResponse}"`);
      });
    }

    return {
      coreUpdated,
      coreErrors,
      totalWithFirstResponse: coreIntentsWithFirstResponse
    };

  } catch (error) {
    console.error('直接SQL更新失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  directSQLUpdate()
    .then((result) => {
      console.log('\n🎉 直接SQL更新完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('更新失败:', error);
      process.exit(1);
    });
}

module.exports = directSQLUpdate;