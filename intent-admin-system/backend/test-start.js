const express = require('express')

console.log('开始测试应用启动...')

try {
  // 测试 Express
  const app = express()
  console.log('✅ Express 导入成功')
  
  // 测试模型导入
  const { initDatabase } = require('./src/models')
  console.log('✅ 模型导入成功')
  
  // 测试路由导入
  const routes = require('./src/routes')
  console.log('✅ 路由导入成功')
  
  app.use('/', routes)
  
  const server = app.listen(3001, () => {
    console.log('✅ 测试服务器启动成功: http://localhost:3001')
    console.log('尝试访问健康检查...')
  })
  
  // 测试数据库初始化
  initDatabase().then(() => {
    console.log('✅ 数据库初始化成功')
  }).catch(err => {
    console.error('❌ 数据库初始化失败:', err)
  })
  
} catch (error) {
  console.error('❌ 启动失败:', error)
  process.exit(1)
} 