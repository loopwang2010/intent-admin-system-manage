const db = require('./src/models');

async function createHierarchicalCategories() {
  try {
    console.log('开始创建层级分类体系...');
    
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 备份现有分类数据
    const existingCategories = await db.IntentCategory.findAll();
    console.log(`现有分类: ${existingCategories.length} 个`);

    // 更新现有分类为二级分类，并设置相应属性
    console.log('\n更新现有分类...');
    await db.sequelize.query(`
      UPDATE intent_categories SET 
        level = 2,
        isLeaf = 1,
        code = CASE 
          WHEN name = '音乐控制' THEN 'ENT_MUSIC'
          WHEN name = '天气查询' THEN 'LIFE_WEATHER'  
          WHEN name = '智能家居' THEN 'CTRL_SMARTHOME'
          WHEN name = '时间日期' THEN 'INFO_TIME'
          WHEN name = '新闻资讯' THEN 'INFO_NEWS'
        END,
        color = CASE
          WHEN name = '音乐控制' THEN '#FF6B6B'
          WHEN name = '天气查询' THEN '#4ECDC4'
          WHEN name = '智能家居' THEN '#45B7D1'
          WHEN name = '时间日期' THEN '#96CEB4'
          WHEN name = '新闻资讯' THEN '#FECA57'
        END
      WHERE id IN (1, 2, 3, 4, 5);
    `);

    // 定义一级分类数据
    const primaryCategories = [
      {
        name: '娱乐休闲',
        nameEn: 'Entertainment',
        description: '音乐、视频、游戏等娱乐功能',
        descriptionEn: 'Music, video, gaming and entertainment features',
        icon: 'game-icons',
        code: 'ENT',
        level: 1,
        isLeaf: 0,
        color: '#FF6B6B',
        sortOrder: 1
      },
      {
        name: '生活服务',
        nameEn: 'Life Services',
        description: '天气、交通、美食等生活服务',
        descriptionEn: 'Weather, transportation, food and life services',
        icon: 'service',
        code: 'LIFE',
        level: 1,
        isLeaf: 0,
        color: '#4ECDC4',
        sortOrder: 2
      },
      {
        name: '信息查询',
        nameEn: 'Information Query',
        description: '新闻、百科、搜索等信息查询',
        descriptionEn: 'News, encyclopedia, search and information query',
        icon: 'search',
        code: 'INFO',
        level: 1,
        isLeaf: 0,
        color: '#FECA57',
        sortOrder: 3
      },
      {
        name: '智能控制',
        nameEn: 'Smart Control',
        description: '智能家居、设备控制等',
        descriptionEn: 'Smart home, device control and automation',
        icon: 'control',
        code: 'CTRL',
        level: 1,
        isLeaf: 0,
        color: '#45B7D1',
        sortOrder: 4
      },
      {
        name: '社交互动',
        nameEn: 'Social Interaction',
        description: '通话、消息、社交分享等',
        descriptionEn: 'Calls, messages, social sharing and interaction',
        icon: 'social',
        code: 'SOCIAL',
        level: 1,
        isLeaf: 0,
        color: '#A78BFA',
        sortOrder: 5
      },
      {
        name: '学习教育',
        nameEn: 'Education',
        description: '儿童教育、语言学习等',
        descriptionEn: 'Children education, language learning and training',
        icon: 'education',
        code: 'EDU',
        level: 1,
        isLeaf: 0,
        color: '#10B981',
        sortOrder: 6
      },
      {
        name: '健康运动',
        nameEn: 'Health & Sports',
        description: '健康监测、运动健身等',
        descriptionEn: 'Health monitoring, sports and fitness',
        icon: 'health',
        code: 'HEALTH',
        level: 1,
        isLeaf: 0,
        color: '#F59E0B',
        sortOrder: 7
      },
      {
        name: '商务办公',
        nameEn: 'Business & Office',
        description: '日程管理、会议助手等',
        descriptionEn: 'Schedule management, meeting assistant and office tools',
        icon: 'business',
        code: 'BIZ',
        level: 1,
        isLeaf: 0,
        color: '#6366F1',
        sortOrder: 8
      }
    ];

    // 插入一级分类
    console.log('\n创建一级分类...');
    const createdPrimaryCategories = [];
    for (const category of primaryCategories) {
      const created = await db.IntentCategory.create(category);
      createdPrimaryCategories.push(created);
      console.log(`✅ 创建一级分类: ${category.name} (${category.code})`);
    }

    // 定义二级分类数据
    const secondaryCategories = [
      // 娱乐休闲子分类
      {
        name: '视频娱乐',
        nameEn: 'Video Entertainment',
        description: '视频播放、电影、电视节目等',
        icon: 'video',
        code: 'ENT_VIDEO',
        parentCode: 'ENT',
        color: '#FF8E8E'
      },
      {
        name: '游戏互动',
        nameEn: 'Gaming',
        description: '语音游戏、互动娱乐等',
        icon: 'game',
        code: 'ENT_GAME',
        parentCode: 'ENT',
        color: '#FF9999'
      },
      {
        name: '故事相声',
        nameEn: 'Stories & Comedy',
        description: '故事、相声、段子等',
        icon: 'story',
        code: 'ENT_STORY',
        parentCode: 'ENT',
        color: '#FFA4A4'
      },
      
      // 生活服务子分类
      {
        name: '交通出行',
        nameEn: 'Transportation',
        description: '路况、导航、公交等',
        icon: 'car',
        code: 'LIFE_TRANSPORT',
        parentCode: 'LIFE',
        color: '#6FD5D1'
      },
      {
        name: '美食餐饮',
        nameEn: 'Food & Dining',
        description: '菜谱、餐厅推荐等',
        icon: 'food',
        code: 'LIFE_FOOD',
        parentCode: 'LIFE',
        color: '#7EDDD9'
      },
      {
        name: '购物消费',
        nameEn: 'Shopping',
        description: '购物、比价、优惠等',
        icon: 'shopping',
        code: 'LIFE_SHOPPING',
        parentCode: 'LIFE',
        color: '#8DE5E1'
      },
      
      // 信息查询子分类
      {
        name: '百科知识',
        nameEn: 'Encyclopedia',
        description: '百科、知识问答等',
        icon: 'book',
        code: 'INFO_ENCYCLOPEDIA',
        parentCode: 'INFO',
        color: '#FED970'
      },
      {
        name: '翻译服务',
        nameEn: 'Translation',
        description: '多语言翻译服务',
        icon: 'translate',
        code: 'INFO_TRANSLATE',
        parentCode: 'INFO',
        color: '#FEDC82'
      },
      {
        name: '计算服务',
        nameEn: 'Calculation',
        description: '数学计算、单位转换等',
        icon: 'calculator',
        code: 'INFO_CALC',
        parentCode: 'INFO',
        color: '#FEDF94'
      },
      
      // 智能控制子分类
      {
        name: '设备控制',
        nameEn: 'Device Control',
        description: '音响、设备控制等',
        icon: 'device',
        code: 'CTRL_DEVICE',
        parentCode: 'CTRL',
        color: '#6BC5E3'
      },
      {
        name: '系统设置',
        nameEn: 'System Settings',
        description: '音量、模式等系统设置',
        icon: 'settings',
        code: 'CTRL_SYSTEM',
        parentCode: 'CTRL',
        color: '#7DCCE7'
      },
      
      // 社交互动子分类
      {
        name: '语音通话',
        nameEn: 'Voice Call',
        description: '拨打电话、视频通话等',
        icon: 'phone',
        code: 'SOCIAL_CALL',
        parentCode: 'SOCIAL',
        color: '#BBA7FB'
      },
      {
        name: '消息提醒',
        nameEn: 'Message Reminder',
        description: '短信、提醒、备忘等',
        icon: 'message',
        code: 'SOCIAL_MESSAGE',
        parentCode: 'SOCIAL',
        color: '#C5B3FC'
      },
      
      // 学习教育子分类
      {
        name: '儿童教育',
        nameEn: 'Children Education',
        description: '儿歌、故事、知识启蒙等',
        icon: 'child',
        code: 'EDU_CHILDREN',
        parentCode: 'EDU',
        color: '#34D399'
      },
      {
        name: '语言学习',
        nameEn: 'Language Learning',
        description: '英语学习、发音练习等',
        icon: 'language',
        code: 'EDU_LANGUAGE',
        parentCode: 'EDU',
        color: '#4ADE80'
      },
      
      // 健康运动子分类
      {
        name: '健康监测',
        nameEn: 'Health Monitoring',
        description: '健康提醒、身体监测等',
        icon: 'heart',
        code: 'HEALTH_MONITOR',
        parentCode: 'HEALTH',
        color: '#FBB040'
      },
      {
        name: '运动健身',
        nameEn: 'Sports & Fitness',
        description: '运动指导、健身计划等',
        icon: 'sport',
        code: 'HEALTH_FITNESS',
        parentCode: 'HEALTH',
        color: '#FCC252'
      },
      
      // 商务办公子分类
      {
        name: '日程管理',
        nameEn: 'Schedule Management',
        description: '日程安排、会议提醒等',
        icon: 'calendar',
        code: 'BIZ_SCHEDULE',
        parentCode: 'BIZ',
        color: '#7C83F4'
      },
      {
        name: '会议助手',
        nameEn: 'Meeting Assistant',
        description: '会议记录、会议提醒等',
        icon: 'meeting',
        code: 'BIZ_MEETING',
        parentCode: 'BIZ',
        color: '#8B92F7'
      }
    ];

    // 创建父分类ID映射
    const primaryCategoryMap = {};
    createdPrimaryCategories.forEach(cat => {
      primaryCategoryMap[cat.code] = cat.id;
    });
    
    console.log('一级分类ID映射:', primaryCategoryMap);

    // 插入二级分类
    console.log('\n创建二级分类...');
    const createdSecondaryCategories = [];
    for (const category of secondaryCategories) {
      const parentId = primaryCategoryMap[category.parentCode];
      
      if (!parentId) {
        console.error(`❌ 找不到父分类 ${category.parentCode} 的ID`);
        continue;
      }
      
      const categoryData = {
        ...category,
        parentId,
        level: 2,
        isLeaf: 1,
        childrenCount: 0,
        sortOrder: createdSecondaryCategories.length + 1
      };
      delete categoryData.parentCode;

      const created = await db.IntentCategory.create(categoryData);
      createdSecondaryCategories.push(created);
      console.log(`✅ 创建二级分类: ${category.name} (${category.code}) -> 父分类ID: ${parentId}`);
    }

    // 设置现有分类的父分类
    console.log('\n设置现有分类的父分类关系...');
    const categoryMappings = [
      { id: 1, parentCode: 'ENT' },    // 音乐控制 -> 娱乐休闲
      { id: 2, parentCode: 'LIFE' },   // 天气查询 -> 生活服务
      { id: 3, parentCode: 'CTRL' },   // 智能家居 -> 智能控制
      { id: 4, parentCode: 'INFO' },   // 时间日期 -> 信息查询
      { id: 5, parentCode: 'INFO' }    // 新闻资讯 -> 信息查询
    ];

    for (const mapping of categoryMappings) {
      const parentId = primaryCategoryMap[mapping.parentCode];
      await db.sequelize.query(
        'UPDATE intent_categories SET parentId = ? WHERE id = ?',
        { replacements: [parentId, mapping.id] }
      );
      console.log(`✅ 设置分类 ${mapping.id} 的父分类为 ${parentId} (${mapping.parentCode})`);
    }

    // 更新一级分类的子分类计数
    console.log('\n更新一级分类的子分类计数...');
    for (const primaryCategory of createdPrimaryCategories) {
      const [result] = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM intent_categories WHERE parentId = ?',
        { replacements: [primaryCategory.id] }
      );
      const childrenCount = result[0].count;
      
      await db.IntentCategory.update(
        { childrenCount },
        { where: { id: primaryCategory.id } }
      );
      console.log(`✅ 更新 ${primaryCategory.name} 的子分类数量: ${childrenCount}`);
    }

    // 统计最终结果
    const [totalResult] = await db.sequelize.query(
      'SELECT level, COUNT(*) as count FROM intent_categories GROUP BY level ORDER BY level'
    );
    
    console.log('\n========== 分类创建完成 ==========');
    totalResult.forEach(row => {
      const levelName = row.level === 1 ? '一级分类' : '二级分类';
      console.log(`${levelName}: ${row.count} 个`);
    });

    // 显示分类树结构
    console.log('\n========== 分类树结构 ==========');
    const [treeResult] = await db.sequelize.query(`
      SELECT 
        p.name as parent_name,
        p.code as parent_code,
        GROUP_CONCAT(c.name, ' | ') as children_names
      FROM intent_categories p
      LEFT JOIN intent_categories c ON p.id = c.parentId
      WHERE p.level = 1
      GROUP BY p.id, p.name, p.code
      ORDER BY p.sortOrder
    `);

    treeResult.forEach(row => {
      console.log(`📁 ${row.parent_name} (${row.parent_code})`);
      if (row.children_names) {
        const children = row.children_names.split(' | ');
        children.forEach(child => {
          console.log(`   └── ${child}`);
        });
      }
    });

    return {
      primaryCategories: createdPrimaryCategories.length,
      secondaryCategories: createdSecondaryCategories.length,
      totalCategories: createdPrimaryCategories.length + createdSecondaryCategories.length + 5
    };

  } catch (error) {
    console.error('创建分类体系失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createHierarchicalCategories()
    .then((result) => {
      console.log(`\n🎉 分类体系创建完成！一级分类 ${result.primaryCategories} 个，二级分类 ${result.secondaryCategories} 个，总计 ${result.totalCategories} 个分类`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('创建失败:', error);
      process.exit(1);
    });
}

module.exports = createHierarchicalCategories;