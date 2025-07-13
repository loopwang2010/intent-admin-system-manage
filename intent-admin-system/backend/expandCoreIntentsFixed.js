const db = require('./src/models');

async function expandCoreIntentsFixed() {
  try {
    console.log('🚀 开始扩展核心意图数据...');
    
    await db.sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查现有数据
    const existingCount = await db.CoreIntent.count();
    console.log(`📊 现有核心意图数量: ${existingCount}`);

    // 基于现有分类ID (1-5) 的全面核心意图扩展
    // 1-音乐控制, 2-天气查询, 3-智能家居, 4-时间日期, 5-新闻资讯
    const expandedCoreIntents = [
      // === 音乐控制类 (categoryId: 1) ===
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
      { name: '下一首', description: '播放下一首歌曲', categoryId: 1, keywords: '下一首,切歌,换一首,下首歌,跳过这首', confidence: 0.9, priority: 2 },
      { name: '上一首', description: '播放上一首歌曲', categoryId: 1, keywords: '上一首,前一首,回到上首,上首歌', confidence: 0.9, priority: 2 },
      { name: '音量调节', description: '调节音量大小', categoryId: 1, keywords: '调节音量,声音大小,音量,大声点,小声点', confidence: 0.9, priority: 2 },
      { name: '静音', description: '开启或关闭静音', categoryId: 1, keywords: '静音,关闭声音,取消静音,恢复声音', confidence: 0.9, priority: 2 },
      { name: '播放模式', description: '切换播放模式', categoryId: 1, keywords: '播放模式,循环模式,顺序播放,随机模式', confidence: 0.8, priority: 3 },
      { name: '音乐搜索', description: '搜索音乐', categoryId: 1, keywords: '搜索音乐,找歌,查找歌曲,音乐查找', confidence: 0.8, priority: 3 },
      { name: '音乐暂停', description: '暂停音乐播放', categoryId: 1, keywords: '暂停,停止播放,暂停音乐,停一下', confidence: 0.9, priority: 2 },
      { name: '音乐继续', description: '继续播放音乐', categoryId: 1, keywords: '继续播放,继续,恢复播放,播放', confidence: 0.9, priority: 2 },
      { name: '播放歌手', description: '播放指定歌手的歌曲', categoryId: 1, keywords: '播放歌手,听歌手,歌手的歌,某某歌手', confidence: 0.8, priority: 3 },
      { name: '播放类型', description: '播放指定类型的音乐', categoryId: 1, keywords: '播放类型,音乐类型,流行音乐,摇滚音乐', confidence: 0.8, priority: 3 },
      { name: '音乐推荐', description: '推荐音乐', categoryId: 1, keywords: '推荐音乐,音乐推荐,好听的歌,推荐歌曲', confidence: 0.8, priority: 3 },

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
      { name: '实时天气', description: '查询当前实时天气', categoryId: 2, keywords: '现在天气,当前天气,实时天气,此刻天气', confidence: 0.9, priority: 1 },
      { name: '天气预警', description: '查询天气预警信息', categoryId: 2, keywords: '天气预警,气象预警,预警信息,天气警报', confidence: 0.8, priority: 3 },
      { name: '温度查询', description: '查询温度信息', categoryId: 2, keywords: '温度,气温,多少度,冷不冷,热不热', confidence: 0.9, priority: 1 },
      { name: '天气趋势', description: '查询天气变化趋势', categoryId: 2, keywords: '天气趋势,天气变化,未来天气,天气走势', confidence: 0.8, priority: 3 },
      { name: '季节天气', description: '查询季节性天气特点', categoryId: 2, keywords: '春天天气,夏天天气,秋天天气,冬天天气', confidence: 0.7, priority: 4 },
      { name: '极端天气', description: '查询极端天气情况', categoryId: 2, keywords: '台风,暴雨,大雪,高温,寒潮', confidence: 0.7, priority: 4 },
      { name: '地区天气', description: '查询不同地区天气', categoryId: 2, keywords: '北京天气,上海天气,广州天气,地区天气', confidence: 0.8, priority: 3 },
      { name: '天气对比', description: '对比不同地区天气', categoryId: 2, keywords: '天气对比,天气比较,哪里天气好,温差', confidence: 0.7, priority: 4 },

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
      { name: '开关灯', description: '控制灯光开关', categoryId: 3, keywords: '开灯,关灯,打开灯,关闭灯,灯光开关', confidence: 0.9, priority: 1 },
      { name: '风扇控制', description: '控制风扇', categoryId: 3, keywords: '开风扇,关风扇,风扇档位,风扇速度', confidence: 0.8, priority: 3 },
      { name: '音响控制', description: '控制音响设备', categoryId: 3, keywords: '开音响,关音响,音响音量,音响模式', confidence: 0.8, priority: 3 },
      { name: '投影仪控制', description: '控制投影仪', categoryId: 3, keywords: '开投影仪,关投影仪,投影仪亮度,投影模式', confidence: 0.7, priority: 4 },
      { name: '智能插座', description: '控制智能插座', categoryId: 3, keywords: '智能插座,插座开关,插座控制,电源开关', confidence: 0.8, priority: 3 },
      { name: '温控器', description: '控制温控器', categoryId: 3, keywords: '温控器,温度控制,恒温,温控设置', confidence: 0.7, priority: 4 },
      { name: '智能门铃', description: '控制智能门铃', categoryId: 3, keywords: '门铃,智能门铃,门铃设置,门铃状态', confidence: 0.7, priority: 4 },
      { name: '烟雾报警器', description: '查看烟雾报警器状态', categoryId: 3, keywords: '烟雾报警器,火警,烟雾检测,安全报警', confidence: 0.7, priority: 4 },
      { name: '窗户控制', description: '控制智能窗户', categoryId: 3, keywords: '开窗,关窗,窗户控制,通风', confidence: 0.8, priority: 3 },
      { name: '地暖控制', description: '控制地暖系统', categoryId: 3, keywords: '地暖,地暖开关,地暖温度,地暖模式', confidence: 0.7, priority: 4 },

      // === 时间日期类 (categoryId: 4) ===
      { name: '世界时间', description: '查询世界各地时间', categoryId: 4, keywords: '世界时间,纽约时间,东京时间,伦敦时间,时差', confidence: 0.8, priority: 3 },
      { name: '农历查询', description: '查询农历日期', categoryId: 4, keywords: '农历,阴历,农历几月几日,今天农历', confidence: 0.8, priority: 3 },
      { name: '节假日查询', description: '查询节假日信息', categoryId: 4, keywords: '节假日,假期,放假,调休,法定节假日', confidence: 0.8, priority: 3 },
      { name: '倒计时', description: '设置倒计时', categoryId: 4, keywords: '倒计时,计时,定时,倒数', confidence: 0.9, priority: 2 },
      { name: '秒表', description: '启动秒表功能', categoryId: 4, keywords: '秒表,计时器,开始计时,停止计时', confidence: 0.9, priority: 2 },
      { name: '工作日查询', description: '查询工作日信息', categoryId: 4, keywords: '工作日,上班日,今天上班吗,工作日查询', confidence: 0.7, priority: 4 },
      { name: '生肖查询', description: '查询生肖信息', categoryId: 4, keywords: '生肖,属相,今年属什么,生肖运势', confidence: 0.7, priority: 4 },
      { name: '星座查询', description: '查询星座信息', categoryId: 4, keywords: '星座,什么座,星座运势,星座配对', confidence: 0.7, priority: 4 },
      { name: '时间查询', description: '查询当前时间', categoryId: 4, keywords: '现在几点,时间,几点了,当前时间', confidence: 0.9, priority: 1 },
      { name: '日期查询', description: '查询当前日期', categoryId: 4, keywords: '今天几号,日期,星期几,几月几日', confidence: 0.9, priority: 1 },
      { name: '闹钟设置', description: '设置闹钟', categoryId: 4, keywords: '设置闹钟,定闹钟,明天几点叫我,闹钟提醒', confidence: 0.9, priority: 2 },
      { name: '闹钟取消', description: '取消闹钟', categoryId: 4, keywords: '取消闹钟,关闭闹钟,删除闹钟,不要闹钟', confidence: 0.9, priority: 2 },
      { name: '提醒设置', description: '设置提醒', categoryId: 4, keywords: '设置提醒,提醒我,记得提醒,定时提醒', confidence: 0.9, priority: 2 },
      { name: '提醒取消', description: '取消提醒', categoryId: 4, keywords: '取消提醒,删除提醒,不要提醒了', confidence: 0.9, priority: 2 },
      { name: '日程查询', description: '查询日程安排', categoryId: 4, keywords: '日程,日程安排,今天安排,明天安排', confidence: 0.8, priority: 3 },
      { name: '计时器', description: '启动计时器', categoryId: 4, keywords: '计时器,定时器,计时,定时', confidence: 0.9, priority: 2 },
      { name: '时区转换', description: '时区时间转换', categoryId: 4, keywords: '时区,时区转换,时差计算,不同时区', confidence: 0.7, priority: 4 },
      { name: '日历查询', description: '查询日历信息', categoryId: 4, keywords: '日历,万年历,日历查询,日期计算', confidence: 0.8, priority: 3 },
      { name: '重要日期', description: '查询重要日期', categoryId: 4, keywords: '重要日期,纪念日,生日,节日', confidence: 0.7, priority: 4 },
      { name: '时间段查询', description: '查询时间段信息', categoryId: 4, keywords: '上午,下午,晚上,凌晨,时间段', confidence: 0.8, priority: 3 },

      // === 新闻资讯类 (categoryId: 5) ===
      { name: '头条新闻', description: '播报头条新闻', categoryId: 5, keywords: '头条新闻,今日头条,重要新闻,新闻头条', confidence: 0.9, priority: 1 },
      { name: '财经新闻', description: '播报财经资讯', categoryId: 5, keywords: '财经新闻,股市,金融,经济新闻,财经资讯', confidence: 0.8, priority: 2 },
      { name: '体育新闻', description: '播报体育资讯', categoryId: 5, keywords: '体育新闻,体育赛事,球赛,比赛结果,体育资讯', confidence: 0.8, priority: 2 },
      { name: '科技新闻', description: '播报科技资讯', categoryId: 5, keywords: '科技新闻,科技资讯,数码,互联网,科技动态', confidence: 0.8, priority: 2 },
      { name: '娱乐新闻', description: '播报娱乐资讯', categoryId: 5, keywords: '娱乐新闻,明星,娱乐圈,影视,娱乐资讯', confidence: 0.8, priority: 2 },
      { name: '国际新闻', description: '播报国际资讯', categoryId: 5, keywords: '国际新闻,国外新闻,世界新闻,国际资讯', confidence: 0.8, priority: 2 },
      { name: '本地新闻', description: '播报本地资讯', categoryId: 5, keywords: '本地新闻,当地新闻,本市新闻,本地资讯', confidence: 0.8, priority: 2 },
      { name: '社会新闻', description: '播报社会资讯', categoryId: 5, keywords: '社会新闻,民生,社会热点,社会资讯', confidence: 0.8, priority: 2 },
      { name: '实时新闻', description: '播报实时新闻', categoryId: 5, keywords: '实时新闻,最新消息,即时新闻,最新资讯', confidence: 0.9, priority: 1 },
      { name: '新闻摘要', description: '播报新闻摘要', categoryId: 5, keywords: '新闻摘要,新闻概要,新闻简报,新闻总结', confidence: 0.8, priority: 2 },
      { name: '热点新闻', description: '播报热点新闻', categoryId: 5, keywords: '热点新闻,热门新闻,热点话题,热门话题', confidence: 0.8, priority: 2 },
      { name: '军事新闻', description: '播报军事资讯', categoryId: 5, keywords: '军事新闻,军事资讯,国防,军事动态', confidence: 0.7, priority: 3 },
      { name: '政治新闻', description: '播报政治资讯', categoryId: 5, keywords: '政治新闻,政治资讯,政策,政府新闻', confidence: 0.7, priority: 3 },
      { name: '环境新闻', description: '播报环境资讯', categoryId: 5, keywords: '环境新闻,环保,生态,环境保护', confidence: 0.7, priority: 3 },
      { name: '教育新闻', description: '播报教育资讯', categoryId: 5, keywords: '教育新闻,教育资讯,学校,教育政策', confidence: 0.7, priority: 3 },
      { name: '健康新闻', description: '播报健康资讯', categoryId: 5, keywords: '健康新闻,医疗,健康资讯,医学新闻', confidence: 0.7, priority: 3 },
      { name: '汽车新闻', description: '播报汽车资讯', categoryId: 5, keywords: '汽车新闻,汽车资讯,车市,新车发布', confidence: 0.7, priority: 3 },
      { name: '房产新闻', description: '播报房产资讯', categoryId: 5, keywords: '房产新闻,楼市,房价,房地产', confidence: 0.7, priority: 3 },
      { name: '旅游新闻', description: '播报旅游资讯', categoryId: 5, keywords: '旅游新闻,旅游资讯,景点,旅游攻略', confidence: 0.7, priority: 3 },
      { name: '美食新闻', description: '播报美食资讯', categoryId: 5, keywords: '美食新闻,美食资讯,餐饮,美食推荐', confidence: 0.7, priority: 3 },

      // === 扩展功能 (分布到现有分类) ===
      
      // 音乐控制类扩展
      { name: '音乐评分', description: '给音乐评分', categoryId: 1, keywords: '音乐评分,给这首歌评分,喜欢这首歌,不喜欢', confidence: 0.7, priority: 4 },
      { name: '音乐分享', description: '分享音乐', categoryId: 1, keywords: '分享音乐,分享这首歌,推荐给朋友,音乐分享', confidence: 0.7, priority: 4 },
      { name: '音乐历史', description: '查看播放历史', categoryId: 1, keywords: '播放历史,听过的歌,最近播放,历史记录', confidence: 0.7, priority: 4 },
      { name: '音乐定时', description: '设置音乐定时关闭', categoryId: 1, keywords: '定时关闭,音乐定时,睡眠定时,自动关闭', confidence: 0.7, priority: 4 },
      { name: '音乐闹钟', description: '设置音乐闹钟', categoryId: 1, keywords: '音乐闹钟,用音乐叫醒,音乐提醒,歌曲闹钟', confidence: 0.7, priority: 4 },
      
      // 天气查询类扩展
      { name: '天气历史', description: '查询历史天气', categoryId: 2, keywords: '历史天气,去年天气,以前的天气,天气记录', confidence: 0.6, priority: 5 },
      { name: '天气统计', description: '查询天气统计', categoryId: 2, keywords: '天气统计,平均温度,天气分析,气候统计', confidence: 0.6, priority: 5 },
      { name: '天气提醒', description: '设置天气提醒', categoryId: 2, keywords: '天气提醒,天气变化提醒,降雨提醒,温度提醒', confidence: 0.7, priority: 4 },
      { name: '天气分享', description: '分享天气信息', categoryId: 2, keywords: '分享天气,天气分享,告诉别人天气,天气信息分享', confidence: 0.6, priority: 5 },
      
      // 智能家居类扩展
      { name: '设备状态', description: '查询设备状态', categoryId: 3, keywords: '设备状态,家电状态,设备是否开启,设备运行状态', confidence: 0.8, priority: 3 },
      { name: '能耗查询', description: '查询设备能耗', categoryId: 3, keywords: '能耗,电量,用电量,设备耗电,电费', confidence: 0.7, priority: 4 },
      { name: '设备定时', description: '设置设备定时', categoryId: 3, keywords: '设备定时,定时开关,自动控制,定时任务', confidence: 0.8, priority: 3 },
      { name: '设备联动', description: '设置设备联动', categoryId: 3, keywords: '设备联动,自动化,智能联动,设备协同', confidence: 0.7, priority: 4 },
      { name: '设备维护', description: '设备维护提醒', categoryId: 3, keywords: '设备维护,保养提醒,维修,设备检查', confidence: 0.7, priority: 4 },
      
      // 时间日期类扩展
      { name: '时间计算', description: '计算时间间隔', categoryId: 4, keywords: '时间计算,时间间隔,多长时间,时间差', confidence: 0.7, priority: 4 },
      { name: '时间提醒', description: '设置时间提醒', categoryId: 4, keywords: '时间提醒,按时提醒,定时提醒,时间到了提醒', confidence: 0.8, priority: 3 },
      { name: '时间记录', description: '记录时间', categoryId: 4, keywords: '时间记录,记录时间,时间日志,时间统计', confidence: 0.7, priority: 4 },
      { name: '时间规划', description: '时间规划建议', categoryId: 4, keywords: '时间规划,时间安排,时间管理,时间分配', confidence: 0.7, priority: 4 },
      
      // 新闻资讯类扩展
      { name: '新闻搜索', description: '搜索特定新闻', categoryId: 5, keywords: '新闻搜索,搜索新闻,查找新闻,新闻查询', confidence: 0.8, priority: 3 },
      { name: '新闻订阅', description: '订阅新闻', categoryId: 5, keywords: '新闻订阅,订阅资讯,关注新闻,新闻推送', confidence: 0.7, priority: 4 },
      { name: '新闻评论', description: '新闻评论', categoryId: 5, keywords: '新闻评论,评论新闻,新闻观点,新闻看法', confidence: 0.6, priority: 5 },
      { name: '新闻分类', description: '按分类查看新闻', categoryId: 5, keywords: '新闻分类,分类新闻,新闻类别,按类别看新闻', confidence: 0.7, priority: 4 },
      { name: '新闻收藏', description: '收藏新闻', categoryId: 5, keywords: '新闻收藏,收藏资讯,保存新闻,新闻书签', confidence: 0.7, priority: 4 }
    ];

    // 获取已存在的意图名称
    const existingIntents = await db.CoreIntent.findAll({ attributes: ['name'] });
    const existingNames = new Set(existingIntents.map(intent => intent.name));

    // 过滤掉已存在的意图
    const newIntents = expandedCoreIntents.filter(intent => !existingNames.has(intent.name));
    
    console.log(`🔍 发现 ${newIntents.length} 个新的核心意图需要导入`);

    if (newIntents.length > 0) {
      // 分批插入，避免一次性插入过多数据
      const batchSize = 30;
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
        5: '新闻资讯'
      };

      Object.entries(categoryStats).forEach(([categoryId, stats]) => {
        console.log(`\n${categoryNames[categoryId]}: ${stats.count}个`);
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
    console.log('3. 可以考虑创建更多专业领域的意图分类');
    console.log('4. 建议添加更多针对性的关键词以提高识别准确率');
    console.log('5. 这些意图覆盖了智能音箱的主要使用场景');

  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  expandCoreIntentsFixed()
    .then(() => {
      console.log('✅ 核心意图扩展完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 核心意图扩展失败:', error);
      process.exit(1);
    });
}

module.exports = expandCoreIntentsFixed; 