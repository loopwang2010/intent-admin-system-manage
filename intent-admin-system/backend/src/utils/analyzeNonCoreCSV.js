const fs = require('fs');
const path = require('path');

function analyzeNonCoreCSV() {
  console.log('🔍 === 非核心意图CSV文件分析 ===\n');
  
  // 尝试多个可能的路径
  const possiblePaths = [
    path.resolve(__dirname, '../../../../../non_core_intents_ultra_expanded.csv'),
    path.resolve(__dirname, '../../../../../../non_core_intents_ultra_expanded.csv'),
    path.resolve('C:/Users/wangx/Desktop/xiaozhi/yuliao/non_core_intents_ultra_expanded.csv'),
    path.resolve('C:/Users/wangx/Desktop/xiaozhi/non_core_intents_ultra_expanded.csv'),
    path.resolve('./non_core_intents_ultra_expanded.csv')
  ];
  
  let csvPath = null;
  for (const p of possiblePaths) {
    console.log(`🔍 尝试路径: ${p}`);
    if (fs.existsSync(p)) {
      csvPath = p;
      console.log(`✅ 找到文件: ${p}`);
      break;
    }
  }
  
  if (!csvPath) {
    console.error('❌ 所有路径都未找到文件');
    return;
  }
  
  // 读取文件
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`📊 总行数: ${lines.length}`);
  
  // 分析头部
  console.log('\n📋 文件头部:');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`第${i+1}行: ${lines[i]}`);
  }
  
  // 统计子类型分布
  console.log('\n📈 非核心意图子类型分布:');
  const subtypeStats = {};
  
  lines.slice(1).forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const type = parts[0].trim();
      const subtype = parts[1].trim();
      
      if (type === 'non_core') {
        if (!subtypeStats[subtype]) {
          subtypeStats[subtype] = 0;
        }
        subtypeStats[subtype]++;
      }
    }
  });
  
  // 按数量排序显示
  const sortedSubtypes = Object.entries(subtypeStats)
    .sort(([,a], [,b]) => b - a);
    
  console.log(`🏷️ 发现 ${sortedSubtypes.length} 个非核心意图子类型:`);
  sortedSubtypes.forEach(([subtype, count], index) => {
    console.log(`  ${index + 1}. ${subtype}: ${count} 条`);
  });
  
  const totalTemplates = Object.values(subtypeStats).reduce((sum, count) => sum + count, 0);
  console.log(`\n📊 总模板数: ${totalTemplates} 条`);
  
  return {
    totalLines: lines.length,
    subtypes: sortedSubtypes,
    totalTemplates,
    csvPath
  };
}

if (require.main === module) {
  try {
    const result = analyzeNonCoreCSV();
    console.log('\n✅ 分析完成');
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

module.exports = { analyzeNonCoreCSV }; 