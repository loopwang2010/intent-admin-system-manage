const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')

// 简单的CSV解析函数来获取文件信息
function getCSVInfo(csvPath) {
  if (!fs.existsSync(csvPath)) {
    return { exists: false }
  }
  
  try {
    const stats = fs.statSync(csvPath)
    const content = fs.readFileSync(csvPath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : []
    
    return {
      exists: true,
      size: (stats.size / 1024).toFixed(2) + ' KB',
      records: lines.length - 1, // 减去标题行
      headers: headers
    }
  } catch (error) {
    return { exists: false, error: error.message }
  }
}

async function checkAllCSVFiles() {
  try {
    console.log('🔍 检查所有CSV文件的导入状态...')
    
    const projectRoot = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao'
    
    // 用户列出的所有文件
    const csvFiles = [
      'core_intents_integrated.csv',
      'non_core_intents_10000.csv',
      'non_core_intents_batch_15000.csv',
      'non_core_intents_integrated.csv',
      'non_core_intents_priority_expanded.csv',
      'non_core_intents_ultra_expanded.csv',
      'non_core_intents_enhanced_15000.csv',
      'system_summary.csv',
      'casual_response_templates.csv',
      'core_casual_response_templates.csv',
      'core_casual_responses.csv',
      'all_intents_integrated.csv',
      'all_intents_priority_expanded.csv',
      'all_intents_ultra_expanded.csv',
      'core_intents_batch_10000.csv',
      'core_intents_integrated.csv',
      'core_intents_priority_expanded.csv',
      'core_intents_ultra_expanded.csv',
      'core_pre_response_templates.csv'
    ]
    
    console.log('\\n📋 === CSV文件检查结果 ===')
    
    let totalRecords = 0
    let existingFiles = 0
    const fileInfo = []
    
    for (const fileName of csvFiles) {
      const filePath = path.join(projectRoot, fileName)
      const info = getCSVInfo(filePath)
      
      if (info.exists) {
        existingFiles++
        totalRecords += info.records
        fileInfo.push({
          name: fileName,
          ...info
        })
        console.log(`✅ ${fileName}`)
        console.log(`   📊 大小: ${info.size}, 记录数: ${info.records}`)
        console.log(`   🏷️  字段: ${info.headers.join(', ')}`)
        console.log('')
      } else {
        console.log(`❌ ${fileName} - 文件不存在`)
      }
    }
    
    console.log(`\\n📊 === 文件统计 ===`)
    console.log(`📄 总文件数: ${csvFiles.length}`)
    console.log(`✅ 存在文件: ${existingFiles}`)
    console.log(`❌ 缺失文件: ${csvFiles.length - existingFiles}`)
    console.log(`📈 总记录数: ${totalRecords.toLocaleString()}`)
    
    // 检查数据库当前状态
    console.log('\\n🔌 连接数据库检查当前数据...')
    await sequelize.authenticate()
    
    const [coreCount] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents;')
    const [nonCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents;')
    const [responseCount] = await sequelize.query('SELECT COUNT(*) as count FROM pre_responses;')
    
    console.log('\\n📊 === 数据库当前状态 ===')
    console.log(`🎯 核心意图: ${coreCount[0].count} 个`)
    console.log(`🗣️  非核心意图: ${nonCoreCount[0].count} 个`)
    console.log(`💬 回复模板: ${responseCount[0].count} 个`)
    
    // 分析已导入和未导入的文件
    console.log('\\n🎯 === 导入状态分析 ===')
    
    const importedFiles = [
      'core_intents_ultra_expanded.csv',
      'non_core_intents_ultra_expanded.csv', 
      'core_intent_pre_responses.csv',
      'core_pre_response_templates.csv',
      'casual_response_templates.csv'
    ]
    
    console.log('✅ 已导入的文件:')
    importedFiles.forEach(file => {
      if (csvFiles.includes(file)) {
        console.log(`   - ${file}`)
      }
    })
    
    console.log('\\n⏳ 未导入的文件:')
    const notImported = csvFiles.filter(file => !importedFiles.includes(file))
    notImported.forEach(file => {
      const info = fileInfo.find(f => f.name === file)
      if (info) {
        console.log(`   - ${file} (${info.records} 条记录)`)
      }
    })
    
    // 建议导入优先级
    console.log('\\n🎯 === 建议导入优先级 ===')
    
    const highPriority = fileInfo
      .filter(f => !importedFiles.includes(f.name))
      .sort((a, b) => b.records - a.records)
      .slice(0, 5)
    
    console.log('高优先级 (数据量大):')
    highPriority.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} - ${file.records.toLocaleString()} 条记录`)
    })
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

checkAllCSVFiles() 