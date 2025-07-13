const fs = require('fs');
const path = require('path');

// 直接引入数据库配置
const { Sequelize } = require('sequelize');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/intent_admin.db',
  logging: false
});

// 定义NonCoreIntent模型
const NonCoreIntent = sequelize.define('NonCoreIntent', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  response: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  tableName: 'non_core_intents',
  timestamps: true
});

async function importCasualResponses() {
  console.log('🚀 导入首句回复模板\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    const csvPath = path.resolve('../../casual_response_templates.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ casual_response_templates.csv 文件未找到');
      console.log('当前目录:', __dirname);
      console.log('查找路径:', csvPath);
      return;
    }
    
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log(`📊 找到 ${lines.length - 1} 条随意回复模板`);
    
    // 按分类整理回复模板
    const categoryResponses = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 处理CSV解析，考虑可能有引号包围的字段
      const match = line.match(/^([^,]+),\s*"?([^"]+)"?/);
      if (match) {
        const category = match[1].trim();
        const response = match[2].trim();
        
        if (!categoryResponses[category]) {
          categoryResponses[category] = [];
        }
        categoryResponses[category].push(response);
      }
    }
    
    console.log('\n📊 分类统计:');
    Object.entries(categoryResponses).forEach(([category, responses]) => {
      console.log(`  - ${category}: ${responses.length} 条回复`);
    });
    
    // 为每个分类的非核心意图设置首句回复
    let updatedCount = 0;
    
    for (const [category, responses] of Object.entries(categoryResponses)) {
      try {
        const intent = await NonCoreIntent.findOne({ where: { name: category } });
        
        if (intent) {
          // 随机选择一个回复作为首句回复
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          await intent.update({
            response: randomResponse
          });
          
          console.log(`✅ 更新 ${category}: ${randomResponse}`);
          updatedCount++;
        } else {
          console.log(`⚠️  未找到对应的非核心意图: ${category}`);
        }
      } catch (error) {
        console.log(`❌ 更新失败 [${category}]: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 成功更新 ${updatedCount} 个非核心意图的首句回复`);
    
    // 保存完整的回复模板数据
    const templateFilePath = path.resolve('./data/casual_response_templates.json');
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync(templateFilePath, JSON.stringify(categoryResponses, null, 2), 'utf8');
    console.log(`📁 完整回复模板保存至: ${templateFilePath}`);
    
    // 生成简单报告
    const allIntents = await NonCoreIntent.findAll({ attributes: ['name', 'response'] });
    const withResponse = allIntents.filter(intent => intent.response && intent.response.trim());
    const withoutResponse = allIntents.filter(intent => !intent.response || !intent.response.trim());
    
    console.log('\n📈 导入统计:');
    console.log(`  - 总非核心意图: ${allIntents.length} 个`);
    console.log(`  - 已配置回复: ${withResponse.length} 个`);
    console.log(`  - 未配置回复: ${withoutResponse.length} 个`);
    console.log(`  - 覆盖率: ${Math.round((withResponse.length / allIntents.length) * 100)}%`);
    
    if (withoutResponse.length > 0) {
      console.log('\n⚠️  尚未配置回复的意图:');
      withoutResponse.slice(0, 5).forEach(intent => {
        console.log(`    - ${intent.name}`);
      });
    }
    
    console.log('\n✨ 已配置回复的意图示例:');
    withResponse.slice(0, 5).forEach(intent => {
      console.log(`    - ${intent.name}: "${intent.response.substring(0, 50)}${intent.response.length > 50 ? '...' : ''}"`);
    });
    
    console.log('\n🎉 首句回复导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行导入
importCasualResponses(); 