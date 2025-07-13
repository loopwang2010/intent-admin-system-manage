#!/usr/bin/env node
/**
 * 扩展分类数据 - 基于同类产品研究的完整智能音箱意图分类体系
 * 整合了小度、天猫精灵、小爱同学等主流产品的分类结构
 */

const extendedCategoryData = {
  // 新增的二级分类数据
  secondaryCategories: [
    // 娱乐休闲 - ENT
    {
      name: "故事相声",
      nameEn: "Stories & Comedy",
      code: "ENT_STORY",
      description: "讲故事、相声、评书等有声内容",
      parentId: 41, // 娱乐休闲
      level: 2,
      icon: "📖",
      color: "#FF6B6B",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },
    {
      name: "广播电台",
      nameEn: "Radio",
      code: "ENT_RADIO",
      description: "收听各类广播电台节目",
      parentId: 41,
      level: 2,
      icon: "📻",
      color: "#4ECDC4",
      sortOrder: 5,
      status: "active",
      isLeaf: true
    },
    {
      name: "有声读物",
      nameEn: "Audio Books",
      code: "ENT_AUDIOBOOK",
      description: "收听小说、散文等有声读物",
      parentId: 41,
      level: 2,
      icon: "🎧",
      color: "#45B7D1",
      sortOrder: 6,
      status: "active",
      isLeaf: true
    },

    // 生活服务 - LIFE
    {
      name: "购物消费",
      nameEn: "Shopping",
      code: "LIFE_SHOPPING",
      description: "购物指南、价格查询、优惠信息",
      parentId: 42,
      level: 2,
      icon: "🛒",
      color: "#96CEB4",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },
    {
      name: "生活助手",
      nameEn: "Life Assistant",
      code: "LIFE_ASSISTANT",
      description: "提醒、备忘录、日程管理等",
      parentId: 42,
      level: 2,
      icon: "📝",
      color: "#FECA57",
      sortOrder: 5,
      status: "active",
      isLeaf: true
    },
    {
      name: "城市服务",
      nameEn: "City Services",
      code: "LIFE_CITY",
      description: "违章查询、公积金查询、社保查询等",
      parentId: 42,
      level: 2,
      icon: "🏙️",
      color: "#48CAE4",
      sortOrder: 6,
      status: "active",
      isLeaf: true
    },
    {
      name: "快递物流",
      nameEn: "Express Delivery",
      code: "LIFE_EXPRESS",
      description: "快递查询、物流跟踪",
      parentId: 42,
      level: 2,
      icon: "📦",
      color: "#FF9F43",
      sortOrder: 7,
      status: "active",
      isLeaf: true
    },

    // 信息查询 - INFO
    {
      name: "计算服务",
      nameEn: "Calculation",
      code: "INFO_CALC",
      description: "数学计算、单位换算等",
      parentId: 43,
      level: 2,
      icon: "🧮",
      color: "#6C5CE7",
      sortOrder: 5,
      status: "active",
      isLeaf: true
    },
    {
      name: "搜索查询",
      nameEn: "Search",
      code: "INFO_SEARCH",
      description: "网络搜索、信息查找",
      parentId: 43,
      level: 2,
      icon: "🔎",
      color: "#A29BFE",
      sortOrder: 6,
      status: "active",
      isLeaf: true
    },
    {
      name: "股票财经",
      nameEn: "Finance",
      code: "INFO_FINANCE",
      description: "股票行情、财经资讯",
      parentId: 43,
      level: 2,
      icon: "💰",
      color: "#00B894",
      sortOrder: 7,
      status: "active",
      isLeaf: true
    },
    {
      name: "彩票查询",
      nameEn: "Lottery",
      code: "INFO_LOTTERY",
      description: "彩票开奖信息查询",
      parentId: 43,
      level: 2,
      icon: "🎰",
      color: "#E17055",
      sortOrder: 8,
      status: "active",
      isLeaf: true
    },

    // 智能控制 - CTRL
    {
      name: "系统设置",
      nameEn: "System Settings",
      code: "CTRL_SYSTEM",
      description: "音箱系统设置、网络配置等",
      parentId: 44,
      level: 2,
      icon: "⚙️",
      color: "#636E72",
      sortOrder: 3,
      status: "active",
      isLeaf: true
    },
    {
      name: "音响控制",
      nameEn: "Audio Control",
      code: "CTRL_AUDIO",
      description: "音量、音效等音响相关控制",
      parentId: 44,
      level: 2,
      icon: "🔊",
      color: "#74B9FF",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },

    // 社交互动 - SOCIAL
    {
      name: "语音通话",
      nameEn: "Voice Call",
      code: "SOCIAL_CALL",
      description: "语音通话、视频通话",
      parentId: 45,
      level: 2,
      icon: "📞",
      color: "#0984E3",
      sortOrder: 1,
      status: "active",
      isLeaf: true
    },
    {
      name: "消息提醒",
      nameEn: "Message Reminder",
      code: "SOCIAL_MESSAGE",
      description: "短信、微信消息等提醒",
      parentId: 45,
      level: 2,
      icon: "💬",
      color: "#00CEC9",
      sortOrder: 2,
      status: "active",
      isLeaf: true
    },
    {
      name: "社交分享",
      nameEn: "Social Sharing",
      code: "SOCIAL_SHARE",
      description: "朋友圈、微博等社交分享",
      parentId: 45,
      level: 2,
      icon: "📱",
      color: "#FD79A8",
      sortOrder: 3,
      status: "active",
      isLeaf: true
    },
    {
      name: "情感交流",
      nameEn: "Emotional Communication",
      code: "SOCIAL_EMOTION",
      description: "聊天、情感对话、心理疏导",
      parentId: 45,
      level: 2,
      icon: "💝",
      color: "#E84393",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },

    // 学习教育 - EDU
    {
      name: "儿童教育",
      nameEn: "Children Education",
      code: "EDU_CHILDREN",
      description: "儿歌、儿童故事、早教内容",
      parentId: 46,
      level: 2,
      icon: "🧸",
      color: "#FDCB6E",
      sortOrder: 1,
      status: "active",
      isLeaf: true
    },
    {
      name: "语言学习",
      nameEn: "Language Learning",
      code: "EDU_LANGUAGE",
      description: "英语学习、外语练习",
      parentId: 46,
      level: 2,
      icon: "🗣️",
      color: "#6C5CE7",
      sortOrder: 2,
      status: "active",
      isLeaf: true
    },
    {
      name: "技能培训",
      nameEn: "Skill Training",
      code: "EDU_SKILL",
      description: "职业技能、兴趣培训课程",
      parentId: 46,
      level: 2,
      icon: "🎯",
      color: "#A29BFE",
      sortOrder: 3,
      status: "active",
      isLeaf: true
    },
    {
      name: "知识问答",
      nameEn: "Q&A",
      code: "EDU_QA",
      description: "知识竞赛、智力问答",
      parentId: 46,
      level: 2,
      icon: "🤔",
      color: "#81ECEC",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },

    // 健康运动 - HEALTH
    {
      name: "健康监测",
      nameEn: "Health Monitoring",
      code: "HEALTH_MONITOR",
      description: "健康数据监测、体检提醒",
      parentId: 47,
      level: 2,
      icon: "💊",
      color: "#00B894",
      sortOrder: 1,
      status: "active",
      isLeaf: true
    },
    {
      name: "运动健身",
      nameEn: "Sports & Fitness",
      code: "HEALTH_SPORTS",
      description: "运动指导、健身计划",
      parentId: 47,
      level: 2,
      icon: "🏃‍♂️",
      color: "#00CEC9",
      sortOrder: 2,
      status: "active",
      isLeaf: true
    },
    {
      name: "医疗咨询",
      nameEn: "Medical Consultation",
      code: "HEALTH_MEDICAL",
      description: "疾病咨询、用药指导",
      parentId: 47,
      level: 2,
      icon: "🩺",
      color: "#0984E3",
      sortOrder: 3,
      status: "active",
      isLeaf: true
    },
    {
      name: "养生保健",
      nameEn: "Health Care",
      code: "HEALTH_CARE",
      description: "养生知识、保健指导",
      parentId: 47,
      level: 2,
      icon: "🌿",
      color: "#00B894",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    },

    // 商务办公 - BIZ
    {
      name: "日程管理",
      nameEn: "Schedule Management",
      code: "BIZ_SCHEDULE",
      description: "会议安排、日程提醒",
      parentId: 48,
      level: 2,
      icon: "📅",
      color: "#2D3436",
      sortOrder: 1,
      status: "active",
      isLeaf: true
    },
    {
      name: "会议助手",
      nameEn: "Meeting Assistant",
      code: "BIZ_MEETING",
      description: "会议记录、会议室预定",
      parentId: 48,
      level: 2,
      icon: "🏢",
      color: "#636E72",
      sortOrder: 2,
      status: "active",
      isLeaf: true
    },
    {
      name: "文档处理",
      nameEn: "Document Processing",
      code: "BIZ_DOCUMENT",
      description: "文档创建、邮件处理",
      parentId: 48,
      level: 2,
      icon: "📄",
      color: "#74B9FF",
      sortOrder: 3,
      status: "active",
      isLeaf: true
    },
    {
      name: "通讯录管理",
      nameEn: "Contact Management",
      code: "BIZ_CONTACT",
      description: "联系人管理、名片识别",
      parentId: 48,
      level: 2,
      icon: "📇",
      color: "#A29BFE",
      sortOrder: 4,
      status: "active",
      isLeaf: true
    }
  ],

  // 扩展的意图数据（示例）
  extendedIntents: [
    // 故事相声类
    {
      name: "讲故事",
      subtype: "讲故事",
      description: "播放儿童故事、成人故事等",
      categoryCode: "ENT_STORY",
      keywords: ["讲故事", "听故事", "故事时间", "童话故事", "睡前故事", "播放故事"],
      confidence: 0.92,
      priority: 1
    },
    {
      name: "相声段子",
      subtype: "相声段子",
      description: "播放相声、小品、段子等娱乐内容",
      categoryCode: "ENT_STORY",
      keywords: ["相声", "小品", "段子", "搞笑", "幽默", "逗乐"],
      confidence: 0.88,
      priority: 2
    },

    // 购物消费类
    {
      name: "商品查询",
      subtype: "商品查询",
      description: "查询商品价格、比价、优惠信息",
      categoryCode: "LIFE_SHOPPING",
      keywords: ["查价格", "比价", "优惠券", "打折", "商品信息", "购买建议"],
      confidence: 0.90,
      priority: 1
    },
    {
      name: "购物清单",
      subtype: "购物清单",
      description: "管理购物清单，添加删除商品",
      categoryCode: "LIFE_SHOPPING",
      keywords: ["购物清单", "购物列表", "添加商品", "买什么", "购物提醒"],
      confidence: 0.93,
      priority: 1
    },

    // 儿童教育类
    {
      name: "儿歌播放",
      subtype: "儿歌播放",
      description: "播放儿歌、童谣等儿童音乐",
      categoryCode: "EDU_CHILDREN",
      keywords: ["儿歌", "童谣", "小星星", "儿童歌曲", "宝宝音乐"],
      confidence: 0.95,
      priority: 1
    },
    {
      name: "早教启蒙",
      subtype: "早教启蒙",
      description: "数字认知、字母学习等早教内容",
      categoryCode: "EDU_CHILDREN",
      keywords: ["学数字", "学字母", "认颜色", "学拼音", "早教"],
      confidence: 0.89,
      priority: 2
    },

    // 健康监测类
    {
      name: "健康提醒",
      subtype: "健康提醒",
      description: "用药提醒、体检提醒等健康管理",
      categoryCode: "HEALTH_MONITOR",
      keywords: ["吃药提醒", "体检提醒", "健康管理", "医疗提醒"],
      confidence: 0.91,
      priority: 1
    },

    // 语音通话类
    {
      name: "拨打电话",
      subtype: "拨打电话",
      description: "语音拨打电话联系人",
      categoryCode: "SOCIAL_CALL",
      keywords: ["打电话", "拨号", "联系", "通话", "给谁打电话"],
      confidence: 0.94,
      priority: 1
    }
  ],

  // 预设回复内容（基于行业最佳实践）
  extendedResponses: [
    // 故事相声类回复
    {
      categoryCode: "ENT_STORY",
      content: "为你播放精彩故事《{title}》，希望你喜欢这个{type}故事～",
      type: "text",
      priority: 1,
      variables: ["title", "type"]
    },
    {
      categoryCode: "ENT_STORY",
      content: "来听个有趣的相声段子：{content}，哈哈，是不是很搞笑？",
      type: "text",
      priority: 2,
      variables: ["content"]
    },
    {
      categoryCode: "ENT_STORY",
      content: "今天的故事时间到了！为你推荐{count}个好听的故事，想听哪一个呢？",
      type: "text",
      priority: 3,
      variables: ["count"]
    },

    // 购物消费类回复
    {
      categoryCode: "LIFE_SHOPPING",
      content: "已为你查询{product}的价格信息：最低价{price}元，建议在{platform}购买～",
      type: "text",
      priority: 1,
      variables: ["product", "price", "platform"]
    },
    {
      categoryCode: "LIFE_SHOPPING",
      content: "已将{item}添加到购物清单，当前清单共有{count}项商品～",
      type: "text",
      priority: 1,
      variables: ["item", "count"]
    },
    {
      categoryCode: "LIFE_SHOPPING",
      content: "发现{product}有{discount}优惠活动，限时{time}，要抓紧时间哦！",
      type: "text",
      priority: 2,
      variables: ["product", "discount", "time"]
    },

    // 儿童教育类回复
    {
      categoryCode: "EDU_CHILDREN",
      content: "为小朋友播放儿歌《{song}》，一起来跟着唱吧～ 🎵",
      type: "text",
      priority: 1,
      variables: ["song"]
    },
    {
      categoryCode: "EDU_CHILDREN",
      content: "今天我们来学习{topic}，小朋友要认真听哦！{content}",
      type: "text",
      priority: 1,
      variables: ["topic", "content"]
    },
    {
      categoryCode: "EDU_CHILDREN",
      content: "哇，小朋友真聪明！答对了{count}道题，继续加油～ 🌟",
      type: "text",
      priority: 2,
      variables: ["count"]
    },

    // 健康监测类回复
    {
      categoryCode: "HEALTH_MONITOR",
      content: "提醒：该吃{medicine}了，记得按时服药，保持身体健康～",
      type: "text",
      priority: 1,
      variables: ["medicine"]
    },
    {
      categoryCode: "HEALTH_MONITOR",
      content: "你的{indicator}数据为{value}，{status}，建议{suggestion}",
      type: "text",
      priority: 1,
      variables: ["indicator", "value", "status", "suggestion"]
    },
    {
      categoryCode: "HEALTH_MONITOR",
      content: "距离上次体检已过去{days}天，建议安排体检，关爱身体健康～",
      type: "text",
      priority: 2,
      variables: ["days"]
    },

    // 语音通话类回复
    {
      categoryCode: "SOCIAL_CALL",
      content: "正在为你拨打{contact}的电话，请稍等片刻～",
      type: "action",
      priority: 1,
      variables: ["contact"]
    },
    {
      categoryCode: "SOCIAL_CALL",
      content: "抱歉，{contact}暂时无法接通，是否需要留言或稍后再试？",
      type: "text",
      priority: 2,
      variables: ["contact"]
    }
  ]
}

module.exports = extendedCategoryData