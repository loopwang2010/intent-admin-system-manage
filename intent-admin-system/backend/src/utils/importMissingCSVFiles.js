const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')

// 简单的CSV解析函数
function parseCSV(csvContent, maxRows = 1000) {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []
  
  const maxLines = Math.min(lines.length, maxRows + 1)
  
  for (let i = 1; i < maxLines; i++) {
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

async function importMissingCSVFiles() {
  try {
    console.log('🚀 开始导入遗漏的CSV文件...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const projectRoot = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao'
    
    // 高优先级文件（按数据量和重要性排序）
    const priorityFiles = [
      {
        name: 'all_intents_ultra_expanded.csv',
        type: 'all_intents',
        description: '所有意图完整数据集',
        maxSample: 2000 // 采样更多数据
      },
      {
        name: 'core_casual_responses.csv',
        type: 'core_casual',
        description: '核心意图随意回复',
        maxSample: 1000
      },
      {
        name: 'core_casual_response_templates.csv',
        type: 'templates',
        description: '核心随意回复模板',
        maxSample: 200
      },
      {
        name: 'all_intents_priority_expanded.csv',
        type: 'all_intents',
        description: '优先级扩展完整数据集',
        maxSample: 1500
      },
      {
        name: 'system_summary.csv',
        type: 'summary',
        description: '系统摘要数据',
        maxSample: 10
      }
    ]
    
    let totalProcessed = 0
    
    for (const fileInfo of priorityFiles) {
      console.log(`\\n=== 处理 ${fileInfo.name} ===`)
      console.log(`📝 描述: ${fileInfo.description}`)
      
      const filePath = path.join(projectRoot, fileInfo.name)
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ 文件不存在: ${fileInfo.name}`)
        continue
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const data = parseCSV(content, fileInfo.maxSample)
        
        console.log(`📊 文件包含 ${content.split('\\n').length - 1} 条记录，处理前 ${data.length} 条样本`)
        
        if (data.length === 0) {
          console.log(`⚠️  文件 ${fileInfo.name} 没有有效数据`)
          continue
        }
        
        // 根据文件类型处理数据
        if (fileInfo.type === 'all_intents') {
          // 处理完整意图数据
          const coreIntents = data.filter(row => row.intent_type === 'core')
          const nonCoreIntents = data.filter(row => row.intent_type === 'non_core')
          
          console.log(`🎯 核心意图样本: ${coreIntents.length} 条`)
          console.log(`🗣️  非核心意图样本: ${nonCoreIntents.length} 条`)
          
          // 按子类型分组并添加新的意图类型
          const coreSubtypes = [...new Set(coreIntents.map(r => r.subtype))].filter(Boolean)
          const nonCoreSubtypes = [...new Set(nonCoreIntents.map(r => r.subtype))].filter(Boolean)
          
          // 添加新的核心意图类型
          for (const subtype of coreSubtypes) {
            const [existing] = await sequelize.query(
              'SELECT id FROM core_intents WHERE name = ?',
              { replacements: [subtype] }
            )
            
            if (existing.length === 0) {
              const subtypeData = coreIntents.filter(r => r.subtype === subtype)
              const keywords = [...new Set(subtypeData.map(r => r.template))].slice(0, 100)
              
              await sequelize.query(`
                INSERT INTO core_intents (name, description, categoryId, keywords, confidence, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, 15, ?, 0.85, 'active', 0, datetime('now'), datetime('now'))
              `, {
                replacements: [
                  subtype,
                  `来自 ${fileInfo.name} 的意图识别`,
                  JSON.stringify(keywords)
                ]
              })
              console.log(`✓ 新增核心意图: ${subtype} (${subtypeData.length}个模板)`)
              totalProcessed++
            }
          }
          
          // 添加新的非核心意图类型
          for (const subtype of nonCoreSubtypes) {
            const [existing] = await sequelize.query(
              'SELECT id FROM non_core_intents WHERE name = ?',
              { replacements: [subtype] }
            )
            
            if (existing.length === 0) {
              const subtypeData = nonCoreIntents.filter(r => r.subtype === subtype)
              const keywords = [...new Set(subtypeData.map(r => r.template))].slice(0, 100)
              
              await sequelize.query(`
                INSERT INTO non_core_intents (name, description, categoryId, keywords, confidence, response, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, 15, ?, 0.75, '我理解您的意思～', 'active', 0, datetime('now'), datetime('now'))
              `, {
                replacements: [
                  subtype,
                  `来自 ${fileInfo.name} 的非核心意图`,
                  JSON.stringify(keywords)
                ]
              })
              console.log(`✓ 新增非核心意图: ${subtype} (${subtypeData.length}个模板)`)
              totalProcessed++
            }
          }
          
        } else if (fileInfo.type === 'core_casual') {
          // 处理核心意图随意回复
          console.log(`💬 处理随意回复数据...`)
          
          // 按子类型收集回复
          const responsesBySubtype = {}
          data.forEach(row => {
            if (row.subtype && row.casual_response) {
              if (!responsesBySubtype[row.subtype]) {
                responsesBySubtype[row.subtype] = []
              }
              const response = row.casual_response.replace(/"/g, '').trim()
              if (response && !responsesBySubtype[row.subtype].includes(response) && responsesBySubtype[row.subtype].length < 3) {
                responsesBySubtype[row.subtype].push(response)
              }
            }
          })
          
          // 为现有的核心意图添加随意回复
          for (const [subtype, responses] of Object.entries(responsesBySubtype)) {
            const [coreIntent] = await sequelize.query(
              'SELECT id FROM core_intents WHERE name = ?',
              { replacements: [subtype] }
            )
            
            if (coreIntent.length > 0) {
              const intentId = coreIntent[0].id
              
              // 检查是否已有回复
              const [existingCount] = await sequelize.query(
                'SELECT COUNT(*) as count FROM pre_responses WHERE coreIntentId = ?',
                { replacements: [intentId] }
              )
              
              if (existingCount[0].count < 5) { // 最多添加到5个回复
                for (let i = 0; i < responses.length; i++) {
                  await sequelize.query(`
                    INSERT INTO pre_responses (coreIntentId, content, priority, status, usageCount, createdAt, updatedAt)
                    VALUES (?, ?, ?, 'active', 0, datetime('now'), datetime('now'))
                  `, {
                    replacements: [intentId, responses[i], existingCount[0].count + i + 1]
                  })
                }
                console.log(`✓ 为"${subtype}"添加了 ${responses.length} 个随意回复`)
                totalProcessed += responses.length
              }
            }
          }
          
        } else if (fileInfo.type === 'templates') {
          // 处理模板数据
          console.log(`📝 处理模板数据...`)
          let templateCount = 0
          
          for (const row of data) {
            if (row.category && row.casual_response) {
              // 尝试找到对应的核心意图
              const [coreIntent] = await sequelize.query(
                'SELECT id FROM core_intents WHERE name = ?',
                { replacements: [row.category] }
              )
              
              if (coreIntent.length > 0) {
                const intentId = coreIntent[0].id
                const response = row.casual_response.replace(/"/g, '').trim()
                
                // 检查是否已存在此回复
                const [existing] = await sequelize.query(
                  'SELECT id FROM pre_responses WHERE coreIntentId = ? AND content = ?',
                  { replacements: [intentId, response] }
                )
                
                if (existing.length === 0) {
                  await sequelize.query(`
                    INSERT INTO pre_responses (coreIntentId, content, priority, status, usageCount, createdAt, updatedAt)
                    VALUES (?, ?, 999, 'active', 0, datetime('now'), datetime('now'))
                  `, {
                    replacements: [intentId, response]
                  })
                  templateCount++
                }
              }
            }
          }
          console.log(`✓ 添加了 ${templateCount} 个模板回复`)
          totalProcessed += templateCount
          
        } else if (fileInfo.type === 'summary') {
          // 处理系统摘要（只是记录，不存储到数据库）
          console.log(`📋 系统摘要信息:`)
          data.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
              console.log(`   ${key}: ${value}`)
            })
          })
        }
        
      } catch (error) {
        console.error(`❌ 处理文件 ${fileInfo.name} 时出错:`, error.message)
      }
    }
    
    console.log(`\\n🎉 导入完成！`)
    console.log(`📊 总共处理了 ${totalProcessed} 项数据`)
    
    // 验证最终结果
    const [finalCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM core_intents;')
    const [finalNonCoreCount] = await sequelize.query('SELECT COUNT(*) as count FROM non_core_intents;')
    const [finalResponseCount] = await sequelize.query('SELECT COUNT(*) as count FROM pre_responses;')
    
    console.log(`\\n📊 === 最终数据库状态 ===`)
    console.log(`🎯 核心意图: ${finalCoreCount[0].count} 个`)
    console.log(`🗣️  非核心意图: ${finalNonCoreCount[0].count} 个`)
    console.log(`💬 回复模板: ${finalResponseCount[0].count} 个`)
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message)
    console.error('错误详情:', error)
  } finally {
    await sequelize.close()
  }
}

importMissingCSVFiles() 