const fs = require('fs');
const iconv = require('iconv-lite');
const db = require('./src/models');

async function extractFirstResponses() {
  try {
    console.log('开始从CSV文件中提取首句回复数据...');
    
    // 读取CSV文件，尝试不同编码
    let csvContent;
    try {
      const buffer = fs.readFileSync('/Users/admin/work/zmt-server-yuliao/前置回答语料.csv');
      
      // 尝试GB2312编码
      try {
        csvContent = iconv.decode(buffer, 'gb2312');
        console.log('使用GB2312编码成功读取文件');
      } catch (gbError) {
        // 尝试UTF-8编码
        csvContent = buffer.toString('utf8');
        console.log('使用UTF-8编码读取文件');
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      return;
    }

    // 解析CSV
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    console.log('CSV表头:', headers);
    
    // 找到关键列的索引
    const intentTypeIndex = headers.findIndex(h => h.includes('intent_type') || h.includes('意图类型'));
    const subtypeIndex = headers.findIndex(h => h.includes('subtype') || h.includes('子类型'));
    const templateIndex = headers.findIndex(h => h.includes('template') || h.includes('模板'));
    const preResponseIndex = headers.findIndex(h => h.includes('pre_response') || h.includes('首句回复') || h.includes('前置回复'));
    
    console.log('列索引:', {
      intentType: intentTypeIndex,
      subtype: subtypeIndex, 
      template: templateIndex,
      preResponse: preResponseIndex
    });

    if (preResponseIndex === -1) {
      console.error('未找到首句回复列');
      return;
    }

    // 连接数据库
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取现有的核心意图和非核心意图
    const coreIntents = await db.CoreIntent.findAll();
    const nonCoreIntents = await db.NonCoreIntent.findAll();
    
    console.log(`现有核心意图: ${coreIntents.length}个`);
    console.log(`现有非核心意图: ${nonCoreIntents.length}个`);

    // 创建意图名称到ID的映射
    const coreIntentMap = new Map();
    const nonCoreIntentMap = new Map();
    
    coreIntents.forEach(intent => {
      coreIntentMap.set(intent.name, intent.id);
    });
    
    nonCoreIntents.forEach(intent => {
      nonCoreIntentMap.set(intent.name, intent.id);
    });

    // 解析数据
    const firstResponseData = {
      core: [],
      nonCore: []
    };
    
    let processedCount = 0;
    let coreCount = 0;
    let nonCoreCount = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = lines[i].split(',');
        
        if (values.length < Math.max(intentTypeIndex, subtypeIndex, templateIndex, preResponseIndex) + 1) {
          continue;
        }
        
        const intentType = values[intentTypeIndex]?.trim();
        const subtype = values[subtypeIndex]?.trim();
        const template = values[templateIndex]?.trim();
        const preResponse = values[preResponseIndex]?.trim();
        
        if (!preResponse || preResponse === '') {
          continue;
        }

        // 处理核心意图
        if (intentType === 'core' && template) {
          if (coreIntentMap.has(template)) {
            firstResponseData.core.push({
              intentId: coreIntentMap.get(template),
              intentName: template,
              subtype: subtype,
              firstResponse: preResponse
            });
            coreCount++;
          }
        }
        // 处理非核心意图
        else if (intentType === 'non_core' && template) {
          if (nonCoreIntentMap.has(template)) {
            firstResponseData.nonCore.push({
              intentId: nonCoreIntentMap.get(template),
              intentName: template,
              subtype: subtype,
              firstResponse: preResponse
            });
            nonCoreCount++;
          }
        }
        
        processedCount++;
        
        if (processedCount % 1000 === 0) {
          console.log(`已处理 ${processedCount} 条记录...`);
        }
        
      } catch (rowError) {
        // 跳过有问题的行
        continue;
      }
    }

    console.log(`\n数据提取完成:`);
    console.log(`- 总处理记录: ${processedCount}`);
    console.log(`- 核心意图首句回复: ${coreCount}条`);
    console.log(`- 非核心意图首句回复: ${nonCoreCount}条`);

    // 去重处理（按intentId分组，保留第一个）
    const uniqueCoreResponses = [];
    const uniqueNonCoreResponses = [];
    const coreSeenIds = new Set();
    const nonCoreSeenIds = new Set();

    firstResponseData.core.forEach(item => {
      if (!coreSeenIds.has(item.intentId)) {
        uniqueCoreResponses.push(item);
        coreSeenIds.add(item.intentId);
      }
    });

    firstResponseData.nonCore.forEach(item => {
      if (!nonCoreSeenIds.has(item.intentId)) {
        uniqueNonCoreResponses.push(item);
        nonCoreSeenIds.add(item.intentId);
      }
    });

    console.log(`\n去重后:`);
    console.log(`- 核心意图首句回复: ${uniqueCoreResponses.length}条`);
    console.log(`- 非核心意图首句回复: ${uniqueNonCoreResponses.length}条`);

    // 保存到JSON文件以便查看
    const outputData = {
      core: uniqueCoreResponses,
      nonCore: uniqueNonCoreResponses,
      summary: {
        totalProcessed: processedCount,
        coreIntentResponses: uniqueCoreResponses.length,
        nonCoreIntentResponses: uniqueNonCoreResponses.length,
        extractedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync('./firstResponsesData.json', JSON.stringify(outputData, null, 2), 'utf8');
    console.log('\n数据已保存到 firstResponsesData.json');

    // 显示样例数据
    console.log('\n==== 核心意图首句回复样例 ====');
    uniqueCoreResponses.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.intentName}: "${item.firstResponse}"`);
    });

    console.log('\n==== 非核心意图首句回复样例 ====');
    uniqueNonCoreResponses.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.intentName}: "${item.firstResponse}"`);
    });

    return outputData;

  } catch (error) {
    console.error('提取首句回复失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  extractFirstResponses()
    .then((data) => {
      console.log('\n首句回复数据提取完成!');
      console.log(`总计: 核心意图 ${data.core.length} 条, 非核心意图 ${data.nonCore.length} 条`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('提取失败:', error);
      process.exit(1);
    });
}

module.exports = extractFirstResponses;