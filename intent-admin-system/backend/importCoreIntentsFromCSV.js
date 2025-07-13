const fs = require('fs');
const csv = require('csv-parser');
const db = require('./src/models');

async function importCoreIntentsFromCSV() {
  try {
    console.log('开始从CSV文件导入核心意图数据...');
    
    // 确保数据库连接
    await db.sequelize.authenticate();
    console.log('数据库连接成功');

    // 读取现有的核心意图，避免重复
    const existingIntents = await db.CoreIntent.findAll({
      attributes: ['name', 'id']
    });
    const existingNames = new Set(existingIntents.map(intent => intent.name));
    console.log(`现有核心意图数量: ${existingNames.size}`);

    // 创建意图分类映射
    const categoryMapping = {
      '时间查询': 1, // 基础功能
      '日期查询': 1, // 基础功能  
      '天气查询': 2, // 信息查询
      '音乐功能': 3, // 娱乐互动
      '播放功能': 3, // 娱乐互动
      '计算功能': 4, // 工具类
      '搜索功能': 2, // 信息查询
      '智能家居': 5, // 智能家居
      '设备控制': 5, // 智能家居
      '闹钟提醒': 6, // 提醒服务
      '定时器': 6,   // 提醒服务
      '语音通话': 7, // 通讯服务
      '消息发送': 7, // 通讯服务
      '新闻资讯': 8, // 新闻资讯
      '学习教育': 9, // 学习教育
      '生活服务': 10 // 生活服务
    };

    const coreIntentsToImport = [];
    const csvFilePath = '/Users/admin/work/zmt-server-yuliao/前置回答语料.csv';

    return new Promise((resolve, reject) => {
      const subtypeGroups = new Map();

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          if (row.intent_type === 'core' && row.subtype && row.template) {
            const subtype = row.subtype.trim();
            const template = row.template.trim();
            
            if (!subtypeGroups.has(subtype)) {
              subtypeGroups.set(subtype, {
                subtype: subtype,
                templates: new Set(),
                keywords: new Set(),
                preResponses: new Set(),
                count: 0
              });
            }
            
            const group = subtypeGroups.get(subtype);
            group.templates.add(template);
            group.count++;
            
            // 收集关键词（从template中提取）
            if (template.length <= 10) { // 短的template可能是关键词
              group.keywords.add(template);
            }
            
            // 收集前置回答
            if (row.pre_response && row.pre_response.trim()) {
              group.preResponses.add(row.pre_response.trim());
            }
          }
        })
        .on('end', async () => {
          try {
            console.log(`\n发现 ${subtypeGroups.size} 个不同的核心意图类型`);
            
            // 转换为要导入的核心意图数组
            for (const [subtype, data] of subtypeGroups) {
              if (existingNames.has(subtype)) {
                console.log(`跳过已存在的意图: ${subtype}`);
                continue;
              }

              // 确定分类ID
              let categoryId = 1; // 默认为基础功能
              for (const [key, id] of Object.entries(categoryMapping)) {
                if (subtype.includes(key)) {
                  categoryId = id;
                  break;
                }
              }

              // 生成关键词数组
              const keywords = Array.from(data.keywords).slice(0, 10); // 最多10个关键词
              if (keywords.length === 0) {
                keywords.push(subtype); // 至少包含意图名称作为关键词
              }

              // 选择最常见的前置回答
              const preResponse = data.preResponses.size > 0 ? 
                Array.from(data.preResponses)[0] : 
                `好的，正在为您${subtype}。`;

              const intentData = {
                name: subtype,
                description: `${subtype}相关功能，包含${data.count}个训练样本`,
                categoryId: categoryId,
                keywords: keywords.join(','), // 转换为逗号分隔的字符串
                confidence: 0.8,
                priority: Math.min(Math.max(Math.floor(data.count / 100), 1), 10),
                status: 'active',
                usageCount: 0
              };

              coreIntentsToImport.push(intentData);
            }

            console.log(`\n准备导入 ${coreIntentsToImport.length} 个新的核心意图`);

            // 批量导入到数据库
            if (coreIntentsToImport.length > 0) {
              await db.CoreIntent.bulkCreate(coreIntentsToImport, {
                validate: true,
                ignoreDuplicates: true
              });

              console.log(`✅ 成功导入 ${coreIntentsToImport.length} 个核心意图`);
              
              // 显示前10个导入的意图
              console.log('\n前10个导入的核心意图:');
              coreIntentsToImport.slice(0, 10).forEach((intent, index) => {
                console.log(`${index + 1}. ${intent.name} (分类ID: ${intent.categoryId}, 关键词: ${intent.keywords.join(', ')})`);
              });
            }

            // 最终统计
            const finalCount = await db.CoreIntent.count();
            console.log(`\n🎉 导入完成！数据库中现有核心意图总数: ${finalCount}`);
            
            resolve();
          } catch (error) {
            console.error('导入过程中出错:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('读取CSV文件出错:', error);
          reject(error);
        });
    });

  } catch (error) {
    console.error('导入核心意图失败:', error);
    throw error;
  }
}

// 执行导入
if (require.main === module) {
  importCoreIntentsFromCSV()
    .then(() => {
      console.log('核心意图导入完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('导入失败:', error);
      process.exit(1);
    })
    .finally(() => {
      // 不在这里关闭连接，让进程自然退出
      setTimeout(() => process.exit(0), 1000);
    });
}

module.exports = importCoreIntentsFromCSV;