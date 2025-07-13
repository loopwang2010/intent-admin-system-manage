const { importUltraData } = require('./src/utils/importUltraData.js');

console.log('🚀 开始执行数据导入...');

importUltraData()
  .then(() => {
    console.log('✅ 导入完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 导入失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }); 