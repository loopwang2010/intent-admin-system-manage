const express = require('express')
const cors = require('cors')
const path = require('path')
const { requestLogger } = require('./middleware/logger')

// 创建Express应用
const app = express()

// 中间件配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../public')))

// 日志中间件
app.use(requestLogger)

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '智能音箱意图管理系统 v2.0 运行正常',
    timestamp: new Date(),
    version: '2.0.0',
    status: 'healthy'
  })
})

// API路由
try {
  // 导入路由
  const authRoutes = require('./routes/auth')
  const dashboardRoutes = require('./routes/dashboard')
  const categoriesRoutes = require('./routes/categories')
  const coreIntentsRoutes = require('./routes/coreIntents')
  const nonCoreIntentsRoutes = require('./routes/nonCoreIntents')
  const preResponsesRoutes = require('./routes/preResponses')
  const testRoutes = require('./routes/test')
  const analyticsRoutes = require('./routes/analytics')
  const usersRoutes = require('./routes/users')
  const roleRoutes = require('./routes/roles')
  const permissionRoutes = require('./routes/permissions')

  // 注册路由
  app.use('/api/auth', authRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/categories', categoriesRoutes)
  app.use('/api/core-intents', coreIntentsRoutes)
  app.use('/api/non-core-intents', nonCoreIntentsRoutes)
  app.use('/api/pre-responses', preResponsesRoutes)
  app.use('/api/test', testRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/roles', roleRoutes)
  app.use('/api/permissions', permissionRoutes)

  console.log('✅ 所有路由加载成功')
} catch (error) {
  console.error('❌ 路由加载失败:', error.message)
  console.error('详细错误:', error)
}

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用智能音箱意图管理系统 v2.0',
    version: '2.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      categories: '/api/categories',
      coreIntents: '/api/core-intents',
      nonCoreIntents: '/api/non-core-intents',
      preResponses: '/api/pre-responses',
      test: '/api/test',
      analytics: '/api/analytics',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions'
    }
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date()
  })
})

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误处理:', error)
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`
🚀 智能音箱意图管理系统 v2.0 启动成功!

📍 服务地址: http://localhost:${PORT}
🏥 健康检查: http://localhost:${PORT}/health
📚 API文档: http://localhost:${PORT}/api
🔧 开发模式: ${process.env.NODE_ENV || 'development'}
⚡ 启动时间: ${new Date().toLocaleString('zh-CN')}

主要功能模块:
✓ 用户认证系统 (/api/auth)
✓ 仪表板数据 (/api/dashboard)
✓ 意图分类管理 (/api/categories)
✓ 核心意图管理 (/api/core-intents)
✓ 非核心意图管理 (/api/non-core-intents)
✓ 回复模板管理 (/api/pre-responses)
✓ 意图测试功能 (/api/test)
✓ 数据分析统计 (/api/analytics)
✓ 用户权限管理 (/api/users)

企业级特性:
🔐 JWT身份认证
🛡️ 权限控制系统
📊 实时数据分析
🧪 A/B测试支持
🤖 AI智能推荐
📝 操作日志记录
⚡ API限流保护
  `)
})

module.exports = app 