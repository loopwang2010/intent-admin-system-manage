# CORS跨域访问配置说明

## 概述

本项目已经配置了完善的CORS（跨域资源共享）支持，允许前端应用从不同的域名访问后端API。

## 当前配置

### 开发环境
- **允许所有域名**: 开发模式下自动允许所有origin
- **支持的方法**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **认证支持**: 支持Cookie和Authorization头
- **预检缓存**: 24小时

### 生产环境
- **安全域名白名单**: 只允许指定的域名访问
- **默认允许的域名**:
  - http://localhost:5173
  - http://localhost:5174
  - http://127.0.0.1:5173
  - http://127.0.0.1:5174

## 配置方式

### 1. 环境变量配置

创建 `.env` 文件并设置：

```bash
# 基本配置
NODE_ENV=development  # 或 production
PORT=3000

# CORS配置
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://yourdomain.com
```

### 2. 动态配置

在 `app.js` 中的 `corsOptions` 对象内修改：

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // 开发环境允许所有域名
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    
    // 添加你的域名到这里
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ]
    
    // ... 其他配置
  }
}
```

## 测试CORS配置

### 1. 使用内置测试接口

访问以下接口测试CORS配置：

```bash
# GET请求测试
curl -H "Origin: http://localhost:5173" \
     http://localhost:3000/api/cors-test

# POST请求测试
curl -X POST \
     -H "Origin: http://localhost:5173" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}' \
     http://localhost:3000/api/cors-test
```

### 2. 前端JavaScript测试

```javascript
// 测试GET请求
fetch('http://localhost:3000/api/cors-test')
  .then(response => response.json())
  .then(data => console.log('CORS GET测试:', data))

// 测试POST请求
fetch('http://localhost:3000/api/cors-test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ test: 'data' })
})
  .then(response => response.json())
  .then(data => console.log('CORS POST测试:', data))
```

## 支持的功能

- ✅ 简单请求
- ✅ 预检请求（OPTIONS）
- ✅ Cookie认证
- ✅ 自定义请求头
- ✅ 文件上传
- ✅ WebSocket（如果需要）

## 常见问题

### 1. CORS错误

如果遇到CORS错误，检查：
1. Origin是否在允许列表中
2. 请求方法是否被支持
3. 请求头是否被允许

### 2. 预检请求失败

确保：
1. OPTIONS方法被正确处理
2. 预检请求返回正确的CORS头
3. 浏览器缓存没有问题

### 3. 认证问题

如果使用Cookie认证：
1. 设置 `credentials: 'include'` （前端）
2. 后端已设置 `credentials: true`
3. HTTPS环境下的安全Cookie设置

## 生产环境部署

1. 设置 `NODE_ENV=production`
2. 更新允许的域名列表
3. 使用HTTPS
4. 启用安全头
5. 定期检查CORS配置

## 安全建议

1. **最小权限原则**: 只允许必要的域名
2. **定期审查**: 检查允许的域名列表
3. **监控日志**: 关注被拒绝的CORS请求
4. **使用HTTPS**: 生产环境必须使用HTTPS
5. **验证Origin**: 不信任客户端发送的Origin头

## 调试技巧

1. 查看服务器日志中的CORS相关信息
2. 使用浏览器开发者工具检查网络请求
3. 检查响应头中的CORS相关字段
4. 使用CORS测试接口验证配置

## 更新记录

- 2025-07-11: 初始版本，支持基本的CORS配置
- 添加了开发/生产环境的不同策略
- 增加了CORS测试接口
- 优化了安全头配置 