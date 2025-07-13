const fs = require('fs');
const path = require('path');

async function testImport() {
  console.log('🚀 开始测试导入...');
  
  const csvFilePath = path.resolve(__dirname, '../../../../../../all_intents_ultra_expanded.csv');
  console.log('📁 文件路径:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV文件不存在:', csvFilePath);
    return;
  }
  
  console.log('✅ 文件存在');
  
  // 读取前10行测试
  const content = fs.readFileSync(csvFilePath, 'utf8');
  const lines = content.split('\n').slice(0, 10);
  
  console.log('📋 文件内容前10行:');
  lines.forEach((line, index) => {
    console.log(`${index + 1}: ${line}`);
  });
  
  // 统计总行数
  const totalLines = content.split('\n').length;
  console.log(`📊 总行数: ${totalLines}`);
  
  // 统计核心意图和非核心意图
  const coreLines = content.split('\n').filter(line => line.startsWith('core,')).length;
  const nonCoreLines = content.split('\n').filter(line => line.startsWith('non_core,')).length;
  
  console.log(`🎯 核心意图行数: ${coreLines}`);
  console.log(`💬 非核心意图行数: ${nonCoreLines}`);
}

testImport().catch(console.error); 