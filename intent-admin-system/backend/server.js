const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '智能音箱意图管理系统 API',
    version: '1.0.0',
    status: 'running'
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '系统运行正常',
    timestamp: new Date().toISOString()
  })
})

// 核心意图API
app.get('/api/core-intents', (req, res) => {
  const { page = 1, limit = 20, search = '', status = '', categoryId = '' } = req.query
  
  let mockCoreIntents = [
    {
        "id": 301,
        "name": "播放音乐",
        "subtype": "播放音乐",
        "description": "播放指定歌曲、歌手或音乐类型",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "播放音乐",
            "放首歌",
            "听音乐",
            "播放歌曲",
            "来首歌",
            "我想听歌"
        ],
        "confidence": 0.95,
        "priority": 1,
        "usageCount": 3200,
        "status": "active"
    },
    {
        "id": 302,
        "name": "暂停播放",
        "subtype": "暂停播放",
        "description": "暂停当前播放的音乐或音频",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "暂停",
            "暂停播放",
            "停止",
            "停止播放",
            "别放了",
            "先停一下"
        ],
        "confidence": 0.97,
        "priority": 1,
        "usageCount": 1800,
        "status": "active"
    },
    {
        "id": 303,
        "name": "切换歌曲",
        "subtype": "切换歌曲",
        "description": "切换到下一首或上一首歌曲",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "下一首",
            "上一首",
            "换一首",
            "切歌",
            "跳过",
            "下首歌"
        ],
        "confidence": 0.94,
        "priority": 1,
        "usageCount": 2450,
        "status": "active"
    },
    {
        "id": 304,
        "name": "音量控制",
        "subtype": "音量控制",
        "description": "调节音量大小或静音",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "调大声音",
            "调小声音",
            "静音",
            "音量大一点",
            "音量小一点",
            "声音大点"
        ],
        "confidence": 0.92,
        "priority": 1,
        "usageCount": 1350,
        "status": "active"
    },
    {
        "id": 401,
        "name": "灯光控制",
        "subtype": "灯光控制",
        "description": "控制智能灯具的开关和亮度",
        "categoryId": 1,
        "category": {
            "id": 1,
            "name": "智能家居",
            "icon": "🏠"
        },
        "keywords": [
            "开灯",
            "关灯",
            "调亮一点",
            "调暗一点",
            "客厅开灯",
            "卧室关灯"
        ],
        "confidence": 0.96,
        "priority": 1,
        "usageCount": 2800,
        "status": "active"
    },
    {
        "id": 402,
        "name": "空调控制",
        "subtype": "空调控制",
        "description": "控制空调的开关、温度和模式",
        "categoryId": 1,
        "category": {
            "id": 1,
            "name": "智能家居",
            "icon": "🏠"
        },
        "keywords": [
            "开空调",
            "关空调",
            "调温度",
            "制冷",
            "制热",
            "除湿",
            "空调温度"
        ],
        "confidence": 0.93,
        "priority": 1,
        "usageCount": 1900,
        "status": "active"
    },
    {
        "id": 403,
        "name": "窗帘控制",
        "subtype": "窗帘控制",
        "description": "控制智能窗帘的开关",
        "categoryId": 1,
        "category": {
            "id": 1,
            "name": "智能家居",
            "icon": "🏠"
        },
        "keywords": [
            "开窗帘",
            "关窗帘",
            "拉开窗帘",
            "拉上窗帘",
            "卧室窗帘",
            "客厅窗帘"
        ],
        "confidence": 0.9,
        "priority": 2,
        "usageCount": 680,
        "status": "active"
    },
    {
        "id": 201,
        "name": "天气查询",
        "subtype": "天气查询",
        "description": "查询当前天气、温度、湿度等天气信息",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "今天天气",
            "天气怎么样",
            "温度多少",
            "外面热吗",
            "下雨了吗",
            "天气如何"
        ],
        "confidence": 0.92,
        "priority": 1,
        "usageCount": 2100,
        "status": "active"
    },
    {
        "id": 202,
        "name": "时间查询",
        "subtype": "时间查询",
        "description": "查询当前时间、日期等时间相关信息",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "现在几点",
            "几点了",
            "现在是几点",
            "时间是多少",
            "当前时间"
        ],
        "confidence": 0.95,
        "priority": 1,
        "usageCount": 1250,
        "status": "active"
    },
    {
        "id": 203,
        "name": "新闻播报",
        "subtype": "新闻播报",
        "description": "播报最新新闻和资讯",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "今天新闻",
            "播放新闻",
            "最新资讯",
            "财经新闻",
            "体育新闻",
            "听新闻"
        ],
        "confidence": 0.9,
        "priority": 2,
        "usageCount": 1450,
        "status": "active"
    },
    {
        "id": 501,
        "name": "设置闹钟",
        "subtype": "设置闹钟",
        "description": "设置定时闹钟提醒",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "设闹钟",
            "明天七点叫我",
            "定个闹钟",
            "提醒我起床",
            "闹铃",
            "设置闹铃"
        ],
        "confidence": 0.94,
        "priority": 1,
        "usageCount": 1850,
        "status": "active"
    },
    {
        "id": 502,
        "name": "设置提醒",
        "subtype": "设置提醒",
        "description": "设置事件提醒和备忘录",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "提醒我",
            "别忘了",
            "记住",
            "备忘录",
            "稍后提醒",
            "定时提醒"
        ],
        "confidence": 0.91,
        "priority": 1,
        "usageCount": 1320,
        "status": "active"
    },
    {
        "id": 503,
        "name": "倒计时",
        "subtype": "倒计时",
        "description": "设置倒计时器功能",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "倒计时",
            "计时器",
            "十分钟后提醒",
            "定时",
            "计时",
            "时间到了叫我"
        ],
        "confidence": 0.89,
        "priority": 2,
        "usageCount": 780,
        "status": "active"
    },
    {
        "id": 601,
        "name": "数学计算",
        "subtype": "数学计算",
        "description": "进行基础数学运算",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "计算",
            "算一下",
            "多少加多少",
            "除法",
            "乘法",
            "减法",
            "等于多少"
        ],
        "confidence": 0.95,
        "priority": 2,
        "usageCount": 890,
        "status": "active"
    },
    {
        "id": 602,
        "name": "单位换算",
        "subtype": "单位换算",
        "description": "进行各种单位的换算",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "换算",
            "多少米",
            "多少公斤",
            "华氏度",
            "摄氏度",
            "英里",
            "厘米"
        ],
        "confidence": 0.88,
        "priority": 3,
        "usageCount": 450,
        "status": "active"
    },
    {
        "id": 701,
        "name": "讲笑话",
        "subtype": "讲笑话",
        "description": "讲述幽默笑话娱乐用户",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "讲个笑话",
            "说个笑话",
            "来个笑话",
            "逗我开心",
            "搞笑一下"
        ],
        "confidence": 0.92,
        "priority": 2,
        "usageCount": 1200,
        "status": "active"
    },
    {
        "id": 702,
        "name": "诗词朗诵",
        "subtype": "诗词朗诵",
        "description": "朗诵古诗词或现代诗歌",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "背首诗",
            "朗诵诗词",
            "古诗",
            "诗歌",
            "念首诗"
        ],
        "confidence": 0.88,
        "priority": 3,
        "usageCount": 520,
        "status": "active"
    },
    {
        "id": 703,
        "name": "故事播放",
        "subtype": "故事播放",
        "description": "播放有声故事或童话",
        "categoryId": 3,
        "category": {
            "id": 3,
            "name": "娱乐互动",
            "icon": "🎵"
        },
        "keywords": [
            "讲故事",
            "听故事",
            "童话故事",
            "睡前故事",
            "播放故事"
        ],
        "confidence": 0.9,
        "priority": 2,
        "usageCount": 850,
        "status": "active"
    },
    {
        "id": 801,
        "name": "翻译功能",
        "subtype": "翻译功能",
        "description": "提供多语言翻译服务",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "翻译",
            "英文怎么说",
            "中文翻译",
            "日语翻译",
            "韩语翻译",
            "法语"
        ],
        "confidence": 0.9,
        "priority": 2,
        "usageCount": 1200,
        "status": "active"
    },
    {
        "id": 802,
        "name": "百科问答",
        "subtype": "百科问答",
        "description": "回答百科知识问题",
        "categoryId": 2,
        "category": {
            "id": 2,
            "name": "信息查询",
            "icon": "🔍"
        },
        "keywords": [
            "什么是",
            "为什么",
            "怎么样",
            "百科",
            "知识",
            "告诉我"
        ],
        "confidence": 0.85,
        "priority": 2,
        "usageCount": 1850,
        "status": "active"
    },
    {
        "id": 901,
        "name": "购物清单",
        "subtype": "购物清单",
        "description": "管理购物清单和待办事项",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "购物清单",
            "添加到清单",
            "买什么",
            "购物列表",
            "记录购物"
        ],
        "confidence": 0.87,
        "priority": 2,
        "usageCount": 650,
        "status": "active"
    },
    {
        "id": 902,
        "name": "食谱推荐",
        "subtype": "食谱推荐",
        "description": "推荐菜谱和烹饪方法",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "今天吃什么",
            "食谱",
            "怎么做菜",
            "菜谱",
            "烹饪",
            "做饭"
        ],
        "confidence": 0.86,
        "priority": 2,
        "usageCount": 740,
        "status": "active"
    },
    {
        "id": 1001,
        "name": "健康建议",
        "subtype": "健康建议",
        "description": "提供健康养生建议",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "健康建议",
            "养生",
            "注意什么",
            "保健",
            "锻炼",
            "运动"
        ],
        "confidence": 0.83,
        "priority": 3,
        "usageCount": 580,
        "status": "active"
    },
    {
        "id": 1002,
        "name": "冥想引导",
        "subtype": "冥想引导",
        "description": "提供冥想和放松指导",
        "categoryId": 4,
        "category": {
            "id": 4,
            "name": "生活服务",
            "icon": "📅"
        },
        "keywords": [
            "冥想",
            "放松",
            "深呼吸",
            "减压",
            "静心",
            "冥想音乐"
        ],
        "confidence": 0.85,
        "priority": 3,
        "usageCount": 420,
        "status": "active"
    }
]

  // 应用搜索过滤
  if (search) {
    mockCoreIntents = mockCoreIntents.filter(intent => 
      intent.name.includes(search) || 
      intent.description.includes(search) ||
      intent.keywords.some(keyword => keyword.includes(search))
    )
  }

  // 应用状态过滤
  if (status) {
    mockCoreIntents = mockCoreIntents.filter(intent => intent.status === status)
  }

  // 应用分类过滤
  if (categoryId) {
    mockCoreIntents = mockCoreIntents.filter(intent => intent.categoryId === parseInt(categoryId))
  }

  // 分页
  const total = mockCoreIntents.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedData = mockCoreIntents.slice(start, end)

  res.json({
    success: true,
    data: paginatedData,
    total: total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: Math.ceil(total / limit)
    }
  })
})

// 创建核心意图
app.post('/api/core-intents', (req, res) => {
  const { name, description, categoryId, keywords, confidence, priority, status } = req.body
  
  if (!name || !categoryId) {
    return res.status(400).json({
      success: false,
      message: '意图名称和分类为必填项'
    })
  }

  const newIntent = {
    id: Date.now(),
    name,
    description: description || '',
    categoryId: parseInt(categoryId),
    keywords: keywords || [],
    confidence: confidence || 0.8,
    priority: priority || 1,
    usageCount: 0,
    status: status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  res.json({
    success: true,
    data: newIntent,
    message: '核心意图创建成功'
  })
})

// 统计数据
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalCategories: 4,
        totalCoreIntents: 24,
        totalNonCoreIntents: 23,
        totalResponses: 24,
        activeCoreIntents: 24,
        activeNonCoreIntents: 23
      }
    }
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 智能音箱意图管理系统后端服务启动成功!`)
  console.log(`📡 服务地址: http://localhost:${PORT}`)
  console.log(`🎯 已加载 ${24} 个核心意图`)
  console.log(`📊 数据统计:`)
  
  const categoryStats = {}
  const intents = [{"id":301,"name":"播放音乐","subtype":"播放音乐","description":"播放指定歌曲、歌手或音乐类型","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["播放音乐","放首歌","听音乐","播放歌曲","来首歌","我想听歌"],"confidence":0.95,"priority":1,"usageCount":3200,"status":"active"},{"id":302,"name":"暂停播放","subtype":"暂停播放","description":"暂停当前播放的音乐或音频","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["暂停","暂停播放","停止","停止播放","别放了","先停一下"],"confidence":0.97,"priority":1,"usageCount":1800,"status":"active"},{"id":303,"name":"切换歌曲","subtype":"切换歌曲","description":"切换到下一首或上一首歌曲","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["下一首","上一首","换一首","切歌","跳过","下首歌"],"confidence":0.94,"priority":1,"usageCount":2450,"status":"active"},{"id":304,"name":"音量控制","subtype":"音量控制","description":"调节音量大小或静音","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["调大声音","调小声音","静音","音量大一点","音量小一点","声音大点"],"confidence":0.92,"priority":1,"usageCount":1350,"status":"active"},{"id":401,"name":"灯光控制","subtype":"灯光控制","description":"控制智能灯具的开关和亮度","categoryId":1,"category":{"id":1,"name":"智能家居","icon":"🏠"},"keywords":["开灯","关灯","调亮一点","调暗一点","客厅开灯","卧室关灯"],"confidence":0.96,"priority":1,"usageCount":2800,"status":"active"},{"id":402,"name":"空调控制","subtype":"空调控制","description":"控制空调的开关、温度和模式","categoryId":1,"category":{"id":1,"name":"智能家居","icon":"🏠"},"keywords":["开空调","关空调","调温度","制冷","制热","除湿","空调温度"],"confidence":0.93,"priority":1,"usageCount":1900,"status":"active"},{"id":403,"name":"窗帘控制","subtype":"窗帘控制","description":"控制智能窗帘的开关","categoryId":1,"category":{"id":1,"name":"智能家居","icon":"🏠"},"keywords":["开窗帘","关窗帘","拉开窗帘","拉上窗帘","卧室窗帘","客厅窗帘"],"confidence":0.9,"priority":2,"usageCount":680,"status":"active"},{"id":201,"name":"天气查询","subtype":"天气查询","description":"查询当前天气、温度、湿度等天气信息","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["今天天气","天气怎么样","温度多少","外面热吗","下雨了吗","天气如何"],"confidence":0.92,"priority":1,"usageCount":2100,"status":"active"},{"id":202,"name":"时间查询","subtype":"时间查询","description":"查询当前时间、日期等时间相关信息","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["现在几点","几点了","现在是几点","时间是多少","当前时间"],"confidence":0.95,"priority":1,"usageCount":1250,"status":"active"},{"id":203,"name":"新闻播报","subtype":"新闻播报","description":"播报最新新闻和资讯","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["今天新闻","播放新闻","最新资讯","财经新闻","体育新闻","听新闻"],"confidence":0.9,"priority":2,"usageCount":1450,"status":"active"},{"id":501,"name":"设置闹钟","subtype":"设置闹钟","description":"设置定时闹钟提醒","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["设闹钟","明天七点叫我","定个闹钟","提醒我起床","闹铃","设置闹铃"],"confidence":0.94,"priority":1,"usageCount":1850,"status":"active"},{"id":502,"name":"设置提醒","subtype":"设置提醒","description":"设置事件提醒和备忘录","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["提醒我","别忘了","记住","备忘录","稍后提醒","定时提醒"],"confidence":0.91,"priority":1,"usageCount":1320,"status":"active"},{"id":503,"name":"倒计时","subtype":"倒计时","description":"设置倒计时器功能","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["倒计时","计时器","十分钟后提醒","定时","计时","时间到了叫我"],"confidence":0.89,"priority":2,"usageCount":780,"status":"active"},{"id":601,"name":"数学计算","subtype":"数学计算","description":"进行基础数学运算","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["计算","算一下","多少加多少","除法","乘法","减法","等于多少"],"confidence":0.95,"priority":2,"usageCount":890,"status":"active"},{"id":602,"name":"单位换算","subtype":"单位换算","description":"进行各种单位的换算","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["换算","多少米","多少公斤","华氏度","摄氏度","英里","厘米"],"confidence":0.88,"priority":3,"usageCount":450,"status":"active"},{"id":701,"name":"讲笑话","subtype":"讲笑话","description":"讲述幽默笑话娱乐用户","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["讲个笑话","说个笑话","来个笑话","逗我开心","搞笑一下"],"confidence":0.92,"priority":2,"usageCount":1200,"status":"active"},{"id":702,"name":"诗词朗诵","subtype":"诗词朗诵","description":"朗诵古诗词或现代诗歌","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["背首诗","朗诵诗词","古诗","诗歌","念首诗"],"confidence":0.88,"priority":3,"usageCount":520,"status":"active"},{"id":703,"name":"故事播放","subtype":"故事播放","description":"播放有声故事或童话","categoryId":3,"category":{"id":3,"name":"娱乐互动","icon":"🎵"},"keywords":["讲故事","听故事","童话故事","睡前故事","播放故事"],"confidence":0.9,"priority":2,"usageCount":850,"status":"active"},{"id":801,"name":"翻译功能","subtype":"翻译功能","description":"提供多语言翻译服务","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["翻译","英文怎么说","中文翻译","日语翻译","韩语翻译","法语"],"confidence":0.9,"priority":2,"usageCount":1200,"status":"active"},{"id":802,"name":"百科问答","subtype":"百科问答","description":"回答百科知识问题","categoryId":2,"category":{"id":2,"name":"信息查询","icon":"🔍"},"keywords":["什么是","为什么","怎么样","百科","知识","告诉我"],"confidence":0.85,"priority":2,"usageCount":1850,"status":"active"},{"id":901,"name":"购物清单","subtype":"购物清单","description":"管理购物清单和待办事项","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["购物清单","添加到清单","买什么","购物列表","记录购物"],"confidence":0.87,"priority":2,"usageCount":650,"status":"active"},{"id":902,"name":"食谱推荐","subtype":"食谱推荐","description":"推荐菜谱和烹饪方法","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["今天吃什么","食谱","怎么做菜","菜谱","烹饪","做饭"],"confidence":0.86,"priority":2,"usageCount":740,"status":"active"},{"id":1001,"name":"健康建议","subtype":"健康建议","description":"提供健康养生建议","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["健康建议","养生","注意什么","保健","锻炼","运动"],"confidence":0.83,"priority":3,"usageCount":580,"status":"active"},{"id":1002,"name":"冥想引导","subtype":"冥想引导","description":"提供冥想和放松指导","categoryId":4,"category":{"id":4,"name":"生活服务","icon":"📅"},"keywords":["冥想","放松","深呼吸","减压","静心","冥想音乐"],"confidence":0.85,"priority":3,"usageCount":420,"status":"active"}]
  intents.forEach(intent => {
    const categoryName = intent.category.name
    categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1
  })
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} 个意图`)
  })
  
  console.log('\n准备就绪! 🎉')
})