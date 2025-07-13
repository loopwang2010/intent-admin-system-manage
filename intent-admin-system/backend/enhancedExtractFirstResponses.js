const fs = require('fs');
const iconv = require('iconv-lite');
const db = require('./src/models');

async function enhancedExtractFirstResponses() {
  try {
    console.log('开始增强型首句回复提取...');
    
    // 读取CSV文件
    const buffer = fs.readFileSync('/Users/admin/work/zmt-server-yuliao/前置回答语料.csv');
    const csvContent = iconv.decode(buffer, 'gb2312');
    console.log('使用GB2312编码成功读取文件');

    // 解析CSV
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    const intentTypeIndex = 1; // intent_type
    const subtypeIndex = 2;    // subtype  
    const templateIndex = 3;   // template
    const preResponseIndex = 6; // pre_response
    
    // 连接数据库
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取所有现有意图
    const allCoreIntents = await db.CoreIntent.findAll({
      attributes: ['id', 'name']
    });
    const allNonCoreIntents = await db.NonCoreIntent.findAll({
      attributes: ['id', 'name']
    });

    console.log(`数据库中的意图：核心意图 ${allCoreIntents.length} 个，非核心意图 ${allNonCoreIntents.length} 个`);

    // 创建意图名称映射
    const coreIntentMap = new Map();
    const nonCoreIntentMap = new Map();
    
    allCoreIntents.forEach(intent => {
      coreIntentMap.set(intent.name, intent);
    });
    
    allNonCoreIntents.forEach(intent => {
      nonCoreIntentMap.set(intent.name, intent);
    });

    // 分析整个CSV文件
    const coreResponseMap = new Map(); // intentName -> responses[]
    const nonCoreResponseMap = new Map();
    let processedCount = 0;
    
    console.log('\n开始分析CSV文件...');

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = lines[i].split(',');
        if (values.length < 7) continue;
        
        const intentType = values[intentTypeIndex]?.trim();
        const subtype = values[subtypeIndex]?.trim();
        const template = values[templateIndex]?.trim();
        const preResponse = values[preResponseIndex]?.trim();
        
        if (!preResponse || preResponse === '' || !template) {
          continue;
        }

        processedCount++;

        // 处理核心意图
        if (intentType === 'core') {
          if (coreIntentMap.has(template)) {
            if (!coreResponseMap.has(template)) {
              coreResponseMap.set(template, []);
            }
            coreResponseMap.get(template).push({
              response: preResponse,
              subtype: subtype
            });
          }
        }
        // 处理非核心意图
        else if (intentType === 'non_core') {
          if (nonCoreIntentMap.has(template)) {
            if (!nonCoreResponseMap.has(template)) {
              nonCoreResponseMap.set(template, []);
            }
            nonCoreResponseMap.get(template).push({
              response: preResponse,
              subtype: subtype
            });
          }
        }
        
        if (processedCount % 2000 === 0) {
          console.log(`已处理 ${processedCount} 条记录...`);
        }
        
      } catch (rowError) {
        continue;
      }
    }

    console.log(`\n分析完成，总处理记录: ${processedCount}`);
    console.log(`找到核心意图首句回复: ${coreResponseMap.size} 个意图`);
    console.log(`找到非核心意图首句回复: ${nonCoreResponseMap.size} 个意图`);

    // 为每个意图选择最佳首句回复（选择最常见的或第一个）
    const finalCoreResponses = [];
    const finalNonCoreResponses = [];

    // 处理核心意图
    for (const [intentName, responses] of coreResponseMap.entries()) {
      const intent = coreIntentMap.get(intentName);
      
      // 选择第一个回复作为首句回复（通常是最典型的）
      const selectedResponse = responses[0];
      
      finalCoreResponses.push({
        intentId: intent.id,
        intentName: intentName,
        subtype: selectedResponse.subtype,
        firstResponse: selectedResponse.response,
        alternativeCount: responses.length - 1
      });
    }

    // 处理非核心意图
    for (const [intentName, responses] of nonCoreResponseMap.entries()) {
      const intent = nonCoreIntentMap.get(intentName);
      
      const selectedResponse = responses[0];
      
      finalNonCoreResponses.push({
        intentId: intent.id,
        intentName: intentName,
        subtype: selectedResponse.subtype,
        firstResponse: selectedResponse.response,
        alternativeCount: responses.length - 1
      });
    }

    // 保存结果
    const enhancedData = {
      core: finalCoreResponses,
      nonCore: finalNonCoreResponses,
      summary: {
        totalProcessed: processedCount,
        coreIntentResponses: finalCoreResponses.length,
        nonCoreIntentResponses: finalNonCoreResponses.length,
        extractedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync('./enhancedFirstResponsesData.json', JSON.stringify(enhancedData, null, 2), 'utf8');
    console.log('\n增强数据已保存到 enhancedFirstResponsesData.json');

    // 显示结果统计
    console.log('\n========== 提取结果统计 ==========');
    console.log(`📊 核心意图首句回复: ${finalCoreResponses.length} 个`);
    console.log(`📊 非核心意图首句回复: ${finalNonCoreResponses.length} 个`);

    // 显示样例
    console.log('\n==== 核心意图首句回复样例 ====');
    finalCoreResponses.slice(0, 8).forEach((item, index) => {
      const altText = item.alternativeCount > 0 ? ` (+${item.alternativeCount}个备选)` : '';
      console.log(`${index + 1}. ${item.intentName}: "${item.firstResponse}"${altText}`);
    });

    if (finalNonCoreResponses.length > 0) {
      console.log('\n==== 非核心意图首句回复样例 ====');
      finalNonCoreResponses.slice(0, 5).forEach((item, index) => {
        const altText = item.alternativeCount > 0 ? ` (+${item.alternativeCount}个备选)` : '';
        console.log(`${index + 1}. ${item.intentName}: "${item.firstResponse}"${altText}`);
      });
    }

    return enhancedData;

  } catch (error) {
    console.error('增强提取失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  enhancedExtractFirstResponses()
    .then((data) => {
      console.log(`\n🎉 增强提取完成! 核心意图 ${data.core.length} 条, 非核心意图 ${data.nonCore.length} 条`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('提取失败:', error);
      process.exit(1);
    });
}

module.exports = enhancedExtractFirstResponses;