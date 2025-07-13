const fs = require('fs');

// 读取生成的扩展数据
const extendedCoreIntents = JSON.parse(fs.readFileSync('extended_core_intents.json', 'utf8'));

console.log('🔧 修复server.js中的核心意图数据...');

// 创建一个新的server.js内容
const serverTemplate = `const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '智能音箱意图管理系统 API',
    version: '1.0.0',
    status: 'running'
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '系统运行正常',
    timestamp: new Date().toISOString()
  })
})

// 核心意图API
app.get('/api/core-intents', (req, res) => {
  const { page = 1, limit = 20, search = '', status = '', categoryId = '' } = req.query
  
  let mockCoreIntents = ${JSON.stringify(extendedCoreIntents, null, 4)}

  // 应用搜索过滤
  if (search) {
    mockCoreIntents = mockCoreIntents.filter(intent => 
      intent.name.includes(search) || 
      intent.description.includes(search) ||
      intent.keywords.some(keyword => keyword.includes(search))
    )
  }

  // 应用状态过滤
  if (status) {
    mockCoreIntents = mockCoreIntents.filter(intent => intent.status === status)
  }

  // 应用分类过滤
  if (categoryId) {
    mockCoreIntents = mockCoreIntents.filter(intent => intent.categoryId === parseInt(categoryId))
  }

  // 分页
  const total = mockCoreIntents.length
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedData = mockCoreIntents.slice(start, end)

  res.json({
    success: true,
    data: paginatedData,
    total: total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: Math.ceil(total / limit)
    }
  })
})

// 创建核心意图
app.post('/api/core-intents', (req, res) => {
  const { name, description, categoryId, keywords, confidence, priority, status } = req.body
  
  if (!name || !categoryId) {
    return res.status(400).json({
      success: false,
      message: '意图名称和分类为必填项'
    })
  }

  const newIntent = {
    id: Date.now(),
    name,
    description: description || '',
    categoryId: parseInt(categoryId),
    keywords: keywords || [],
    confidence: confidence || 0.8,
    priority: priority || 1,
    usageCount: 0,
    status: status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  res.json({
    success: true,
    data: newIntent,
    message: '核心意图创建成功'
  })
})

// 统计数据
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalCategories: 4,
        totalCoreIntents: ${extendedCoreIntents.length},
        totalNonCoreIntents: 23,
        totalResponses: 24,
        activeCoreIntents: ${extendedCoreIntents.filter(i => i.status === 'active').length},
        activeNonCoreIntents: 23
      }
    }
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(\`🚀 智能音箱意图管理系统后端服务启动成功!\`)
  console.log(\`📡 服务地址: http://localhost:\${PORT}\`)
  console.log(\`🎯 已加载 \${${extendedCoreIntents.length}} 个核心意图\`)
  console.log(\`📊 数据统计:\`)
  
  const categoryStats = {}
  const intents = ${JSON.stringify(extendedCoreIntents)}
  intents.forEach(intent => {
    const categoryName = intent.category.name
    categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1
  })
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(\`  \${category}: \${count} 个意图\`)
  })
  
  console.log('\\n准备就绪! 🎉')
})`;

// 写入新的server.js
fs.writeFileSync('server.js', serverTemplate, 'utf8');

console.log('✅ server.js已修复并更新');
console.log(`📊 包含 ${extendedCoreIntents.length} 个核心意图`);

// 生成分类统计
const categoryStats = {};
extendedCoreIntents.forEach(intent => {
  const categoryName = intent.category.name;
  categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
});

console.log('\n📊 分类分布：');
Object.entries(categoryStats).forEach(([category, count]) => {
  console.log(`  ${category}: ${count} 个意图`);
}); 