const fs = require('fs');
const path = require('path');

function analyzeCSV() {
  console.log('🔍 === CSV文件分析 ===\n');
  
  // 尝试多个可能的路径
  const possiblePaths = [
    path.resolve(__dirname, '../../../../../all_intents_ultra_expanded.csv'),
    path.resolve(__dirname, '../../../../../../all_intents_ultra_expanded.csv'),
    path.resolve(__dirname, '../../../../../../../all_intents_ultra_expanded.csv'),
    path.resolve('C:/Users/wangx/Desktop/xiaozhi/yuliao/all_intents_ultra_expanded.csv')
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
  
  // 分析编码
  console.log('\n🔤 编码分析:');
  const firstLine = lines[0];
  console.log('第一行原始:', JSON.stringify(firstLine));
  console.log('第一行长度:', firstLine.length);
  
  // 统计类型分布
  console.log('\n📈 类型分布:');
  let coreCount = 0;
  let nonCoreCount = 0;
  let otherCount = 0;
  
  const coreSubtypes = new Set();
  const nonCoreSubtypes = new Set();
  
  lines.slice(1).forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const type = parts[0].trim();
      const subtype = parts[1].trim();
      
      if (type === 'core') {
        coreCount++;
        coreSubtypes.add(subtype);
      } else if (type === 'non_core') {
        nonCoreCount++;
        nonCoreSubtypes.add(subtype);
      } else {
        otherCount++;
      }
    }
  });
  
  console.log(`🎯 核心意图: ${coreCount} 条`);
  console.log(`💬 非核心意图: ${nonCoreCount} 条`);
  console.log(`❓ 其他: ${otherCount} 条`);
  
  console.log(`\n🏷️ 核心意图子类型 (${coreSubtypes.size} 个):`);
  Array.from(coreSubtypes).slice(0, 10).forEach((subtype, index) => {
    console.log(`  ${index + 1}. ${subtype}`);
  });
  if (coreSubtypes.size > 10) {
    console.log(`  ... 还有 ${coreSubtypes.size - 10} 个`);
  }
  
  console.log(`\n🏷️ 非核心意图子类型 (${nonCoreSubtypes.size} 个):`);
  Array.from(nonCoreSubtypes).slice(0, 10).forEach((subtype, index) => {
    console.log(`  ${index + 1}. ${subtype}`);
  });
  if (nonCoreSubtypes.size > 10) {
    console.log(`  ... 还有 ${nonCoreSubtypes.size - 10} 个`);
  }
  
  // 分析数据质量
  console.log('\n🔍 数据质量检查:');
  let validLines = 0;
  let invalidLines = 0;
  
  lines.slice(1).forEach((line, index) => {
    const parts = line.split(',');
    if (parts.length >= 3 && parts[0].trim() && parts[1].trim() && parts[2].trim()) {
      validLines++;
    } else {
      invalidLines++;
      if (invalidLines <= 5) {
        console.log(`  无效行 ${index + 2}: ${line.substring(0, 100)}...`);
      }
    }
  });
  
  console.log(`✅ 有效行: ${validLines}`);
  console.log(`❌ 无效行: ${invalidLines}`);
  
  return {
    totalLines: lines.length,
    coreCount,
    nonCoreCount,
    coreSubtypes: Array.from(coreSubtypes),
    nonCoreSubtypes: Array.from(nonCoreSubtypes),
    validLines,
    invalidLines,
    csvPath
  };
}

if (require.main === module) {
  try {
    const result = analyzeCSV();
    console.log('\n✅ 分析完成');
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

module.exports = { analyzeCSV }; 