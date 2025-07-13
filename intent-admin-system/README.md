# 智能音箱意图管理系统 v2.0

## 📋 项目概述

智能音箱意图管理系统v2.0是一个企业级的意图识别和管理平台，提供完整的意图生命周期管理、AI辅助功能、用户权限控制和数据分析能力。

**开发时间**: 2024年1月  
**版本**: v2.0  
**技术栈**: Node.js + Express + Vue 3 + Element Plus + SQLite

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0
- npm >= 8.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd intent-admin-system
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **安装前端依赖**
```bash
cd ../frontend
npm install
```

4. **配置环境变量**
```bash
cd ../backend
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

5. **初始化数据库**
```bash
npm run db:init
```

6. **启动服务**
```bash
# 启动后端服务
npm start

# 在新终端启动前端服务
cd ../frontend
npm run dev
```

### 访问系统
- 前端界面: http://localhost:5173
- 后端API: http://localhost:3000
- 健康检查: http://localhost:3000/health

### 默认账户
- 管理员: admin / admin123
- 编辑员: editor / editor123
- 查看者: viewer / viewer123

## 🏗️ 系统架构

### 技术栈
**后端**
- Express.js - Web应用框架
- Sequelize ORM - 数据库操作
- SQLite - 数据库存储
- JWT - 身份认证
- CORS - 跨域支持

**前端**
- Vue 3 - 前端框架
- Element Plus - UI组件库
- Vite - 构建工具
- Pinia - 状态管理
- Vue Router - 路由管理

## 📊 核心功能

### 1. 用户认证系统
- ✅ 用户登录/注册
- ✅ JWT身份认证
- ✅ 权限控制
- ✅ 个人资料管理

### 2. 仪表板
- ✅ 系统概览统计
- ✅ 趋势分析图表
- ✅ 热门意图排行
- ✅ 系统状态监控
- ✅ 告警管理

### 3. 意图分类管理
- ✅ 分类CRUD操作
- ✅ 分类排序
- ✅ 使用统计
- ✅ 批量操作
- ✅ 数据导入导出

### 4. 核心意图管理
- ✅ 意图CRUD操作
- ✅ 关键词管理
- ✅ AI关键词推荐
- ✅ 意图冲突检测
- ✅ 语义分析
- ✅ 批量操作

### 5. 非核心意图管理
- ✅ 意图审核流程
- ✅ 批准/拒绝/修改
- ✅ 提升为核心意图
- ✅ 相似意图分析
- ✅ 智能分类推荐

### 6. 回复模板管理
- ✅ 多媒体模板支持
- ✅ 动态变量系统
- ✅ 条件逻辑控制
- ✅ 模板预览测试
- ✅ 版本历史管理
- ✅ AI内容建议

### 7. 意图测试系统
- ✅ 单次/批量测试
- ✅ 测试套件管理
- ✅ A/B测试支持
- ✅ 性能压力测试
- ✅ 测试结果分析

### 8. 数据分析
- ✅ 使用量统计
- ✅ 准确率分析
- ✅ 用户行为分析
- ✅ 性能监控
- ✅ 错误统计

### 9. 用户权限管理
- ✅ 用户列表管理
- ✅ 角色权限体系
- ✅ 权限精细控制
- ✅ 用户状态管理

## 🛡️ 企业级特性

### 安全特性
- JWT身份认证
- 基于角色的权限控制
- 密码加密存储
- CORS跨域配置
- 请求参数验证

### 监控日志
- 操作日志记录
- 请求日志中间件
- 错误日志系统
- 系统健康检查
- 实时告警系统

### AI智能
- 智能关键词推荐
- 意图冲突检测
- 语义相似度分析
- 智能分类推荐
- 内容智能生成

## 📁 项目结构

```
intent-admin-system/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── routes/         # 路由层
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── config/         # 配置文件
│   │   ├── utils/          # 工具函数
│   │   ├── services/       # 业务服务
│   │   └── app.js          # 应用入口
│   ├── package.json
│   └── .env.example
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── views/          # 页面视图
│   │   ├── stores/         # 状态管理
│   │   ├── router/         # 路由配置
│   │   ├── utils/          # 工具函数
│   │   └── styles/         # 样式文件
│   ├── package.json
│   └── vite.config.js
└── docs/                   # 项目文档
```

## 📚 API文档

### 主要接口模块
- `/api/auth` - 用户认证
- `/api/dashboard` - 仪表板数据
- `/api/categories` - 分类管理
- `/api/core-intents` - 核心意图
- `/api/non-core-intents` - 非核心意图
- `/api/pre-responses` - 回复模板
- `/api/test` - 测试功能
- `/api/analytics` - 数据分析
- `/api/users` - 用户管理

### 响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm run test
```

### API测试
使用Postman或其他API测试工具测试接口：
- 导入API文档
- 配置环境变量
- 执行测试用例

## 📦 部署

### 开发环境
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 生产环境
```bash
# 构建前端
cd frontend && npm run build

# 启动后端
cd backend && npm start
```

### Docker部署
```bash
# 构建镜像
docker build -t intent-admin-system .

# 运行容器
docker run -p 3000:3000 intent-admin-system
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请：
- 提交 Issue
- 发送邮件到 support@example.com
- 查看项目文档

## 🎯 路线图

- [ ] 多语言支持
- [ ] 移动端适配
- [ ] 更多AI功能
- [ ] 集成外部AI服务
- [ ] 微服务架构改造

---

**文档版本**: v1.0  
**更新时间**: 2024年1月  
**维护者**: 开发团队 