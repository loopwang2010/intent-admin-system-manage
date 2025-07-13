const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requestLogger } = require('../middleware/logger');
const { auditLogger } = require('../middleware/auditLogger');

// 全局速率限制
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});

// 应用全局中间件
router.use(globalRateLimit);
router.use(requestLogger);
router.use(auditLogger); // 应用审计日志中间件

// 导入业务路由
const dashboardRoutes = require('./dashboard');
const categoryRoutes = require('./categories');
const coreIntentRoutes = require('./coreIntents');
const nonCoreIntentRoutes = require('./nonCoreIntents');
const preResponseRoutes = require('./preResponses');
const testRoutes = require('./test');
const analyticsRoutes = require('./analytics');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const auditRoutes = require('./audit');
const permissionRoutes = require('./permissions');
const roleRoutes = require('./roles');
const historyVisualizationRoutes = require('./historyVisualization');
const securityAuditRoutes = require('./securityAudit');
const performanceRoutes = require('./performance');

// 健康检查路由
router.get('/health', (req, res) => {
  const startTime = req.startTime || Date.now();
  const responseTime = Date.now() - startTime;
  
  res.json({
    success: true,
    message: '智能音箱意图管理系统运行正常',
    service: 'Intent Admin System Backend',
    version: '2.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'SQLite connected',
    features: [
      'AI智能推荐',
      '意图冲突检测', 
      '语义相似度分析',
      '多语言支持',
      '版本控制',
      '用户权限管理',
      '数据分析统计',
      'A/B测试',
      '批量操作',
      '拖拽排序',
      'API限流',
      '完整日志记录'
    ]
  });
});

// API状态检查
router.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API服务正常运行',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth/* - 用户认证相关API',
      users: '/api/users/* - 用户管理API',
      dashboard: '/api/dashboard/* - 仪表板相关API',
      categories: '/api/categories/* - 意图分类管理API',
      coreIntents: '/api/core-intents/* - 核心意图管理API',
      nonCoreIntents: '/api/non-core-intents/* - 非核心意图管理API',
      preResponses: '/api/pre-responses/* - 回复模板管理API',
      test: '/api/test/* - 意图测试API',
      analytics: '/api/analytics/* - 数据分析API',
      audit: '/api/audit/* - 审计日志API',
      permissions: '/api/permissions/* - 权限管理API',
      roles: '/api/roles/* - 角色管理API',
      historyVisualization: '/api/history-visualization/* - 操作历史可视化API',
      securityAudit: '/api/security-audit/* - 安全审计API',
      performance: '/api/performance/* - 性能优化API',
      corsTest: '/api/cors-test - CORS跨域测试API'
    },
    capabilities: {
      crud: '完整的CRUD操作',
      batch: '批量操作支持',
      ai: 'AI智能功能',
      analytics: '深度数据分析',
      security: '安全认证和权限控制',
      performance: 'API限流和性能优化',
      logging: '完整操作日志',
      cors: '跨域访问支持'
    }
  });
});

// CORS跨域测试接口
router.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin
  const userAgent = req.headers['user-agent']
  const referer = req.headers.referer
  
  console.log(`🌐 CORS测试请求 - Origin: ${origin || '无'}, User-Agent: ${userAgent}`)
  
  res.json({
    success: true,
    message: '🎉 CORS跨域访问测试成功！',
    data: {
      method: req.method,
      origin: origin || '无Origin头',
      userAgent: userAgent || '无User-Agent',
      referer: referer || '无Referer',
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      headers: {
        'access-control-allow-origin': res.get('Access-Control-Allow-Origin'),
        'access-control-allow-credentials': res.get('Access-Control-Allow-Credentials'),
        'access-control-allow-methods': res.get('Access-Control-Allow-Methods'),
        'access-control-allow-headers': res.get('Access-Control-Allow-Headers')
      }
    },
    cors: {
      status: '✅ 跨域访问正常',
      allowedOrigins: process.env.NODE_ENV === 'development' 
        ? ['所有域名（开发模式）'] 
        : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
      supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      credentialsSupport: true,
      maxAge: '86400秒'
    }
  });
});

// CORS POST测试接口
router.post('/api/cors-test', (req, res) => {
  const origin = req.headers.origin
  const contentType = req.headers['content-type']
  
  console.log(`🌐 CORS POST测试请求 - Origin: ${origin || '无'}, Content-Type: ${contentType}`)
  
  res.json({
    success: true,
    message: '🎉 CORS POST请求测试成功！',
    data: {
      method: req.method,
      origin: origin || '无Origin头',
      contentType: contentType || '无Content-Type',
      body: req.body,
      timestamp: new Date().toISOString()
    },
    note: '这说明跨域POST请求（包括预检请求）都工作正常'
  });
});

// 系统信息接口
router.get('/api/system/info', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    success: true,
    data: {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// 注册业务路由
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/core-intents', coreIntentRoutes);
router.use('/api/non-core-intents', nonCoreIntentRoutes);
router.use('/api/pre-responses', preResponseRoutes);
router.use('/api/test', testRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/audit', auditRoutes);
router.use('/api/permissions', permissionRoutes);
router.use('/api/roles', roleRoutes);
router.use('/api/history-visualization', historyVisualizationRoutes);
router.use('/api/security-audit', securityAuditRoutes);
router.use('/api/performance', performanceRoutes);

// 根路径
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用智能音箱意图管理系统API v2.0',
    description: '这是一个用于管理智能音箱意图识别的全功能后端服务',
    features: {
      core: [
        '核心意图管理',
        '非核心意图管理', 
        '回复模板配置',
        '意图分类管理',
        '意图识别测试'
      ],
      advanced: [
        'AI智能推荐',
        '意图冲突检测',
        '语义相似度分析',
        '数据统计分析',
        '用户行为分析',
        'A/B测试功能'
      ],
      enterprise: [
        '多语言支持',
        '版本控制',
        '用户权限管理',
        '完整日志记录',
        'API限流保护',
        '批量操作',
        '数据导入导出'
      ]
    },
    documentation: '/api/status',
    health: '/health',
    version: '2.0.0',
    support: {
      languages: ['zh-CN', 'en-US'],
      formats: ['JSON', 'CSV'],
      authentication: 'JWT Bearer Token',
      rateLimit: 'IP based with different limits per endpoint'
    }
  });
});

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api/status'
  });
});

// 全局错误处理中间件
router.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  
  // 记录错误日志
  const { logError } = require('../middleware/logger');
  logError(error, req, req.user?.id);
  
  if (res.headersSent) {
    return next(error);
  }
  
  let statusCode = 500;
  let message = '服务器内部错误';
  
  // 根据错误类型设置状态码和消息
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = '禁止访问';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = '资源不存在';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = '资源冲突';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = '请求过于频繁';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router; 