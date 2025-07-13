const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')

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

async function checkCSVCompletion() {
  try {
    console.log('🔍 检查CSV文件完整性...')
    
    const projectRoot = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao'
    
    // 要检查的CSV文件列表
    const csvFiles = [
      'core_intents_ultra_expanded.csv',
      'non_core_intents_ultra_expanded.csv',
      'core_intent_pre_responses.csv',
      'core_pre_response_templates.csv', 
      'core_casual_responses.csv',
      'non_core_casual_responses.csv',
      'casual_response_templates.csv'
    ]
    
    console.log('\n📋 === CSV文件检查 ===')
    
    let foundFiles = []
    
    for (const fileName of csvFiles) {
      const filePath = path.join(projectRoot, fileName)
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          const sizeKB = (stats.size / 1024).toFixed(2)
          console.log(`✅ ${fileName}: ${sizeKB} KB`)
          
          // 尝试读取文件内容
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            const data = parseCSV(content)
            console.log(`   📊 包含 ${data.length} 条记录`)
            
            // 检查前几行数据
            if (data.length > 0) {
              const headers = Object.keys(data[0])
              console.log(`   🏷️  字段: ${headers.join(', ')}`)
              foundFiles.push({
                name: fileName,
                path: filePath,
                records: data.length,
                headers: headers,
                data: data.slice(0, 3) // 取前3条样本
              })
            }
          } catch (readError) {
            console.log(`   ❌ 读取失败: ${readError.message}`)
          }
        } else {
          console.log(`❌ ${fileName}: 文件不存在`)
        }
      } catch (error) {
        console.log(`❌ ${fileName}: 检查失败 - ${error.message}`)
      }
    }
    
    // 连接数据库检查现有数据
    console.log('\n🔌 连接数据库检查现有数据...')
    await sequelize.authenticate()
    
    const [coreCount] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents;')
    const [nonCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents;')
    const [responseCount] = await sequelize.query('SELECT COUNT(*) as count FROM pre_responses;')
    
    console.log('\n📊 === 数据库现有数据 ===')
    console.log(`🎯 核心意图: ${coreCount[0].count} 个`)
    console.log(`🗣️  非核心意图: ${nonCoreCount[0].count} 个`)
    console.log(`💬 回复模板: ${responseCount[0].count} 个`)
    
    // 检查是否有未导入的回复模板文件
    console.log('\n🔍 === 回复模板文件分析 ===')
    
    const responseFiles = foundFiles.filter(f => 
      f.name.includes('response') || f.name.includes('casual')
    )
    
    if (responseFiles.length > 0) {
      console.log('发现以下回复模板相关文件:')
      responseFiles.forEach(file => {
        console.log(`\n📄 ${file.name}:`)
        console.log(`   📊 ${file.records} 条记录`)
        console.log(`   🏷️  字段: ${file.headers.join(', ')}`)
        
        // 显示样本数据
        if (file.data.length > 0) {
          console.log('   📝 样本数据:')
          file.data.forEach((row, index) => {
            const values = Object.values(row).slice(0, 3).join(' | ')
            console.log(`      ${index + 1}. ${values}`)
          })
        }
      })
      
      console.log('\n⚠️  建议检查这些文件是否需要导入到数据库中')
    } else {
      console.log('✅ 未发现额外的回复模板文件')
    }
    
    console.log('\n🎯 === 建议操作 ===')
    if (responseFiles.length > 0) {
      console.log('1. 检查core_intent_pre_responses.csv是否包含额外的回复模板')
      console.log('2. 如果包含，考虑导入到pre_responses表中')
      console.log('3. 检查casual_response相关文件是否需要单独处理')
    } else {
      console.log('✅ 所有相关CSV文件数据已完整导入')
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

checkCSVCompletion() 