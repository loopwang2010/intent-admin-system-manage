const fs = require('fs');

// 生成扩展的核心意图数据 - 涵盖智能音箱的主要使用场景
const generateExtendedCoreIntents = () => {
  const baseDate = Date.now();
  
  return [
    // === 音乐娱乐类 ===
    {
      id: 301,
      name: '播放音乐',
      subtype: '播放音乐',
      description: '播放指定歌曲、歌手或音乐类型',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['播放音乐', '放首歌', '听音乐', '播放歌曲', '来首歌', '我想听歌'],
      confidence: 0.95,
      priority: 1,
      usageCount: 3200,
      status: 'active'
    },
    {
      id: 302,
      name: '暂停播放',
      subtype: '暂停播放',
      description: '暂停当前播放的音乐或音频',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['暂停', '暂停播放', '停止', '停止播放', '别放了', '先停一下'],
      confidence: 0.97,
      priority: 1,
      usageCount: 1800,
      status: 'active'
    },
    {
      id: 303,
      name: '切换歌曲',
      subtype: '切换歌曲',
      description: '切换到下一首或上一首歌曲',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['下一首', '上一首', '换一首', '切歌', '跳过', '下首歌'],
      confidence: 0.94,
      priority: 1,
      usageCount: 2450,
      status: 'active'
    },
    {
      id: 304,
      name: '音量控制',
      subtype: '音量控制',
      description: '调节音量大小或静音',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['调大声音', '调小声音', '静音', '音量大一点', '音量小一点', '声音大点'],
      confidence: 0.92,
      priority: 1,
      usageCount: 1350,
      status: 'active'
    },

    // === 智能家居控制类 ===
    {
      id: 401,
      name: '灯光控制',
      subtype: '灯光控制',
      description: '控制智能灯具的开关和亮度',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开灯', '关灯', '调亮一点', '调暗一点', '客厅开灯', '卧室关灯'],
      confidence: 0.96,
      priority: 1,
      usageCount: 2800,
      status: 'active'
    },
    {
      id: 402,
      name: '空调控制',
      subtype: '空调控制',
      description: '控制空调的开关、温度和模式',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开空调', '关空调', '调温度', '制冷', '制热', '除湿', '空调温度'],
      confidence: 0.93,
      priority: 1,
      usageCount: 1900,
      status: 'active'
    },
    {
      id: 403,
      name: '窗帘控制',
      subtype: '窗帘控制',
      description: '控制智能窗帘的开关',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开窗帘', '关窗帘', '拉开窗帘', '拉上窗帘', '卧室窗帘', '客厅窗帘'],
      confidence: 0.90,
      priority: 2,
      usageCount: 680,
      status: 'active'
    },

    // === 信息查询类 ===
    {
      id: 201,
      name: '天气查询',
      subtype: '天气查询',
      description: '查询当前天气、温度、湿度等天气信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['今天天气', '天气怎么样', '温度多少', '外面热吗', '下雨了吗', '天气如何'],
      confidence: 0.92,
      priority: 1,
      usageCount: 2100,
      status: 'active'
    },
    {
      id: 202,
      name: '时间查询',
      subtype: '时间查询',
      description: '查询当前时间、日期等时间相关信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['现在几点', '几点了', '现在是几点', '时间是多少', '当前时间'],
      confidence: 0.95,
      priority: 1,
      usageCount: 1250,
      status: 'active'
    },
    {
      id: 203,
      name: '新闻播报',
      subtype: '新闻播报',
      description: '播报最新新闻和资讯',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['今天新闻', '播放新闻', '最新资讯', '财经新闻', '体育新闻', '听新闻'],
      confidence: 0.90,
      priority: 2,
      usageCount: 1450,
      status: 'active'
    },

    // === 生活服务类 ===
    {
      id: 501,
      name: '设置闹钟',
      subtype: '设置闹钟',
      description: '设置定时闹钟提醒',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['设闹钟', '明天七点叫我', '定个闹钟', '提醒我起床', '闹铃', '设置闹铃'],
      confidence: 0.94,
      priority: 1,
      usageCount: 1850,
      status: 'active'
    },
    {
      id: 502,
      name: '设置提醒',
      subtype: '设置提醒',
      description: '设置事件提醒和备忘录',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['提醒我', '别忘了', '记住', '备忘录', '稍后提醒', '定时提醒'],
      confidence: 0.91,
      priority: 1,
      usageCount: 1320,
      status: 'active'
    },
    {
      id: 503,
      name: '倒计时',
      subtype: '倒计时',
      description: '设置倒计时器功能',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['倒计时', '计时器', '十分钟后提醒', '定时', '计时', '时间到了叫我'],
      confidence: 0.89,
      priority: 2,
      usageCount: 780,
      status: 'active'
    },

    // === 计算工具类 ===
    {
      id: 601,
      name: '数学计算',
      subtype: '数学计算',
      description: '进行基础数学运算',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['计算', '算一下', '多少加多少', '除法', '乘法', '减法', '等于多少'],
      confidence: 0.95,
      priority: 2,
      usageCount: 890,
      status: 'active'
    },
    {
      id: 602,
      name: '单位换算',
      subtype: '单位换算',
      description: '进行各种单位的换算',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['换算', '多少米', '多少公斤', '华氏度', '摄氏度', '英里', '厘米'],
      confidence: 0.88,
      priority: 3,
      usageCount: 450,
      status: 'active'
    },

    // === 娱乐互动类 ===
    {
      id: 701,
      name: '讲笑话',
      subtype: '讲笑话',
      description: '讲述幽默笑话娱乐用户',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['讲个笑话', '说个笑话', '来个笑话', '逗我开心', '搞笑一下'],
      confidence: 0.92,
      priority: 2,
      usageCount: 1200,
      status: 'active'
    },
    {
      id: 702,
      name: '诗词朗诵',
      subtype: '诗词朗诵',
      description: '朗诵古诗词或现代诗歌',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['背首诗', '朗诵诗词', '古诗', '诗歌', '念首诗'],
      confidence: 0.88,
      priority: 3,
      usageCount: 520,
      status: 'active'
    },
    {
      id: 703,
      name: '故事播放',
      subtype: '故事播放',
      description: '播放有声故事或童话',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['讲故事', '听故事', '童话故事', '睡前故事', '播放故事'],
      confidence: 0.90,
      priority: 2,
      usageCount: 850,
      status: 'active'
    },

    // === 语音助手类 ===
    {
      id: 801,
      name: '翻译功能',
      subtype: '翻译功能',
      description: '提供多语言翻译服务',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['翻译', '英文怎么说', '中文翻译', '日语翻译', '韩语翻译', '法语'],
      confidence: 0.90,
      priority: 2,
      usageCount: 1200,
      status: 'active'
    },
    {
      id: 802,
      name: '百科问答',
      subtype: '百科问答',
      description: '回答百科知识问题',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['什么是', '为什么', '怎么样', '百科', '知识', '告诉我'],
      confidence: 0.85,
      priority: 2,
      usageCount: 1850,
      status: 'active'
    },

    // === 购物生活类 ===
    {
      id: 901,
      name: '购物清单',
      subtype: '购物清单',
      description: '管理购物清单和待办事项',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['购物清单', '添加到清单', '买什么', '购物列表', '记录购物'],
      confidence: 0.87,
      priority: 2,
      usageCount: 650,
      status: 'active'
    },
    {
      id: 902,
      name: '食谱推荐',
      subtype: '食谱推荐',
      description: '推荐菜谱和烹饪方法',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['今天吃什么', '食谱', '怎么做菜', '菜谱', '烹饪', '做饭'],
      confidence: 0.86,
      priority: 2,
      usageCount: 740,
      status: 'active'
    },

    // === 健康运动类 ===
    {
      id: 1001,
      name: '健康建议',
      subtype: '健康建议',
      description: '提供健康养生建议',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['健康建议', '养生', '注意什么', '保健', '锻炼', '运动'],
      confidence: 0.83,
      priority: 3,
      usageCount: 580,
      status: 'active'
    },
    {
      id: 1002,
      name: '冥想引导',
      subtype: '冥想引导',
      description: '提供冥想和放松指导',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['冥想', '放松', '深呼吸', '减压', '静心', '冥想音乐'],
      confidence: 0.85,
      priority: 3,
      usageCount: 420,
      status: 'active'
    }
  ];
};

// 生成对应的回复模板
const generateExtendedResponses = () => {
  return [
    // 音乐娱乐类回复
    {
      id: 3001,
      content: '好的，正在为你播放{song}，希望你喜欢这首歌～',
      category: '播放音乐',
      type: 'action',
      variables: ['song'],
      status: 'active',
      usageCount: 3200
    },
    {
      id: 3002,
      content: '已暂停播放，需要继续的时候告诉我哦～',
      category: '暂停播放',
      type: 'action',
      variables: [],
      status: 'active',
      usageCount: 1800
    },
    {
      id: 3003,
      content: '好的，已经切换到{direction}，现在播放{song}～',
      category: '切换歌曲',
      type: 'action',
      variables: ['direction', 'song'],
      status: 'active',
      usageCount: 2450
    },
    {
      id: 3004,
      content: '音量已{action}到{level}，现在的音量怎么样？',
      category: '音量控制',
      type: 'action',
      variables: ['action', 'level'],
      status: 'active',
      usageCount: 1350
    },

    // 智能家居类回复
    {
      id: 4001,
      content: '{room}的灯已经{action}了，现在环境更{feeling}了～',
      category: '灯光控制',
      type: 'action',
      variables: ['room', 'action', 'feeling'],
      status: 'active',
      usageCount: 2800
    },
    {
      id: 4002,
      content: '空调已{action}，温度设置为{temperature}度，模式为{mode}～',
      category: '空调控制',
      type: 'action',
      variables: ['action', 'temperature', 'mode'],
      status: 'active',
      usageCount: 1900
    },
    {
      id: 4003,
      content: '{room}的窗帘已经{action}，{effect}让房间更舒适了～',
      category: '窗帘控制',
      type: 'action',
      variables: ['room', 'action', 'effect'],
      status: 'active',
      usageCount: 680
    },

    // 信息查询类回复
    {
      id: 2001,
      content: '今天{location}天气{weather}，温度{temperature}度，{suggestion}',
      category: '天气查询',
      type: 'info',
      variables: ['location', 'weather', 'temperature', 'suggestion'],
      status: 'active',
      usageCount: 2100
    },
    {
      id: 2002,
      content: '现在是{time}，{date}，正是美好的{period}呢～',
      category: '时间查询',
      type: 'info',
      variables: ['time', 'date', 'period'],
      status: 'active',
      usageCount: 1250
    },
    {
      id: 2003,
      content: '为你播报今天的{type}新闻：{headline}...',
      category: '新闻播报',
      type: 'info',
      variables: ['type', 'headline'],
      status: 'active',
      usageCount: 1450
    },

    // 生活服务类回复
    {
      id: 5001,
      content: '好的，已经设置{time}的闹钟，到时候我会准时叫醒你～',
      category: '设置闹钟',
      type: 'action',
      variables: ['time'],
      status: 'active',
      usageCount: 1850
    },
    {
      id: 5002,
      content: '收到！我会在{time}提醒你{event}，别担心会忘记～',
      category: '设置提醒',
      type: 'action',
      variables: ['time', 'event'],
      status: 'active',
      usageCount: 1320
    },
    {
      id: 5003,
      content: '{duration}倒计时开始，我会在时间到了告诉你～',
      category: '倒计时',
      type: 'action',
      variables: ['duration'],
      status: 'active',
      usageCount: 780
    },

    // 计算工具类回复
    {
      id: 6001,
      content: '{expression} = {result}，计算完成！',
      category: '数学计算',
      type: 'calculation',
      variables: ['expression', 'result'],
      status: 'active',
      usageCount: 890
    },
    {
      id: 6002,
      content: '{value}{unit1}等于{result}{unit2}～',
      category: '单位换算',
      type: 'calculation',
      variables: ['value', 'unit1', 'result', 'unit2'],
      status: 'active',
      usageCount: 450
    },

    // 娱乐互动类回复
    {
      id: 7001,
      content: '哈哈，来听个笑话：{joke}～',
      category: '讲笑话',
      type: 'entertainment',
      variables: ['joke'],
      status: 'active',
      usageCount: 1200
    },
    {
      id: 7002,
      content: '为你朗诵一首{poet}的{poem}：{content}～',
      category: '诗词朗诵',
      type: 'entertainment',
      variables: ['poet', 'poem', 'content'],
      status: 'active',
      usageCount: 520
    },
    {
      id: 7003,
      content: '为你播放{type}故事《{title}》，希望你喜欢～',
      category: '故事播放',
      type: 'entertainment',
      variables: ['type', 'title'],
      status: 'active',
      usageCount: 850
    },

    // 语音助手类回复
    {
      id: 8001,
      content: '"{text}"的{target_lang}翻译是：{translation}',
      category: '翻译功能',
      type: 'translation',
      variables: ['text', 'target_lang', 'translation'],
      status: 'active',
      usageCount: 1200
    },
    {
      id: 8002,
      content: '根据我的了解，{answer}。希望这个回答对你有帮助～',
      category: '百科问答',
      type: 'knowledge',
      variables: ['answer'],
      status: 'active',
      usageCount: 1850
    },

    // 购物生活类回复
    {
      id: 9001,
      content: '已将{item}添加到你的购物清单，当前清单有{count}项～',
      category: '购物清单',
      type: 'list_management',
      variables: ['item', 'count'],
      status: 'active',
      usageCount: 650
    },
    {
      id: 9002,
      content: '推荐你试试{dish}，做法：{recipe}，营养又美味～',
      category: '食谱推荐',
      type: 'suggestion',
      variables: ['dish', 'recipe'],
      status: 'active',
      usageCount: 740
    },

    // 健康运动类回复
    {
      id: 10001,
      content: '关于健康，建议你{advice}。{details}，保持身体健康很重要哦～',
      category: '健康建议',
      type: 'health_advice',
      variables: ['advice', 'details'],
      status: 'active',
      usageCount: 580
    },
    {
      id: 10002,
      content: '开始{minutes}分钟的冥想：{instruction}，让我们一起放松心情～',
      category: '冥想引导',
      type: 'relaxation',
      variables: ['minutes', 'instruction'],
      status: 'active',
      usageCount: 420
    }
  ];
};

// 运行生成
const extendedCoreIntents = generateExtendedCoreIntents();
const extendedResponses = generateExtendedResponses();

fs.writeFileSync('extended_core_intents.json', JSON.stringify(extendedCoreIntents, null, 2), 'utf8');
fs.writeFileSync('extended_responses.json', JSON.stringify(extendedResponses, null, 2), 'utf8');

console.log(`🎯 已生成 ${extendedCoreIntents.length} 个扩展核心意图数据`);
console.log(`💬 已生成 ${extendedResponses.length} 个扩展回复模板数据`);

// 生成统计报告
const categoryStats = {};
extendedCoreIntents.forEach(intent => {
  const categoryName = intent.category.name;
  if (!categoryStats[categoryName]) {
    categoryStats[categoryName] = 0;
  }
  categoryStats[categoryName]++;
});

console.log('\n📊 分类统计：');
Object.entries(categoryStats).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}个意图`);
});

console.log('\n✨ 覆盖的功能领域：');
console.log('  🎵 音乐播放控制 (4个)');
console.log('  🏠 智能家居控制 (3个)'); 
console.log('  🔍 信息查询服务 (5个)');
console.log('  📅 生活提醒服务 (3个)');
console.log('  🧮 计算工具 (2个)');
console.log('  🎭 娱乐互动 (3个)');
console.log('  🔤 语音助手 (2个)');
console.log('  🛒 购物生活 (2个)');
console.log('  💪 健康运动 (2个)'); 