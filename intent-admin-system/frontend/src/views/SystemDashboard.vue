<template>
  <div class="system-dashboard">
    <div class="dashboard-header">
      <h2>系统管理仪表板</h2>
      <div class="header-actions">
        <el-badge :value="criticalAlerts" :max="99" type="danger" :hidden="criticalAlerts === 0">
          <el-button type="danger" size="small" @click="viewSecurityAlerts">
            <el-icon><Warning /></el-icon>
            严重告警
          </el-button>
        </el-badge>
        <el-button type="primary" size="small" @click="refreshDashboard" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 快速导航 -->
    <div class="quick-navigation">
      <el-row :gutter="20">
        <el-col :span="4" v-for="nav in quickNavItems" :key="nav.name">
          <el-card 
            class="nav-card" 
            :class="nav.status"
            @click="navigateTo(nav.route)"
            shadow="hover"
          >
            <div class="nav-content">
              <el-icon :class="nav.iconClass">
                <component :is="nav.icon" />
              </el-icon>
              <div class="nav-info">
                <div class="nav-title">{{ nav.title }}</div>
                <div class="nav-subtitle">{{ nav.subtitle }}</div>
              </div>
              <div class="nav-status" v-if="nav.value">
                <span class="status-value">{{ nav.value }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 系统概览 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统状态概览</span>
              <el-tag :type="getSystemStatusType(systemOverview.status)" size="large">
                {{ getSystemStatusText(systemOverview.status) }}
              </el-tag>
            </div>
          </template>
          
          <div class="system-metrics">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-icon performance">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ systemOverview.performance?.score || 0 }}</div>
                    <div class="metric-label">性能评分</div>
                    <div class="metric-trend" :class="getTrendClass(systemOverview.performance?.trend)">
                      {{ getTrendText(systemOverview.performance?.trend) }}
                    </div>
                  </div>
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-icon security">
                    <el-icon><Lock /></el-icon>
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ systemOverview.security?.alerts || 0 }}</div>
                    <div class="metric-label">安全告警</div>
                    <div class="metric-trend danger" v-if="systemOverview.security?.alerts > 0">
                      需要关注
                    </div>
                    <div class="metric-trend success" v-else>
                      状态良好
                    </div>
                  </div>
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="metric-item">
                  <div class="metric-icon activity">
                    <el-icon><DataAnalysis /></el-icon>
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ systemOverview.activity?.operations || 0 }}</div>
                    <div class="metric-label">今日操作</div>
                    <div class="metric-trend" :class="getTrendClass(systemOverview.activity?.trend)">
                      {{ getTrendText(systemOverview.activity?.trend) }}
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="system-health">
            <h4>系统健康指标</h4>
            <div class="health-indicators">
              <div class="health-item">
                <div class="health-label">CPU使用率</div>
                <el-progress 
                  :percentage="systemOverview.health?.cpu || 0" 
                  :color="getHealthColor(systemOverview.health?.cpu)"
                  :show-text="true"
                />
              </div>
              <div class="health-item">
                <div class="health-label">内存使用率</div>
                <el-progress 
                  :percentage="systemOverview.health?.memory || 0" 
                  :color="getHealthColor(systemOverview.health?.memory)"
                  :show-text="true"
                />
              </div>
              <div class="health-item">
                <div class="health-label">数据库连接</div>
                <el-progress 
                  :percentage="systemOverview.health?.database || 0" 
                  :color="getHealthColor(systemOverview.health?.database)"
                  :show-text="true"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
              <el-button type="text" size="small" @click="viewAllAuditLogs">
                查看全部
              </el-button>
            </div>
          </template>
          
          <div class="recent-activities">
            <div 
              v-for="activity in recentActivities" 
              :key="activity.id"
              class="activity-item"
              @click="viewActivityDetail(activity)"
            >
              <div class="activity-icon">
                <el-avatar :size="32" :style="{ backgroundColor: getActivityColor(activity.type) }">
                  {{ getActivityIcon(activity.type) }}
                </el-avatar>
              </div>
              <div class="activity-content">
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-meta">
                  <span class="activity-user">{{ activity.user?.username || '系统' }}</span>
                  <span class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</span>
                </div>
              </div>
              <div class="activity-status">
                <el-tag :type="activity.success ? 'success' : 'danger'" size="small">
                  {{ activity.success ? '成功' : '失败' }}
                </el-tag>
              </div>
            </div>
            
            <el-empty v-if="recentActivities.length === 0" description="暂无最近活动" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>操作趋势</span>
          </template>
          <div ref="operationTrendsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户活跃度</span>
          </template>
          <div ref="userActivityChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 关键指标和建议 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>关键指标</span>
              <el-button type="text" size="small" @click="exportReport">
                导出报告
              </el-button>
            </div>
          </template>
          
          <div class="key-metrics">
            <el-row :gutter="20">
              <el-col :span="12" v-for="metric in keyMetrics" :key="metric.key">
                <div class="key-metric-item">
                  <div class="metric-header">
                    <span class="metric-name">{{ metric.name }}</span>
                    <el-tag :type="metric.status" size="small">{{ metric.statusText }}</el-tag>
                  </div>
                  <div class="metric-value">{{ metric.value }}</div>
                  <div class="metric-description">{{ metric.description }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统建议</span>
          </template>
          
          <div class="system-recommendations">
            <div 
              v-for="recommendation in systemRecommendations" 
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
              <div class="recommendation-action" v-if="recommendation.actionable">
                <el-button type="text" size="small" @click="handleRecommendation(recommendation)">
                  立即处理
                </el-button>
              </div>
            </div>
            
            <el-empty v-if="systemRecommendations.length === 0" description="暂无系统建议" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="showActivityDialog"
      title="活动详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="selectedActivity">
        <el-descriptions-item label="操作类型">
          {{ selectedActivity.operationType }}
        </el-descriptions-item>
        <el-descriptions-item label="操作用户">
          {{ selectedActivity.user?.username || '系统' }}
        </el-descriptions-item>
        <el-descriptions-item label="资源">
          {{ selectedActivity.resource }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedActivity.success ? 'success' : 'danger'">
            {{ selectedActivity.success ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(selectedActivity.timestamp) }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ selectedActivity.ipAddress || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ selectedActivity.operationDescription }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="showActivityDialog = false">关闭</el-button>
        <el-button type="primary" @click="viewFullActivityLog">查看完整日志</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Warning, Refresh, TrendCharts, Lock, DataAnalysis,
  Document, Monitor, User
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { formatDateTime, formatRelativeTime } from '@/utils/date'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const criticalAlerts = ref(0)
const systemOverview = ref({})
const recentActivities = ref([])
const keyMetrics = ref([])
const systemRecommendations = ref([])

const showActivityDialog = ref(false)
const selectedActivity = ref(null)

// 图表引用
const operationTrendsChartRef = ref()
const userActivityChartRef = ref()
let operationTrendsChart = null
let userActivityChart = null

// 快速导航项
const quickNavItems = ref([
  {
    name: 'audit',
    title: '审计日志',
    subtitle: '查看系统操作记录',
    icon: Document,
    iconClass: 'nav-icon audit',
    route: '/audit-logs',
    status: 'normal',
    value: '1,234'
  },
  {
    name: 'permission',
    title: '权限管理',
    subtitle: '管理用户角色权限',
    icon: Lock,
    iconClass: 'nav-icon permission',
    route: '/permission-management',
    status: 'normal',
    value: '45'
  },
  {
    name: 'visualization',
    title: '数据可视化',
    subtitle: '查看数据分析图表',
    icon: DataAnalysis,
    iconClass: 'nav-icon visualization',
    route: '/data-visualization',
    status: 'normal',
    value: '实时'
  },
  {
    name: 'security',
    title: '安全监控',
    subtitle: '监控系统安全状态',
    icon: Lock,
    iconClass: 'nav-icon security',
    route: '/security-monitor',
    status: 'warning',
    value: '3'
  },
  {
    name: 'performance',
    title: '性能监控',
    subtitle: '监控系统性能指标',
    icon: Monitor,
    iconClass: 'nav-icon performance',
    route: '/performance-monitor',
    status: 'normal',
    value: '85'
  },
  {
    name: 'users',
    title: '用户管理',
    subtitle: '管理系统用户',
    icon: User,
    iconClass: 'nav-icon users',
    route: '/users',
    status: 'normal',
    value: '128'
  }
])

// 方法
const refreshDashboard = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchSystemOverview(),
      fetchRecentActivities(),
      fetchKeyMetrics(),
      fetchSystemRecommendations(),
      fetchOperationTrends(),
      fetchUserActivity()
    ])
  } catch (error) {
    ElMessage.error('仪表板数据刷新失败')
    console.error('Error refreshing dashboard:', error)
  } finally {
    loading.value = false
  }
}

const fetchSystemOverview = async () => {
  // 模拟获取系统概览数据
  systemOverview.value = {
    status: 'healthy',
    performance: {
      score: 85,
      trend: 2.3
    },
    security: {
      alerts: 3,
      status: 'warning'
    },
    activity: {
      operations: 1247,
      trend: 5.2
    },
    health: {
      cpu: 45,
      memory: 68,
      database: 32
    }
  }
  
  criticalAlerts.value = systemOverview.value.security.alerts
}

const fetchRecentActivities = async () => {
  // 模拟获取最近活动数据
  recentActivities.value = [
    {
      id: 1,
      type: 'USER_LOGIN',
      description: '用户登录系统',
      user: { username: 'admin' },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      success: true,
      ipAddress: '192.168.1.100'
    },
    {
      id: 2,
      type: 'ROLE_ASSIGN',
      description: '分配用户角色',
      user: { username: 'manager' },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      success: true,
      ipAddress: '192.168.1.101'
    },
    {
      id: 3,
      type: 'SECURITY_AUDIT',
      description: '执行安全审计',
      user: null,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      success: true,
      ipAddress: 'system'
    }
  ]
}

const fetchKeyMetrics = async () => {
  keyMetrics.value = [
    {
      key: 'response_time',
      name: '平均响应时间',
      value: '245ms',
      status: 'success',
      statusText: '良好',
      description: '系统响应速度正常'
    },
    {
      key: 'success_rate',
      name: '操作成功率',
      value: '98.5%',
      status: 'success',
      statusText: '优秀',
      description: '系统稳定性很好'
    },
    {
      key: 'security_score',
      name: '安全评分',
      value: '92',
      status: 'warning',
      statusText: '良好',
      description: '有少量安全告警'
    },
    {
      key: 'user_satisfaction',
      name: '用户满意度',
      value: '4.7/5',
      status: 'success',
      statusText: '优秀',
      description: '用户反馈积极'
    }
  ]
}

const fetchSystemRecommendations = async () => {
  systemRecommendations.value = [
    {
      id: 1,
      priority: 'high',
      category: '性能优化',
      title: '优化数据库查询',
      description: '发现多个慢查询，建议优化索引',
      actionable: true
    },
    {
      id: 2,
      priority: 'medium',
      category: '安全强化',
      title: '更新安全策略',
      description: '建议启用更严格的密码策略',
      actionable: true
    },
    {
      id: 3,
      priority: 'low',
      category: '系统维护',
      title: '清理日志文件',
      description: '系统日志文件占用空间较大',
      actionable: false
    }
  ]
}

const fetchOperationTrends = async () => {
  // 模拟操作趋势数据
  const data = {
    dates: [],
    operations: [],
    success: [],
    failed: []
  }
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.dates.push(date.toLocaleDateString())
    data.operations.push(Math.floor(Math.random() * 200 + 100))
    data.success.push(Math.floor(Math.random() * 180 + 80))
    data.failed.push(Math.floor(Math.random() * 20 + 5))
  }
  
  await nextTick()
  renderOperationTrendsChart(data)
}

const fetchUserActivity = async () => {
  // 模拟用户活跃度数据
  const data = {
    hours: [],
    activity: []
  }
  
  for (let i = 0; i < 24; i++) {
    data.hours.push(`${i}:00`)
    data.activity.push(Math.floor(Math.random() * 50 + 10))
  }
  
  await nextTick()
  renderUserActivityChart(data)
}

const navigateTo = (route) => {
  router.push(route)
}

const viewSecurityAlerts = () => {
  router.push('/security-monitor')
}

const viewAllAuditLogs = () => {
  router.push('/audit-logs')
}

const viewActivityDetail = (activity) => {
  selectedActivity.value = activity
  showActivityDialog.value = true
}

const viewFullActivityLog = () => {
  showActivityDialog.value = false
  router.push('/audit-logs')
}

const handleRecommendation = (recommendation) => {
  ElMessage.success(`正在处理建议: ${recommendation.title}`)
  // 这里可以实现具体的处理逻辑
}

const exportReport = () => {
  ElMessage.success('报告导出功能开发中...')
}

// 图表渲染
const renderOperationTrendsChart = (data) => {
  if (!operationTrendsChartRef.value) return
  
  if (operationTrendsChart) {
    operationTrendsChart.dispose()
  }
  
  operationTrendsChart = echarts.init(operationTrendsChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总操作', '成功', '失败'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '总操作',
        type: 'line',
        data: data.operations,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '成功',
        type: 'line',
        data: data.success,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '失败',
        type: 'line',
        data: data.failed,
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  
  operationTrendsChart.setOption(option)
}

const renderUserActivityChart = (data) => {
  if (!userActivityChartRef.value) return
  
  if (userActivityChart) {
    userActivityChart.dispose()
  }
  
  userActivityChart = echarts.init(userActivityChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.hours
    },
    yAxis: {
      type: 'value',
      name: '活跃用户数'
    },
    series: [
      {
        name: '活跃用户',
        type: 'bar',
        data: data.activity,
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
  
  userActivityChart.setOption(option)
}

// 工具方法
const getSystemStatusType = (status) => {
  const typeMap = {
    'healthy': 'success',
    'warning': 'warning',
    'error': 'danger'
  }
  return typeMap[status] || 'info'
}

const getSystemStatusText = (status) => {
  const textMap = {
    'healthy': '健康',
    'warning': '警告',
    'error': '错误'
  }
  return textMap[status] || '未知'
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

const getHealthColor = (percentage) => {
  if (percentage <= 70) return '#67C23A'
  if (percentage <= 85) return '#E6A23C'
  return '#F56C6C'
}

const getActivityColor = (type) => {
  const colorMap = {
    'USER_LOGIN': '#67C23A',
    'USER_LOGOUT': '#909399',
    'ROLE_ASSIGN': '#409EFF',
    'SECURITY_AUDIT': '#E6A23C',
    'PERFORMANCE_CHECK': '#F56C6C'
  }
  return colorMap[type] || '#409EFF'
}

const getActivityIcon = (type) => {
  const iconMap = {
    'USER_LOGIN': '登',
    'USER_LOGOUT': '出',
    'ROLE_ASSIGN': '角',
    'SECURITY_AUDIT': '安',
    'PERFORMANCE_CHECK': '性'
  }
  return iconMap[type] || '操'
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

// 窗口大小调整处理
const handleResize = () => {
  operationTrendsChart?.resize()
  userActivityChart?.resize()
}

// 生命周期
onMounted(() => {
  refreshDashboard()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  operationTrendsChart?.dispose()
  userActivityChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.system-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.quick-navigation {
  margin-bottom: 30px;
}

.nav-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.nav-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.nav-card.warning {
  border-left: 4px solid #E6A23C;
}

.nav-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.nav-icon {
  font-size: 32px;
  margin-right: 15px;
}

.nav-icon.audit {
  color: #409EFF;
}

.nav-icon.permission {
  color: #E6A23C;
}

.nav-icon.visualization {
  color: #67C23A;
}

.nav-icon.security {
  color: #F56C6C;
}

.nav-icon.performance {
  color: #9254DE;
}

.nav-icon.users {
  color: #13C2C2;
}

.nav-info {
  flex: 1;
}

.nav-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.nav-subtitle {
  font-size: 12px;
  color: #909399;
}

.nav-status {
  text-align: right;
}

.status-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.system-metrics {
  margin-bottom: 30px;
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  background-color: #FAFAFA;
}

.metric-icon {
  font-size: 40px;
  margin-right: 15px;
  opacity: 0.8;
}

.metric-icon.performance {
  color: #409EFF;
}

.metric-icon.security {
  color: #F56C6C;
}

.metric-icon.activity {
  color: #67C23A;
}

.metric-content {
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

.metric-trend {
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.trend-stable {
  color: #909399;
}

.success {
  color: #67C23A;
}

.danger {
  color: #F56C6C;
}

.system-health h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.health-indicators {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.health-label {
  width: 100px;
  font-size: 14px;
  color: #606266;
}

.recent-activities {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.activity-item:hover {
  background-color: #F8F9FA;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 15px;
}

.activity-content {
  flex: 1;
}

.activity-description {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.activity-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.activity-status {
  margin-left: 10px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.key-metrics {
  padding: 10px 0;
}

.key-metric-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.metric-description {
  font-size: 12px;
  color: #909399;
}

.system-recommendations {
  max-height: 400px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
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

.recommendation-action {
  text-align: right;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>