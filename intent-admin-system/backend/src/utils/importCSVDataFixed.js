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
        row[header] = values[index] ? values[index].replace(/"/g, '') : ''
      })
      data.push(row)
    }
  }
  
  return data
}

async function importCSVData() {
  try {
    console.log('正在连接数据库...')
    await sequelize.authenticate()
    console.log('数据库连接成功!')
    
    const { 
      IntentCategory, 
      CoreIntent, 
      NonCoreIntent, 
      PreResponse 
    } = require('../models')
    
    // 获取类别映射
    const categories = await IntentCategory.findAll()
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id
    })
    console.log('类别映射:', categoryMap)
    
    // 1. 导入核心意图
    console.log('\n=== 导入核心意图数据 ===')
    const coreCSVPath = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\core_intents_ultra_expanded.csv'
    
    if (fs.existsSync(coreCSVPath)) {
      console.log('正在读取核心意图CSV文件...')
      const coreCSVContent = fs.readFileSync(coreCSVPath, 'utf8')
      const coreData = parseCSV(coreCSVContent)
      
      console.log(`发现 ${coreData.length} 条核心意图记录`)
      
      // 显示前几条数据的结构
      if (coreData.length > 0) {
        console.log('数据结构示例:')
        console.log('列名:', Object.keys(coreData[0]))
        console.log('第一条数据:', coreData[0])
      }
      
      let addedCoreCount = 0
      let skippedCoreCount = 0
      
      for (const row of coreData.slice(0, 200)) { // 先处理前200条测试
        try {
          // 解析关键词
          let keywords = []
          const keywordFields = ['keywords', '关键词', 'triggers', 'patterns']
          for (const field of keywordFields) {
            if (row[field]) {
              keywords = row[field].split(/[,，；;]/).map(k => k.trim()).filter(k => k)
              break
            }
          }
          
          // 确定类别ID
          let categoryId = 1 // 默认音乐播放
          const categoryFields = ['category', '类别', 'category_name', 'type']
          for (const field of categoryFields) {
            if (row[field] && categoryMap[row[field]]) {
              categoryId = categoryMap[row[field]]
              break
            }
          }
          
          // 构建意图数据
          const nameFields = ['name', '意图名称', 'intent_name', 'title']
          const descFields = ['description', '描述', 'desc', 'detail']
          
          const intentData = {
            name: nameFields.find(field => row[field]) ? row[nameFields.find(field => row[field])] : `意图_${Date.now()}_${Math.random()}`,
            description: descFields.find(field => row[field]) ? row[descFields.find(field => row[field])] : '',
            categoryId: categoryId,
            keywords: keywords,
            confidence: parseFloat(row.confidence || row.置信度 || '0.8'),
            priority: parseInt(row.priority || row.优先级 || '1')
          }
          
          // 确保名称不为空且唯一
          if (!intentData.name || intentData.name.trim() === '') {
            intentData.name = `核心意图_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          // 检查是否已存在
          const existing = await CoreIntent.findOne({ where: { name: intentData.name } })
          if (!existing) {
            await CoreIntent.create(intentData)
            addedCoreCount++
            if (addedCoreCount % 20 === 0) {
              console.log(`已添加 ${addedCoreCount} 个核心意图...`)
            }
          } else {
            skippedCoreCount++
          }
        } catch (error) {
          console.error('添加核心意图失败:', row.name || '未知', error.message)
        }
      }
      
      console.log(`核心意图导入完成: 添加 ${addedCoreCount} 个, 跳过 ${skippedCoreCount} 个`)
    } else {
      console.log('核心意图CSV文件不存在:', coreCSVPath)
    }
    
    // 2. 导入非核心意图
    console.log('\n=== 导入非核心意图数据 ===')
    const nonCoreCSVPath = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\non_core_intents_ultra_expanded.csv'
    
    if (fs.existsSync(nonCoreCSVPath)) {
      console.log('正在读取非核心意图CSV文件...')
      const nonCoreCSVContent = fs.readFileSync(nonCoreCSVPath, 'utf8')
      const nonCoreData = parseCSV(nonCoreCSVContent)
      
      console.log(`发现 ${nonCoreData.length} 条非核心意图记录`)
      
      // 显示前几条数据的结构
      if (nonCoreData.length > 0) {
        console.log('数据结构示例:')
        console.log('列名:', Object.keys(nonCoreData[0]))
        console.log('第一条数据:', nonCoreData[0])
      }
      
      let addedNonCoreCount = 0
      let skippedNonCoreCount = 0
      
      for (const row of nonCoreData.slice(0, 200)) { // 先处理前200条测试
        try {
          // 解析关键词
          let keywords = []
          const keywordFields = ['keywords', '关键词', 'triggers', 'patterns']
          for (const field of keywordFields) {
            if (row[field]) {
              keywords = row[field].split(/[,，；;]/).map(k => k.trim()).filter(k => k)
              break
            }
          }
          
          // 确定类别ID
          let categoryId = 15 // 默认系统功能
          const categoryFields = ['category', '类别', 'category_name', 'type']
          for (const field of categoryFields) {
            if (row[field] && categoryMap[row[field]]) {
              categoryId = categoryMap[row[field]]
              break
            }
          }
          
          // 构建意图数据
          const nameFields = ['name', '意图名称', 'intent_name', 'title']
          const descFields = ['description', '描述', 'desc', 'detail']
          const responseFields = ['response', '回复', 'reply', 'answer']
          
          const intentData = {
            name: nameFields.find(field => row[field]) ? row[nameFields.find(field => row[field])] : `意图_${Date.now()}_${Math.random()}`,
            description: descFields.find(field => row[field]) ? row[descFields.find(field => row[field])] : '',
            categoryId: categoryId,
            keywords: keywords,
            confidence: parseFloat(row.confidence || row.置信度 || '0.8'),
            response: responseFields.find(field => row[field]) ? row[responseFields.find(field => row[field])] : '好的，我明白了。'
          }
          
          // 确保名称不为空且唯一
          if (!intentData.name || intentData.name.trim() === '') {
            intentData.name = `非核心意图_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          // 检查是否已存在
          const existing = await NonCoreIntent.findOne({ where: { name: intentData.name } })
          if (!existing) {
            await NonCoreIntent.create(intentData)
            addedNonCoreCount++
            if (addedNonCoreCount % 20 === 0) {
              console.log(`已添加 ${addedNonCoreCount} 个非核心意图...`)
            }
          } else {
            skippedNonCoreCount++
          }
        } catch (error) {
          console.error('添加非核心意图失败:', row.name || '未知', error.message)
        }
      }
      
      console.log(`非核心意图导入完成: 添加 ${addedNonCoreCount} 个, 跳过 ${skippedNonCoreCount} 个`)
    } else {
      console.log('非核心意图CSV文件不存在:', nonCoreCSVPath)
    }
    
    // 最终统计
    const finalCoreCount = await CoreIntent.count()
    const finalNonCoreCount = await NonCoreIntent.count()
    
    console.log('\n=== 导入完成统计 ===')
    console.log(`总核心意图: ${finalCoreCount}个`)
    console.log(`总非核心意图: ${finalNonCoreCount}个`)
    
    process.exit(0)
  } catch (error) {
    console.error('CSV数据导入失败:', error)
    process.exit(1)
  }
}

// 运行导入
importCSVData() 