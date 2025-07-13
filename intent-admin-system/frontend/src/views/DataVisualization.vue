<template>
  <div class="data-visualization">
    <div class="header">
      <h2>数据可视化分析</h2>
      <div class="header-controls">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateRangeChange"
          style="width: 320px"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ dashboardData.totalOperations || 0 }}</div>
              <div class="card-label">总操作数</div>
              <div class="card-trend" :class="{ positive: dashboardData.operationTrend > 0 }">
                <el-icon><TrendCharts /></el-icon>
                {{ dashboardData.operationTrend > 0 ? '+' : '' }}{{ dashboardData.operationTrend || 0 }}%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ dashboardData.totalUsers || 0 }}</div>
              <div class="card-label">活跃用户</div>
              <div class="card-trend" :class="{ positive: dashboardData.userTrend > 0 }">
                <el-icon><User /></el-icon>
                {{ dashboardData.userTrend > 0 ? '+' : '' }}{{ dashboardData.userTrend || 0 }}%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ dashboardData.avgResponseTime || 0 }}ms</div>
              <div class="card-label">平均响应时间</div>
              <div class="card-trend" :class="{ positive: dashboardData.responseTrend < 0 }">
                <el-icon><Timer /></el-icon>
                {{ dashboardData.responseTrend > 0 ? '+' : '' }}{{ dashboardData.responseTrend || 0 }}%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ dashboardData.successRate || 0 }}%</div>
              <div class="card-label">操作成功率</div>
              <div class="card-trend" :class="{ positive: dashboardData.successTrend > 0 }">
                <el-icon><CircleCheck /></el-icon>
                {{ dashboardData.successTrend > 0 ? '+' : '' }}{{ dashboardData.successTrend || 0 }}%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 操作趋势图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>操作趋势分析</span>
              <el-select v-model="trendsInterval" size="small" @change="fetchOperationTrends">
                <el-option label="按小时" value="hour" />
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
              </el-select>
            </div>
          </template>
          <div ref="trendsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 活动热力图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统活动热力图</span>
              <el-select v-model="heatmapGranularity" size="small" @change="fetchActivityHeatmap">
                <el-option label="按小时" value="hour" />
                <el-option label="按天" value="day" />
              </el-select>
            </div>
          </template>
          <div ref="heatmapChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 用户行为分析 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>用户行为分析</span>
          </template>
          <div class="user-behavior-list">
            <div 
              v-for="user in userBehaviorData.userActivity" 
              :key="user.userId"
              class="user-item"
              @click="viewUserTimeline(user)"
            >
              <div class="user-info">
                <el-avatar :size="32">{{ user.username?.charAt(0) || 'U' }}</el-avatar>
                <div class="user-details">
                  <div class="username">{{ user.username }}</div>
                  <div class="user-stats">
                    {{ user.totalOperations }} 次操作 · {{ user.successRate }}% 成功率
                  </div>
                </div>
              </div>
              <div class="user-activity">
                <el-progress 
                  :percentage="parseFloat(user.successRate)" 
                  :color="getSuccessRateColor(user.successRate)"
                  :show-text="false"
                  :stroke-width="6"
                />
                <div class="activity-level">
                  <el-tag 
                    :type="getActivityLevelType(user.totalOperations)" 
                    size="small"
                  >
                    {{ getActivityLevel(user.totalOperations) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 操作类型分布 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>操作类型分布</span>
          </template>
          <div ref="operationDistributionChartRef" class="chart-container-small"></div>
        </el-card>
      </el-col>

      <!-- 系统健康指标 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统健康指标</span>
          </template>
          <div class="health-metrics">
            <div class="metric-item">
              <div class="metric-label">CPU 使用率</div>
              <el-progress 
                :percentage="systemHealth.cpuUsage || 0" 
                :color="getHealthColor(systemHealth.cpuUsage)"
              />
            </div>
            <div class="metric-item">
              <div class="metric-label">内存使用率</div>
              <el-progress 
                :percentage="systemHealth.memoryUsage || 0" 
                :color="getHealthColor(systemHealth.memoryUsage)"
              />
            </div>
            <div class="metric-item">
              <div class="metric-label">数据库连接</div>
              <el-progress 
                :percentage="systemHealth.dbConnections || 0" 
                :color="getHealthColor(systemHealth.dbConnections)"
              />
            </div>
            <div class="metric-item">
              <div class="metric-label">错误率</div>
              <el-progress 
                :percentage="systemHealth.errorRate || 0" 
                :color="getErrorRateColor(systemHealth.errorRate)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户时间线对话框 -->
    <el-dialog
      v-model="showUserTimelineDialog"
      :title="`用户操作时间线 - ${selectedUser?.username}`"
      width="80%"
      top="5vh"
    >
      <div class="timeline-container">
        <div class="timeline-filters">
          <el-select v-model="timelineGroupBy" @change="fetchUserTimeline" size="small">
            <el-option label="按小时分组" value="hour" />
            <el-option label="按天分组" value="day" />
            <el-option label="按周分组" value="week" />
          </el-select>
        </div>
        <div ref="timelineChartRef" class="timeline-chart"></div>
        
        <div class="timeline-summary" v-if="userTimelineData.summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-value">{{ userTimelineData.summary.totalOperations }}</div>
                <div class="summary-label">总操作数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-value">{{ userTimelineData.summary.operationTypes?.length || 0 }}</div>
                <div class="summary-label">操作类型</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-value">{{ userTimelineData.summary.activityPattern?.peakHour || '无' }}</div>
                <div class="summary-label">活跃时段</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-value">{{ userTimelineData.summary.resourceDistribution?.length || 0 }}</div>
                <div class="summary-label">涉及资源</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  TrendCharts, User, Timer, CircleCheck 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { visualizationAPI } from '@/api/visualization'
import { performanceAPI } from '@/api/performance'

// 响应式数据
const loading = ref(false)
const dateRange = ref([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
])

const trendsInterval = ref('day')
const heatmapGranularity = ref('hour')
const timelineGroupBy = ref('day')

const dashboardData = ref({})
const userBehaviorData = ref({ userActivity: [] })
const systemHealth = ref({})
const userTimelineData = ref({})

const showUserTimelineDialog = ref(false)
const selectedUser = ref(null)

// 图表引用
const trendsChartRef = ref()
const heatmapChartRef = ref()
const operationDistributionChartRef = ref()
const timelineChartRef = ref()

// 图表实例
let trendsChart = null
let heatmapChart = null
let operationDistributionChart = null
let timelineChart = null

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchDashboardData(),
      fetchOperationTrends(),
      fetchActivityHeatmap(),
      fetchUserBehaviorAnalysis(),
      fetchOperationDistribution(),
      fetchSystemHealth()
    ])
  } catch (error) {
    ElMessage.error('数据刷新失败')
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

const fetchDashboardData = async () => {
  try {
    const params = getDateRangeParams()
    const response = await visualizationAPI.getVisualizationDashboard(params)
    dashboardData.value = response.data.summary || {}
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

const fetchOperationTrends = async () => {
  try {
    const params = {
      ...getDateRangeParams(),
      interval: trendsInterval.value
    }
    const response = await visualizationAPI.getOperationTrends(params)
    
    await nextTick()
    renderTrendsChart(response.data)
  } catch (error) {
    console.error('Error fetching operation trends:', error)
  }
}

const fetchActivityHeatmap = async () => {
  try {
    const params = {
      ...getDateRangeParams(),
      granularity: heatmapGranularity.value
    }
    const response = await visualizationAPI.getActivityHeatmapData(params)
    
    await nextTick()
    renderHeatmapChart(response.data)
  } catch (error) {
    console.error('Error fetching activity heatmap:', error)
  }
}

const fetchUserBehaviorAnalysis = async () => {
  try {
    const params = getDateRangeParams()
    const response = await visualizationAPI.getUserBehaviorAnalysis(params)
    userBehaviorData.value = response.data || { userActivity: [] }
  } catch (error) {
    console.error('Error fetching user behavior analysis:', error)
  }
}

const fetchOperationDistribution = async () => {
  try {
    const params = getDateRangeParams()
    const response = await visualizationAPI.getOperationTrends(params)
    
    await nextTick()
    renderOperationDistributionChart(response.data)
  } catch (error) {
    console.error('Error fetching operation distribution:', error)
  }
}

const fetchSystemHealth = async () => {
  try {
    const response = await performanceAPI.getResourceUsageAnalysis()
    systemHealth.value = {
      cpuUsage: Math.random() * 80, // 模拟数据
      memoryUsage: parseFloat(response.data.memory?.usage?.heapUtilization) || 0,
      dbConnections: 45,
      errorRate: Math.random() * 10
    }
  } catch (error) {
    console.error('Error fetching system health:', error)
  }
}

const fetchUserTimeline = async () => {
  if (!selectedUser.value) return
  
  try {
    const params = {
      ...getDateRangeParams(),
      groupBy: timelineGroupBy.value
    }
    const response = await visualizationAPI.getUserTimelineVisualization(
      selectedUser.value.userId, 
      params
    )
    
    userTimelineData.value = response.data || {}
    
    await nextTick()
    renderTimelineChart(response.data)
  } catch (error) {
    console.error('Error fetching user timeline:', error)
  }
}

const getDateRangeParams = () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    return {}
  }
  
  return {
    startDate: dateRange.value[0].toISOString(),
    endDate: dateRange.value[1].toISOString()
  }
}

const handleDateRangeChange = () => {
  refreshData()
}

const viewUserTimeline = (user) => {
  selectedUser.value = user
  showUserTimelineDialog.value = true
  fetchUserTimeline()
}

// 图表渲染方法
const renderTrendsChart = (data) => {
  if (!trendsChartRef.value) return
  
  if (trendsChart) {
    trendsChart.dispose()
  }
  
  trendsChart = echarts.init(trendsChartRef.value)
  
  const option = {
    title: {
      text: '操作趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['总操作数', '成功操作', '失败操作'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: data.overallTrend?.map(item => item.period) || []
    },
    yAxis: [
      {
        type: 'value',
        name: '操作数量'
      },
      {
        type: 'value',
        name: '成功率(%)',
        max: 100
      }
    ],
    series: [
      {
        name: '总操作数',
        type: 'line',
        data: data.overallTrend?.map(item => item.totalOperations) || [],
        smooth: true
      },
      {
        name: '成功操作',
        type: 'line',
        data: data.overallTrend?.map(item => item.successOperations) || [],
        smooth: true
      },
      {
        name: '失败操作',
        type: 'line',
        data: data.overallTrend?.map(item => item.failedOperations) || [],
        smooth: true
      }
    ]
  }
  
  trendsChart.setOption(option)
}

const renderHeatmapChart = (data) => {
  if (!heatmapChartRef.value) return
  
  if (heatmapChart) {
    heatmapChart.dispose()
  }
  
  heatmapChart = echarts.init(heatmapChartRef.value)
  
  const heatmapData = data.heatmapData || []
  const calendarData = heatmapData.map(item => [
    item.timeSlot,
    item.activityCount
  ])
  
  const option = {
    title: {
      text: '活动热力图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${params.data[0]}<br/>活动数量: ${params.data[1]}`
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.map(item => item.activityCount)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 'bottom'
    },
    calendar: {
      range: [dateRange.value[0], dateRange.value[1]],
      cellSize: ['auto', 20]
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calendarData
    }
  }
  
  heatmapChart.setOption(option)
}

const renderOperationDistributionChart = (data) => {
  if (!operationDistributionChartRef.value) return
  
  if (operationDistributionChart) {
    operationDistributionChart.dispose()
  }
  
  operationDistributionChart = echarts.init(operationDistributionChartRef.value)
  
  const operationTypes = Object.entries(data.operationTypeTrends || {})
    .map(([type, count]) => ({ name: type, value: count }))
    .slice(0, 10)
  
  const option = {
    title: {
      text: '操作类型分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '操作类型',
        type: 'pie',
        radius: ['40%', '70%'],
        data: operationTypes,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  operationDistributionChart.setOption(option)
}

const renderTimelineChart = (data) => {
  if (!timelineChartRef.value) return
  
  if (timelineChart) {
    timelineChart.dispose()
  }
  
  timelineChart = echarts.init(timelineChartRef.value)
  
  const timelineData = data.timelineData || []
  
  const option = {
    title: {
      text: '用户操作时间线',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: timelineData.map(item => item.period)
    },
    yAxis: {
      type: 'value',
      name: '操作数量'
    },
    series: [
      {
        name: '操作数量',
        type: 'bar',
        data: timelineData.map(item => item.operationCount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  timelineChart.setOption(option)
}

// 工具方法
const getSuccessRateColor = (rate) => {
  if (rate >= 95) return '#67C23A'
  if (rate >= 85) return '#E6A23C'
  return '#F56C6C'
}

const getActivityLevel = (operations) => {
  if (operations >= 1000) return '高活跃'
  if (operations >= 500) return '中活跃'
  if (operations >= 100) return '低活跃'
  return '不活跃'
}

const getActivityLevelType = (operations) => {
  if (operations >= 1000) return 'danger'
  if (operations >= 500) return 'warning'
  if (operations >= 100) return 'success'
  return 'info'
}

const getHealthColor = (value) => {
  if (value <= 70) return '#67C23A'
  if (value <= 85) return '#E6A23C'
  return '#F56C6C'
}

const getErrorRateColor = (rate) => {
  if (rate <= 5) return '#67C23A'
  if (rate <= 10) return '#E6A23C'
  return '#F56C6C'
}

// 窗口大小调整处理
const handleResize = () => {
  trendsChart?.resize()
  heatmapChart?.resize()
  operationDistributionChart?.resize()
  timelineChart?.resize()
}

// 生命周期
onMounted(() => {
  refreshData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  trendsChart?.dispose()
  heatmapChart?.dispose()
  operationDistributionChart?.dispose()
  timelineChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.data-visualization {
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

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.card-content {
  padding: 20px;
  text-align: center;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-trend {
  font-size: 12px;
  color: #F56C6C;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.card-trend.positive {
  color: #67C23A;
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

.chart-container-small {
  height: 280px;
  width: 100%;
}

.user-behavior-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.user-stats {
  font-size: 12px;
  color: #909399;
}

.user-activity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 120px;
}

.activity-level {
  display: flex;
  justify-content: flex-end;
}

.health-metrics {
  padding: 10px 0;
}

.metric-item {
  margin-bottom: 20px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.timeline-container {
  padding: 20px 0;
}

.timeline-filters {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.timeline-chart {
  height: 400px;
  width: 100%;
}

.timeline-summary {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #909399;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>