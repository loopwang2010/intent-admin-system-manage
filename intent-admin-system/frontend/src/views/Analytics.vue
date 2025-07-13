<template>
  <div class="analytics">
    <div class="page-header">
      <h1>数据分析</h1>
    </div>
    
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalTests }}</div>
          <div class="stat-label">总测试次数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.successfulTests }}</div>
          <div class="stat-label">成功识别</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.avgResponseTime }}ms</div>
          <div class="stat-label">平均响应时间</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">识别准确率</div>
        </div>
      </div>
    </div>
    
    <div class="chart-card">
      <h3>分析报告</h3>
      <div class="loading" v-if="loading">加载中...</div>
      <div v-else class="chart-placeholder">
        <p>📊 数据分析图表区域</p>
        <p>图表功能开发中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Analytics',
  setup() {
    const loading = ref(false)
    const stats = ref({
      totalTests: 1250,
      successfulTests: 1125,
      avgResponseTime: 89,
      accuracy: 90
    })

    onMounted(() => {
      console.log('数据分析页面加载完成')
    })

    return {
      loading,
      stats
    }
  }
}
</script>

<style scoped>
.analytics {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 18px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}
</style>