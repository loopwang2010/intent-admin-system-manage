<template>
  <div class="performance-monitor">
    <div class="header">
      <h2>性能监控中心</h2>
      <div class="header-actions">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          @change="toggleAutoRefresh"
        />
        <el-button type="primary" @click="runHealthCheck" :loading="healthCheckLoading">
          健康检查
        </el-button>
        <el-button :icon="Refresh" @click="refreshPerformanceData" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 性能概览 -->
    <div class="performance-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card" :class="getHealthStatusClass(performanceData.performance?.health)">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon :class="getHealthIconClass(performanceData.performance?.health)">
                  <component :is="getHealthIcon(performanceData.performance?.health)" />
                </el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceData.performance?.score || 0 }}</div>
                <div class="metric-label">性能评分</div>
                <div class="metric-status">{{ getHealthText(performanceData.performance?.health) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon response-time">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceData.performance?.responseTime || 0 }}ms</div>
                <div class="metric-label">平均响应时间</div>
                <div class="metric-trend" :class="getTrendClass(performanceData.responseTrend)">
                  {{ getTrendText(performanceData.responseTrend) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon memory">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceData.performance?.memoryUsage || '0%' }}</div>
                <div class="metric-label">内存使用率</div>
                <div class="metric-trend" :class="getTrendClass(performanceData.memoryTrend)">
                  {{ getTrendText(performanceData.memoryTrend) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon concurrency">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ performanceData.performance?.concurrency || '0%' }}</div>
                <div class="metric-label">并发利用率</div>
                <div class="metric-trend" :class="getTrendClass(performanceData.concurrencyTrend)">
                  {{ getTrendText(performanceData.concurrencyTrend) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 性能图表 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>性能趋势</span>
              <el-select v-model="trendsTimeRange" size="small" @change="fetchPerformanceTrends">
                <el-option label="最近1小时" value="1h" />
                <el-option label="最近6小时" value="6h" />
                <el-option label="最近24小时" value="24h" />
                <el-option label="最近7天" value="7d" />
              </el-select>
            </div>
          </template>
          <div ref="performanceTrendsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>资源使用情况</span>
              <el-button type="text" size="small" @click="showResourceDetailsDialog = true">
                详细信息
              </el-button>
            </div>
          </template>
          <div class="resource-usage">
            <div class="resource-item">
              <div class="resource-label">CPU使用率</div>
              <el-progress 
                :percentage="resourceUsage.cpu?.usage || 0" 
                :color="getResourceColor(resourceUsage.cpu?.usage)"
                :show-text="true"
              />
            </div>
            <div class="resource-item">
              <div class="resource-label">内存使用率</div>
              <el-progress 
                :percentage="resourceUsage.memory?.heapUtilization || 0" 
                :color="getResourceColor(resourceUsage.memory?.heapUtilization)"
                :show-text="true"
              />
            </div>
            <div class="resource-item">
              <div class="resource-label">数据库连接</div>
              <el-progress 
                :percentage="resourceUsage.database?.utilizationRate || 0" 
                :color="getResourceColor(resourceUsage.database?.utilizationRate)"
                :show-text="true"
              />
            </div>
            <div class="resource-item">
              <div class="resource-label">并发处理</div>
              <el-progress 
                :percentage="resourceUsage.concurrency?.utilizationRate || 0" 
                :color="getResourceColor(resourceUsage.concurrency?.utilizationRate)"
                :show-text="true"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 慢查询和优化建议 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>慢查询分析</span>
              <el-button type="text" size="small" @click="refreshSlowQueries">
                刷新
              </el-button>
            </div>
          </template>
          <div class="slow-queries">
            <div 
              v-for="query in slowQueries" 
              :key="query.id"
              class="query-item"
              @click="viewQueryDetail(query)"
            >
              <div class="query-header">
                <div class="query-type">
                  <el-tag :type="getQuerySeverityColor(query.responseTime)" size="small">
                    {{ query.operationType }}
                  </el-tag>
                  <span class="query-time">{{ query.responseTime }}ms</span>
                </div>
                <div class="query-timestamp">
                  {{ formatDateTime(query.timestamp) }}
                </div>
              </div>
              <div class="query-resource" v-if="query.resource">
                资源: {{ query.resource }}
              </div>
              <div class="query-metadata" v-if="query.metadata">
                <el-tag 
                  v-for="(value, key) in query.metadata" 
                  :key="key"
                  type="info" 
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ key }}: {{ value }}
                </el-tag>
              </div>
            </div>
            
            <el-empty v-if="slowQueries.length === 0" description="暂无慢查询" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>优化建议</span>
              <el-select v-model="recommendationFilter" size="small" @change="filterRecommendations">
                <el-option label="全部" value="all" />
                <el-option label="高优先级" value="high" />
                <el-option label="中优先级" value="medium" />
                <el-option label="低优先级" value="low" />
              </el-select>
            </div>
          </template>
          <div class="optimization-recommendations">
            <div 
              v-for="recommendation in filteredRecommendations" 
              :key="recommendation.id"
              class="recommendation-item"
              :class="recommendation.priority"
            >
              <div class="recommendation-header">
                <el-tag :type="getPriorityColor(recommendation.priority)" size="small">
                  {{ getPriorityText(recommendation.priority) }}
                </el-tag>
                <span class="recommendation-category">{{ recommendation.category }}</span>
              </div>
              <div class="recommendation-title">{{ recommendation.title }}</div>
              <div class="recommendation-description">{{ recommendation.description }}</div>
              <div class="recommendation-actions" v-if="recommendation.actions?.length">
                <el-collapse>
                  <el-collapse-item title="查看详细建议" name="actions">
                    <ul>
                      <li v-for="action in recommendation.actions" :key="action">
                        {{ action }}
                      </li>
                    </ul>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
            
            <el-empty v-if="filteredRecommendations.length === 0" description="暂无优化建议" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统健康检查对话框 -->
    <el-dialog
      v-model="showHealthCheckDialog"
      title="系统健康检查"
      width="80%"
    >
      <div class="health-check-results" v-if="healthCheckResults">
        <div class="health-overview">
          <el-alert
            :title="`系统状态: ${getHealthText(healthCheckResults.status)}`"
            :type="getHealthAlertType(healthCheckResults.status)"
            :closable="false"
            show-icon
            style="margin-bottom: 20px"
          />
          
          <el-descriptions title="检查概览" :column="2" border>
            <el-descriptions-item label="检查时间">
              {{ formatDateTime(healthCheckResults.timestamp) }}
            </el-descriptions-item>
            <el-descriptions-item label="总体状态">
              <el-tag :type="getHealthTagType(healthCheckResults.status)">
                {{ getHealthText(healthCheckResults.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="检查项目">
              {{ Object.keys(healthCheckResults.checks || {}).length }}
            </el-descriptions-item>
            <el-descriptions-item label="异常项目">
              {{ Object.values(healthCheckResults.checks || {}).filter(check => check.status !== 'healthy').length }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="health-checks" style="margin-top: 20px">
          <h4>详细检查结果</h4>
          <div 
            v-for="(check, name) in healthCheckResults.checks" 
            :key="name"
            class="check-item"
            :class="check.status"
          >
            <div class="check-header">
              <div class="check-name">
                <el-icon :class="getCheckIconClass(check.status)">
                  <component :is="getCheckIcon(check.status)" />
                </el-icon>
                {{ getCheckDisplayName(name) }}
              </div>
              <el-tag :type="getHealthTagType(check.status)" size="small">
                {{ getHealthText(check.status) }}
              </el-tag>
            </div>
            <div class="check-message">{{ check.message }}</div>
            <div class="check-details" v-if="check.details">
              <el-descriptions :column="3" size="small">
                <el-descriptions-item 
                  v-for="(value, key) in check.details" 
                  :key="key"
                  :label="key"
                >
                  {{ value }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 资源详情对话框 -->
    <el-dialog
      v-model="showResourceDetailsDialog"
      title="资源使用详情"
      width="700px"
    >
      <div class="resource-details" v-if="resourceUsage">
        <el-tabs>
          <el-tab-pane label="内存使用" name="memory">
            <el-descriptions :column="2" border v-if="resourceUsage.memory">
              <el-descriptions-item label="已用堆内存">
                {{ resourceUsage.memory.heapUsed }}
              </el-descriptions-item>
              <el-descriptions-item label="总堆内存">
                {{ resourceUsage.memory.heapTotal }}
              </el-descriptions-item>
              <el-descriptions-item label="外部内存">
                {{ resourceUsage.memory.external }}
              </el-descriptions-item>
              <el-descriptions-item label="数组缓冲区">
                {{ resourceUsage.memory.arrayBuffers }}
              </el-descriptions-item>
              <el-descriptions-item label="RSS">
                {{ resourceUsage.memory.rss }}
              </el-descriptions-item>
              <el-descriptions-item label="利用率">
                {{ resourceUsage.memory.usage?.heapUtilization }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div style="margin-top: 20px" v-if="resourceUsage.memory?.recommendations?.length">
              <h5>内存优化建议</h5>
              <ul>
                <li v-for="rec in resourceUsage.memory.recommendations" :key="rec">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </el-tab-pane>

          <el-tab-pane label="数据库" name="database">
            <el-descriptions :column="2" border v-if="resourceUsage.database">
              <el-descriptions-item label="连接状态">
                {{ resourceUsage.database.status }}
              </el-descriptions-item>
              <el-descriptions-item label="活跃连接">
                {{ resourceUsage.database.active }}
              </el-descriptions-item>
              <el-descriptions-item label="空闲连接">
                {{ resourceUsage.database.idle }}
              </el-descriptions-item>
              <el-descriptions-item label="总连接数">
                {{ resourceUsage.database.total }}
              </el-descriptions-item>
              <el-descriptions-item label="最大连接数">
                {{ resourceUsage.database.maxConnections }}
              </el-descriptions-item>
              <el-descriptions-item label="利用率">
                {{ resourceUsage.database.utilizationRate }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="并发处理" name="concurrency">
            <el-descriptions :column="2" border v-if="resourceUsage.concurrency">
              <el-descriptions-item label="峰值并发">
                {{ resourceUsage.concurrency.peakConcurrency }}
              </el-descriptions-item>
              <el-descriptions-item label="平均并发">
                {{ resourceUsage.concurrency.averageConcurrency }}
              </el-descriptions-item>
              <el-descriptions-item label="当前容量">
                {{ resourceUsage.concurrency.capacity?.current }}
              </el-descriptions-item>
              <el-descriptions-item label="推荐容量">
                {{ resourceUsage.concurrency.capacity?.recommended }}
              </el-descriptions-item>
              <el-descriptions-item label="利用率">
                {{ resourceUsage.concurrency.capacity?.utilizationRate }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 查询详情对话框 -->
    <el-dialog
      v-model="showQueryDetailDialog"
      title="慢查询详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="selectedQuery">
        <el-descriptions-item label="操作类型">
          {{ selectedQuery.operationType }}
        </el-descriptions-item>
        <el-descriptions-item label="响应时间">
          <el-tag :type="getQuerySeverityColor(selectedQuery.responseTime)">
            {{ selectedQuery.responseTime }}ms
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源">
          {{ selectedQuery.resource || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="发生时间">
          {{ formatDateTime(selectedQuery.timestamp) }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="selectedQuery?.metadata" style="margin-top: 20px">
        <h4>元数据</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item 
            v-for="(value, key) in selectedQuery.metadata" 
            :key="key"
            :label="key"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="showQueryDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Refresh, Timer, Cpu, Connection, SuccessFilled, 
  WarningFilled, CircleCloseFilled, CircleCheckFilled 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { performanceAPI } from '@/api/performance'
import { formatDateTime } from '@/utils/date'

// 响应式数据
const loading = ref(false)
const healthCheckLoading = ref(false)
const autoRefresh = ref(false)
const performanceData = ref({})
const resourceUsage = ref({})
const slowQueries = ref([])
const recommendations = ref([])
const healthCheckResults = ref(null)

const showHealthCheckDialog = ref(false)
const showResourceDetailsDialog = ref(false)
const showQueryDetailDialog = ref(false)

const selectedQuery = ref(null)
const trendsTimeRange = ref('24h')
const recommendationFilter = ref('all')

// 图表引用
const performanceTrendsChartRef = ref()
let performanceTrendsChart = null

// 自动刷新定时器
let refreshTimer = null

// 计算属性
const filteredRecommendations = computed(() => {
  if (recommendationFilter.value === 'all') {
    return recommendations.value
  }
  return recommendations.value.filter(rec => rec.priority === recommendationFilter.value)
})

// 方法
const refreshPerformanceData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchRealtimePerformance(),
      fetchPerformanceTrends(),
      fetchResourceUsage(),
      fetchSlowQueries(),
      fetchOptimizationRecommendations()
    ])
  } catch (error) {
    ElMessage.error('性能数据刷新失败')
    console.error('Error refreshing performance data:', error)
  } finally {
    loading.value = false
  }
}

const fetchRealtimePerformance = async () => {
  try {
    const response = await performanceAPI.getRealtimePerformance()
    performanceData.value = response.data || {}
  } catch (error) {
    console.error('Error fetching realtime performance:', error)
  }
}

const fetchPerformanceTrends = async () => {
  try {
    const params = { timeRange: trendsTimeRange.value }
    const response = await performanceAPI.getPerformanceTrends(params)
    
    await nextTick()
    renderPerformanceTrendsChart(response.data)
  } catch (error) {
    console.error('Error fetching performance trends:', error)
  }
}

const fetchResourceUsage = async () => {
  try {
    const response = await performanceAPI.getResourceUsageAnalysis()
    resourceUsage.value = response.data || {}
  } catch (error) {
    console.error('Error fetching resource usage:', error)
  }
}

const fetchSlowQueries = async () => {
  try {
    const response = await performanceAPI.getSlowQueryAnalysis()
    slowQueries.value = response.data.queries || []
  } catch (error) {
    console.error('Error fetching slow queries:', error)
  }
}

const refreshSlowQueries = () => {
  fetchSlowQueries()
}

const fetchOptimizationRecommendations = async () => {
  try {
    const response = await performanceAPI.getOptimizationRecommendations()
    recommendations.value = response.data.recommendations || []
  } catch (error) {
    console.error('Error fetching optimization recommendations:', error)
  }
}

const runHealthCheck = async () => {
  healthCheckLoading.value = true
  try {
    const response = await performanceAPI.performHealthCheck()
    healthCheckResults.value = response.data
    showHealthCheckDialog.value = true
    
    ElMessage.success('系统健康检查完成')
  } catch (error) {
    ElMessage.error('系统健康检查失败')
    console.error('Error performing health check:', error)
  } finally {
    healthCheckLoading.value = false
  }
}

const toggleAutoRefresh = (enabled) => {
  if (enabled) {
    refreshTimer = setInterval(fetchRealtimePerformance, 30000) // 30秒刷新一次
    ElMessage.success('已开启自动刷新')
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

const viewQueryDetail = (query) => {
  selectedQuery.value = query
  showQueryDetailDialog.value = true
}

const filterRecommendations = () => {
  // 筛选已在计算属性中处理
}

// 图表渲染
const renderPerformanceTrendsChart = (data) => {
  if (!performanceTrendsChartRef.value) return
  
  if (performanceTrendsChart) {
    performanceTrendsChart.dispose()
  }
  
  performanceTrendsChart = echarts.init(performanceTrendsChartRef.value)
  
  const timeline = data.timeline || []
  
  const option = {
    title: {
      text: '性能趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['响应时间', '操作数量', '性能分数'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: timeline.map(item => item.period)
    },
    yAxis: [
      {
        type: 'value',
        name: '响应时间(ms)',
        position: 'left'
      },
      {
        type: 'value',
        name: '操作数量',
        position: 'right'
      }
    ],
    series: [
      {
        name: '响应时间',
        type: 'line',
        yAxisIndex: 0,
        data: timeline.map(item => parseFloat(item.avgResponseTime)),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '操作数量',
        type: 'bar',
        yAxisIndex: 1,
        data: timeline.map(item => item.operationCount),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '性能分数',
        type: 'line',
        yAxisIndex: 0,
        data: timeline.map(item => parseFloat(item.performanceLevel === 'excellent' ? 100 : 
                                              item.performanceLevel === 'good' ? 80 : 
                                              item.performanceLevel === 'fair' ? 60 : 40)),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  performanceTrendsChart.setOption(option)
}

// 工具方法
const getHealthStatusClass = (status) => {
  const classMap = {
    'excellent': 'status-excellent',
    'good': 'status-good',
    'fair': 'status-fair',
    'poor': 'status-poor',
    'critical': 'status-critical'
  }
  return classMap[status] || 'status-unknown'
}

const getHealthIconClass = (status) => {
  const classMap = {
    'excellent': 'icon-excellent',
    'good': 'icon-good',
    'fair': 'icon-fair',
    'poor': 'icon-poor',
    'critical': 'icon-critical'
  }
  return classMap[status] || 'icon-unknown'
}

const getHealthIcon = (status) => {
  const iconMap = {
    'excellent': SuccessFilled,
    'good': CircleCheckFilled,
    'fair': WarningFilled,
    'poor': WarningFilled,
    'critical': CircleCloseFilled
  }
  return iconMap[status] || WarningFilled
}

const getHealthText = (status) => {
  const textMap = {
    'excellent': '优秀',
    'good': '良好',
    'fair': '一般',
    'poor': '较差',
    'critical': '严重',
    'healthy': '健康',
    'warning': '警告'
  }
  return textMap[status] || '未知'
}

const getHealthAlertType = (status) => {
  const typeMap = {
    'excellent': 'success',
    'good': 'success',
    'fair': 'warning',
    'poor': 'warning',
    'critical': 'error',
    'healthy': 'success',
    'warning': 'warning'
  }
  return typeMap[status] || 'info'
}

const getHealthTagType = (status) => {
  const typeMap = {
    'excellent': 'success',
    'good': 'success',
    'fair': 'warning',
    'poor': 'danger',
    'critical': 'danger',
    'healthy': 'success',
    'warning': 'warning'
  }
  return typeMap[status] || 'info'
}

const getTrendClass = (trend) => {
  if (trend > 0) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return 'trend-stable'
}

const getTrendText = (trend) => {
  if (trend > 0) return `↑ ${trend}%`
  if (trend < 0) return `↓ ${Math.abs(trend)}%`
  return '→ 稳定'
}

const getResourceColor = (percentage) => {
  if (percentage <= 70) return '#67C23A'
  if (percentage <= 85) return '#E6A23C'
  return '#F56C6C'
}

const getQuerySeverityColor = (responseTime) => {
  if (responseTime >= 5000) return 'danger'
  if (responseTime >= 2000) return 'warning'
  if (responseTime >= 1000) return 'primary'
  return 'success'
}

const getPriorityColor = (priority) => {
  const colorMap = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'success'
  }
  return colorMap[priority] || 'info'
}

const getPriorityText = (priority) => {
  const textMap = {
    'critical': '严重',
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[priority] || '未知'
}

const getCheckDisplayName = (name) => {
  const nameMap = {
    'database': '数据库',
    'memory': '内存',
    'performance': '性能',
    'dependencies': '依赖服务'
  }
  return nameMap[name] || name
}

const getCheckIconClass = (status) => {
  const classMap = {
    'healthy': 'check-healthy',
    'warning': 'check-warning',
    'critical': 'check-critical'
  }
  return classMap[status] || 'check-unknown'
}

const getCheckIcon = (status) => {
  const iconMap = {
    'healthy': CircleCheckFilled,
    'warning': WarningFilled,
    'critical': CircleCloseFilled
  }
  return iconMap[status] || WarningFilled
}

// 窗口大小调整处理
const handleResize = () => {
  performanceTrendsChart?.resize()
}

// 生命周期
onMounted(() => {
  refreshPerformanceData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  performanceTrendsChart?.dispose()
  window.removeEventListener('resize', handleResize)
  
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.performance-monitor {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.performance-overview {
  margin-bottom: 20px;
}

.metric-card {
  position: relative;
  overflow: hidden;
}

.metric-card.status-excellent {
  border-left: 4px solid #67C23A;
}

.metric-card.status-good {
  border-left: 4px solid #95D475;
}

.metric-card.status-fair {
  border-left: 4px solid #E6A23C;
}

.metric-card.status-poor {
  border-left: 4px solid #F89898;
}

.metric-card.status-critical {
  border-left: 4px solid #F56C6C;
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  font-size: 40px;
  margin-right: 15px;
  opacity: 0.8;
}

.metric-icon.icon-excellent {
  color: #67C23A;
}

.metric-icon.icon-good {
  color: #95D475;
}

.metric-icon.icon-fair {
  color: #E6A23C;
}

.metric-icon.icon-poor {
  color: #F89898;
}

.metric-icon.icon-critical {
  color: #F56C6C;
}

.metric-icon.response-time {
  color: #E6A23C;
}

.metric-icon.memory {
  color: #409EFF;
}

.metric-icon.concurrency {
  color: #9254DE;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-status {
  font-size: 12px;
  color: #606266;
}

.metric-trend {
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  color: #F56C6C;
}

.trend-down {
  color: #67C23A;
}

.trend-stable {
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.resource-usage {
  padding: 20px 0;
}

.resource-item {
  margin-bottom: 20px;
}

.resource-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.slow-queries {
  max-height: 300px;
  overflow-y: auto;
}

.query-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.query-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.query-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-time {
  font-weight: bold;
  color: #E6A23C;
}

.query-timestamp {
  font-size: 12px;
  color: #C0C4CC;
}

.query-resource {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.query-metadata {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.optimization-recommendations {
  max-height: 300px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
}

.recommendation-item.critical {
  border-left: 4px solid #F56C6C;
  background-color: #fef0f0;
}

.recommendation-item.high {
  border-left: 4px solid #E6A23C;
  background-color: #fdf6ec;
}

.recommendation-item.medium {
  border-left: 4px solid #409EFF;
  background-color: #ecf5ff;
}

.recommendation-item.low {
  border-left: 4px solid #67C23A;
  background-color: #f0f9ff;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.recommendation-category {
  font-size: 12px;
  color: #909399;
}

.recommendation-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.recommendation-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.recommendation-actions ul {
  margin: 0;
  padding-left: 20px;
}

.recommendation-actions li {
  font-size: 12px;
  color: #909399;
  margin-bottom: 3px;
}

.health-check-results {
  padding: 10px 0;
}

.health-overview {
  margin-bottom: 20px;
}

.health-checks {
  margin-top: 20px;
}

.check-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
}

.check-item.healthy {
  border-left: 4px solid #67C23A;
}

.check-item.warning {
  border-left: 4px solid #E6A23C;
}

.check-item.critical {
  border-left: 4px solid #F56C6C;
}

.check-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.check-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.check-healthy {
  color: #67C23A;
}

.check-warning {
  color: #E6A23C;
}

.check-critical {
  color: #F56C6C;
}

.check-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.check-details {
  margin-top: 10px;
}

.resource-details {
  padding: 10px 0;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}

:deep(.el-collapse-item__header) {
  font-size: 12px;
}

:deep(.el-collapse-item__content) {
  padding: 10px 0;
}
</style>