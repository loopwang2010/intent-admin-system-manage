const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// 导入数据库和模型
const { initDatabase } = require('./src/models')
const routes = require('./src/routes')

// 安全中间件 - 配置为支持跨域访问
app.use(helmet({
  // 在开发环境中禁用CSP，生产环境中使用宽松的CSP
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'"],
    },
  } : false,
  
  // 跨域相关配置
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // 其他安全头
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  
  // 允许iframe嵌入（如果需要）
  frameguard: { action: 'sameorigin' },
  
  // 不隐藏X-Powered-By头（在开发中有用）
  hidePoweredBy: process.env.NODE_ENV === 'production'
}))

// 跨域配置 - 允许前端访问
const corsOptions = {
  // 允许的源域名
  origin: function (origin, callback) {
    // 开发环境允许所有域名
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    
    // 生产环境的允许列表
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      // 可以添加生产环境的域名
      // 'https://your-production-domain.com'
    ]
    
    // 允许环境变量指定的域名
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN)
    }
    
    // 如果没有origin（如移动应用或Postman）也允许
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.warn(`❌ CORS: 拒绝来自 ${origin} 的请求`)
      callback(new Error('CORS政策不允许此源访问'))
    }
  },
  
  // 允许的HTTP方法
  methods: [
    'GET', 
    'POST', 
    'PUT', 
    'DELETE', 
    'PATCH', 
    'OPTIONS', 
    'HEAD'
  ],
  
  // 允许的请求头
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token',
    'X-Forwarded-For',
    'User-Agent',
    'Referer'
  ],
  
  // 允许发送Cookie和认证信息
  credentials: true,
  
  // 预检请求的缓存时间（秒）
  maxAge: 86400, // 24小时
  
  // 允许客户端访问的响应头
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'X-Total-Count',
    'X-Page-Count',
    'Link'
  ],
  
  // 处理OPTIONS预检请求
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// 额外的CORS头设置中间件
app.use((req, res, next) => {
  // 确保所有响应都包含CORS头
  const origin = req.headers.origin
  
  // 开发环境允许所有域名
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*')
  } else {
    // 生产环境检查允许的域名
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000'
    ]
    
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN)
    }
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
    }
  }
  
  // 设置其他CORS头
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,X-CSRF-Token')
  res.header('Access-Control-Max-Age', '86400')
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS: 处理预检请求 ${req.method} ${req.url}`)
    return res.status(200).json({
      message: '预检请求成功',
      methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD',
      headers: 'Content-Type,Authorization,X-Requested-With,Accept,Origin,X-CSRF-Token'
    })
  }
  
  next()
})

// 压缩中间件
app.use(compression())

// 请求日志
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}))

// 基础中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')))

// 请求时间戳中间件
app.use((req, res, next) => {
  req.startTime = Date.now()
  next()
})

// 主路由
app.use('/', routes)

// 优雅关闭处理
const gracefulShutdown = async (signal) => {
  console.log(`\n收到 ${signal} 信号，开始优雅关闭...`)
  
  try {
    // 关闭数据库连接
    const { closeDatabase } = require('./src/models')
    await closeDatabase()
    console.log('数据库连接已关闭')
    
    process.exit(0)
  } catch (error) {
    console.error('优雅关闭失败:', error)
    process.exit(1)
  }
}

// 注册信号处理器
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
  process.exit(1)
})

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    console.log('🚀 正在初始化数据库...')
    const dbInitialized = await initDatabase()
    
    if (!dbInitialized) {
      console.error('❌ 数据库初始化失败')
      process.exit(1)
    }
    
    console.log('✅ 数据库初始化成功')
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log('\n🎯 智能音箱意图管理系统后端服务启动成功!')
      console.log(`📡 服务地址: http://localhost:${PORT}`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📝 API文档: http://localhost:${PORT}/api/status`)
      console.log(`💓 健康检查: http://localhost:${PORT}/health`)
      console.log(`🔗 CORS测试: http://localhost:${PORT}/api/cors-test`)
      
      // CORS配置信息
      console.log('\n🌐 跨域访问配置:')
      if (process.env.NODE_ENV === 'development') {
        console.log('  • 开发模式: 允许所有域名访问')
      } else {
        console.log('  • 生产模式: 仅允许指定域名访问')
      }
      console.log('  • 支持的方法: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
      console.log('  • 支持认证: Cookie和Authorization头')
      console.log('  • 预检缓存: 24小时')
      console.log('  • 允许的前端地址:')
      console.log('    - http://localhost:5173')
      console.log('    - http://localhost:5174')
      console.log('    - http://127.0.0.1:5173')
      console.log('    - http://127.0.0.1:5174')
      
      console.log('\n🔧 系统功能:')
      console.log('  • 核心意图管理')
      console.log('  • 非核心意图管理') 
      console.log('  • 回复模板配置')
      console.log('  • 意图分类管理')
      console.log('  • 意图识别测试')
      console.log('  • AI智能推荐')
      console.log('  • 意图冲突检测')
      console.log('  • 语义相似度分析')
      console.log('  • 数据分析统计')
      console.log('  • 用户行为分析')
      console.log('  • A/B测试功能')
      console.log('  • 多语言支持')
      console.log('  • 版本控制')
      console.log('  • 用户权限管理')
      console.log('  • 完整日志记录')
      console.log('  • API限流保护')
      console.log('  • 批量操作')
      console.log('  • 数据导入导出')
      console.log('\n🎉 服务已启动，支持跨域访问！\n')
    })
    
    // 设置服务器超时
    server.timeout = 30000 // 30秒
    
    return server
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer()
}

module.exports = app 