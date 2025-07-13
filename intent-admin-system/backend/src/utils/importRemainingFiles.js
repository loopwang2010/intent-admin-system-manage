const fs = require('fs')
const path = require('path')
const { sequelize } = require('../models')

// 简单的CSV解析函数
function parseCSV(csvContent, maxRows = 2000) {
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

async function importRemainingFiles() {
  try {
    console.log('🚀 导入剩余的重要CSV文件...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功!')
    
    const projectRoot = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao'
    
    // 剩余的重要文件
    const remainingFiles = [
      {
        name: 'all_intents_integrated.csv',
        type: 'all_intents',
        description: '所有意图集成数据集',
        maxSample: 2500
      },
      {
        name: 'core_intents_integrated.csv',
        type: 'core_intents',
        description: '核心意图集成数据',
        maxSample: 2000
      },
      {
        name: 'non_core_intents_integrated.csv',
        type: 'non_core_intents',
        description: '非核心意图集成数据',
        maxSample: 2000
      },
      {
        name: 'core_intents_batch_10000.csv',
        type: 'core_intents',
        description: '核心意图批量数据',
        maxSample: 2000
      },
      {
        name: 'non_core_intents_10000.csv',
        type: 'non_core_intents',
        description: '非核心意图1万条数据',
        maxSample: 2000
      }
    ]
    
    let totalProcessed = 0
    
    for (const fileInfo of remainingFiles) {
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
        
        if (fileInfo.type === 'all_intents' || fileInfo.type === 'core_intents') {
          // 处理核心意图数据
          const coreIntents = fileInfo.type === 'all_intents' 
            ? data.filter(row => row.intent_type === 'core')
            : data
          
          console.log(`🎯 处理核心意图样本: ${coreIntents.length} 条`)
          
          // 按子类型分组
          const coreSubtypes = [...new Set(coreIntents.map(r => r.subtype))].filter(Boolean)
          console.log(`发现 ${coreSubtypes.length} 个核心意图子类型`)
          
          // 为每个子类型创建或更新意图
          for (const subtype of coreSubtypes) {
            const [existing] = await sequelize.query(
              'SELECT id FROM core_intents WHERE name = ?',
              { replacements: [subtype] }
            )
            
            if (existing.length === 0) {
              const subtypeData = coreIntents.filter(r => r.subtype === subtype)
              const keywords = [...new Set(subtypeData.map(r => r.template))].slice(0, 150)
              
              // 找到对应的类别ID
              let categoryId = 15 // 默认系统功能
              if (subtype.includes('音乐') || subtype.includes('播放')) categoryId = 1
              else if (subtype.includes('天气')) categoryId = 2
              else if (subtype.includes('新闻')) categoryId = 3
              else if (subtype.includes('智能') || subtype.includes('设备')) categoryId = 4
              else if (subtype.includes('时间') || subtype.includes('日期')) categoryId = 5
              else if (subtype.includes('计算') || subtype.includes('数学')) categoryId = 6
              else if (subtype.includes('翻译') || subtype.includes('语言')) categoryId = 7
              else if (subtype.includes('股票') || subtype.includes('投资')) categoryId = 8
              else if (subtype.includes('生活') || subtype.includes('服务')) categoryId = 9
              else if (subtype.includes('游戏') || subtype.includes('娱乐')) categoryId = 10
              else if (subtype.includes('学习') || subtype.includes('教育')) categoryId = 11
              else if (subtype.includes('健康') || subtype.includes('医疗')) categoryId = 12
              else if (subtype.includes('交通') || subtype.includes('出行')) categoryId = 13
              else if (subtype.includes('购物') || subtype.includes('消费')) categoryId = 14
              
              await sequelize.query(`
                INSERT INTO core_intents (name, description, categoryId, keywords, confidence, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 0.85, 'active', 0, datetime('now'), datetime('now'))
              `, {
                replacements: [
                  subtype,
                  `来自 ${fileInfo.name} 的意图识别 (${subtypeData.length}个模板)`,
                  categoryId,
                  JSON.stringify(keywords)
                ]
              })
              console.log(`✓ 新增核心意图: ${subtype} (${subtypeData.length}个模板)`)
              totalProcessed++
            } else {
              // 更新已存在的意图，增加更多关键词
              const subtypeData = coreIntents.filter(r => r.subtype === subtype)
              const [currentData] = await sequelize.query(
                'SELECT keywords FROM core_intents WHERE name = ?',
                { replacements: [subtype] }
              )
              
              if (currentData.length > 0) {
                const currentKeywords = JSON.parse(currentData[0].keywords || '[]')
                const newKeywords = [...new Set(subtypeData.map(r => r.template))]
                const combinedKeywords = [...new Set([...currentKeywords, ...newKeywords])].slice(0, 200)
                
                await sequelize.query(`
                  UPDATE core_intents SET keywords = ?, updatedAt = datetime('now')
                  WHERE name = ?
                `, {
                  replacements: [JSON.stringify(combinedKeywords), subtype]
                })
                console.log(`✓ 更新核心意图"${subtype}"，增加 ${newKeywords.length} 个模板`)
              }
            }
          }
        }
        
        if (fileInfo.type === 'all_intents' || fileInfo.type === 'non_core_intents') {
          // 处理非核心意图数据
          const nonCoreIntents = fileInfo.type === 'all_intents' 
            ? data.filter(row => row.intent_type === 'non_core')
            : data
          
          console.log(`🗣️  处理非核心意图样本: ${nonCoreIntents.length} 条`)
          
          // 按子类型分组
          const nonCoreSubtypes = [...new Set(nonCoreIntents.map(r => r.subtype))].filter(Boolean)
          console.log(`发现 ${nonCoreSubtypes.length} 个非核心意图子类型`)
          
          // 为每个子类型创建或更新意图
          for (const subtype of nonCoreSubtypes) {
            const [existing] = await sequelize.query(
              'SELECT id FROM non_core_intents WHERE name = ?',
              { replacements: [subtype] }
            )
            
            if (existing.length === 0) {
              const subtypeData = nonCoreIntents.filter(r => r.subtype === subtype)
              const keywords = [...new Set(subtypeData.map(r => r.template))].slice(0, 150)
              
              // 生成随意回复
              const responses = [
                '我理解您的意思～',
                '哈哈，很有趣呢～',
                '嗯嗯，是这样的～',
                '我明白了～',
                '好的好的～'
              ]
              const randomResponse = responses[Math.floor(Math.random() * responses.length)]
              
              await sequelize.query(`
                INSERT INTO non_core_intents (name, description, categoryId, keywords, confidence, response, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, 15, ?, 0.75, ?, 'active', 0, datetime('now'), datetime('now'))
              `, {
                replacements: [
                  subtype,
                  `来自 ${fileInfo.name} 的非核心意图 (${subtypeData.length}个模板)`,
                  JSON.stringify(keywords),
                  randomResponse
                ]
              })
              console.log(`✓ 新增非核心意图: ${subtype} (${subtypeData.length}个模板)`)
              totalProcessed++
            } else {
              // 更新已存在的非核心意图
              const subtypeData = nonCoreIntents.filter(r => r.subtype === subtype)
              const [currentData] = await sequelize.query(
                'SELECT keywords FROM non_core_intents WHERE name = ?',
                { replacements: [subtype] }
              )
              
              if (currentData.length > 0) {
                const currentKeywords = JSON.parse(currentData[0].keywords || '[]')
                const newKeywords = [...new Set(subtypeData.map(r => r.template))]
                const combinedKeywords = [...new Set([...currentKeywords, ...newKeywords])].slice(0, 200)
                
                await sequelize.query(`
                  UPDATE non_core_intents SET keywords = ?, updatedAt = datetime('now')
                  WHERE name = ?
                `, {
                  replacements: [JSON.stringify(combinedKeywords), subtype]
                })
                console.log(`✓ 更新非核心意图"${subtype}"，增加 ${newKeywords.length} 个模板`)
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ 处理文件 ${fileInfo.name} 时出错:`, error.message)
      }
    }
    
    console.log(`\\n🎉 导入完成！`)
    console.log(`📊 总共处理了 ${totalProcessed} 项新数据`)
    
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

importRemainingFiles() 