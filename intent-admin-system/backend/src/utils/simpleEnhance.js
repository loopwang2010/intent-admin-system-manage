const fs = require('fs');
const path = require('path');
const { sequelize, NonCoreIntent } = require('../models');

async function simpleEnhance() {
  console.log('🚀 === 简化版数据增强 ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 读取CSV数据
    const csvData = await readCSVData();
    
    // 增强关键词
    await enhanceKeywords(csvData);
    
    // 生成训练数据
    await generateTrainingData(csvData);
    
    // 生成分析报告
    await generateAnalysisReport(csvData);
    
    console.log('\n🎉 === 数据增强完成！ ===');
    
  } catch (error) {
    console.error('❌ 数据增强失败:', error);
  }
}

async function readCSVData() {
  console.log('📖 读取CSV文件...');
  
  const csvPath = path.resolve('../../non_core_intents_ultra_expanded.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`📊 CSV文件包含 ${lines.length} 行数据`);
  
  const subtypeData = {};
  
  lines.slice(1).forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const subtype = parts[1].trim();
      const template = parts.slice(2).join(',').trim();
      
      if (!subtypeData[subtype]) {
        subtypeData[subtype] = [];
      }
      subtypeData[subtype].push(template);
    }
  });
  
  console.log(`🏷️  发现 ${Object.keys(subtypeData).length} 个子类型`);
  return subtypeData;
}

async function enhanceKeywords(csvData) {
  console.log('\n🔧 增强关键词数据...');
  
  let enhancedCount = 0;
  
  for (const [subtype, templates] of Object.entries(csvData)) {
    try {
      // 使用原始SQL查询避免字段问题
      const [results] = await sequelize.query(
        'SELECT * FROM non_core_intents WHERE name = ?',
        { replacements: [subtype] }
      );
      
      if (results.length > 0) {
        const intent = results[0];
        let existingKeywords = [];
        
        try {
          existingKeywords = JSON.parse(intent.keywords || '[]');
        } catch (e) {
          existingKeywords = [];
        }
        
        // 合并关键词（去重）
        const newKeywords = [...new Set([...existingKeywords, ...templates])];
        
        if (newKeywords.length > existingKeywords.length) {
          await sequelize.query(
            'UPDATE non_core_intents SET keywords = ?, description = ? WHERE id = ?',
            { 
              replacements: [
                JSON.stringify(newKeywords),
                `${subtype}相关的非功能性对话，包含${newKeywords.length}个关键词变体`,
                intent.id
              ] 
            }
          );
          
          console.log(`✅ 更新 ${subtype}: ${existingKeywords.length} → ${newKeywords.length} 个关键词`);
          enhancedCount++;
        }
      }
    } catch (error) {
      console.log(`⚠️  跳过 ${subtype}: ${error.message}`);
    }
  }
  
  console.log(`🎯 成功增强 ${enhancedCount} 个意图的关键词数据`);
}

async function generateTrainingData(csvData) {
  console.log('\n🎯 生成训练数据...');
  
  const trainingData = [];
  const intentStats = {};
  
  Object.entries(csvData).forEach(([subtype, templates]) => {
    intentStats[subtype] = templates.length;
    
    templates.forEach(template => {
      trainingData.push({
        text: template,
        intent: subtype,
        type: 'non_core',
        confidence: 0.9
      });
    });
  });
  
  // 保存训练数据
  const trainingFilePath = path.resolve(__dirname, '../data/non_core_training_data.json');
  fs.writeFileSync(trainingFilePath, JSON.stringify(trainingData, null, 2), 'utf8');
  
  console.log(`💾 生成训练数据文件: ${trainingData.length} 条记录`);
  console.log(`📁 保存路径: ${trainingFilePath}`);
  
  // 生成意图统计
  const statsFilePath = path.resolve(__dirname, '../data/intent_statistics.json');
  fs.writeFileSync(statsFilePath, JSON.stringify(intentStats, null, 2), 'utf8');
  
  console.log(`📊 生成统计文件: ${Object.keys(intentStats).length} 个意图`);
  console.log(`📁 统计路径: ${statsFilePath}`);
}

async function generateAnalysisReport(csvData) {
  console.log('\n📋 生成分析报告...');
  
  const report = {
    generation_time: new Date().toISOString(),
    summary: {
      total_intents: Object.keys(csvData).length,
      total_templates: Object.values(csvData).reduce((sum, templates) => sum + templates.length, 0),
      average_templates_per_intent: Math.round(Object.values(csvData).reduce((sum, templates) => sum + templates.length, 0) / Object.keys(csvData).length)
    },
    intent_breakdown: Object.entries(csvData)
      .map(([intent, templates]) => ({
        intent_name: intent,
        template_count: templates.length,
        sample_templates: templates.slice(0, 5)
      }))
      .sort((a, b) => b.template_count - a.template_count),
    top_intents: Object.entries(csvData)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10)
      .map(([intent, templates]) => ({ intent, count: templates.length })),
    recommendations: [
      '使用训练数据提升意图识别准确性',
      '基于模板数量调整意图置信度阈值',
      '对高频意图进行响应优化',
      '建立意图识别的A/B测试机制'
    ]
  };
  
  const reportFilePath = path.resolve(__dirname, '../data/enhancement_report.json');
  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`📊 分析报告生成完成`);
  console.log(`📁 报告路径: ${reportFilePath}`);
  
  // 打印核心统计
  console.log('\n📈 核心统计:');
  console.log(`  - 总意图数: ${report.summary.total_intents} 个`);
  console.log(`  - 总模板数: ${report.summary.total_templates} 条`);
  console.log(`  - 平均每意图: ${report.summary.average_templates_per_intent} 个模板`);
  
  console.log('\n🏆 Top 5 意图 (按模板数量):');
  report.top_intents.slice(0, 5).forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.intent}: ${item.count} 个模板`);
  });
}

if (require.main === module) {
  simpleEnhance()
    .then(() => {
      console.log('\n✅ 简化版数据增强脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 简化版数据增强脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { simpleEnhance }; 