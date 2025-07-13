const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 5173

// 简单的MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.vue': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
}

const server = http.createServer((req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // API代理
  if (req.url.startsWith('/api')) {
    const http = require('http')
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err)
      res.writeHead(500)
      res.end('Proxy Error')
    })
    
    req.pipe(proxyReq)
    return
  }
  
  // 静态文件服务
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url)
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 如果是SPA路由，返回index.html
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
          if (err) {
            res.writeHead(404)
            res.end('Not Found')
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(data)
          }
        })
      } else {
        res.writeHead(500)
        res.end('Server Error')
      }
    } else {
      const ext = path.extname(filePath)
      const contentType = mimeTypes[ext] || 'text/plain'
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    }
  })
})

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}/`)
  console.log('Press Ctrl+C to stop the server')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down frontend server...')
  server.close(() => {
    console.log('Frontend server stopped')
    process.exit(0)
  })
})