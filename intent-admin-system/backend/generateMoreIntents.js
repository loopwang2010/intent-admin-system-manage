const fs = require('fs');

// 生成更多核心意图数据
const generateCoreIntents = () => {
  const baseDate = Date.now();
  
  return [
    // 时间日期类
    {
      id: 101,
      name: '时间查询',
      subtype: '时间查询',
      description: '查询当前时间、日期等时间相关信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['现在几点', '几点了', '现在是几点', '时间是多少', '当前时间'],
      confidence: 0.95,
      priority: 1,
      usageCount: 1250,
      status: 'active',
      createdAt: new Date(baseDate - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 102,
      name: '日期查询',
      subtype: '日期查询',
      description: '查询今天日期、星期几、农历等日期信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['今天几号', '今天是几月几日', '星期几', '今天星期几', '农历几月'],
      confidence: 0.93,
      priority: 1,
      usageCount: 980,
      status: 'active',
      createdAt: new Date(baseDate - 172800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 103,
      name: '节假日查询',
      subtype: '节假日查询',
      description: '查询节假日安排、放假时间等信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['国庆节', '春节', '五一假期', '清明节', '端午节', '中秋节'],
      confidence: 0.88,
      priority: 2,
      usageCount: 420,
      status: 'active',
      createdAt: new Date(baseDate - 259200000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 天气类
    {
      id: 201,
      name: '天气查询',
      subtype: '天气查询',
      description: '查询当前天气、温度、湿度等天气信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['今天天气', '天气怎么样', '温度多少', '外面热吗', '下雨了吗'],
      confidence: 0.92,
      priority: 1,
      usageCount: 2100,
      status: 'active',
      createdAt: new Date(baseDate - 345600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 202,
      name: '天气预报',
      subtype: '天气预报',
      description: '查询未来几天的天气预报',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['明天天气', '后天天气', '这周天气', '天气预报', '未来天气'],
      confidence: 0.90,
      priority: 1,
      usageCount: 1650,
      status: 'active',
      createdAt: new Date(baseDate - 432000000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 203,
      name: '穿衣建议',
      subtype: '穿衣建议',
      description: '根据天气情况提供穿衣搭配建议',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['穿什么衣服', '今天穿什么', '需要穿外套吗', '穿衣建议', '要不要带伞'],
      confidence: 0.85,
      priority: 2,
      usageCount: 720,
      status: 'active',
      createdAt: new Date(baseDate - 518400000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 音乐娱乐类
    {
      id: 301,
      name: '播放音乐',
      subtype: '播放音乐',
      description: '播放指定歌曲、歌手或音乐类型',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['播放音乐', '放首歌', '听音乐', '播放歌曲', '来首歌'],
      confidence: 0.95,
      priority: 1,
      usageCount: 3200,
      status: 'active',
      createdAt: new Date(baseDate - 604800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 302,
      name: '暂停播放',
      subtype: '暂停播放',
      description: '暂停当前播放的音乐或音频',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['暂停', '暂停播放', '停止', '停止播放', '别放了'],
      confidence: 0.97,
      priority: 1,
      usageCount: 1800,
      status: 'active',
      createdAt: new Date(baseDate - 691200000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 303,
      name: '切换歌曲',
      subtype: '切换歌曲',
      description: '切换到下一首或上一首歌曲',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['下一首', '上一首', '换一首', '切歌', '跳过'],
      confidence: 0.94,
      priority: 1,
      usageCount: 2450,
      status: 'active',
      createdAt: new Date(baseDate - 777600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 304,
      name: '音量控制',
      subtype: '音量控制',
      description: '调节音量大小或静音',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['调大声音', '调小声音', '静音', '音量大一点', '音量小一点'],
      confidence: 0.92,
      priority: 1,
      usageCount: 1350,
      status: 'active',
      createdAt: new Date(baseDate - 864000000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 305,
      name: '播放列表',
      subtype: '播放列表',
      description: '管理和播放音乐播放列表',
      categoryId: 3,
      category: { id: 3, name: '娱乐互动', icon: '🎵' },
      keywords: ['我的歌单', '播放列表', '收藏的歌', '最近播放', '推荐歌曲'],
      confidence: 0.87,
      priority: 2,
      usageCount: 950,
      status: 'active',
      createdAt: new Date(baseDate - 950400000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 智能家居类
    {
      id: 401,
      name: '灯光控制',
      subtype: '灯光控制',
      description: '控制智能灯具的开关和亮度',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开灯', '关灯', '调亮一点', '调暗一点', '客厅开灯'],
      confidence: 0.96,
      priority: 1,
      usageCount: 2800,
      status: 'active',
      createdAt: new Date(baseDate - 1036800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 402,
      name: '空调控制',
      subtype: '空调控制',
      description: '控制空调的开关、温度和模式',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开空调', '关空调', '调温度', '制冷', '制热', '除湿'],
      confidence: 0.93,
      priority: 1,
      usageCount: 1900,
      status: 'active',
      createdAt: new Date(baseDate - 1123200000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 403,
      name: '窗帘控制',
      subtype: '窗帘控制',
      description: '控制智能窗帘的开关',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开窗帘', '关窗帘', '拉开窗帘', '拉上窗帘', '卧室窗帘'],
      confidence: 0.90,
      priority: 2,
      usageCount: 680,
      status: 'active',
      createdAt: new Date(baseDate - 1209600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 404,
      name: '电视控制',
      subtype: '电视控制',
      description: '控制智能电视的开关和频道',
      categoryId: 1,
      category: { id: 1, name: '智能家居', icon: '🏠' },
      keywords: ['开电视', '关电视', '换台', '调频道', '看新闻'],
      confidence: 0.88,
      priority: 2,
      usageCount: 1200,
      status: 'active',
      createdAt: new Date(baseDate - 1296000000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 提醒服务类
    {
      id: 501,
      name: '设置闹钟',
      subtype: '设置闹钟',
      description: '设置定时闹钟提醒',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['设闹钟', '明天七点叫我', '定个闹钟', '提醒我起床', '闹铃'],
      confidence: 0.94,
      priority: 1,
      usageCount: 1850,
      status: 'active',
      createdAt: new Date(baseDate - 1382400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 502,
      name: '设置提醒',
      subtype: '设置提醒',
      description: '设置事件提醒和备忘录',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['提醒我', '别忘了', '记住', '备忘录', '稍后提醒'],
      confidence: 0.91,
      priority: 1,
      usageCount: 1320,
      status: 'active',
      createdAt: new Date(baseDate - 1468800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 503,
      name: '倒计时',
      subtype: '倒计时',
      description: '设置倒计时器功能',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['倒计时', '计时器', '十分钟后提醒', '定时', '计时'],
      confidence: 0.89,
      priority: 2,
      usageCount: 780,
      status: 'active',
      createdAt: new Date(baseDate - 1555200000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 信息查询类
    {
      id: 601,
      name: '新闻资讯',
      subtype: '新闻资讯',
      description: '播报最新新闻和资讯',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['今天新闻', '播放新闻', '最新资讯', '财经新闻', '体育新闻'],
      confidence: 0.90,
      priority: 2,
      usageCount: 1450,
      status: 'active',
      createdAt: new Date(baseDate - 1641600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 602,
      name: '股票查询',
      subtype: '股票查询',
      description: '查询股票价格和市场信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['股票', '股价', '大盘', '上证指数', '深证指数'],
      confidence: 0.86,
      priority: 3,
      usageCount: 520,
      status: 'active',
      createdAt: new Date(baseDate - 1728000000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 603,
      name: '汇率查询',
      subtype: '汇率查询',
      description: '查询货币汇率信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['汇率', '美元汇率', '欧元汇率', '人民币汇率', '英镑汇率'],
      confidence: 0.84,
      priority: 3,
      usageCount: 380,
      status: 'active',
      createdAt: new Date(baseDate - 1814400000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 计算工具类
    {
      id: 701,
      name: '数学计算',
      subtype: '数学计算',
      description: '进行基础数学运算',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['计算', '算一下', '多少加多少', '除法', '乘法', '减法'],
      confidence: 0.95,
      priority: 2,
      usageCount: 890,
      status: 'active',
      createdAt: new Date(baseDate - 1900800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 702,
      name: '单位换算',
      subtype: '单位换算',
      description: '进行各种单位的换算',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['换算', '多少米', '多少公斤', '华氏度', '摄氏度', '英里'],
      confidence: 0.88,
      priority: 3,
      usageCount: 450,
      status: 'active',
      createdAt: new Date(baseDate - 1987200000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 通讯联系类
    {
      id: 801,
      name: '拨打电话',
      subtype: '拨打电话',
      description: '拨打指定联系人电话',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['打电话', '拨打', '给谁打电话', '联系', '电话'],
      confidence: 0.92,
      priority: 2,
      usageCount: 1100,
      status: 'active',
      createdAt: new Date(baseDate - 2073600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 802,
      name: '发送短信',
      subtype: '发送短信',
      description: '发送文字短信给联系人',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['发短信', '发消息', '短信', '给谁发信息', '发条短信'],
      confidence: 0.89,
      priority: 2,
      usageCount: 650,
      status: 'active',
      createdAt: new Date(baseDate - 2160000000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 出行交通类
    {
      id: 901,
      name: '路况查询',
      subtype: '路况查询',
      description: '查询实时路况和交通信息',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['路况', '堵车吗', '交通情况', '高速路况', '限行'],
      confidence: 0.87,
      priority: 2,
      usageCount: 920,
      status: 'active',
      createdAt: new Date(baseDate - 2246400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 902,
      name: '导航路线',
      subtype: '导航路线',
      description: '提供路线导航服务',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['导航', '去哪里', '怎么走', '路线', '开车去'],
      confidence: 0.91,
      priority: 1,
      usageCount: 1750,
      status: 'active',
      createdAt: new Date(baseDate - 2332800000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 学习教育类
    {
      id: 1001,
      name: '翻译功能',
      subtype: '翻译功能',
      description: '提供多语言翻译服务',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['翻译', '英文怎么说', '中文翻译', '日语翻译', '韩语翻译'],
      confidence: 0.90,
      priority: 2,
      usageCount: 1200,
      status: 'active',
      createdAt: new Date(baseDate - 2419200000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 1002,
      name: '百科问答',
      subtype: '百科问答',
      description: '回答百科知识问题',
      categoryId: 2,
      category: { id: 2, name: '信息查询', icon: '🔍' },
      keywords: ['什么是', '为什么', '怎么样', '百科', '知识'],
      confidence: 0.85,
      priority: 2,
      usageCount: 1850,
      status: 'active',
      createdAt: new Date(baseDate - 2505600000).toISOString(),
      updatedAt: new Date().toISOString()
    },

    // 健康生活类
    {
      id: 1101,
      name: '健康建议',
      subtype: '健康建议',
      description: '提供健康养生建议',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['健康建议', '养生', '注意什么', '保健', '锻炼'],
      confidence: 0.83,
      priority: 3,
      usageCount: 580,
      status: 'active',
      createdAt: new Date(baseDate - 2592000000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 1102,
      name: '食谱推荐',
      subtype: '食谱推荐',
      description: '推荐菜谱和烹饪方法',
      categoryId: 4,
      category: { id: 4, name: '生活服务', icon: '📅' },
      keywords: ['今天吃什么', '食谱', '怎么做菜', '菜谱', '烹饪'],
      confidence: 0.86,
      priority: 2,
      usageCount: 740,
      status: 'active',
      createdAt: new Date(baseDate - 2678400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

// 生成对应的回复模板
const generateResponses = () => {
  return [
    // 时间日期类回复
    {
      id: 1001,
      content: '现在是{time}，正是美好的一天呢～',
      category: '时间查询',
      type: 'info',
      variables: ['time'],
      status: 'active',
      usageCount: 1250
    },
    {
      id: 1002,
      content: '今天是{date}，{weekday}，希望你今天过得愉快～',
      category: '日期查询',
      type: 'info',
      variables: ['date', 'weekday'],
      status: 'active',
      usageCount: 980
    },
    {
      id: 1003,
      content: '{holiday}还有{days}天就到了，是不是很期待呀～',
      category: '节假日查询',
      type: 'info',
      variables: ['holiday', 'days'],
      status: 'active',
      usageCount: 420
    },

    // 天气类回复
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
      content: '未来几天{location}的天气情况：{forecast}',
      category: '天气预报',
      type: 'info',
      variables: ['location', 'forecast'],
      status: 'active',
      usageCount: 1650
    },
    {
      id: 2003,
      content: '根据今天的天气情况，建议你{advice}，出门记得{remind}哦～',
      category: '穿衣建议',
      type: 'suggestion',
      variables: ['advice', 'remind'],
      status: 'active',
      usageCount: 720
    },

    // 音乐娱乐类回复
    {
      id: 3001,
      content: '好的，正在为你播放{song}，希望你喜欢～',
      category: '播放音乐',
      type: 'action',
      variables: ['song'],
      status: 'active',
      usageCount: 3200
    },
    {
      id: 3002,
      content: '已暂停播放，需要的时候再告诉我继续哦～',
      category: '暂停播放',
      type: 'action',
      variables: [],
      status: 'active',
      usageCount: 1800
    },
    {
      id: 3003,
      content: '好的，已经切换到{action}，现在播放{song}～',
      category: '切换歌曲',
      type: 'action',
      variables: ['action', 'song'],
      status: 'active',
      usageCount: 2450
    },
    {
      id: 3004,
      content: '音量已{action}到{level}，怎么样，合适吗？',
      category: '音量控制',
      type: 'action',
      variables: ['action', 'level'],
      status: 'active',
      usageCount: 1350
    },
    {
      id: 3005,
      content: '正在播放{playlist}，共有{count}首歌曲～',
      category: '播放列表',
      type: 'info',
      variables: ['playlist', 'count'],
      status: 'active',
      usageCount: 950
    },

    // 智能家居类回复
    {
      id: 4001,
      content: '{room}的灯已经{action}，环境更{feeling}了～',
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
      content: '{room}的窗帘已经{action}，{effect}～',
      category: '窗帘控制',
      type: 'action',
      variables: ['room', 'action', 'effect'],
      status: 'active',
      usageCount: 680
    },
    {
      id: 4004,
      content: '电视已{action}，{content}～',
      category: '电视控制',
      type: 'action',
      variables: ['action', 'content'],
      status: 'active',
      usageCount: 1200
    },

    // 提醒服务类回复
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
      content: '收到！我会在{time}提醒你{event}，别担心忘记～',
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

    // 信息查询类回复
    {
      id: 6001,
      content: '为你播报今天的{type}新闻：{news}',
      category: '新闻资讯',
      type: 'info',
      variables: ['type', 'news'],
      status: 'active',
      usageCount: 1450
    },
    {
      id: 6002,
      content: '{stock}当前股价{price}元，{change}，{trend}',
      category: '股票查询',
      type: 'info',
      variables: ['stock', 'price', 'change', 'trend'],
      status: 'active',
      usageCount: 520
    },
    {
      id: 6003,
      content: '今日{currency}汇率：{rate}，{comparison}',
      category: '汇率查询',
      type: 'info',
      variables: ['currency', 'rate', 'comparison'],
      status: 'active',
      usageCount: 380
    },

    // 计算工具类回复
    {
      id: 7001,
      content: '{expression} = {result}，计算完成～',
      category: '数学计算',
      type: 'calculation',
      variables: ['expression', 'result'],
      status: 'active',
      usageCount: 890
    },
    {
      id: 7002,
      content: '{value} {unit1} 等于 {result} {unit2}～',
      category: '单位换算',
      type: 'calculation',
      variables: ['value', 'unit1', 'result', 'unit2'],
      status: 'active',
      usageCount: 450
    },

    // 通讯联系类回复
    {
      id: 8001,
      content: '正在拨打{contact}的电话，请稍等～',
      category: '拨打电话',
      type: 'action',
      variables: ['contact'],
      status: 'active',
      usageCount: 1100
    },
    {
      id: 8002,
      content: '短信"{message}"已发送给{contact}～',
      category: '发送短信',
      type: 'action',
      variables: ['message', 'contact'],
      status: 'active',
      usageCount: 650
    },

    // 出行交通类回复
    {
      id: 9001,
      content: '{location}路况{status}，{details}，建议{suggestion}～',
      category: '路况查询',
      type: 'info',
      variables: ['location', 'status', 'details', 'suggestion'],
      status: 'active',
      usageCount: 920
    },
    {
      id: 9002,
      content: '从{from}到{to}的路线：{route}，预计{time}分钟～',
      category: '导航路线',
      type: 'navigation',
      variables: ['from', 'to', 'route', 'time'],
      status: 'active',
      usageCount: 1750
    },

    // 学习教育类回复
    {
      id: 10001,
      content: '"{text}"的{language}翻译是：{translation}',
      category: '翻译功能',
      type: 'translation',
      variables: ['text', 'language', 'translation'],
      status: 'active',
      usageCount: 1200
    },
    {
      id: 10002,
      content: '根据我的了解，{answer}。希望对你有帮助～',
      category: '百科问答',
      type: 'knowledge',
      variables: ['answer'],
      status: 'active',
      usageCount: 1850
    },

    // 健康生活类回复
    {
      id: 11001,
      content: '关于健康，建议你{advice}，{details}，保持身体健康很重要哦～',
      category: '健康建议',
      type: 'suggestion',
      variables: ['advice', 'details'],
      status: 'active',
      usageCount: 580
    },
    {
      id: 11002,
      content: '推荐你试试{dish}，做法：{recipe}，营养又美味～',
      category: '食谱推荐',
      type: 'suggestion',
      variables: ['dish', 'recipe'],
      status: 'active',
      usageCount: 740
    }
  ];
};

// 生成数据并保存到文件
const coreIntents = generateCoreIntents();
const responses = generateResponses();

// 保存核心意图数据
fs.writeFileSync('generated_core_intents.json', JSON.stringify(coreIntents, null, 2), 'utf8');
console.log(`✅ 已生成 ${coreIntents.length} 个核心意图数据，保存到 generated_core_intents.json`);

// 保存回复模板数据
fs.writeFileSync('generated_responses.json', JSON.stringify(responses, null, 2), 'utf8');
console.log(`✅ 已生成 ${responses.length} 个回复模板数据，保存到 generated_responses.json`);

// 生成总结报告
const summary = {
  总计: {
    核心意图数量: coreIntents.length,
    回复模板数量: responses.length
  },
  分类统计: {
    智能家居: coreIntents.filter(i => i.categoryId === 1).length,
    信息查询: coreIntents.filter(i => i.categoryId === 2).length,
    娱乐互动: coreIntents.filter(i => i.categoryId === 3).length,
    生活服务: coreIntents.filter(i => i.categoryId === 4).length
  },
  功能覆盖: [
    '时间日期查询', '天气信息', '音乐播放控制', '智能家居控制',
    '提醒服务', '新闻资讯', '计算工具', '通讯联系',
    '出行交通', '学习教育', '健康生活'
  ]
};

fs.writeFileSync('generation_summary.json', JSON.stringify(summary, null, 2), 'utf8');
console.log('✅ 生成报告已保存到 generation_summary.json');

console.log('\n📊 数据生成完成！');
console.log('📁 生成的文件：');
console.log('  - generated_core_intents.json (核心意图数据)');
console.log('  - generated_responses.json (回复模板数据)');
console.log('  - generation_summary.json (生成报告)'); 