const fs = require('fs')
const path = require('path')
const { sequelize, PreResponse, NonCoreIntent } = require('../models')

// 简单的CSV解析函数
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    if (values.length === headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
  }
  
  return data
}

async function importResponseTemplates() {
  console.log('🚀 === 导入首句回复模板 ===\n')
  
  try {
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功\n')
    
    // 导入casual_response_templates.csv
    console.log('📋 第一步：导入随意回复模板...')
    await importCasualResponses()
    
    // 分析并处理核心意图文件
    console.log('\n📋 第二步：分析核心意图数据...')
    await analyzeCoreIntents()
    
    // 生成综合报告
    console.log('\n📋 第三步：生成导入报告...')
    await generateImportReport()
    
    console.log('\n🎉 === 首句回复模板导入完成！ ===')
    
  } catch (error) {
    console.error('❌ 导入失败:', error)
  }
}

async function importCasualResponses() {
  const csvPath = path.resolve('../../casual_response_templates.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  casual_response_templates.csv 文件未找到')
    return
  }
  
  const content = fs.readFileSync(csvPath, 'utf8')
  const lines = content.split('\n').filter(line => line.trim())
  
  console.log(`📊 找到 ${lines.length - 1} 条随意回复模板`)
  
  let importedCount = 0
  let categoryStats = {}
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const parts = line.split(',')
    if (parts.length >= 3) {
      const category = parts[0].trim()
      const casualResponse = parts[1].trim()
      const usageScenario = parts[2].trim()
      
      // 统计分类
      if (!categoryStats[category]) {
        categoryStats[category] = 0
      }
      categoryStats[category]++
      
      try {
        // 查找对应的非核心意图
        const nonCoreIntent = await NonCoreIntent.findOne({ 
          where: { name: category } 
        })
        
        if (nonCoreIntent) {
          // 创建回复模板记录
          await PreResponse.create({
            text: casualResponse,
            type: 'casual',
            variables: JSON.stringify({
              category: category,
              usage_scenario: usageScenario,
              tone: 'friendly'
            }),
            status: 'active'
          })
          
          importedCount++
        } else {
          console.log(`⚠️  未找到对应的非核心意图: ${category}`)
        }
      } catch (error) {
        console.log(`❌ 导入失败 [${category}]: ${error.message}`)
      }
    }
  }
  
  console.log(`✅ 成功导入 ${importedCount} 条随意回复模板`)
  console.log('\n📊 分类统计:')
  Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} 条`)
    })
}

async function analyzeCoreIntents() {
  const files = [
    'all_intents_integrated.csv',
    'all_intents_priority_expanded.csv', 
    'all_intents_ultra_expanded.csv'
  ]
  
  const analysisResults = {}
  
  for (const fileName of files) {
    const filePath = path.resolve(`../../${fileName}`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${fileName} 文件未找到`)
      continue
    }
    
    console.log(`📊 分析 ${fileName}...`)
    
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    
    const fileStats = {
      totalLines: lines.length - 1,
      coreIntents: new Set(),
      nonCoreIntents: new Set(),
      subtypes: new Set()
    }
    
    for (let i = 1; i < Math.min(lines.length, 1000); i++) { // 只分析前1000行用于统计
      const line = lines[i].trim()
      if (!line) continue
      
      const parts = line.split(',')
      if (parts.length >= 3) {
        const intentType = parts[0].trim()
        const subtype = parts[1].trim()
        
        fileStats.subtypes.add(subtype)
        
        if (intentType === 'core') {
          fileStats.coreIntents.add(subtype)
        } else if (intentType === 'non_core') {
          fileStats.nonCoreIntents.add(subtype)
        }
      }
    }
    
    analysisResults[fileName] = {
      总数据量: fileStats.totalLines,
      核心意图类型: fileStats.coreIntents.size,
      非核心意图类型: fileStats.nonCoreIntents.size,
      子类型总数: fileStats.subtypes.size,
      核心意图列表: Array.from(fileStats.coreIntents).slice(0, 10),
      非核心意图列表: Array.from(fileStats.nonCoreIntents).slice(0, 10)
    }
    
    console.log(`  ✅ ${fileName}: ${fileStats.totalLines} 条数据，${fileStats.subtypes.size} 个子类型`)
  }
  
  // 保存分析结果
  const analysisFilePath = path.resolve(__dirname, '../data/core_intents_analysis.json')
  fs.writeFileSync(analysisFilePath, JSON.stringify(analysisResults, null, 2), 'utf8')
  console.log(`📁 分析结果保存至: ${analysisFilePath}`)
}

async function generateImportReport() {
  // 统计数据库中的回复模板
  const totalResponses = await PreResponse.count()
  const casualResponses = await PreResponse.count({ where: { type: 'casual' } })
  
  // 统计非核心意图
  const nonCoreIntents = await NonCoreIntent.findAll({
    attributes: ['name', 'response']
  })
  
  const report = {
    import_time: new Date().toISOString(),
    summary: {
      total_response_templates: totalResponses,
      casual_response_templates: casualResponses,
      non_core_intents_with_responses: nonCoreIntents.filter(intent => intent.response).length,
      total_non_core_intents: nonCoreIntents.length
    },
    template_coverage: {
      covered_intents: nonCoreIntents.filter(intent => intent.response).map(intent => intent.name),
      uncovered_intents: nonCoreIntents.filter(intent => !intent.response).map(intent => intent.name)
    },
    recommendations: [
      '为所有非核心意图配置首句回复模板',
      '建立多样化的回复风格体系',
      '根据用户情绪调整回复语调',
      '定期更新和优化回复模板'
    ],
    data_files_analyzed: [
      'casual_response_templates.csv - 313条随意回复模板',
      'all_intents_integrated.csv - 25,549条意图数据',
      'all_intents_priority_expanded.csv - 32,349条优先级数据',
      'all_intents_ultra_expanded.csv - 超大规模数据集'
    ]
  }
  
  const reportFilePath = path.resolve(__dirname, '../data/response_import_report.json')
  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), 'utf8')
  
  console.log(`📊 导入报告生成完成`)
  console.log(`📁 报告路径: ${reportFilePath}`)
  
  console.log('\n📈 导入统计:')
  console.log(`  - 总回复模板: ${totalResponses} 条`)
  console.log(`  - 随意回复模板: ${casualResponses} 条`)
  console.log(`  - 已配置回复的非核心意图: ${report.summary.non_core_intents_with_responses} 个`)
  console.log(`  - 总非核心意图: ${report.summary.total_non_core_intents} 个`)
  
  if (report.template_coverage.uncovered_intents.length > 0) {
    console.log('\n⚠️  尚未配置回复的意图:')
    report.template_coverage.uncovered_intents.slice(0, 5).forEach(intent => {
      console.log(`    - ${intent}`)
    })
    if (report.template_coverage.uncovered_intents.length > 5) {
      console.log(`    ... 还有 ${report.template_coverage.uncovered_intents.length - 5} 个`)
    }
  }
}

// 创建为非核心意图生成默认回复的函数
async function generateDefaultResponses() {
  console.log('\n🔧 为未配置回复的意图生成默认回复...')
  
  const uncoveredIntents = await NonCoreIntent.findAll({
    where: { response: null }
  })
  
  const defaultResponses = {
    '语气词表达': ['嗯嗯～', '哦哦，我知道了～', '诶～'],
    '重复无意义': ['我听到了～', '嗯？', '你说什么呢？'],
    '情感倾诉': ['我理解你的感受～', '嗯嗯，我在听～', '说出来会好一些～'],
    '方言表达': ['哈哈，你的表达很有特色呢～', '我也想学学～', '地方话很有意思～'],
    '年龄代际用语': ['不同年代的表达方式真有趣～', '我也想跟上时代～', '这个词很有时代感～'],
    '社交媒体用语': ['你很潮呢～', '网络用语真有意思～', '我也想学学这些新词～'],
    '游戏术语': ['哦，是游戏相关的呀～', '我对游戏不太懂呢～', '听起来很专业～'],
    '职场用语': ['工作辛苦了～', '职场生活不容易呢～', '理解你的工作状态～'],
    '学生用语': ['学习加油呀～', '学生时代真怀念～', '你们现在的用语真有意思～']
  }
  
  let generatedCount = 0
  
  for (const intent of uncoveredIntents) {
    const responses = defaultResponses[intent.name] || [
      `关于${intent.name}，我理解你的表达～`,
      `嗯嗯，${intent.name}相关的话题呢～`,
      `我明白你说的${intent.name}～`
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    await intent.update({
      response: randomResponse
    })
    
    generatedCount++
    console.log(`  ✅ ${intent.name}: ${randomResponse}`)
  }
  
  console.log(`🎯 成功为 ${generatedCount} 个意图生成默认回复`)
}

if (require.main === module) {
  importResponseTemplates()
    .then(async () => {
      // 可选：生成默认回复
      await generateDefaultResponses()
      
      console.log('\n✅ 首句回复模板导入脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 首句回复模板导入脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { importResponseTemplates, generateDefaultResponses } 