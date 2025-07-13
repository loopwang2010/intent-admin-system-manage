const fs = require('fs')

// 简单的CSV解析函数
function parseCSV(csvContent, maxRows = 5) {
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
        row[header] = values[index] ? values[index].replace(/"/g, '') : ''
      })
      data.push(row)
    }
  }
  
  return data
}

try {
  console.log('=== 检查核心意图CSV文件 ===')
  const coreCSVPath = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\core_intents_ultra_expanded.csv'
  
  if (fs.existsSync(coreCSVPath)) {
    const stats = fs.statSync(coreCSVPath)
    console.log(`文件大小: ${(stats.size / 1024).toFixed(2)} KB`)
    
    const coreCSVContent = fs.readFileSync(coreCSVPath, 'utf8')
    const lines = coreCSVContent.split('\n')
    console.log(`总行数: ${lines.length}`)
    
    const coreData = parseCSV(coreCSVContent, 3)
    console.log(`解析到 ${coreData.length} 条记录`)
    
    if (coreData.length > 0) {
      console.log('列名:', Object.keys(coreData[0]))
      console.log('\n前3条数据:')
      coreData.forEach((row, index) => {
        console.log(`记录 ${index + 1}:`, row)
        console.log('---')
      })
    }
  } else {
    console.log('核心意图CSV文件不存在')
  }
  
  console.log('\n=== 检查非核心意图CSV文件 ===')
  const nonCoreCSVPath = 'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\non_core_intents_ultra_expanded.csv'
  
  if (fs.existsSync(nonCoreCSVPath)) {
    const stats = fs.statSync(nonCoreCSVPath)
    console.log(`文件大小: ${(stats.size / 1024).toFixed(2)} KB`)
    
    const nonCoreCSVContent = fs.readFileSync(nonCoreCSVPath, 'utf8')
    const lines = nonCoreCSVContent.split('\n')
    console.log(`总行数: ${lines.length}`)
    
    const nonCoreData = parseCSV(nonCoreCSVContent, 3)
    console.log(`解析到 ${nonCoreData.length} 条记录`)
    
    if (nonCoreData.length > 0) {
      console.log('列名:', Object.keys(nonCoreData[0]))
      console.log('\n前3条数据:')
      nonCoreData.forEach((row, index) => {
        console.log(`记录 ${index + 1}:`, row)
        console.log('---')
      })
    }
  } else {
    console.log('非核心意图CSV文件不存在')
  }
  
} catch (error) {
  console.error('检查CSV文件失败:', error)
} 