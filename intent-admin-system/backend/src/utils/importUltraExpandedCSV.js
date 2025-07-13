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

// 子类型到类别的映射
function mapSubtypeToCategory(subtype) {
  const categoryMapping = {
    // 时间日期类
    '时间查询': '时间日期',
    '日期查询': '时间日期',
    '闹钟设置': '时间日期',
    
    // 音乐播放类
    '音乐播放': '音乐播放',
    '音乐控制': '音乐播放',
    '播放控制': '音乐播放',
    
    // 天气查询类
    '天气查询': '天气查询',
    '天气': '天气查询',
    
    // 新闻资讯类
    '新闻': '新闻资讯',
    '新闻查询': '新闻资讯',
    '资讯': '新闻资讯',
    
    // 智能家居类
    '智能家居': '智能家居',
    '设备控制': '智能家居',
    '家居控制': '智能家居',
    
    // 计算功能类
    '计算': '计算功能',
    '数学': '计算功能',
    '换算': '计算功能',
    
    // 翻译功能类
    '翻译': '翻译功能',
    '语言': '翻译功能',
    
    // 股票查询类
    '股票': '股票查询',
    '股价': '股票查询',
    
    // 生活服务类
    '生活': '生活服务',
    '服务': '生活服务',
    '查询': '生活服务',
    
    // 娱乐游戏类
    '娱乐': '娱乐游戏',
    '游戏': '娱乐游戏',
    '笑话': '娱乐游戏',
    '谜语': '娱乐游戏',
    
    // 学习教育类
    '学习': '学习教育',
    '教育': '学习教育',
    '知识': '学习教育',
    
    // 健康医疗类
    '健康': '健康医疗',
    '医疗': '健康医疗',
    '运动': '健康医疗',
    
    // 交通出行类
    '交通': '交通出行',
    '出行': '交通出行',
    '路线': '交通出行',
    
    // 购物消费类
    '购物': '购物消费',
    '消费': '购物消费',
    
    // 系统功能类（默认）
    '唤醒确认': '系统功能',
    '确认': '系统功能',
    '问候': '系统功能',
    '感谢': '系统功能',
    '告别': '系统功能'
  }
  
  // 查找精确匹配
  if (categoryMapping[subtype]) {
    return categoryMapping[subtype]
  }
  
  // 模糊匹配
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (subtype.includes(key) || key.includes(subtype)) {
      return value
    }
  }
  
  // 默认返回系统功能
  return '系统功能'
}

async function importUltraExpandedCSV() {
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
      
      // 按subtype分组处理
      const groupedData = {}
      coreData.forEach(row => {
        if (!groupedData[row.subtype]) {
          groupedData[row.subtype] = []
        }
        groupedData[row.subtype].push(row.template)
      })
      
      console.log(`发现 ${Object.keys(groupedData).length} 个不同的核心意图子类型`)
      
      let addedCoreCount = 0
      let skippedCoreCount = 0
      
      for (const [subtype, templates] of Object.entries(groupedData)) {
        try {
          // 确定类别ID
          const categoryName = mapSubtypeToCategory(subtype)
          const categoryId = categoryMap[categoryName] || 1
          
          // 构建意图数据
          const intentData = {
            name: subtype,
            description: `${subtype}相关的意图识别`,
            categoryId: categoryId,
            keywords: templates.slice(0, 50), // 取前50个作为关键词
            confidence: 0.8,
            priority: 1
          }
          
          // 检查是否已存在
          const existing = await CoreIntent.findOne({ where: { name: intentData.name } })
          if (!existing) {
            await CoreIntent.create(intentData)
            addedCoreCount++
            console.log(`✓ 添加核心意图: ${subtype} (${templates.length}个模板) -> ${categoryName}`)
          } else {
            skippedCoreCount++
            console.log(`- 跳过已存在的核心意图: ${subtype}`)
          }
        } catch (error) {
          console.error('添加核心意图失败:', subtype, error.message)
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
      
      // 按subtype分组处理
      const groupedData = {}
      nonCoreData.forEach(row => {
        if (!groupedData[row.subtype]) {
          groupedData[row.subtype] = []
        }
        groupedData[row.subtype].push(row.template)
      })
      
      console.log(`发现 ${Object.keys(groupedData).length} 个不同的非核心意图子类型`)
      
      // 预定义回复
      const responseTemplates = {
        '唤醒确认': '我在这里，有什么可以帮助您的吗？',
        '问候': '您好！很高兴为您服务！',
        '感谢': '不用客气，很高兴能帮到您！',
        '告别': '再见！期待下次为您服务！',
        '确认': '好的，我明白了。',
        '否定': '我理解您的意思。',
        '赞美': '谢谢您的夸奖！',
        '抱怨': '很抱歉给您带来困扰，我会努力改进的。'
      }
      
      let addedNonCoreCount = 0
      let skippedNonCoreCount = 0
      
      for (const [subtype, templates] of Object.entries(groupedData)) {
        try {
          // 确定类别ID
          const categoryName = mapSubtypeToCategory(subtype)
          const categoryId = categoryMap[categoryName] || 15
          
          // 生成回复
          let response = responseTemplates[subtype] || '好的，我明白了。'
          
          // 构建意图数据
          const intentData = {
            name: subtype,
            description: `${subtype}相关的意图识别`,
            categoryId: categoryId,
            keywords: templates.slice(0, 50), // 取前50个作为关键词
            confidence: 0.8,
            response: response
          }
          
          // 检查是否已存在
          const existing = await NonCoreIntent.findOne({ where: { name: intentData.name } })
          if (!existing) {
            await NonCoreIntent.create(intentData)
            addedNonCoreCount++
            console.log(`✓ 添加非核心意图: ${subtype} (${templates.length}个模板) -> ${categoryName}`)
          } else {
            skippedNonCoreCount++
            console.log(`- 跳过已存在的非核心意图: ${subtype}`)
          }
        } catch (error) {
          console.error('添加非核心意图失败:', subtype, error.message)
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
importUltraExpandedCSV() 