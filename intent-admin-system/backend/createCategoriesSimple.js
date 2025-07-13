const db = require('./src/models');

async function createCategoriesSimple() {
  try {
    console.log('开始创建层级分类体系...');
    
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 清理之前的创建
    await db.sequelize.query('DELETE FROM intent_categories WHERE id > 5');
    console.log('清理完成');

    // 更新现有分类为二级分类
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

    // 直接用SQL创建一级分类
    const primaryCategories = [
      { name: '娱乐休闲', nameEn: 'Entertainment', code: 'ENT', color: '#FF6B6B', icon: 'game-icons' },
      { name: '生活服务', nameEn: 'Life Services', code: 'LIFE', color: '#4ECDC4', icon: 'service' },
      { name: '信息查询', nameEn: 'Information Query', code: 'INFO', color: '#FECA57', icon: 'search' },
      { name: '智能控制', nameEn: 'Smart Control', code: 'CTRL', color: '#45B7D1', icon: 'control' },
      { name: '社交互动', nameEn: 'Social Interaction', code: 'SOCIAL', color: '#A78BFA', icon: 'social' },
      { name: '学习教育', nameEn: 'Education', code: 'EDU', color: '#10B981', icon: 'education' },
      { name: '健康运动', nameEn: 'Health & Sports', code: 'HEALTH', color: '#F59E0B', icon: 'health' },
      { name: '商务办公', nameEn: 'Business & Office', code: 'BIZ', color: '#6366F1', icon: 'business' }
    ];

    console.log('\n创建一级分类...');
    const createdIds = [];
    
    for (let i = 0; i < primaryCategories.length; i++) {
      const category = primaryCategories[i];
      const [result] = await db.sequelize.query(`
        INSERT INTO intent_categories 
        (name, nameEn, description, icon, code, level, isLeaf, childrenCount, color, sortOrder, status, version, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?, 'active', '1.0.0', datetime('now'), datetime('now'))
      `, {
        replacements: [
          category.name,
          category.nameEn,
          `${category.name}相关功能`,
          category.icon,
          category.code,
          category.color,
          i + 1
        ]
      });
      
      // 获取刚插入的ID
      const [idResult] = await db.sequelize.query('SELECT last_insert_rowid() as id');
      const newId = idResult[0].id;
      createdIds.push({ code: category.code, id: newId });
      
      console.log(`✅ 创建一级分类: ${category.name} (${category.code}) ID: ${newId}`);
    }

    // 设置现有分类的父分类关系
    console.log('\n设置现有分类的父分类关系...');
    const codeToId = {};
    createdIds.forEach(item => {
      codeToId[item.code] = item.id;
    });

    const categoryMappings = [
      { id: 1, parentCode: 'ENT' },    // 音乐控制 -> 娱乐休闲
      { id: 2, parentCode: 'LIFE' },   // 天气查询 -> 生活服务
      { id: 3, parentCode: 'CTRL' },   // 智能家居 -> 智能控制
      { id: 4, parentCode: 'INFO' },   // 时间日期 -> 信息查询
      { id: 5, parentCode: 'INFO' }    // 新闻资讯 -> 信息查询
    ];

    for (const mapping of categoryMappings) {
      const parentId = codeToId[mapping.parentCode];
      await db.sequelize.query(
        'UPDATE intent_categories SET parentId = ? WHERE id = ?',
        { replacements: [parentId, mapping.id] }
      );
      console.log(`✅ 设置分类 ${mapping.id} 的父分类为 ${parentId} (${mapping.parentCode})`);
    }

    // 创建一些重要的二级分类
    const importantSecondaryCategories = [
      { name: '视频娱乐', code: 'ENT_VIDEO', parentCode: 'ENT', color: '#FF8E8E' },
      { name: '游戏互动', code: 'ENT_GAME', parentCode: 'ENT', color: '#FF9999' },
      { name: '交通出行', code: 'LIFE_TRANSPORT', parentCode: 'LIFE', color: '#6FD5D1' },
      { name: '美食餐饮', code: 'LIFE_FOOD', parentCode: 'LIFE', color: '#7EDDD9' },
      { name: '百科知识', code: 'INFO_ENCYCLOPEDIA', parentCode: 'INFO', color: '#FED970' },
      { name: '翻译服务', code: 'INFO_TRANSLATE', parentCode: 'INFO', color: '#FEDC82' },
      { name: '设备控制', code: 'CTRL_DEVICE', parentCode: 'CTRL', color: '#6BC5E3' },
      { name: '系统设置', code: 'CTRL_SYSTEM', parentCode: 'CTRL', color: '#7DCCE7' }
    ];

    console.log('\n创建重要的二级分类...');
    for (let i = 0; i < importantSecondaryCategories.length; i++) {
      const category = importantSecondaryCategories[i];
      const parentId = codeToId[category.parentCode];
      
      await db.sequelize.query(`
        INSERT INTO intent_categories 
        (name, nameEn, description, icon, code, level, isLeaf, childrenCount, color, parentId, sortOrder, status, version, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 2, 1, 0, ?, ?, ?, 'active', '1.0.0', datetime('now'), datetime('now'))
      `, {
        replacements: [
          category.name,
          category.name,
          `${category.name}相关功能`,
          'folder',
          category.code,
          category.color,
          parentId,
          i + 1
        ]
      });
      
      console.log(`✅ 创建二级分类: ${category.name} (${category.code}) -> 父分类: ${category.parentCode}`);
    }

    // 更新一级分类的子分类计数
    console.log('\n更新一级分类的子分类计数...');
    await db.sequelize.query(`
      UPDATE intent_categories 
      SET childrenCount = (
        SELECT COUNT(*) FROM intent_categories child 
        WHERE child.parentId = intent_categories.id
      )
      WHERE level = 1
    `);

    // 统计最终结果
    const [totalResult] = await db.sequelize.query(
      'SELECT level, COUNT(*) as count FROM intent_categories GROUP BY level ORDER BY level'
    );
    
    console.log('\n========== 分类创建完成 ==========');
    totalResult.forEach(row => {
      const levelName = row.level === 1 ? '一级分类' : '二级分类';
      console.log(`${levelName}: ${row.count} 个`);
    });

    // 显示分类树结构预览
    const [treeResult] = await db.sequelize.query(`
      SELECT 
        p.name as parent_name,
        p.code as parent_code,
        p.childrenCount,
        COUNT(c.id) as actual_children
      FROM intent_categories p
      LEFT JOIN intent_categories c ON p.id = c.parentId
      WHERE p.level = 1
      GROUP BY p.id, p.name, p.code, p.childrenCount
      ORDER BY p.sortOrder
    `);

    console.log('\n========== 分类结构预览 ==========');
    treeResult.forEach(row => {
      console.log(`📁 ${row.parent_name} (${row.parent_code}) - ${row.actual_children} 个子分类`);
    });

    return { success: true };

  } catch (error) {
    console.error('创建分类体系失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createCategoriesSimple()
    .then(() => {
      console.log('\n🎉 分类体系创建完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('创建失败:', error);
      process.exit(1);
    });
}

module.exports = createCategoriesSimple;