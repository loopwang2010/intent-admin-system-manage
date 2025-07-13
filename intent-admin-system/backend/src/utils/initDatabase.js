const { sequelize } = require('../models')

async function initDatabase() {
  try {
    console.log('正在连接数据库...')
    console.log('数据库文件路径:', sequelize.options.storage)
    
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('数据库连接成功!')
    
    // 同步所有模型（创建表）
    console.log('正在创建数据库表...')
    await sequelize.sync({ force: true }) // force: true 会删除已存在的表并重新创建
    console.log('数据库表创建完成!')
    
    // 插入初始数据
    console.log('正在插入初始数据...')
    await insertInitialData()
    
    // 创建角色和权限种子数据
    console.log('正在创建角色和权限数据...')
    const { createSeeds } = require('../seeds')
    await createSeeds()
    console.log('角色和权限数据创建完成!')
    
    console.log('初始数据插入完成!')
    
    console.log('数据库初始化完成!')
    process.exit(0)
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

async function insertInitialData() {
  const { 
    IntentCategory, 
    CoreIntent, 
    NonCoreIntent, 
    PreResponse, 
    SystemLog,
    DataStatistics 
  } = require('../models')
  
  // 插入意图类别
  const categories = [
    { name: '音乐播放', description: '与音乐播放相关的意图', icon: 'music', sortOrder: 1 },
    { name: '天气查询', description: '查询天气信息的意图', icon: 'weather', sortOrder: 2 },
    { name: '新闻资讯', description: '获取新闻资讯的意图', icon: 'news', sortOrder: 3 },
    { name: '智能家居', description: '控制智能家居设备', icon: 'home', sortOrder: 4 },
    { name: '时间日期', description: '查询时间和日期相关', icon: 'time', sortOrder: 5 },
    { name: '计算功能', description: '进行数学计算', icon: 'calculator', sortOrder: 6 },
    { name: '翻译功能', description: '语言翻译服务', icon: 'translate', sortOrder: 7 },
    { name: '股票查询', description: '查询股票信息', icon: 'stock', sortOrder: 8 },
    { name: '生活服务', description: '各种生活服务查询', icon: 'service', sortOrder: 9 },
    { name: '娱乐游戏', description: '娱乐和游戏相关', icon: 'game', sortOrder: 10 },
    { name: '学习教育', description: '学习和教育相关', icon: 'education', sortOrder: 11 },
    { name: '健康医疗', description: '健康和医疗咨询', icon: 'health', sortOrder: 12 },
    { name: '交通出行', description: '交通和出行信息', icon: 'transport', sortOrder: 13 },
    { name: '购物消费', description: '购物和消费相关', icon: 'shopping', sortOrder: 14 },
    { name: '系统功能', description: '系统控制和设置', icon: 'system', sortOrder: 15 }
  ]
  
  const createdCategories = await IntentCategory.bulkCreate(categories)
  console.log(`已创建 ${createdCategories.length} 个意图类别`)
  
  // 插入核心意图
  const coreIntents = [
    {
      name: '播放音乐',
      description: '播放指定的音乐',
      categoryId: 1,
      keywords: JSON.stringify(['播放', '音乐', '歌曲', '听歌', '放歌']),
      confidence: 0.8,
      priority: 1,
      status: 'active',
      usageCount: 0,
      successCount: 0,
      version: '1.0.0',
      aiGenerated: false,
      language: 'zh-CN'
    },
    {
      name: '暂停音乐',
      description: '暂停当前播放的音乐',
      categoryId: 1,
      keywords: JSON.stringify(['暂停', '停止', '别播了']),
      confidence: 0.9,
      priority: 2,
      status: 'active',
      usageCount: 0,
      successCount: 0,
      version: '1.0.0',
      aiGenerated: false,
      language: 'zh-CN'
    },
    {
      name: '查询天气',
      description: '查询指定地区的天气情况',
      categoryId: 2,
      keywords: JSON.stringify(['天气', '气温', '下雨', '晴天', '阴天']),
      confidence: 0.7,
      priority: 1,
      status: 'active',
      usageCount: 0,
      successCount: 0,
      version: '1.0.0',
      aiGenerated: false,
      language: 'zh-CN'
    },
    {
      name: '开灯',
      description: '打开房间的灯光',
      categoryId: 4,
      keywords: JSON.stringify(['开灯', '打开灯', '灯亮一点']),
      confidence: 0.9,
      priority: 1,
      status: 'active',
      usageCount: 0,
      successCount: 0,
      version: '1.0.0',
      aiGenerated: false,
      language: 'zh-CN'
    },
    {
      name: '关灯',
      description: '关闭房间的灯光',
      categoryId: 4,
      keywords: JSON.stringify(['关灯', '关闭灯', '熄灯']),
      confidence: 0.9,
      priority: 2,
      status: 'active',
      usageCount: 0,
      successCount: 0,
      version: '1.0.0',
      aiGenerated: false,
      language: 'zh-CN'
    }
  ]
  
  const createdCoreIntents = await CoreIntent.bulkCreate(coreIntents)
  console.log(`已创建 ${createdCoreIntents.length} 个核心意图`)
  
  // 插入非核心意图
  const nonCoreIntents = [
    {
      name: '问候语',
      description: '用户的问候',
      categoryId: 15,
      keywords: JSON.stringify(['你好', '早上好', '晚上好', 'hello']),
      confidence: 0.8,
      response: '你好！我是智能助手，有什么可以帮助您的吗？',
      status: 'pending',
      priority: 1,
      language: 'zh-CN'
    },
    {
      name: '感谢语',
      description: '用户的感谢',
      categoryId: 15,
      keywords: JSON.stringify(['谢谢', '感谢', 'thanks']),
      confidence: 0.8,
      response: '不用客气，很高兴能帮到您！',
      status: 'pending',
      priority: 2,
      language: 'zh-CN'
    },
    {
      name: '再见',
      description: '用户告别',
      categoryId: 15,
      keywords: JSON.stringify(['再见', '拜拜', 'bye']),
      confidence: 0.8,
      response: '再见！期待下次为您服务！',
      status: 'pending',
      priority: 3,
      language: 'zh-CN'
    }
  ]
  
  const createdNonCoreIntents = await NonCoreIntent.bulkCreate(nonCoreIntents)
  console.log(`已创建 ${createdNonCoreIntents.length} 个非核心意图`)
  
  // 插入先行回复
  const preResponses = [
    {
      coreIntentId: 1,
      content: '好的，正在为您播放音乐...',
      priority: 1
    },
    {
      coreIntentId: 1,
      content: '马上为您播放，请稍等...',
      priority: 2
    },
    {
      coreIntentId: 2,
      content: '音乐已暂停',
      priority: 1
    },
    {
      coreIntentId: 3,
      content: '正在查询天气信息，请稍候...',
      priority: 1
    },
    {
      coreIntentId: 4,
      content: '好的，正在为您开灯...',
      priority: 1
    },
    {
      coreIntentId: 5,
      content: '正在关闭灯光...',
      priority: 1
    }
  ]
  
  const createdPreResponses = await PreResponse.bulkCreate(preResponses)
  console.log(`已创建 ${createdPreResponses.length} 个先行回复`)
  
  // 插入系统日志示例
  const systemLogs = [
    {
      level: 'info',
      message: '系统启动成功',
      source: 'system',
      userId: null,
      action: 'SYSTEM_INIT',
      operationType: 'SYSTEM_STARTUP',
      resource: 'system',
      resourceId: null,
      metadata: JSON.stringify({ version: '1.0.0' })
    },
    {
      level: 'info',
      message: '数据库初始化完成',
      source: 'database',
      userId: null,
      action: 'DATA_SEED',
      operationType: 'DATABASE_INIT',
      resource: 'database',
      resourceId: null,
      metadata: JSON.stringify({ tables: 6 })
    }
  ]
  
  const createdLogs = await SystemLog.bulkCreate(systemLogs)
  console.log(`已创建 ${createdLogs.length} 条系统日志`)
  
  // 插入数据统计示例
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dataStats = [
    {
      date: yesterday.toISOString().split('T')[0],
      totalRequests: 150,
      successRequests: 135,
      failureRequests: 15,
      avgResponseTime: 245,
      uniqueUsers: 25,
      topIntent: '播放音乐'
    },
    {
      date: today.toISOString().split('T')[0],
      totalRequests: 89,
      successRequests: 82,
      failureRequests: 7,
      avgResponseTime: 198,
      uniqueUsers: 18,
      topIntent: '查询天气'
    }
  ]
  
  const createdStats = await DataStatistics.bulkCreate(dataStats)
  console.log(`已创建 ${createdStats.length} 条数据统计记录`)
}

// 运行初始化
initDatabase() 