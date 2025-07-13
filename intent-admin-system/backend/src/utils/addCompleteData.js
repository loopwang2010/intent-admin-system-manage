const { sequelize } = require('../models')

async function addCompleteData() {
  try {
    console.log('正在连接数据库...')
    await sequelize.authenticate()
    console.log('数据库连接成功!')
    
    const { 
      IntentCategory, 
      CoreIntent, 
      NonCoreIntent, 
      PreResponse, 
      SystemLog,
      DataStatistics 
    } = require('../models')
    
    // 检查现有数据
    const existingCoreIntents = await CoreIntent.count()
    const existingNonCoreIntents = await NonCoreIntent.count()
    
    console.log(`现有核心意图: ${existingCoreIntents}个`)
    console.log(`现有非核心意图: ${existingNonCoreIntents}个`)
    
    // 完整的核心意图数据
    const coreIntentsToAdd = [
      // 音乐播放类 (categoryId: 1)
      {
        name: '下一首',
        description: '播放下一首歌曲',
        categoryId: 1,
        keywords: ['下一首', '切歌', '换一首', '下首歌'],
        confidence: 0.9,
        priority: 3
      },
      {
        name: '上一首',
        description: '播放上一首歌曲',
        categoryId: 1,
        keywords: ['上一首', '前一首', '回到上首'],
        confidence: 0.9,
        priority: 4
      },
      {
        name: '调节音量',
        description: '调节播放音量',
        categoryId: 1,
        keywords: ['音量', '大声点', '小声点', '调音量'],
        confidence: 0.8,
        priority: 5
      },
      
      // 天气查询类 (categoryId: 2)
      {
        name: '明天天气',
        description: '查询明天的天气',
        categoryId: 2,
        keywords: ['明天天气', '明日天气', '明天怎么样'],
        confidence: 0.8,
        priority: 2
      },
      {
        name: '一周天气',
        description: '查询一周天气预报',
        categoryId: 2,
        keywords: ['一周天气', '七天天气', '天气预报'],
        confidence: 0.7,
        priority: 3
      },
      
      // 新闻资讯类 (categoryId: 3)
      {
        name: '播报新闻',
        description: '播报最新新闻',
        categoryId: 3,
        keywords: ['新闻', '今日新闻', '播报新闻', '最新消息'],
        confidence: 0.8,
        priority: 1
      },
      {
        name: '财经新闻',
        description: '播报财经新闻',
        categoryId: 3,
        keywords: ['财经新闻', '股市新闻', '经济新闻'],
        confidence: 0.7,
        priority: 2
      },
      {
        name: '体育新闻',
        description: '播报体育新闻',
        categoryId: 3,
        keywords: ['体育新闻', '足球新闻', '篮球新闻', '运动新闻'],
        confidence: 0.7,
        priority: 3
      },
      
      // 智能家居类 (categoryId: 4) - 已有开灯、关灯
      {
        name: '调节空调',
        description: '调节空调温度',
        categoryId: 4,
        keywords: ['空调', '调温度', '开空调', '关空调'],
        confidence: 0.9,
        priority: 3
      },
      {
        name: '窗帘控制',
        description: '控制窗帘开关',
        categoryId: 4,
        keywords: ['窗帘', '开窗帘', '关窗帘', '拉窗帘'],
        confidence: 0.8,
        priority: 4
      },
      
      // 时间日期类 (categoryId: 5)
      {
        name: '现在时间',
        description: '查询当前时间',
        categoryId: 5,
        keywords: ['几点了', '现在时间', '时间', '现在几点'],
        confidence: 0.9,
        priority: 1
      },
      {
        name: '今天日期',
        description: '查询今天日期',
        categoryId: 5,
        keywords: ['今天几号', '今天日期', '日期', '几月几号'],
        confidence: 0.9,
        priority: 2
      },
      {
        name: '设置闹钟',
        description: '设置闹钟提醒',
        categoryId: 5,
        keywords: ['设置闹钟', '定闹钟', '明天叫我', '提醒我'],
        confidence: 0.8,
        priority: 3
      },
      
      // 计算功能类 (categoryId: 6)
      {
        name: '数学计算',
        description: '进行数学计算',
        categoryId: 6,
        keywords: ['计算', '算一下', '多少', '等于'],
        confidence: 0.8,
        priority: 1
      },
      {
        name: '单位换算',
        description: '进行单位换算',
        categoryId: 6,
        keywords: ['换算', '转换', '公里', '公斤', '摄氏度'],
        confidence: 0.7,
        priority: 2
      },
      
      // 翻译功能类 (categoryId: 7)
      {
        name: '中英翻译',
        description: '中英文翻译',
        categoryId: 7,
        keywords: ['翻译', '英文怎么说', '中文意思', '翻译成'],
        confidence: 0.8,
        priority: 1
      },
      {
        name: '多语言翻译',
        description: '多语言翻译',
        categoryId: 7,
        keywords: ['日语', '韩语', '法语', '德语翻译'],
        confidence: 0.7,
        priority: 2
      },
      
      // 股票查询类 (categoryId: 8)
      {
        name: '股票查询',
        description: '查询股票价格',
        categoryId: 8,
        keywords: ['股票', '股价', '查股票', '股市'],
        confidence: 0.8,
        priority: 1
      },
      {
        name: '大盘指数',
        description: '查询大盘指数',
        categoryId: 8,
        keywords: ['大盘', '上证指数', '深证指数', '沪深'],
        confidence: 0.7,
        priority: 2
      }
    ]
    
    // 完整的非核心意图数据
    const nonCoreIntentsToAdd = [
      // 娱乐游戏类 (categoryId: 10)
      {
        name: '讲笑话',
        description: '讲一个笑话',
        categoryId: 10,
        keywords: ['讲笑话', '说笑话', '来个笑话', '幽默'],
        confidence: 0.8,
        response: '为什么程序员总是搞混万圣节和圣诞节？因为 Oct 31 == Dec 25！哈哈！'
      },
      {
        name: '猜谜语',
        description: '出谜语让用户猜',
        categoryId: 10,
        keywords: ['猜谜语', '出谜语', '谜语', '猜猜看'],
        confidence: 0.8,
        response: '我给你出个谜语：什么东西越洗越脏？答案是水！'
      },
      {
        name: '成语接龙',
        description: '玩成语接龙游戏',
        categoryId: 10,
        keywords: ['成语接龙', '接龙', '成语游戏'],
        confidence: 0.7,
        response: '我们来玩成语接龙吧！我先说：一心一意。请你接一个"意"字开头的成语！'
      },
      
      // 学习教育类 (categoryId: 11)
      {
        name: '背诗词',
        description: '背诵古诗词',
        categoryId: 11,
        keywords: ['背诗', '古诗', '诗词', '唐诗'],
        confidence: 0.8,
        response: '静夜思 - 李白：床前明月光，疑是地上霜。举头望明月，低头思故乡。'
      },
      {
        name: '英语单词',
        description: '学习英语单词',
        categoryId: 11,
        keywords: ['英语单词', '背单词', '英文单词', '学英语'],
        confidence: 0.8,
        response: '今天的单词是：Knowledge（知识）- 读音：[ˈnɒlɪdʒ]，例句：Knowledge is power.'
      },
      {
        name: '数学公式',
        description: '讲解数学公式',
        categoryId: 11,
        keywords: ['数学公式', '公式', '数学知识'],
        confidence: 0.7,
        response: '勾股定理：在直角三角形中，直角边的平方和等于斜边的平方，即 a² + b² = c²'
      },
      
      // 健康医疗类 (categoryId: 12)
      {
        name: '健康建议',
        description: '提供健康建议',
        categoryId: 12,
        keywords: ['健康建议', '养生', '保健', '健康'],
        confidence: 0.7,
        response: '保持健康的小贴士：每天喝8杯水，适量运动，保证充足睡眠，多吃蔬菜水果。如有疾病请咨询专业医生。'
      },
      {
        name: '运动指导',
        description: '提供运动指导',
        categoryId: 12,
        keywords: ['运动', '锻炼', '健身', '减肥'],
        confidence: 0.7,
        response: '建议每周进行150分钟中等强度运动，可以选择快走、游泳、骑行等。运动前记得热身哦！'
      },
      
      // 生活服务类 (categoryId: 9)
      {
        name: '生活小贴士',
        description: '分享生活小贴士',
        categoryId: 9,
        keywords: ['生活小贴士', '生活技巧', '小窍门'],
        confidence: 0.8,
        response: '生活小贴士：用牙膏可以清洁银饰，用可乐可以去除马桶污渍，用醋可以去除水垢。'
      },
      {
        name: '菜谱推荐',
        description: '推荐菜谱',
        categoryId: 9,
        keywords: ['菜谱', '做菜', '烹饪', '怎么做'],
        confidence: 0.8,
        response: '推荐一道简单的西红柿鸡蛋：先炒鸡蛋盛起，再炒西红柿出汁，倒入鸡蛋炒匀，调味即可。'
      },
      
      // 交通出行类 (categoryId: 13)
      {
        name: '路况查询',
        description: '查询路况信息',
        categoryId: 13,
        keywords: ['路况', '堵车', '交通', '路况怎么样'],
        confidence: 0.8,
        response: '请告诉我您要查询的具体路线，我会为您查询实时路况信息。'
      },
      {
        name: '公交查询',
        description: '查询公交信息',
        categoryId: 13,
        keywords: ['公交', '公交车', '班车', '几路车'],
        confidence: 0.8,
        response: '请告诉我您的起点和终点，我会为您查询合适的公交路线。'
      }
    ]
    
    // 插入新的核心意图（避免重复）
    console.log('\n正在添加核心意图...')
    let addedCoreCount = 0
    for (const intent of coreIntentsToAdd) {
      const existing = await CoreIntent.findOne({ where: { name: intent.name } })
      if (!existing) {
        await CoreIntent.create(intent)
        addedCoreCount++
        console.log(`✓ 添加核心意图: ${intent.name}`)
      } else {
        console.log(`- 跳过已存在的核心意图: ${intent.name}`)
      }
    }
    
    // 插入新的非核心意图（避免重复）
    console.log('\n正在添加非核心意图...')
    let addedNonCoreCount = 0
    for (const intent of nonCoreIntentsToAdd) {
      const existing = await NonCoreIntent.findOne({ where: { name: intent.name } })
      if (!existing) {
        await NonCoreIntent.create(intent)
        addedNonCoreCount++
        console.log(`✓ 添加非核心意图: ${intent.name}`)
      } else {
        console.log(`- 跳过已存在的非核心意图: ${intent.name}`)
      }
    }
    
    // 为新的核心意图添加先行回复
    console.log('\n正在添加先行回复...')
    const newCoreIntents = await CoreIntent.findAll({
      where: {
        name: coreIntentsToAdd.map(intent => intent.name)
      }
    })
    
    const preResponsesToAdd = [
      // 为新的核心意图添加先行回复
      { coreIntentName: '下一首', content: '好的，正在为您切换到下一首...', priority: 1 },
      { coreIntentName: '上一首', content: '正在为您播放上一首歌曲...', priority: 1 },
      { coreIntentName: '调节音量', content: '正在为您调节音量...', priority: 1 },
      { coreIntentName: '明天天气', content: '正在查询明天的天气信息...', priority: 1 },
      { coreIntentName: '一周天气', content: '正在为您查询一周天气预报...', priority: 1 },
      { coreIntentName: '播报新闻', content: '正在为您播报最新新闻...', priority: 1 },
      { coreIntentName: '财经新闻', content: '正在为您获取财经新闻...', priority: 1 },
      { coreIntentName: '体育新闻', content: '正在为您播报体育新闻...', priority: 1 },
      { coreIntentName: '调节空调', content: '正在为您调节空调...', priority: 1 },
      { coreIntentName: '窗帘控制', content: '正在为您控制窗帘...', priority: 1 },
      { coreIntentName: '现在时间', content: '现在时间是...', priority: 1 },
      { coreIntentName: '今天日期', content: '今天是...', priority: 1 },
      { coreIntentName: '设置闹钟', content: '好的，正在为您设置闹钟...', priority: 1 },
      { coreIntentName: '数学计算', content: '正在为您计算...', priority: 1 },
      { coreIntentName: '单位换算', content: '正在为您进行单位换算...', priority: 1 },
      { coreIntentName: '中英翻译', content: '正在为您翻译...', priority: 1 },
      { coreIntentName: '多语言翻译', content: '正在为您进行翻译...', priority: 1 },
      { coreIntentName: '股票查询', content: '正在为您查询股票信息...', priority: 1 },
      { coreIntentName: '大盘指数', content: '正在为您查询大盘指数...', priority: 1 }
    ]
    
    let addedPreResponseCount = 0
    for (const preResp of preResponsesToAdd) {
      const coreIntent = newCoreIntents.find(intent => intent.name === preResp.coreIntentName)
      if (coreIntent) {
        const existing = await PreResponse.findOne({
          where: {
            coreIntentId: coreIntent.id,
            content: preResp.content
          }
        })
        if (!existing) {
          await PreResponse.create({
            coreIntentId: coreIntent.id,
            content: preResp.content,
            priority: preResp.priority
          })
          addedPreResponseCount++
        }
      }
    }
    
    console.log('\n=== 数据添加完成 ===')
    console.log(`✓ 新增核心意图: ${addedCoreCount}个`)
    console.log(`✓ 新增非核心意图: ${addedNonCoreCount}个`)
    console.log(`✓ 新增先行回复: ${addedPreResponseCount}个`)
    
    // 最终统计
    const finalCoreCount = await CoreIntent.count()
    const finalNonCoreCount = await NonCoreIntent.count()
    const finalPreResponseCount = await PreResponse.count()
    
    console.log('\n=== 最终数据统计 ===')
    console.log(`总核心意图: ${finalCoreCount}个`)
    console.log(`总非核心意图: ${finalNonCoreCount}个`)
    console.log(`总先行回复: ${finalPreResponseCount}个`)
    
    process.exit(0)
  } catch (error) {
    console.error('数据添加失败:', error)
    process.exit(1)
  }
}

// 运行数据添加
addCompleteData() 