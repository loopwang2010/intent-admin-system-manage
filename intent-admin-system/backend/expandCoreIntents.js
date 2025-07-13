const db = require('./src/models');

async function expandCoreIntents() {
  try {
    console.log('🚀 开始扩展核心意图数据...');
    
    await db.sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查现有数据
    const existingCount = await db.CoreIntent.count();
    console.log(`📊 现有核心意图数量: ${existingCount}`);

    // 基于智能音箱行业标准的全面核心意图扩展
    const expandedCoreIntents = [
      // === 音乐娱乐类 (categoryId: 1) ===
      { name: '播放音乐专辑', description: '播放指定专辑', categoryId: 1, keywords: '播放专辑,整张专辑,专辑播放,听专辑', confidence: 0.9, priority: 2 },
      { name: '播放歌单', description: '播放指定歌单', categoryId: 1, keywords: '播放歌单,播放列表,我的歌单,收藏歌单', confidence: 0.9, priority: 2 },
      { name: '随机播放', description: '随机播放音乐', categoryId: 1, keywords: '随机播放,随机听歌,打乱播放,随机模式', confidence: 0.9, priority: 2 },
      { name: '单曲循环', description: '单曲循环播放', categoryId: 1, keywords: '单曲循环,重复播放,循环这首歌,再播一遍', confidence: 0.9, priority: 2 },
      { name: '播放电台', description: '播放网络电台', categoryId: 1, keywords: '播放电台,听电台,收音机,广播电台', confidence: 0.8, priority: 3 },
      { name: '播放有声书', description: '播放有声读物', categoryId: 1, keywords: '播放有声书,听书,有声读物,小说朗读', confidence: 0.8, priority: 3 },
      { name: '播放相声', description: '播放相声曲艺', categoryId: 1, keywords: '播放相声,听相声,曲艺,郭德纲,德云社', confidence: 0.8, priority: 3 },
      { name: '播放儿歌', description: '播放儿童歌曲', categoryId: 1, keywords: '播放儿歌,儿童歌曲,童谣,小朋友的歌', confidence: 0.8, priority: 3 },
      { name: '播放古典音乐', description: '播放古典音乐', categoryId: 1, keywords: '播放古典音乐,交响乐,钢琴曲,小提琴,贝多芬', confidence: 0.8, priority: 3 },
      { name: '播放轻音乐', description: '播放轻音乐', categoryId: 1, keywords: '播放轻音乐,背景音乐,纯音乐,舒缓音乐', confidence: 0.8, priority: 3 },
      { name: '播放白噪音', description: '播放白噪音', categoryId: 1, keywords: '播放白噪音,助眠音乐,自然声音,雨声,海浪声', confidence: 0.8, priority: 3 },
      { name: '收藏音乐', description: '收藏当前播放的音乐', categoryId: 1, keywords: '收藏这首歌,添加到收藏,喜欢这首歌,加入我的音乐', confidence: 0.8, priority: 4 },
      { name: '音乐识别', description: '识别当前播放的音乐', categoryId: 1, keywords: '这是什么歌,歌名是什么,谁唱的,音乐识别', confidence: 0.8, priority: 4 },
      { name: '音效调节', description: '调节音效设置', categoryId: 1, keywords: '音效调节,均衡器,低音,高音,音质设置', confidence: 0.7, priority: 5 },

      // === 天气查询类 (categoryId: 2) ===
      { name: '明天天气', description: '查询明天天气', categoryId: 2, keywords: '明天天气,明日天气,明天怎么样,明天温度', confidence: 0.9, priority: 1 },
      { name: '后天天气', description: '查询后天天气', categoryId: 2, keywords: '后天天气,后天怎么样,大后天天气', confidence: 0.9, priority: 2 },
      { name: '一周天气', description: '查询一周天气预报', categoryId: 2, keywords: '一周天气,七天天气,本周天气,天气预报', confidence: 0.9, priority: 2 },
      { name: '空气质量', description: '查询空气质量指数', categoryId: 2, keywords: '空气质量,PM2.5,雾霾,污染指数,空气怎么样', confidence: 0.8, priority: 3 },
      { name: '紫外线指数', description: '查询紫外线强度', categoryId: 2, keywords: '紫外线,紫外线指数,需要防晒吗,阳光强度', confidence: 0.8, priority: 3 },
      { name: '降雨概率', description: '查询降雨概率', categoryId: 2, keywords: '会下雨吗,降雨概率,下雨可能性,需要带伞吗', confidence: 0.8, priority: 3 },
      { name: '风力风向', description: '查询风力风向', categoryId: 2, keywords: '风力,风向,风速,有风吗,风大吗', confidence: 0.7, priority: 4 },
      { name: '湿度查询', description: '查询空气湿度', categoryId: 2, keywords: '湿度,空气湿度,干燥吗,潮湿吗', confidence: 0.7, priority: 4 },
      { name: '气压查询', description: '查询大气压力', categoryId: 2, keywords: '气压,大气压,气压高低', confidence: 0.6, priority: 5 },
      { name: '日出日落', description: '查询日出日落时间', categoryId: 2, keywords: '日出时间,日落时间,几点天亮,几点天黑', confidence: 0.8, priority: 3 },
      { name: '穿衣建议', description: '根据天气提供穿衣建议', categoryId: 2, keywords: '穿什么衣服,穿衣建议,今天穿什么', confidence: 0.8, priority: 3 },
      { name: '外出建议', description: '根据天气提供外出建议', categoryId: 2, keywords: '适合外出吗,出门建议,户外活动,运动建议', confidence: 0.7, priority: 4 },

      // === 智能家居类 (categoryId: 3) ===
      { name: '开关窗帘', description: '控制电动窗帘', categoryId: 3, keywords: '开窗帘,关窗帘,窗帘控制,拉开窗帘,关闭窗帘', confidence: 0.9, priority: 1 },
      { name: '空调温度', description: '调节空调温度', categoryId: 3, keywords: '空调温度,调到多少度,制冷,制热,温度调节', confidence: 0.9, priority: 1 },
      { name: '空调模式', description: '切换空调模式', categoryId: 3, keywords: '空调模式,制冷模式,制热模式,除湿模式,送风模式', confidence: 0.9, priority: 2 },
      { name: '电视控制', description: '控制电视开关和频道', categoryId: 3, keywords: '开电视,关电视,换台,调频道,电视音量', confidence: 0.9, priority: 1 },
      { name: '灯光亮度', description: '调节灯光亮度', categoryId: 3, keywords: '灯光亮度,调亮一点,调暗一点,灯光调节', confidence: 0.9, priority: 2 },
      { name: '灯光颜色', description: '调节智能灯光颜色', categoryId: 3, keywords: '灯光颜色,红色灯光,蓝色灯光,彩色灯光', confidence: 0.8, priority: 3 },
      { name: '扫地机器人', description: '控制扫地机器人', categoryId: 3, keywords: '扫地机器人,开始扫地,停止扫地,回充电', confidence: 0.8, priority: 3 },
      { name: '加湿器控制', description: '控制加湿器', categoryId: 3, keywords: '开加湿器,关加湿器,加湿器档位,湿度调节', confidence: 0.8, priority: 3 },
      { name: '空气净化器', description: '控制空气净化器', categoryId: 3, keywords: '空气净化器,净化器开关,净化器档位,空气净化', confidence: 0.8, priority: 3 },
      { name: '热水器控制', description: '控制热水器', categoryId: 3, keywords: '热水器,热水器温度,烧热水,热水器开关', confidence: 0.8, priority: 3 },
      { name: '洗衣机控制', description: '控制洗衣机', categoryId: 3, keywords: '洗衣机,开始洗衣,洗衣程序,洗衣机状态', confidence: 0.7, priority: 4 },
      { name: '冰箱控制', description: '控制智能冰箱', categoryId: 3, keywords: '冰箱温度,冰箱模式,冰箱状态', confidence: 0.7, priority: 4 },
      { name: '门锁控制', description: '控制智能门锁', categoryId: 3, keywords: '门锁,开门,锁门,门锁状态', confidence: 0.8, priority: 3 },
      { name: '安防监控', description: '查看安防监控', categoryId: 3, keywords: '监控,摄像头,安防状态,查看监控', confidence: 0.7, priority: 4 },
      { name: '场景模式', description: '启动智能场景', categoryId: 3, keywords: '回家模式,离家模式,睡眠模式,聚会模式,场景切换', confidence: 0.8, priority: 3 },

      // === 时间日期类 (categoryId: 4) ===
      { name: '世界时间', description: '查询世界各地时间', categoryId: 4, keywords: '世界时间,纽约时间,东京时间,伦敦时间,时差', confidence: 0.8, priority: 3 },
      { name: '农历查询', description: '查询农历日期', categoryId: 4, keywords: '农历,阴历,农历几月几日,今天农历', confidence: 0.8, priority: 3 },
      { name: '节假日查询', description: '查询节假日信息', categoryId: 4, keywords: '节假日,假期,放假,调休,法定节假日', confidence: 0.8, priority: 3 },
      { name: '倒计时', description: '设置倒计时', categoryId: 4, keywords: '倒计时,计时,定时,倒数', confidence: 0.9, priority: 2 },
      { name: '秒表', description: '启动秒表功能', categoryId: 4, keywords: '秒表,计时器,开始计时,停止计时', confidence: 0.9, priority: 2 },
      { name: '工作日查询', description: '查询工作日信息', categoryId: 4, keywords: '工作日,上班日,今天上班吗,工作日查询', confidence: 0.7, priority: 4 },
      { name: '生肖查询', description: '查询生肖信息', categoryId: 4, keywords: '生肖,属相,今年属什么,生肖运势', confidence: 0.7, priority: 4 },
      { name: '星座查询', description: '查询星座信息', categoryId: 4, keywords: '星座,什么座,星座运势,星座配对', confidence: 0.7, priority: 4 },

      // === 新闻资讯类 (categoryId: 5) ===
      { name: '头条新闻', description: '播报头条新闻', categoryId: 5, keywords: '头条新闻,今日头条,重要新闻,新闻头条', confidence: 0.9, priority: 1 },
      { name: '财经新闻', description: '播报财经资讯', categoryId: 5, keywords: '财经新闻,股市,金融,经济新闻,财经资讯', confidence: 0.8, priority: 2 },
      { name: '体育新闻', description: '播报体育资讯', categoryId: 5, keywords: '体育新闻,体育赛事,球赛,比赛结果,体育资讯', confidence: 0.8, priority: 2 },
      { name: '科技新闻', description: '播报科技资讯', categoryId: 5, keywords: '科技新闻,科技资讯,数码,互联网,科技动态', confidence: 0.8, priority: 2 },
      { name: '娱乐新闻', description: '播报娱乐资讯', categoryId: 5, keywords: '娱乐新闻,明星,娱乐圈,影视,娱乐资讯', confidence: 0.8, priority: 2 },
      { name: '国际新闻', description: '播报国际资讯', categoryId: 5, keywords: '国际新闻,国外新闻,世界新闻,国际资讯', confidence: 0.8, priority: 2 },
      { name: '本地新闻', description: '播报本地资讯', categoryId: 5, keywords: '本地新闻,当地新闻,本市新闻,本地资讯', confidence: 0.8, priority: 2 },
      { name: '社会新闻', description: '播报社会资讯', categoryId: 5, keywords: '社会新闻,民生,社会热点,社会资讯', confidence: 0.8, priority: 2 },

      // === 提醒服务类 (categoryId: 6) ===
      { name: '设置闹钟', description: '设置闹钟提醒', categoryId: 6, keywords: '设置闹钟,定闹钟,明天几点叫我,闹钟提醒', confidence: 0.9, priority: 1 },
      { name: '取消闹钟', description: '取消闹钟', categoryId: 6, keywords: '取消闹钟,关闭闹钟,删除闹钟,不要闹钟', confidence: 0.9, priority: 2 },
      { name: '查看闹钟', description: '查看已设置的闹钟', categoryId: 6, keywords: '查看闹钟,有什么闹钟,闹钟列表,我的闹钟', confidence: 0.8, priority: 3 },
      { name: '设置提醒', description: '设置事件提醒', categoryId: 6, keywords: '设置提醒,提醒我,记得提醒,定时提醒', confidence: 0.9, priority: 1 },
      { name: '取消提醒', description: '取消提醒', categoryId: 6, keywords: '取消提醒,删除提醒,不要提醒了', confidence: 0.9, priority: 2 },
      { name: '查看提醒', description: '查看提醒列表', categoryId: 6, keywords: '查看提醒,有什么提醒,提醒列表,我的提醒', confidence: 0.8, priority: 3 },
      { name: '重复提醒', description: '设置重复提醒', categoryId: 6, keywords: '每天提醒,每周提醒,重复提醒,定期提醒', confidence: 0.8, priority: 3 },
      { name: '生日提醒', description: '设置生日提醒', categoryId: 6, keywords: '生日提醒,生日,纪念日,重要日子', confidence: 0.8, priority: 3 },
      { name: '会议提醒', description: '设置会议提醒', categoryId: 6, keywords: '会议提醒,开会提醒,会议安排,会议时间', confidence: 0.8, priority: 3 },
      { name: '吃药提醒', description: '设置吃药提醒', categoryId: 6, keywords: '吃药提醒,服药提醒,药物提醒,按时吃药', confidence: 0.8, priority: 3 },

      // === 通讯服务类 (categoryId: 7) ===
      { name: '拨打电话', description: '拨打电话', categoryId: 7, keywords: '打电话,拨打,呼叫,联系,电话', confidence: 0.9, priority: 1 },
      { name: '发送短信', description: '发送短信', categoryId: 7, keywords: '发短信,发信息,短信,发消息', confidence: 0.8, priority: 2 },
      { name: '查看通讯录', description: '查看联系人', categoryId: 7, keywords: '通讯录,联系人,电话本,查看联系人', confidence: 0.8, priority: 3 },
      { name: '语音留言', description: '录制语音留言', categoryId: 7, keywords: '语音留言,录音,留言,语音消息', confidence: 0.7, priority: 4 },
      { name: '视频通话', description: '发起视频通话', categoryId: 7, keywords: '视频通话,视频聊天,视频电话,视频', confidence: 0.8, priority: 3 },
      { name: '查看未接来电', description: '查看未接来电', categoryId: 7, keywords: '未接来电,未接电话,错过的电话,通话记录', confidence: 0.7, priority: 4 },

      // === 计算工具类 (categoryId: 8) ===
      { name: '数学计算', description: '进行数学计算', categoryId: 8, keywords: '计算,加法,减法,乘法,除法,数学', confidence: 0.9, priority: 1 },
      { name: '单位换算', description: '单位换算', categoryId: 8, keywords: '单位换算,换算,转换,米换算,公斤换算', confidence: 0.8, priority: 2 },
      { name: '汇率换算', description: '汇率换算', categoryId: 8, keywords: '汇率,美元,人民币,汇率换算,外汇', confidence: 0.8, priority: 2 },
      { name: '房贷计算', description: '房贷计算', categoryId: 8, keywords: '房贷计算,贷款计算,月供,利率计算', confidence: 0.7, priority: 3 },
      { name: '个税计算', description: '个人所得税计算', categoryId: 8, keywords: '个税计算,税收,个人所得税,扣税', confidence: 0.7, priority: 3 },
      { name: 'BMI计算', description: 'BMI指数计算', categoryId: 8, keywords: 'BMI,身体质量指数,体重指数,健康指数', confidence: 0.7, priority: 3 },
      { name: '年龄计算', description: '年龄计算', categoryId: 8, keywords: '年龄计算,多少岁,年龄,生日计算', confidence: 0.7, priority: 3 },

      // === 学习教育类 (categoryId: 9) ===
      { name: '英语翻译', description: '中英文翻译', categoryId: 9, keywords: '翻译,英语翻译,中文翻译,英文怎么说', confidence: 0.9, priority: 1 },
      { name: '多语言翻译', description: '多种语言翻译', categoryId: 9, keywords: '日语翻译,韩语翻译,法语翻译,德语翻译', confidence: 0.8, priority: 2 },
      { name: '单词查询', description: '查询单词释义', categoryId: 9, keywords: '单词查询,什么意思,词语解释,单词释义', confidence: 0.8, priority: 2 },
      { name: '成语查询', description: '查询成语释义', categoryId: 9, keywords: '成语,成语意思,成语解释,成语典故', confidence: 0.8, priority: 2 },
      { name: '诗词查询', description: '查询诗词内容', categoryId: 9, keywords: '诗词,古诗,诗歌,李白,杜甫', confidence: 0.8, priority: 2 },
      { name: '背诵古诗', description: '背诵古诗词', categoryId: 9, keywords: '背古诗,背诵,古诗词,诗词背诵', confidence: 0.8, priority: 2 },
      { name: '历史查询', description: '查询历史知识', categoryId: 9, keywords: '历史,历史事件,历史人物,朝代', confidence: 0.7, priority: 3 },
      { name: '地理查询', description: '查询地理知识', categoryId: 9, keywords: '地理,地理知识,国家,城市,地理位置', confidence: 0.7, priority: 3 },
      { name: '科学知识', description: '查询科学知识', categoryId: 9, keywords: '科学,物理,化学,生物,科学知识', confidence: 0.7, priority: 3 },
      { name: '数学公式', description: '查询数学公式', categoryId: 9, keywords: '数学公式,公式,数学定理,数学知识', confidence: 0.7, priority: 3 },
      { name: '儿童教育', description: '儿童教育内容', categoryId: 9, keywords: '儿童教育,幼儿教育,儿童故事,启蒙教育', confidence: 0.8, priority: 2 },
      { name: '学习计划', description: '制定学习计划', categoryId: 9, keywords: '学习计划,学习安排,复习计划,学习方法', confidence: 0.7, priority: 3 },

      // === 生活服务类 (categoryId: 10) ===
      { name: '查询路线', description: '查询路线导航', categoryId: 10, keywords: '路线,导航,怎么走,路线规划,交通路线', confidence: 0.9, priority: 1 },
      { name: '附近搜索', description: '搜索附近服务', categoryId: 10, keywords: '附近,附近的,周边,附近有什么,找附近', confidence: 0.9, priority: 1 },
      { name: '美食推荐', description: '推荐美食餐厅', categoryId: 10, keywords: '美食,餐厅,好吃的,美食推荐,吃什么', confidence: 0.8, priority: 2 },
      { name: '酒店预订', description: '酒店预订服务', categoryId: 10, keywords: '酒店,预订酒店,住宿,宾馆,订房', confidence: 0.8, priority: 2 },
      { name: '机票查询', description: '查询机票信息', categoryId: 10, keywords: '机票,航班,飞机票,订机票,机票查询', confidence: 0.8, priority: 2 },
      { name: '火车票查询', description: '查询火车票信息', categoryId: 10, keywords: '火车票,高铁票,动车票,订票,火车时刻', confidence: 0.8, priority: 2 },
      { name: '快递查询', description: '查询快递信息', categoryId: 10, keywords: '快递,快递查询,包裹,物流,快递单号', confidence: 0.8, priority: 2 },
      { name: '外卖订餐', description: '外卖订餐服务', categoryId: 10, keywords: '外卖,订餐,点餐,叫外卖,外卖订单', confidence: 0.8, priority: 2 },
      { name: '打车服务', description: '打车叫车服务', categoryId: 10, keywords: '打车,叫车,出租车,网约车,滴滴', confidence: 0.8, priority: 2 },
      { name: '购物助手', description: '购物推荐服务', categoryId: 10, keywords: '购物,买东西,商品推荐,价格对比,购物建议', confidence: 0.7, priority: 3 },
      { name: '生活缴费', description: '生活缴费服务', categoryId: 10, keywords: '缴费,水电费,燃气费,电话费,生活缴费', confidence: 0.7, priority: 3 },
      { name: '医院挂号', description: '医院挂号服务', categoryId: 10, keywords: '挂号,医院,看病,预约,医生', confidence: 0.7, priority: 3 },
      { name: '药品查询', description: '查询药品信息', categoryId: 10, keywords: '药品,药物,药品查询,药品说明,用药', confidence: 0.7, priority: 3 },
      { name: '违章查询', description: '查询违章信息', categoryId: 10, keywords: '违章,违章查询,交通违章,罚单,扣分', confidence: 0.7, priority: 3 },
      { name: '社保查询', description: '查询社保信息', categoryId: 10, keywords: '社保,社保查询,养老保险,医疗保险,公积金', confidence: 0.7, priority: 3 },
      { name: '银行服务', description: '银行相关服务', categoryId: 10, keywords: '银行,余额查询,转账,信用卡,银行卡', confidence: 0.7, priority: 3 },
      { name: '理财建议', description: '理财投资建议', categoryId: 10, keywords: '理财,投资,基金,股票,理财建议', confidence: 0.7, priority: 3 },
      { name: '保险查询', description: '保险相关查询', categoryId: 10, keywords: '保险,保险查询,车险,健康险,保险理赔', confidence: 0.7, priority: 3 },

      // === 健康医疗类 (新增分类建议) ===
      { name: '健康咨询', description: '健康相关咨询', categoryId: 10, keywords: '健康,身体,症状,健康咨询,养生', confidence: 0.7, priority: 3 },
      { name: '运动健身', description: '运动健身指导', categoryId: 10, keywords: '运动,健身,锻炼,减肥,健身计划', confidence: 0.7, priority: 3 },
      { name: '营养建议', description: '营养饮食建议', categoryId: 10, keywords: '营养,饮食,食谱,营养搭配,健康饮食', confidence: 0.7, priority: 3 },
      { name: '心理健康', description: '心理健康咨询', categoryId: 10, keywords: '心理,情绪,压力,心理健康,心情', confidence: 0.7, priority: 3 },
      { name: '睡眠建议', description: '睡眠质量建议', categoryId: 10, keywords: '睡眠,失眠,睡眠质量,睡眠建议,助眠', confidence: 0.7, priority: 3 },

      // === 娱乐互动类 (扩展) ===
      { name: '讲笑话', description: '讲笑话娱乐', categoryId: 1, keywords: '讲笑话,笑话,逗我笑,幽默,搞笑', confidence: 0.8, priority: 3 },
      { name: '讲故事', description: '讲故事', categoryId: 1, keywords: '讲故事,故事,童话,寓言,小故事', confidence: 0.8, priority: 3 },
      { name: '猜谜语', description: '猜谜语游戏', categoryId: 1, keywords: '猜谜语,谜语,脑筋急转弯,智力游戏', confidence: 0.8, priority: 3 },
      { name: '成语接龙', description: '成语接龙游戏', categoryId: 1, keywords: '成语接龙,接龙,成语游戏,文字游戏', confidence: 0.8, priority: 3 },
      { name: '诗词对联', description: '诗词对联游戏', categoryId: 1, keywords: '对联,诗词,对诗,诗词游戏', confidence: 0.7, priority: 4 },
      { name: '聊天对话', description: '日常聊天对话', categoryId: 1, keywords: '聊天,对话,说话,陪我聊天,闲聊', confidence: 0.8, priority: 3 },
      { name: '情感陪伴', description: '情感陪伴支持', categoryId: 1, keywords: '陪伴,安慰,倾诉,心情不好,孤独', confidence: 0.7, priority: 4 },
      { name: '占卜算命', description: '占卜算命娱乐', categoryId: 1, keywords: '占卜,算命,运势,星座运势,塔罗牌', confidence: 0.6, priority: 5 },
      { name: '语音游戏', description: '语音互动游戏', categoryId: 1, keywords: '游戏,语音游戏,互动游戏,玩游戏', confidence: 0.8, priority: 3 },
      { name: '知识问答', description: '知识问答游戏', categoryId: 1, keywords: '问答,知识问答,百科,常识,问题', confidence: 0.8, priority: 3 },

      // === 系统功能类 (扩展) ===
      { name: '系统设置', description: '系统功能设置', categoryId: 1, keywords: '设置,系统设置,配置,调整,选项', confidence: 0.8, priority: 4 },
      { name: '音量调节', description: '系统音量调节', categoryId: 1, keywords: '音量,声音,大声,小声,静音', confidence: 0.9, priority: 2 },
      { name: '网络设置', description: '网络连接设置', categoryId: 1, keywords: '网络,WiFi,连接,网络设置,断网', confidence: 0.8, priority: 4 },
      { name: '蓝牙连接', description: '蓝牙设备连接', categoryId: 1, keywords: '蓝牙,连接蓝牙,蓝牙设备,配对', confidence: 0.8, priority: 4 },
      { name: '系统状态', description: '查看系统状态', categoryId: 1, keywords: '系统状态,状态,电量,内存,系统信息', confidence: 0.7, priority: 5 },
      { name: '设备重启', description: '设备重启', categoryId: 1, keywords: '重启,重新启动,重启系统,重启设备', confidence: 0.8, priority: 5 },
      { name: '软件更新', description: '软件系统更新', categoryId: 1, keywords: '更新,系统更新,软件更新,升级', confidence: 0.7, priority: 5 },
      { name: '恢复出厂', description: '恢复出厂设置', categoryId: 1, keywords: '恢复出厂,重置,恢复默认,初始化', confidence: 0.7, priority: 6 },
      { name: '帮助说明', description: '帮助和说明', categoryId: 1, keywords: '帮助,说明,使用说明,怎么用,教程', confidence: 0.8, priority: 4 },
      { name: '意见反馈', description: '意见反馈', categoryId: 1, keywords: '反馈,意见,建议,问题反馈,投诉', confidence: 0.7, priority: 5 },

      // === 专业服务类 (扩展) ===
      { name: '法律咨询', description: '法律问题咨询', categoryId: 10, keywords: '法律,法律咨询,律师,法律问题,维权', confidence: 0.6, priority: 5 },
      { name: '税务咨询', description: '税务相关咨询', categoryId: 10, keywords: '税务,报税,税收,税务咨询,纳税', confidence: 0.6, priority: 5 },
      { name: '房产咨询', description: '房产相关咨询', categoryId: 10, keywords: '房产,买房,卖房,房价,房产咨询', confidence: 0.6, priority: 5 },
      { name: '职业规划', description: '职业发展规划', categoryId: 10, keywords: '职业规划,求职,找工作,职业发展,简历', confidence: 0.6, priority: 5 },
      { name: '教育咨询', description: '教育相关咨询', categoryId: 9, keywords: '教育咨询,学校,专业,升学,教育', confidence: 0.6, priority: 5 },

      // === 特色功能类 (创新) ===
      { name: '语音备忘', description: '语音备忘录', categoryId: 6, keywords: '备忘录,记录,语音记录,备忘,记住', confidence: 0.8, priority: 3 },
      { name: '日程管理', description: '日程安排管理', categoryId: 6, keywords: '日程,日程安排,行程,安排,计划', confidence: 0.8, priority: 3 },
      { name: '习惯养成', description: '习惯养成提醒', categoryId: 6, keywords: '习惯,养成习惯,坚持,习惯提醒,打卡', confidence: 0.7, priority: 4 },
      { name: '冥想引导', description: '冥想放松引导', categoryId: 1, keywords: '冥想,放松,深呼吸,冥想音乐,静心', confidence: 0.7, priority: 4 },
      { name: '专注模式', description: '专注工作模式', categoryId: 6, keywords: '专注,专注模式,番茄工作法,专心,集中注意力', confidence: 0.7, priority: 4 },
      { name: '情绪管理', description: '情绪调节管理', categoryId: 1, keywords: '情绪,情绪管理,心情,调节情绪,情绪调节', confidence: 0.7, priority: 4 },
      { name: '语言练习', description: '语言发音练习', categoryId: 9, keywords: '语言练习,发音,口语,语言训练,练习说话', confidence: 0.7, priority: 4 },
      { name: '记忆训练', description: '记忆力训练', categoryId: 9, keywords: '记忆训练,记忆力,记忆,大脑训练,记忆方法', confidence: 0.7, priority: 4 },
      { name: '创意灵感', description: '创意灵感激发', categoryId: 1, keywords: '创意,灵感,创意灵感,创作,头脑风暴', confidence: 0.6, priority: 5 },
      { name: '随机决策', description: '随机决策帮助', categoryId: 1, keywords: '随机,决策,选择,帮我选,随机选择', confidence: 0.7, priority: 4 }
    ];

    // 获取已存在的意图名称
    const existingIntents = await db.CoreIntent.findAll({ attributes: ['name'] });
    const existingNames = new Set(existingIntents.map(intent => intent.name));

    // 过滤掉已存在的意图
    const newIntents = expandedCoreIntents.filter(intent => !existingNames.has(intent.name));
    
    console.log(`🔍 发现 ${newIntents.length} 个新的核心意图需要导入`);

    if (newIntents.length > 0) {
      // 分批插入，避免一次性插入过多数据
      const batchSize = 50;
      let insertedCount = 0;
      
      for (let i = 0; i < newIntents.length; i += batchSize) {
        const batch = newIntents.slice(i, i + batchSize);
        await db.CoreIntent.bulkCreate(batch, {
          validate: true,
          ignoreDuplicates: true
        });
        insertedCount += batch.length;
        console.log(`✨ 已导入 ${insertedCount}/${newIntents.length} 个核心意图`);
      }

      console.log(`\n🎉 成功导入 ${newIntents.length} 个核心意图！`);
      
      // 按分类统计导入的意图
      const categoryStats = {};
      newIntents.forEach(intent => {
        const categoryId = intent.categoryId;
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = { count: 0, intents: [] };
        }
        categoryStats[categoryId].count++;
        categoryStats[categoryId].intents.push(intent.name);
      });

      console.log('\n📊 按分类统计:');
      const categoryNames = {
        1: '音乐控制',
        2: '天气查询', 
        3: '智能家居',
        4: '时间日期',
        5: '新闻资讯',
        6: '提醒服务',
        7: '通讯服务',
        8: '计算工具',
        9: '学习教育',
        10: '生活服务'
      };

      Object.entries(categoryStats).forEach(([categoryId, stats]) => {
        console.log(`${categoryNames[categoryId] || `分类${categoryId}`}: ${stats.count}个`);
        stats.intents.forEach(name => console.log(`  - ${name}`));
      });

    } else {
      console.log('💡 没有新的核心意图需要导入');
    }

    // 最终统计
    const finalCount = await db.CoreIntent.count();
    console.log(`\n🏆 导入完成！数据库中现有核心意图总数: ${finalCount}`);

    // 提供使用建议
    console.log('\n💡 使用建议:');
    console.log('1. 可以根据实际需求调整意图的优先级和置信度');
    console.log('2. 建议定期分析意图使用情况，优化高频意图');
    console.log('3. 可以为特定场景创建新的意图分类');
    console.log('4. 建议添加更多针对性的关键词以提高识别准确率');

  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  expandCoreIntents()
    .then(() => {
      console.log('✅ 核心意图扩展完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 核心意图扩展失败:', error);
      process.exit(1);
    });
}

module.exports = expandCoreIntents; 