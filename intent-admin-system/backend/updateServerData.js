const fs = require('fs');

// 读取生成的扩展数据
const extendedCoreIntents = JSON.parse(fs.readFileSync('extended_core_intents.json', 'utf8'));
const extendedResponses = JSON.parse(fs.readFileSync('extended_responses.json', 'utf8'));

console.log('📖 读取数据：');
console.log(`  核心意图: ${extendedCoreIntents.length} 个`);
console.log(`  回复模板: ${extendedResponses.length} 个`);

// 读取server.js文件
let serverContent = fs.readFileSync('server.js', 'utf8');

// 查找核心意图API部分的开始位置
const coreIntentsApiStart = serverContent.indexOf('// 核心意图API');
const mockCoreIntentsStart = serverContent.indexOf('let mockCoreIntents = [');
const mockCoreIntentsEnd = serverContent.indexOf(']', mockCoreIntentsStart) + 1;

if (coreIntentsApiStart === -1 || mockCoreIntentsStart === -1) {
  console.error('❌ 未找到核心意图API部分');
  process.exit(1);
}

// 生成新的mockCoreIntents数组
const newMockCoreIntentsArray = `let mockCoreIntents = ${JSON.stringify(extendedCoreIntents, null, 4)}`;

// 替换server.js中的mockCoreIntents数组
const beforeMockData = serverContent.substring(0, mockCoreIntentsStart);
const afterMockData = serverContent.substring(mockCoreIntentsEnd);
const updatedServerContent = beforeMockData + newMockCoreIntentsArray + afterMockData;

// 写入更新后的server.js
fs.writeFileSync('server.js', updatedServerContent, 'utf8');

console.log('✅ 已更新 server.js 中的核心意图数据');

// 创建回复模板文件供前端使用
fs.writeFileSync('public/response_templates.json', JSON.stringify(extendedResponses, null, 2), 'utf8');

console.log('✅ 已创建 public/response_templates.json 文件');

// 创建完整的数据导出文件
const fullDataExport = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalCoreIntents: extendedCoreIntents.length,
    totalResponses: extendedResponses.length,
    version: '1.0.0'
  },
  coreIntents: extendedCoreIntents,
  responses: extendedResponses,
  categoryMapping: {
    1: { name: '智能家居', icon: '🏠', description: '控制智能设备和家居环境' },
    2: { name: '信息查询', icon: '🔍', description: '查询各类信息和知识' },
    3: { name: '娱乐互动', icon: '🎵', description: '音乐播放和娱乐功能' },
    4: { name: '生活服务', icon: '📅', description: '生活助手和提醒服务' }
  }
};

fs.writeFileSync('intent_data_complete.json', JSON.stringify(fullDataExport, null, 2), 'utf8');

console.log('✅ 已创建完整数据导出文件 intent_data_complete.json');

console.log('\n🎉 数据更新完成！');
console.log('📋 更新内容：');
console.log(`  - 更新了 ${extendedCoreIntents.length} 个核心意图到 server.js`);
console.log(`  - 创建了 ${extendedResponses.length} 个回复模板文件`);
console.log('  - 生成了完整的数据导出文件');

console.log('\n📊 分类分布：');
const categoryCount = extendedCoreIntents.reduce((acc, intent) => {
  const categoryName = intent.category.name;
  acc[categoryName] = (acc[categoryName] || 0) + 1;
  return acc;
}, {});

Object.entries(categoryCount).forEach(([category, count]) => {
  console.log(`  ${category}: ${count} 个意图`);
}); 