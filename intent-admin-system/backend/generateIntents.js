const fs = require('fs');

// 生成核心意图数据
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
    }
  ];
};

// 生成对应的回复模板
const generateResponses = () => {
  return [
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
      id: 2001,
      content: '今天{location}天气{weather}，温度{temperature}度，{suggestion}',
      category: '天气查询',
      type: 'info',
      variables: ['location', 'weather', 'temperature', 'suggestion'],
      status: 'active',
      usageCount: 2100
    },
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
      id: 4001,
      content: '{room}的灯已经{action}，环境更{feeling}了～',
      category: '灯光控制',
      type: 'action',
      variables: ['room', 'action', 'feeling'],
      status: 'active',
      usageCount: 2800
    },
    {
      id: 5001,
      content: '好的，已经设置{time}的闹钟，到时候我会准时叫醒你～',
      category: '设置闹钟',
      type: 'action',
      variables: ['time'],
      status: 'active',
      usageCount: 1850
    }
  ];
};

// 运行生成
const coreIntents = generateCoreIntents();
const responses = generateResponses();

fs.writeFileSync('generated_core_intents.json', JSON.stringify(coreIntents, null, 2), 'utf8');
fs.writeFileSync('generated_responses.json', JSON.stringify(responses, null, 2), 'utf8');

console.log(`✅ 已生成 ${coreIntents.length} 个核心意图数据`);
console.log(`✅ 已生成 ${responses.length} 个回复模板数据`); 