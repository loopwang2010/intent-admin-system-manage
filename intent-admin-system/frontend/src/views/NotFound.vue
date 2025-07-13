<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">页面未找到</div>
      <div class="error-description">
        抱歉，您访问的页面不存在或已被移除
      </div>
      
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
      
      <!-- 可爱的图标 -->
      <div class="error-icon">
        🤖
      </div>
      
      <!-- 建议链接 -->
      <div class="suggestions">
        <p>您可能想要访问：</p>
        <div class="suggestion-links">
          <el-link type="primary" @click="$router.push('/dashboard')">
            📊 仪表板
          </el-link>
          <el-link type="primary" @click="$router.push('/categories')">
            📁 意图分类
          </el-link>
          <el-link type="primary" @click="$router.push('/core-intents')">
            💬 核心意图
          </el-link>
          <el-link type="primary" @click="$router.push('/intent-test')">
            🎯 意图测试
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #409eff;
  margin: 0;
  line-height: 1;
  background: linear-gradient(45deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-message {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 10px 0;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 40px 0;
  line-height: 1.5;
}

.error-actions {
  margin-bottom: 40px;
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-icon {
  font-size: 80px;
  margin: 20px 0;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.suggestions {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}

.suggestions p {
  color: #909399;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.suggestion-links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.suggestion-links .el-link {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.suggestion-links .el-link:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-message {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .suggestion-links {
    flex-direction: column;
    align-items: center;
  }
}
</style> 