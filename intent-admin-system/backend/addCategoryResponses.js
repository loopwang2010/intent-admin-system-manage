const { sequelize, IntentCategory, CoreIntent, NonCoreIntent, PreResponse } = require('./src/models')

// 为每个二级分类定义默认回复内容
const categoryResponses = {
  'ENT_VIDEO': [
    '正在为您播放视频内容...',
    '视频已暂停播放',
    '正在切换到下一个视频',
    '视频音量已调整',
    '正在为您搜索相关视频'
  ],
  'ENT_GAME': [
    '游戏模式已启动！',
    '让我们开始这个有趣的游戏吧',
    '游戏结束，您的表现很棒！',
    '要不要来个更有挑战性的游戏？',
    '恭喜您获得了新的游戏成就！'
  ],
  'LIFE_TRANSPORT': [
    '正在为您查询路线信息...',
    '当前路况良好，预计用时{duration}分钟',
    '建议您选择{route}路线，避开拥堵',
    '附近有地铁站距离您{distance}米',
    '已为您叫车，司机大约{time}分钟后到达'
  ],
  'LIFE_FOOD': [
    '为您推荐附近的{cuisine}餐厅',
    '这家餐厅的{dish}很受欢迎哦',
    '正在为您查询菜谱信息...',
    '建议您尝试{restaurant}，评分很高',
    '已为您预订餐厅，请记得按时到达'
  ],
  'INFO_ENCYCLOPEDIA': [
    '根据您的问题，我来为您解答...',
    '这是一个很有趣的知识点呢',
    '让我查询一下相关的百科信息',
    '您想了解的{topic}确实很有学问',
    '希望这个解答对您有帮助'
  ],
  'INFO_TRANSLATE': [
    '正在为您翻译中...',
    '翻译结果：{result}',
    '这句话的{language}是：{translation}',
    '您想翻译的内容我理解了',
    '已为您完成翻译，请查看结果'
  ],
  'CTRL_DEVICE': [
    '设备已成功连接',
    '正在为您控制{device}...',
    '{device}已按您的要求调整',
    '设备状态已更新',
    '所有设备运行正常'
  ],
  'CTRL_SYSTEM': [
    '系统设置已更新',
    '正在为您调整系统配置...',
    '设置已保存，重启后生效',
    '系统优化完成',
    '您的偏好设置已记录'
  ]
}

async function addCategoryResponses() {
  try {
    console.log('🚀 开始为二级分类添加回复内容...')
    
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    let totalAdded = 0

    for (const [categoryCode, responses] of Object.entries(categoryResponses)) {
      console.log(`\\n📁 处理分类: ${categoryCode}`)
      
      // 查找对应的分类
      const category = await IntentCategory.findOne({
        where: { code: categoryCode, level: 2 }
      })

      if (!category) {
        console.log(`  ❌ 未找到分类: ${categoryCode}`)
        continue
      }

      console.log(`  ✅ 找到分类: ${category.name}`)

      // 检查是否已有非核心意图，如果没有就创建一个
      let nonCoreIntent = await NonCoreIntent.findOne({
        where: { categoryId: category.id }
      })

      if (!nonCoreIntent) {
        console.log(`  📝 为分类创建默认非核心意图...`)
        nonCoreIntent = await NonCoreIntent.create({
          name: `${category.name}默认回复`,
          description: `${category.name}分类的默认回复意图`,
          categoryId: category.id,
          keywords: JSON.stringify([category.name, '默认', '回复']),
          confidence: 0.8,
          priority: 1,
          status: 'active',
          language: 'zh-CN',
          version: '1.0.0'
        })
        console.log(`  ✅ 创建意图: ${nonCoreIntent.name}`)
      }

      // 为每个回复内容创建记录
      for (let i = 0; i < responses.length; i++) {
        const content = responses[i]
        
        // 检查是否已存在相同内容
        const existing = await PreResponse.findOne({
          where: {
            nonCoreIntentId: nonCoreIntent.id,
            content: content
          }
        })

        if (existing) {
          console.log(`  ⏭️  回复已存在: ${content.substring(0, 30)}...`)
          continue
        }

        // 创建回复记录
        await PreResponse.create({
          nonCoreIntentId: nonCoreIntent.id,
          content: content,
          type: 'text',
          priority: i + 1,
          status: 'active',
          language: 'zh-CN',
          version: '1.0.0'
        })

        totalAdded++
        console.log(`  ✅ 添加回复 ${i + 1}: ${content}`)
      }
    }

    // 统计结果
    console.log(`\\n🎯 回复内容添加完成！`)
    console.log(`  - 本次添加: ${totalAdded} 条回复`)
    
    // 验证数据
    const totalResponses = await PreResponse.count()
    console.log(`  - 数据库总计: ${totalResponses} 条回复`)

    // 按分类统计
    console.log(`\\n📊 各分类回复统计:`)
    const categories = await IntentCategory.findAll({
      where: { level: 2 },
      order: [['name', 'ASC']]
    })

    for (const category of categories) {
      const responseCount = await PreResponse.count({
        include: [
          {
            model: NonCoreIntent,
            where: { categoryId: category.id },
            required: true
          }
        ]
      })
      
      const coreResponseCount = await PreResponse.count({
        include: [
          {
            model: CoreIntent,
            where: { categoryId: category.id },
            required: true
          }
        ]
      })

      const total = responseCount + coreResponseCount
      console.log(`  - ${category.name}: ${total} 条回复`)
    }

    return {
      added: totalAdded,
      total: totalResponses
    }

  } catch (error) {
    console.error('❌ 添加回复内容失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addCategoryResponses()
    .then((result) => {
      console.log(`\\n🎉 完成！添加了 ${result.added} 条回复，数据库总计 ${result.total} 条回复`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('执行失败:', error)
      process.exit(1)
    })
}

module.exports = addCategoryResponses