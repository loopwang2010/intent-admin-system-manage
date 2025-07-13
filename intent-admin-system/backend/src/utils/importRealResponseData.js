const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')

// 简单的CSV解析函数
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []
  
  for (let i = 1; i < lines.length && i <= 100; i++) { // 只处理前100条作为样本
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

async function importRealResponseData() {
  try {
    console.log('🔌 连接数据库...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const projectRoot = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao'
    
    // 1. 获取所有核心意图
    const [coreIntents] = await sequelize.query('SELECT id, name FROM core_intents;')
    const coreIntentMap = {}
    coreIntents.forEach(intent => {
      coreIntentMap[intent.name] = intent.id
    })
    
    console.log(`📊 发现 ${coreIntents.length} 个核心意图`)
    
    // 2. 清空现有回复模板
    await sequelize.query('DELETE FROM pre_responses;')
    console.log('🗑️ 已清空现有回复模板')
    
    let totalInserted = 0
    
    // 3. 导入 core_intent_pre_responses.csv - 最重要的真实回复数据
    console.log('\\n=== 导入核心意图真实预设回复 ===')
    const corePreResponsePath = path.join(projectRoot, 'core_intent_pre_responses.csv')
    
    if (fs.existsSync(corePreResponsePath)) {
      console.log('📄 开始读取核心意图预设回复文件...')
      const content = fs.readFileSync(corePreResponsePath, 'utf8')
      const data = parseCSV(content) // 只处理前100条样本
      console.log(`📊 处理 ${data.length} 条样本记录`)
      
      // 按子类型收集回复
      const subtypeResponses = {}
      
      data.forEach(row => {
        if (row.intent_type === 'core' && row.subtype && row.pre_response) {
          if (!subtypeResponses[row.subtype]) {
            subtypeResponses[row.subtype] = []
          }
          
          const response = row.pre_response.replace(/"/g, '').trim()
          if (response && !subtypeResponses[row.subtype].includes(response) && subtypeResponses[row.subtype].length < 3) {
            subtypeResponses[row.subtype].push(response)
          }
        }
      })
      
      console.log(`\\n🎯 发现 ${Object.keys(subtypeResponses).length} 个核心意图子类型`)
      
      // 为每个子类型添加回复模板
      for (const [subtype, responses] of Object.entries(subtypeResponses)) {
        const coreIntentId = coreIntentMap[subtype]
        if (coreIntentId && responses.length > 0) {
          for (let i = 0; i < responses.length; i++) {
            await sequelize.query(`
              INSERT INTO pre_responses (coreIntentId, content, priority, status, usageCount, createdAt, updatedAt) 
              VALUES (?, ?, ?, 'active', 0, datetime('now'), datetime('now'))
            `, {
              replacements: [coreIntentId, responses[i], i + 1]
            })
            totalInserted++
          }
          console.log(`✓ 为"${subtype}"添加了 ${responses.length} 个真实回复模板`)
        } else if (!coreIntentId) {
          console.log(`⚠️  未找到对应的核心意图: ${subtype}`)
        }
      }
    } else {
      console.log('❌ 核心意图预设回复文件不存在')
    }
    
    // 4. 为没有回复的核心意图添加通用回复
    console.log('\\n=== 为其他核心意图添加通用回复 ===')
    
    const defaultResponses = [
      '好的，正在为您处理...',
      '收到，马上为您查询...',
      '正在执行您的请求...'
    ]
    
    for (const intent of coreIntents) {
      const [existing] = await sequelize.query(
        'SELECT COUNT(*) as count FROM pre_responses WHERE coreIntentId = ?',
        { replacements: [intent.id] }
      )
      
      if (existing[0].count === 0) {
        for (let i = 0; i < defaultResponses.length; i++) {
          await sequelize.query(`
            INSERT INTO pre_responses (coreIntentId, content, priority, status, usageCount, createdAt, updatedAt) 
            VALUES (?, ?, ?, 'active', 0, datetime('now'), datetime('now'))
          `, {
            replacements: [intent.id, defaultResponses[i], i + 1]
          })
          totalInserted++
        }
        console.log(`✓ 为"${intent.name}"添加了 ${defaultResponses.length} 个通用回复模板`)
      }
    }
    
    console.log(`\\n🎉 回复模板导入完成！`)
    console.log(`📊 总计插入 ${totalInserted} 个回复模板`)
    
    // 验证结果
    const [finalCount] = await sequelize.query('SELECT COUNT(*) as total FROM pre_responses;')
    console.log(`✅ 数据库中现有 ${finalCount[0].total} 个回复模板`)
    
    // 显示每个核心意图的回复模板数量
    const [distribution] = await sequelize.query(`
      SELECT ci.name, COUNT(pr.id) as response_count 
      FROM core_intents ci 
      LEFT JOIN pre_responses pr ON ci.id = pr.coreIntentId 
      GROUP BY ci.id, ci.name 
      HAVING response_count > 0
      ORDER BY response_count DESC
      LIMIT 10
    `)
    
    console.log('\\n📊 回复模板分布 (前10个):')
    distribution.forEach(item => {
      console.log(`   "${item.name}": ${item.response_count} 个回复模板`)
    })
    
    // 显示一些样本回复
    const [samples] = await sequelize.query(`
      SELECT ci.name as intent_name, pr.content 
      FROM pre_responses pr 
      JOIN core_intents ci ON pr.coreIntentId = ci.id 
      ORDER BY RANDOM() 
      LIMIT 5
    `)
    
    console.log('\\n💬 真实回复模板样本:')
    samples.forEach(sample => {
      console.log(`   "${sample.intent_name}": ${sample.content}`)
    })
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message)
    console.error('错误详情:', error)
  } finally {
    await sequelize.close()
  }
}

importRealResponseData() 