const db = require('./src/models');

async function finalImportCoreIntents() {
  try {
    console.log('开始导入核心意图数据...');
    
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 现有分类ID: 1-音乐控制, 2-天气查询, 3-智能家居, 4-时间日期, 5-新闻资讯
    const coreIntentsData = [
      // 时间日期类 (categoryId: 4)
      { name: '时间查询扩展', description: '查询各种时间相关信息', categoryId: 4, keywords: '现在几点,时间,几点了,什么时候,当前时间', confidence: 0.9, priority: 1 },
      { name: '日期查询扩展', description: '查询日期和星期信息', categoryId: 4, keywords: '今天几号,日期,星期几,几月几日,今天是', confidence: 0.9, priority: 1 },
      
      // 音乐控制类 (categoryId: 1)  
      { name: '音乐播放控制', description: '全面的音乐播放控制功能', categoryId: 1, keywords: '播放歌曲,放音乐,听歌,音乐控制,播放列表', confidence: 0.9, priority: 2 },
      { name: '音量调节', description: '调节音量大小', categoryId: 1, keywords: '调节音量,声音大小,音量,大声点,小声点', confidence: 0.8, priority: 3 },
      { name: '音乐搜索', description: '搜索和播放指定音乐', categoryId: 1, keywords: '找歌,搜索音乐,播放歌手,找歌曲,音乐搜索', confidence: 0.8, priority: 3 },
      
      // 天气查询类 (categoryId: 2)
      { name: '天气预报查询', description: '查询天气预报信息', categoryId: 2, keywords: '明天天气,后天天气,天气预报,未来天气,下周天气', confidence: 0.9, priority: 2 },
      { name: '实时天气', description: '查询当前实时天气', categoryId: 2, keywords: '现在天气,当前天气,今天天气怎么样,外面天气', confidence: 0.9, priority: 2 },
      
      // 智能家居类 (categoryId: 3)
      { name: '设备开关控制', description: '控制智能设备开关', categoryId: 3, keywords: '开关设备,打开设备,关闭设备,设备控制,智能开关', confidence: 0.8, priority: 3 },
      { name: '空调控制', description: '控制空调设备', categoryId: 3, keywords: '开空调,关空调,调温度,空调设置,制冷制热', confidence: 0.8, priority: 3 },
      { name: '照明控制', description: '控制灯光照明', categoryId: 3, keywords: '开灯关灯,调亮度,灯光控制,照明设置,夜灯', confidence: 0.8, priority: 3 },
      
      // 新闻资讯类 (categoryId: 5)
      { name: '实时新闻', description: '获取最新新闻资讯', categoryId: 5, keywords: '今日新闻,最新消息,新闻头条,时事新闻,资讯播报', confidence: 0.7, priority: 4 },
      { name: '财经资讯', description: '获取财经和股市信息', categoryId: 5, keywords: '股价查询,财经新闻,市场行情,投资资讯,股票', confidence: 0.7, priority: 4 },
      { name: '体育新闻', description: '获取体育赛事资讯', categoryId: 5, keywords: '体育新闻,比赛结果,球赛,体育赛事,运动资讯', confidence: 0.7, priority: 4 },
      
      // 更多功能分布到现有分类
      { name: '计算器功能', description: '进行数学计算', categoryId: 4, keywords: '计算,加法,减法,乘法,除法,数学运算', confidence: 0.8, priority: 3 },
      { name: '定时提醒', description: '设置定时器和提醒', categoryId: 4, keywords: '定时器,提醒,闹钟,倒计时,时间提醒', confidence: 0.8, priority: 3 },
      { name: '语音助手', description: '智能语音交互', categoryId: 3, keywords: '语音助手,智能对话,语音交互,AI助手,智能问答', confidence: 0.7, priority: 4 },
      { name: '娱乐互动', description: '娱乐和互动功能', categoryId: 1, keywords: '讲笑话,唱歌,游戏,聊天,娱乐', confidence: 0.7, priority: 5 },
      { name: '信息查询', description: '各类信息查询服务', categoryId: 2, keywords: '查询信息,搜索,百科,知识问答,信息服务', confidence: 0.7, priority: 4 },
      { name: '生活服务', description: '日常生活相关服务', categoryId: 5, keywords: '生活服务,便民信息,实用查询,生活助手,服务查询', confidence: 0.6, priority: 5 },
      { name: '系统设置', description: '系统功能设置', categoryId: 3, keywords: '系统设置,功能配置,设备设置,系统管理,参数调整', confidence: 0.8, priority: 6 }
    ];

    // 获取已存在的意图名称
    const existingIntents = await db.CoreIntent.findAll({ attributes: ['name'] });
    const existingNames = new Set(existingIntents.map(intent => intent.name));

    // 过滤掉已存在的意图
    const newIntents = coreIntentsData.filter(intent => !existingNames.has(intent.name));
    
    console.log(`发现 ${newIntents.length} 个新的核心意图需要导入`);

    if (newIntents.length > 0) {
      // 批量插入
      await db.CoreIntent.bulkCreate(newIntents, {
        validate: true,
        ignoreDuplicates: true
      });

      console.log(`✅ 成功导入 ${newIntents.length} 个核心意图`);
      
      // 显示导入的意图
      console.log('\\n导入的核心意图:');
      newIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} - ${intent.description}`);
      });
    } else {
      console.log('没有新的核心意图需要导入');
    }

    // 最终统计
    const finalCount = await db.CoreIntent.count();
    console.log(`\\n🎉 导入完成！数据库中现有核心意图总数: ${finalCount}`);

  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
}

// 执行导入
if (require.main === module) {
  finalImportCoreIntents()
    .then(() => {
      console.log('核心意图导入完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('导入失败:', error);
      process.exit(1);
    });
}

module.exports = finalImportCoreIntents;