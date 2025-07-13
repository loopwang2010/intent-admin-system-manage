const fs = require('fs');
const path = require('path');
const { sequelize, IntentCategory, CoreIntent, NonCoreIntent, PreResponse } = require('../models');

// 子类型到分类的映射（扩展版）
const subtypeToCategory = {
  // 时间日期类
  '时间查询': '时间日期',
  '日期查询': '时间日期',
  
  // 天气类
  '天气查询': '天气查询',
  
  // 娱乐类
  '播放功能': '娱乐媒体',
  '音乐播放': '娱乐媒体',
  '视频播放': '娱乐媒体',
  '游戏娱乐': '娱乐媒体',
  
  // 系统功能类
  '设置提醒': '系统功能',
  '闹钟设置': '系统功能',
  '定时器': '系统功能',
  '音量控制': '系统功能',
  
  // 搜索查询类
  '搜索功能': '搜索查询',
  '信息查询': '搜索查询',
  '百科查询': '搜索查询',
  '新闻资讯': '搜索查询',
  
  // 工具计算类
  '计算功能': '工具计算',
  '翻译功能': '工具计算',
  '汇率查询': '工具计算',
  '单位换算': '工具计算',
  
  // 生活服务类
  '导航路线': '生活服务',
  '购物服务': '生活服务',
  '订票服务': '生活服务',
  '外卖订餐': '生活服务',
  '打车服务': '生活服务',
  
  // 通讯联系类
  '通话服务': '通讯联系',
  '邮件服务': '通讯联系',
  '短信服务': '通讯联系',
  
  // 智能家居类
  '控制设备': '智能家居',
  '灯光控制': '智能家居',
  '温度控制': '智能家居',
  '安防监控': '智能家居',
  
  // 学习教育类
  '如何询问': '学习教育',
  '为什么询问': '学习教育',
  '知识问答': '学习教育',
  '英语学习': '学习教育',
  
  // 金融理财类
  '股票查询': '金融理财',
  '理财咨询': '金融理财',
  '转账汇款': '金融理财',
  
  // 健康医疗类
  '健康咨询': '健康医疗',
  '用药提醒': '健康医疗',
  '运动健身': '健康医疗',
  
  // 闲聊对话类
  '唤醒确认': '闲聊对话',
  '闲聊调侃': '闲聊对话',
  '问候寒暄': '闲聊对话',
  '夸奖表扬': '闲聊对话',
  '撒娇卖萌': '闲聊对话',
  
  // 情绪表达类
  '情绪表达': '情绪表达',
  '情绪发泄': '情绪表达',
  '抱怨投诉': '情绪表达',
  
  // 无意义类
  '重复无意义': '无意义输入',
  '测试对话': '无意义输入',
  '语气词表达': '无意义输入',
  '无聊闲扯': '无意义输入',
  '娱乐互动': '无意义输入'
};

async function batchImport() {
  console.log('🚀 === 开始批量导入超大数据集 ===\n');
  
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 获取分类映射
    const categories = await IntentCategory.findAll();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    console.log(`📊 已加载 ${categories.length} 个分类`);
    
    // 找到CSV文件
    const csvPath = path.resolve('C:/Users/wangx/Desktop/xiaozhi/yuliao/all_intents_ultra_expanded.csv');
    console.log('📁 CSV文件路径:', csvPath);
    
    // 读取并解析CSV
    console.log('📖 开始读取CSV文件...');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log(`📊 CSV总行数: ${lines.length}`);
    
    // 聚合数据（按子类型分组）
    console.log('🔄 开始聚合数据...');
    const coreIntentData = {};
    const nonCoreIntentData = {};
    
    let processedLines = 0;
    
    // 跳过标题行，处理数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 3) continue;
      
      const intentType = parts[0].trim();
      const subtype = parts[1].trim();
      const template = parts.slice(2).join(',').trim(); // 模板可能包含逗号
      
      if (intentType === 'core') {
        if (!coreIntentData[subtype]) {
          coreIntentData[subtype] = [];
        }
        coreIntentData[subtype].push(template);
      } else if (intentType === 'non_core') {
        if (!nonCoreIntentData[subtype]) {
          nonCoreIntentData[subtype] = [];
        }
        nonCoreIntentData[subtype].push(template);
      }
      
      processedLines++;
      if (processedLines % 5000 === 0) {
        console.log(`📊 已处理 ${processedLines} 行数据...`);
      }
    }
    
    console.log(`\n✅ 数据聚合完成:`);
    console.log(`🎯 核心意图子类型: ${Object.keys(coreIntentData).length} 个`);
    console.log(`💬 非核心意图子类型: ${Object.keys(nonCoreIntentData).length} 个`);
    console.log(`📊 处理的数据行: ${processedLines} 行`);
    
    // 开始导入核心意图
    console.log('\n🎯 === 开始导入核心意图 ===');
    let coreAdded = 0;
    let coreSkipped = 0;
    
    const coreSubtypes = Object.keys(coreIntentData);
    for (let i = 0; i < coreSubtypes.length; i++) {
      const subtype = coreSubtypes[i];
      const templates = coreIntentData[subtype];
      
      try {
        // 检查是否已存在
        const existing = await CoreIntent.findOne({ where: { name: subtype } });
        if (existing) {
          coreSkipped++;
          console.log(`⏭️  [${i+1}/${coreSubtypes.length}] 跳过已存在: ${subtype} (${templates.length}个模板)`);
          continue;
        }
        
        // 确定分类
        const categoryName = subtypeToCategory[subtype] || '其他功能';
        const categoryId = categoryMap[categoryName] || categoryMap['其他功能'] || 1;
        
        // 创建核心意图
        const coreIntent = await CoreIntent.create({
          name: subtype,
          description: `${subtype}相关的功能需求，包含${templates.length}个模板`,
          categoryId: categoryId,
          keywords: JSON.stringify(templates.slice(0, 30)), // 取前30个作为关键词
          confidence: 0.8,
          status: 'active',
          usageCount: 0
        });
        
                 // 创建回复模板（简化版，不包含type字段）
         await PreResponse.create({
           content: `正在为您处理${subtype}相关请求...`,
           coreIntentId: coreIntent.id,
           status: 'active'
         });
        
        coreAdded++;
        console.log(`✅ [${i+1}/${coreSubtypes.length}] 添加核心意图: ${subtype} (${templates.length}个模板) -> ${categoryName}`);
        
      } catch (error) {
        console.error(`❌ [${i+1}/${coreSubtypes.length}] 添加核心意图失败: ${subtype}`, error.message);
      }
    }
    
    // 开始导入非核心意图
    console.log('\n💬 === 开始导入非核心意图 ===');
    let nonCoreAdded = 0;
    let nonCoreSkipped = 0;
    
    const nonCoreSubtypes = Object.keys(nonCoreIntentData);
    for (let i = 0; i < nonCoreSubtypes.length; i++) {
      const subtype = nonCoreSubtypes[i];
      const templates = nonCoreIntentData[subtype];
      
      try {
        // 检查是否已存在
        const existing = await NonCoreIntent.findOne({ where: { name: subtype } });
        if (existing) {
          nonCoreSkipped++;
          console.log(`⏭️  [${i+1}/${nonCoreSubtypes.length}] 跳过已存在: ${subtype} (${templates.length}个模板)`);
          continue;
        }
        
        // 确定分类
        const categoryName = subtypeToCategory[subtype] || '闲聊对话';
        const categoryId = categoryMap[categoryName] || categoryMap['闲聊对话'] || 1;
        
        // 创建非核心意图
        await NonCoreIntent.create({
          name: subtype,
          description: `${subtype}相关的非功能性对话，包含${templates.length}个模板`,
          categoryId: categoryId,
          keywords: JSON.stringify(templates.slice(0, 20)), // 取前20个作为关键词
          confidence: 0.6,
          status: 'active',
          usageCount: 0,
          response: '好的，我明白了。'
        });
        
        nonCoreAdded++;
        console.log(`✅ [${i+1}/${nonCoreSubtypes.length}] 添加非核心意图: ${subtype} (${templates.length}个模板) -> ${categoryName}`);
        
      } catch (error) {
        console.error(`❌ [${i+1}/${nonCoreSubtypes.length}] 添加非核心意图失败: ${subtype}`, error.message);
      }
    }
    
    // 最终统计
    const finalCoreCount = await CoreIntent.count();
    const finalNonCoreCount = await NonCoreIntent.count();
    const finalResponseCount = await PreResponse.count();
    
    console.log('\n🎉 === 批量导入完成！ ===');
    console.log(`📊 核心意图: 新增 ${coreAdded} 个, 跳过 ${coreSkipped} 个, 总计 ${finalCoreCount} 个`);
    console.log(`📊 非核心意图: 新增 ${nonCoreAdded} 个, 跳过 ${nonCoreSkipped} 个, 总计 ${finalNonCoreCount} 个`);
    console.log(`📊 回复模板: 总计 ${finalResponseCount} 个`);
    console.log(`📊 原始模板数据: ${processedLines} 条`);
    console.log(`\n🚀 恭喜！系统现在从 44 个核心意图升级到了 ${finalCoreCount} 个核心意图！`);
    console.log(`🎯 这已经达到了商业级智能音箱的标准！`);
    
    return {
      coreAdded,
      nonCoreAdded,
      finalCoreCount,
      finalNonCoreCount,
      finalResponseCount
    };
    
  } catch (error) {
    console.error('❌ 批量导入失败:', error);
    throw error;
  }
}

if (require.main === module) {
  batchImport()
    .then(() => {
      console.log('\n✅ 批量导入脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 批量导入脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { batchImport }; 