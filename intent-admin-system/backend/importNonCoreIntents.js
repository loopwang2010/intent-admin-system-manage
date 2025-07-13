const db = require('./src/models');

async function importNonCoreIntents() {
  try {
    console.log('开始导入非核心意图数据...');
    
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 检查现有数据
    const existingCount = await db.NonCoreIntent.count();
    console.log(`现有非核心意图数量: ${existingCount}`);

    // 基于CSV分析，创建20种非核心意图类型
    const nonCoreIntentsData = [
      { 
        name: '情绪表达', 
        description: '用户的各种情绪表达和感受描述',
        keywords: '开心,难过,生气,兴奋,失望,惊讶,害怕,担心,紧张,放松',
        status: 'active',
        priority: 1,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '情绪发泄', 
        description: '用户的情绪发泄和抱怨表达',
        keywords: '郁闷,烦躁,愤怒,不爽,崩溃,压抑,焦虑,烦心,糟糕,讨厌',
        status: 'active',
        priority: 2,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '重复无意义', 
        description: '重复、无意义的话语或测试性输入',
        keywords: '啊啊啊,呃呃呃,嗯嗯嗯,哈哈哈,嘿嘿嘿,重复,测试,无意义',
        status: 'active',
        priority: 8,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '语气词表达', 
        description: '各种语气词和感叹词的使用',
        keywords: '哎呀,哇塞,哦吼,咦,呀,哟,嗯,唉,啊,呢',
        status: 'active',
        priority: 7,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '闲聊调侃', 
        description: '轻松的闲聊和善意的调侃',
        keywords: '聊天,调侃,开玩笑,逗趣,幽默,有趣,好玩,搞笑,逗乐,轻松',
        status: 'active',
        priority: 3,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '测试对话', 
        description: '用户的测试性对话和试探性交流',
        keywords: '测试,试试,看看,检查,验证,试验,实验,测一下,试探,确认',
        status: 'active',
        priority: 9,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '抱怨投诉', 
        description: '用户的抱怨和投诉表达',
        keywords: '抱怨,投诉,不满,牢骚,意见,建议,反馈,批评,质疑,不服',
        status: 'active',
        priority: 4,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '夸奖表扬', 
        description: '对系统或他人的夸奖和表扬',
        keywords: '棒,好,赞,优秀,厉害,不错,很好,完美,精彩,出色',
        status: 'active',
        priority: 2,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '唤醒确认', 
        description: '唤醒设备或确认系统响应',
        keywords: '在吗,听到了吗,醒醒,唤醒,启动,开始,准备好了吗,可以吗',
        status: 'active',
        priority: 5,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '娱乐互动', 
        description: '娱乐性质的互动和游戏对话',
        keywords: '游戏,娱乐,玩耍,互动,有趣,好玩,陪我,一起,逗我,搞笑',
        status: 'active',
        priority: 3,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '情感倾诉', 
        description: '深层次的情感表达和倾诉',
        keywords: '倾诉,心情,感受,心事,烦恼,忧虑,思念,想念,孤独,寂寞',
        status: 'active',
        priority: 2,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '无聊闲扯', 
        description: '无聊时的随意聊天和闲扯',
        keywords: '无聊,闲扯,随便聊,没事干,打发时间,聊点什么,说说话',
        status: 'active',
        priority: 6,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '撒娇卖萌', 
        description: '撒娇、卖萌类的可爱表达',
        keywords: '撒娇,卖萌,可爱,萌萌,乖乖,人家,嘛,呢,啦,哦',
        status: 'active',
        priority: 4,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '网络流行语', 
        description: '网络流行语和网络用语',
        keywords: '网络语言,流行语,梗,表情包,弹幕,6666,yyds,绝绝子',
        status: 'active',
        priority: 5,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '方言表达', 
        description: '各地方言和地方特色表达',
        keywords: '方言,地方话,土话,家乡话,老乡,俺,咱,偶,侬,粤语',
        status: 'active',
        priority: 6,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '游戏术语', 
        description: '游戏相关的专业术语和表达',
        keywords: '游戏,电竞,技能,装备,等级,经验,副本,BOSS,PK,团战',
        status: 'active',
        priority: 7,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '职场用语', 
        description: '工作和职场相关的专业用语',
        keywords: '工作,职场,会议,报告,项目,同事,老板,客户,业务,绩效',
        status: 'active',
        priority: 6,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '社交媒体用语', 
        description: '社交媒体平台特有的表达方式',
        keywords: '点赞,转发,评论,私信,朋友圈,微博,抖音,直播,粉丝,网红',
        status: 'active',
        priority: 5,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '学生用语', 
        description: '学生群体特有的表达和词汇',
        keywords: '学习,作业,考试,老师,同学,课程,专业,宿舍,食堂,图书馆',
        status: 'active',
        priority: 4,
        approvalStatus: 'approved',
        rejectionReason: null
      },
      { 
        name: '年龄代际用语', 
        description: '不同年龄段特有的表达习惯',
        keywords: '代沟,年轻人,老一辈,90后,00后,长辈,晚辈,新潮,传统',
        status: 'active',
        priority: 7,
        approvalStatus: 'approved',
        rejectionReason: null
      }
    ];

    // 获取已存在的意图名称
    const existingIntents = await db.NonCoreIntent.findAll({ attributes: ['name'] });
    const existingNames = new Set(existingIntents.map(intent => intent.name));

    // 过滤掉已存在的意图
    const newIntents = nonCoreIntentsData.filter(intent => !existingNames.has(intent.name));
    
    console.log(`发现 ${newIntents.length} 个新的非核心意图需要导入`);

    if (newIntents.length > 0) {
      // 批量插入
      await db.NonCoreIntent.bulkCreate(newIntents, {
        validate: true,
        ignoreDuplicates: true
      });

      console.log(`✅ 成功导入 ${newIntents.length} 个非核心意图`);
      
      // 显示导入的意图
      console.log('\\n导入的非核心意图:');
      newIntents.forEach((intent, index) => {
        console.log(`${index + 1}. ${intent.name} - ${intent.description} (优先级: ${intent.priority})`);
      });
    } else {
      console.log('没有新的非核心意图需要导入');
    }

    // 最终统计
    const finalCount = await db.NonCoreIntent.count();
    console.log(`\\n🎉 导入完成！数据库中现有非核心意图总数: ${finalCount}`);

    // 按优先级显示统计
    const priorityStats = await db.NonCoreIntent.findAll({
      attributes: [
        'priority',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      order: [['priority', 'ASC']]
    });

    console.log('\\n按优先级分布:');
    priorityStats.forEach(stat => {
      const priorityName = ['', '高频情感', '重要交互', '常见娱乐', '一般表达', '中等频率', '较低频率', '特殊用语', '低优先级', '测试类'][stat.priority] || '未知';
      console.log(`优先级 ${stat.priority} (${priorityName}): ${stat.dataValues.count} 个`);
    });

  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
}

// 执行导入
if (require.main === module) {
  importNonCoreIntents()
    .then(() => {
      console.log('非核心意图导入完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('导入失败:', error);
      process.exit(1);
    });
}

module.exports = importNonCoreIntents;