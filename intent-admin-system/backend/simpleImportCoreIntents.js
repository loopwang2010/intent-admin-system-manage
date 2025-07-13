const db = require('./src/models');

async function simpleImportCoreIntents() {
  try {
    console.log('开始导入核心意图数据...');
    
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 检查现有数据
    const existingCount = await db.CoreIntent.count();
    console.log(`现有核心意图数量: ${existingCount}`);

    // 基于CSV文件中发现的核心意图类型，手动创建主要的核心意图
    const coreIntentsData = [
      // 时间查询类
      { name: '时间查询', description: '查询当前时间', categoryId: 1, keywords: '现在几点,时间,几点了,什么时候', confidence: 0.9, priority: 1 },
      { name: '日期查询', description: '查询当前日期', categoryId: 1, keywords: '今天几号,日期,星期几,几月几日', confidence: 0.9, priority: 1 },
      
      // 天气查询类  
      { name: '天气查询', description: '查询天气信息', categoryId: 2, keywords: '天气,温度,下雨,晴天,阴天', confidence: 0.9, priority: 2 },
      
      // 音乐功能类
      { name: '音乐功能', description: '播放音乐相关功能', categoryId: 3, keywords: '播放音乐,放歌,听歌,音乐,歌曲', confidence: 0.9, priority: 2 },
      
      // 计算功能类
      { name: '计算功能', description: '数学计算功能', categoryId: 4, keywords: '计算,加法,减法,乘法,除法,等于', confidence: 0.8, priority: 3 },
      
      // 搜索功能类
      { name: '搜索功能', description: '信息搜索功能', categoryId: 2, keywords: '搜索,查找,找到,寻找,查询', confidence: 0.8, priority: 3 },
      
      // 设备控制类
      { name: '设备控制', description: '智能设备控制', categoryId: 5, keywords: '打开,关闭,开启,关掉,控制', confidence: 0.8, priority: 3 },
      
      // 闹钟提醒类
      { name: '闹钟提醒', description: '设置闹钟和提醒', categoryId: 6, keywords: '闹钟,提醒,定时,叫醒,设置', confidence: 0.8, priority: 3 },
      
      // 新闻资讯类
      { name: '新闻资讯', description: '获取新闻资讯', categoryId: 8, keywords: '新闻,资讯,消息,报道,头条', confidence: 0.7, priority: 4 },
      
      // 语音通话类
      { name: '语音通话', description: '拨打电话功能', categoryId: 7, keywords: '打电话,通话,拨号,联系,呼叫', confidence: 0.8, priority: 4 },
      
      // 翻译功能类
      { name: '翻译功能', description: '语言翻译服务', categoryId: 9, keywords: '翻译,英语,中文,日语,韩语', confidence: 0.7, priority: 4 },
      
      // 百科问答类
      { name: '百科问答', description: '知识问答服务', categoryId: 9, keywords: '什么是,为什么,怎么样,如何,告诉我', confidence: 0.7, priority: 4 },
      
      // 生活服务类
      { name: '生活服务', description: '日常生活服务', categoryId: 10, keywords: '预定,订票,查询,服务,帮助', confidence: 0.7, priority: 5 },
      
      // 娱乐互动类
      { name: '娱乐互动', description: '娱乐和互动功能', categoryId: 3, keywords: '讲笑话,唱歌,游戏,聊天,陪我', confidence: 0.7, priority: 5 },
      
      // 健康咨询类
      { name: '健康咨询', description: '健康相关咨询', categoryId: 10, keywords: '健康,医疗,症状,建议,身体', confidence: 0.6, priority: 5 },
      
      // 学习教育类
      { name: '学习教育', description: '教育学习功能', categoryId: 9, keywords: '学习,教育,知识,考试,背诵', confidence: 0.7, priority: 5 },
      
      // 购物助手类
      { name: '购物助手', description: '购物相关服务', categoryId: 10, keywords: '购买,买东西,价格,商品,购物', confidence: 0.6, priority: 6 },
      
      // 出行服务类
      { name: '出行服务', description: '交通出行服务', categoryId: 10, keywords: '路线,导航,交通,出行,地址', confidence: 0.7, priority: 6 },
      
      // 情感陪伴类
      { name: '情感陪伴', description: '情感支持和陪伴', categoryId: 3, keywords: '陪伴,聊天,倾诉,安慰,心情', confidence: 0.6, priority: 6 },
      
      // 系统设置类
      { name: '系统设置', description: '系统功能设置', categoryId: 1, keywords: '设置,配置,调整,修改,选项', confidence: 0.8, priority: 6 }
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
      console.log('\n导入的核心意图:');
      newIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} - ${intent.description}`);
      });
    } else {
      console.log('没有新的核心意图需要导入');
    }

    // 最终统计
    const finalCount = await db.CoreIntent.count();
    console.log(`\n🎉 导入完成！数据库中现有核心意图总数: ${finalCount}`);

  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
}

// 执行导入
if (require.main === module) {
  simpleImportCoreIntents()
    .then(() => {
      console.log('核心意图导入完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('导入失败:', error);
      process.exit(1);
    });
}

module.exports = simpleImportCoreIntents;