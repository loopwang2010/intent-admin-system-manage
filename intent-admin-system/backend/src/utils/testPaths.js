const fs = require('fs')
const path = require('path')

console.log('当前目录:', __dirname)

// 测试多个可能的路径
const possiblePaths = [
  path.resolve(__dirname, '../../../../../core_intents_ultra_expanded.csv'),
  path.resolve(__dirname, '../../../../../../core_intents_ultra_expanded.csv'),
  'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\core_intents_ultra_expanded.csv',
  path.join('C:', 'Users', 'wangx', 'Desktop', 'xiaozhi', 'yuliao', 'core_intents_ultra_expanded.csv')
]

console.log('\n测试核心意图CSV文件路径:')
possiblePaths.forEach((testPath, index) => {
  console.log(`路径 ${index + 1}: ${testPath}`)
  console.log(`存在: ${fs.existsSync(testPath)}`)
  if (fs.existsSync(testPath)) {
    const stats = fs.statSync(testPath)
    console.log(`大小: ${(stats.size / 1024).toFixed(2)} KB`)
  }
  console.log('---')
})

const nonCorePaths = [
  path.resolve(__dirname, '../../../../../non_core_intents_ultra_expanded.csv'),
  path.resolve(__dirname, '../../../../../../non_core_intents_ultra_expanded.csv'),
  'C:\\Users\\wangx\\Desktop\\xiaozhi\\yuliao\\non_core_intents_ultra_expanded.csv',
  path.join('C:', 'Users', 'wangx', 'Desktop', 'xiaozhi', 'yuliao', 'non_core_intents_ultra_expanded.csv')
]

console.log('\n测试非核心意图CSV文件路径:')
nonCorePaths.forEach((testPath, index) => {
  console.log(`路径 ${index + 1}: ${testPath}`)
  console.log(`存在: ${fs.existsSync(testPath)}`)
  if (fs.existsSync(testPath)) {
    const stats = fs.statSync(testPath)
    console.log(`大小: ${(stats.size / 1024).toFixed(2)} KB`)
  }
  console.log('---')
}) 