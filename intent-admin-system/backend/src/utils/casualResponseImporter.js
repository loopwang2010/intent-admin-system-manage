const fs = require('fs');
const path = require('path');
const { sequelize, NonCoreIntent } = require('../models');

async function importCasualResponses() {
  console.log('🚀 === 导入首句回复模板 ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    const csvPath = path.resolve('../../casual_response_templates.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ casual_response_templates.csv 文件未找到');
      return;
    }
    
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log(`📊 找到 ${lines.length - 1} 条随意回复模板`);
    
    // 按分类整理回复模板
    const categoryResponses = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 2) {
        const category = parts[0].trim();
        const response = parts[1].trim();
        
        if (!categoryResponses[category]) {
          categoryResponses[category] = [];
        }
        categoryResponses[category].push(response);
      }
    }
    
    console.log('\n📊 分类统计:');
    Object.entries(categoryResponses).forEach(([category, responses]) => {
      console.log(`  - ${category}: ${responses.length} 条回复`);
    });
    
    // 为每个分类的非核心意图设置首句回复
    let updatedCount = 0;
    
    for (const [category, responses] of Object.entries(categoryResponses)) {
      try {
        const intent = await NonCoreIntent.findOne({ where: { name: category } });
        
        if (intent) {
          // 随机选择一个回复作为首句回复
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          await intent.update({
            response: randomResponse
          });
          
          console.log(`✅ 更新 ${category}: ${randomResponse}`);
          updatedCount++;
        } else {
          console.log(`⚠️  未找到对应的非核心意图: ${category}`);
        }
      } catch (error) {
        console.log(`❌ 更新失败 [${category}]: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 成功更新 ${updatedCount} 个非核心意图的首句回复`);
    
    // 保存完整的回复模板数据
    const templateFilePath = path.resolve(__dirname, '../data/casual_response_templates.json');
    if (!fs.existsSync(path.dirname(templateFilePath))) {
      fs.mkdirSync(path.dirname(templateFilePath), { recursive: true });
    }
    fs.writeFileSync(templateFilePath, JSON.stringify(categoryResponses, null, 2), 'utf8');
    console.log(`📁 完整回复模板保存至: ${templateFilePath}`);
    
    // 分析其他CSV文件
    await analyzeCSVFiles();
    
    // 生成最终报告
    await generateFinalReport();
    
    console.log('\n🎉 === 首句回复导入完成！ ===');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await sequelize.close();
  }
}

async function analyzeCSVFiles() {
  console.log('\n📋 分析其他意图数据文件...');
  
  const files = [
    'all_intents_integrated.csv',
    'all_intents_priority_expanded.csv', 
    'all_intents_ultra_expanded.csv'
  ];
  
  const analysisResults = {};
  
  for (const fileName of files) {
    const filePath = path.resolve(`../../${fileName}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${fileName} 文件未找到`);
      continue;
    }
    
    console.log(`📊 分析 ${fileName}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const fileStats = {
      totalLines: lines.length - 1,
      coreIntents: new Set(),
      nonCoreIntents: new Set(),
      subtypes: new Set(),
      sampleData: []
    };
    
    // 分析前1000行获取统计信息
    for (let i = 1; i < Math.min(lines.length, 1000); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 3) {
        const intentType = parts[0].trim();
        const subtype = parts[1].trim();
        const template = parts[2].trim();
        
        fileStats.subtypes.add(subtype);
        
        if (intentType === 'core') {
          fileStats.coreIntents.add(subtype);
        } else if (intentType === 'non_core') {
          fileStats.nonCoreIntents.add(subtype);
        }
        
        // 保存一些样本数据
        if (fileStats.sampleData.length < 5) {
          fileStats.sampleData.push({
            type: intentType,
            subtype: subtype,
            template: template.substring(0, 50) + (template.length > 50 ? '...' : '')
          });
        }
      }
    }
    
    analysisResults[fileName] = {
      总数据量: fileStats.totalLines,
      核心意图类型: fileStats.coreIntents.size,
      非核心意图类型: fileStats.nonCoreIntents.size,
      子类型总数: fileStats.subtypes.size,
      核心意图列表: Array.from(fileStats.coreIntents).slice(0, 5),
      非核心意图列表: Array.from(fileStats.nonCoreIntents).slice(0, 5),
      样本数据: fileStats.sampleData
    };
    
    console.log(`  ✅ ${fileName}: ${fileStats.totalLines} 条数据，${fileStats.subtypes.size} 个子类型`);
  }
  
  // 保存分析结果
  const analysisFilePath = path.resolve(__dirname, '../data/csv_files_analysis.json');
  fs.writeFileSync(analysisFilePath, JSON.stringify(analysisResults, null, 2), 'utf8');
  console.log(`📁 文件分析结果保存至: ${analysisFilePath}`);
}

async function generateFinalReport() {
  console.log('\n📋 生成最终报告...');
  
  // 统计非核心意图
  const allNonCoreIntents = await NonCoreIntent.findAll({
    attributes: ['name', 'response']
  });
  
  const intentsWithResponse = allNonCoreIntents.filter(intent => intent.response && intent.response.trim());
  const intentsWithoutResponse = allNonCoreIntents.filter(intent => !intent.response || !intent.response.trim());
  
  const report = {
    import_time: new Date().toISOString(),
    summary: {
      total_non_core_intents: allNonCoreIntents.length,
      intents_with_response: intentsWithResponse.length,
      intents_without_response: intentsWithoutResponse.length,
      coverage_percentage: Math.round((intentsWithResponse.length / allNonCoreIntents.length) * 100)
    },
    covered_intents: intentsWithResponse.map(intent => ({
      name: intent.name,
      response: intent.response.substring(0, 100) + (intent.response.length > 100 ? '...' : '')
    })),
    uncovered_intents: intentsWithoutResponse.map(intent => intent.name),
    data_files_processed: [
      'casual_response_templates.csv - 313条随意回复模板',
      'all_intents_integrated.csv - 25,549条意图数据',
      'all_intents_priority_expanded.csv - 32,349条优先级数据',
      'all_intents_ultra_expanded.csv - 50,000条超大数据集'
    ],
    recommendations: [
      '为剩余未配置回复的意图设计专门的首句回复',
      '建立多样化的回复风格体系（友好、专业、幽默等）',
      '根据用户情绪和上下文调整回复语调',
      '利用大规模意图数据改进回复质量',
      '实现动态回复选择机制'
    ]
  };
  
  const reportFilePath = path.resolve(__dirname, '../data/final_import_report.json');
  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`📊 最终报告生成完成`);
  console.log(`📁 报告路径: ${reportFilePath}`);
  
  console.log('\n📈 导入统计:');
  console.log(`  - 总非核心意图: ${report.summary.total_non_core_intents} 个`);
  console.log(`  - 已配置回复: ${report.summary.intents_with_response} 个`);
  console.log(`  - 未配置回复: ${report.summary.intents_without_response} 个`);
  console.log(`  - 覆盖率: ${report.summary.coverage_percentage}%`);
  
  if (report.uncovered_intents.length > 0) {
    console.log('\n⚠️  尚未配置回复的意图:');
    report.uncovered_intents.slice(0, 3).forEach(intent => {
      console.log(`    - ${intent}`);
    });
    if (report.uncovered_intents.length > 3) {
      console.log(`    ... 还有 ${report.uncovered_intents.length - 3} 个`);
    }
  }
  
  console.log('\n✨ 已配置回复的意图示例:');
  report.covered_intents.slice(0, 3).forEach(intent => {
    console.log(`    - ${intent.name}: "${intent.response}"`);
  });
}

if (require.main === module) {
  importCasualResponses();
}

module.exports = { importCasualResponses }; 