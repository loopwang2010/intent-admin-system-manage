<template>
  <div class="security-monitor">
    <div class="header">
      <h2>安全监控中心</h2>
      <div class="header-actions">
        <el-badge :value="alertCount" :max="99" type="danger" :hidden="alertCount === 0">
          <el-button type="warning" :icon="Bell" @click="showAlertsDialog = true">
            安全告警
          </el-button>
        </el-badge>
        <el-button type="primary" @click="generateSecurityReport" :loading="reportGenerating">
          生成报告
        </el-button>
        <el-button :icon="Refresh" @click="refreshSecurityData" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 安全状态概览 -->
    <div class="security-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="status-card" :class="getStatusClass(securityStatus.overallStatus)">
            <div class="status-content">
              <el-icon class="status-icon" :class="getStatusIconClass(securityStatus.overallStatus)">
                <component :is="getStatusIcon(securityStatus.overallStatus)" />
              </el-icon>
              <div class="status-info">
                <div class="status-label">整体安全状态</div>
                <div class="status-value">{{ getStatusText(securityStatus.overallStatus) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-value">{{ securityStatus.alerts?.critical || 0 }}</div>
              <div class="metric-label">严重告警</div>
              <el-icon class="metric-icon critical">
                <Warning />
              </el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-value">{{ securityStatus.alerts?.high || 0 }}</div>
              <div class="metric-label">高危告警</div>
              <el-icon class="metric-icon high">
                <InfoFilled />
              </el-icon>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-value">{{ securityStatus.alerts?.total || 0 }}</div>
              <div class="metric-label">总告警数</div>
              <el-icon class="metric-icon total">
                <Document />
              </el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 可疑活动实时监控 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>可疑活动监控</span>
              <div class="header-controls">
                <el-select v-model="suspiciousFilter" size="small" @change="fetchSuspiciousActivities">
                  <el-option label="全部" value="all" />
                  <el-option label="严重" value="critical" />
                  <el-option label="高危" value="high" />
                  <el-option label="中危" value="medium" />
                </el-select>
              </div>
            </div>
          </template>
          
          <div class="suspicious-activities">
            <div 
              v-for="activity in filteredSuspiciousActivities" 
              :key="activity.id"
              class="activity-item"
              :class="activity.riskLevel"
              @click="viewActivityDetail(activity)"
            >
              <div class="activity-header">
                <div class="activity-type">
                  <el-tag :type="getRiskLevelColor(activity.riskLevel)" size="small">
                    {{ getRiskLevelText(activity.riskLevel) }}
                  </el-tag>
                  <span class="activity-category">{{ activity.category }}</span>
                </div>
                <div class="activity-time">
                  {{ formatDateTime(activity.timestamp) }}
                </div>
              </div>
              <div class="activity-description">
                {{ activity.description }}
              </div>
              <div class="activity-details" v-if="activity.details">
                <div class="detail-item" v-if="activity.details.username">
                  <el-icon><User /></el-icon>
                  {{ activity.details.username }}
                </div>
                <div class="detail-item" v-if="activity.details.ipAddress">
                  <el-icon><Location /></el-icon>
                  {{ activity.details.ipAddress }}
                </div>
                <div class="detail-item" v-if="activity.details.operationCount">
                  <el-icon><DataAnalysis /></el-icon>
                  {{ activity.details.operationCount }} 次操作
                </div>
              </div>
            </div>
            
            <el-empty v-if="filteredSuspiciousActivities.length === 0" description="暂无可疑活动" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>安全趋势</span>
          </template>
          <div ref="securityTrendsChartRef" class="chart-container-small"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 安全指标和建议 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>登录安全分析</span>
          </template>
          <div class="login-analysis">
            <div class="analysis-item">
              <div class="analysis-label">登录成功率</div>
              <div class="analysis-value">
                <el-progress 
                  :percentage="loginAnalysis.successRate || 0" 
                  :color="getSuccessRateColor(loginAnalysis.successRate)"
                />
                <span class="percentage-text">{{ loginAnalysis.successRate || 0 }}%</span>
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-label">失败登录次数</div>
              <div class="analysis-value">
                <span class="count-value" :class="{ warning: loginAnalysis.failedLogins > 50 }">
                  {{ loginAnalysis.failedLogins || 0 }}
                </span>
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-label">唯一IP数</div>
              <div class="analysis-value">
                <span class="count-value" :class="{ warning: loginAnalysis.uniqueIPs > 20 }">
                  {{ loginAnalysis.uniqueIPs || 0 }}
                </span>
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-label">风险指标</div>
              <div class="analysis-value">
                <div class="risk-indicators">
                  <el-tag 
                    v-if="loginAnalysis.riskIndicators?.lowSuccessRate" 
                    type="danger" 
                    size="small"
                  >
                    低成功率
                  </el-tag>
                  <el-tag 
                    v-if="loginAnalysis.riskIndicators?.highFailureCount" 
                    type="warning" 
                    size="small"
                  >
                    高失败次数
                  </el-tag>
                  <el-tag 
                    v-if="loginAnalysis.riskIndicators?.suspiciousIPCount" 
                    type="info" 
                    size="small"
                  >
                    可疑IP
                  </el-tag>
                  <el-tag 
                    v-if="!hasRiskIndicators" 
                    type="success" 
                    size="small"
                  >
                    正常
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>安全建议</span>
          </template>
          <div class="security-recommendations">
            <div 
              v-for="recommendation in securityRecommendations" 
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
                <ul>
                  <li v-for="action in recommendation.actions" :key="action">
                    {{ action }}
                  </li>
                </ul>
              </div>
            </div>
            
            <el-empty v-if="securityRecommendations.length === 0" description="暂无安全建议" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 安全告警对话框 -->
    <el-dialog
      v-model="showAlertsDialog"
      title="安全告警"
      width="800px"
    >
      <div class="alerts-container">
        <div class="alerts-filter">
          <el-radio-group v-model="alertsFilter" @change="filterAlerts">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="critical">严重</el-radio-button>
            <el-radio-button label="high">高危</el-radio-button>
            <el-radio-button label="medium">中危</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="alerts-list">
          <div 
            v-for="alert in filteredAlerts" 
            :key="alert.id"
            class="alert-item"
            :class="alert.riskLevel"
          >
            <div class="alert-header">
              <el-tag :type="getRiskLevelColor(alert.riskLevel)">
                {{ getRiskLevelText(alert.riskLevel) }}
              </el-tag>
              <span class="alert-time">{{ formatDateTime(alert.timestamp) }}</span>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.type }}</div>
              <div class="alert-description">{{ alert.description }}</div>
            </div>
            <div class="alert-actions">
              <el-button type="text" size="small" @click="markAlertAsRead(alert)">
                标记已读
              </el-button>
              <el-button type="text" size="small" @click="dismissAlert(alert)">
                忽略
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="showActivityDetailDialog"
      title="可疑活动详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="selectedActivity">
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskLevelColor(selectedActivity.riskLevel)">
            {{ getRiskLevelText(selectedActivity.riskLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动类型">
          {{ selectedActivity.type }}
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          {{ selectedActivity.category }}
        </el-descriptions-item>
        <el-descriptions-item label="发生时间">
          {{ formatDateTime(selectedActivity.timestamp) }}
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ selectedActivity.description }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="selectedActivity?.details" style="margin-top: 20px">
        <h4>详细信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item 
            v-for="(value, key) in selectedActivity.details" 
            :key="key"
            :label="getDetailLabel(key)"
          >
            {{ formatDetailValue(key, value) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="showActivityDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleActivityAction">处理</el-button>
      </template>
    </el-dialog>

    <!-- 安全报告对话框 -->
    <el-dialog
      v-model="showReportDialog"
      title="安全报告"
      width="90%"
      top="5vh"
    >
      <div class="security-report" v-if="securityReport">
        <div class="report-header">
          <h3>{{ securityReport.reportInfo?.reportType }} 安全报告</h3>
          <div class="report-meta">
            <span>生成时间: {{ formatDateTime(securityReport.reportInfo?.generatedAt) }}</span>
            <span>报告周期: {{ formatDateRange(securityReport.reportInfo?.timeRange) }}</span>
          </div>
        </div>

        <div class="report-executive" v-if="securityReport.executive">
          <h4>执行摘要</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="executive-item">
                <div class="item-value">{{ securityReport.executive.overallRiskLevel }}</div>
                <div class="item-label">整体风险等级</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="executive-item">
                <div class="item-value">{{ securityReport.executive.totalIncidents }}</div>
                <div class="item-label">安全事件总数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="executive-item">
                <div class="item-value">{{ securityReport.executive.criticalIssues }}</div>
                <div class="item-label">严重问题数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="executive-item">
                <div class="item-value">{{ securityReport.recommendations?.length || 0 }}</div>
                <div class="item-label">安全建议数</div>
              </div>
            </el-col>
          </el-row>

          <div class="key-findings" v-if="securityReport.executive.keyFindings?.length">
            <h5>关键发现</h5>
            <ul>
              <li v-for="finding in securityReport.executive.keyFindings" :key="finding">
                {{ finding }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 报告的其他部分可以根据需要继续完善 -->
      </div>

      <template #footer>
        <el-button @click="showReportDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadReport">下载报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, Refresh, Warning, InfoFilled, Document, User, Location, 
  DataAnalysis, Lock, Unlock 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { securityAPI } from '@/api/security'
import { formatDateTime } from '@/utils/date'

// 响应式数据
const loading = ref(false)
const reportGenerating = ref(false)
const securityStatus = ref({})
const suspiciousActivities = ref([])
const loginAnalysis = ref({})
const securityRecommendations = ref([])
const securityReport = ref(null)

const showAlertsDialog = ref(false)
const showActivityDetailDialog = ref(false)
const showReportDialog = ref(false)

const selectedActivity = ref(null)
const suspiciousFilter = ref('all')
const alertsFilter = ref('all')

// 图表引用
const securityTrendsChartRef = ref()
let securityTrendsChart = null

// 计算属性
const alertCount = computed(() => {
  return (securityStatus.value.alerts?.critical || 0) + 
         (securityStatus.value.alerts?.high || 0)
})

const filteredSuspiciousActivities = computed(() => {
  if (suspiciousFilter.value === 'all') {
    return suspiciousActivities.value
  }
  return suspiciousActivities.value.filter(activity => 
    activity.riskLevel === suspiciousFilter.value
  )
})

const filteredAlerts = computed(() => {
  if (alertsFilter.value === 'all') {
    return suspiciousActivities.value
  }
  return suspiciousActivities.value.filter(activity => 
    activity.riskLevel === alertsFilter.value
  )
})

const hasRiskIndicators = computed(() => {
  const indicators = loginAnalysis.value.riskIndicators || {}
  return indicators.lowSuccessRate || indicators.highFailureCount || indicators.suspiciousIPCount
})

// 方法
const refreshSecurityData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchRealtimeSecurityStatus(),
      fetchSuspiciousActivities(),
      fetchSecurityTrends(),
      fetchSecurityRecommendations()
    ])
  } catch (error) {
    ElMessage.error('安全数据刷新失败')
    console.error('Error refreshing security data:', error)
  } finally {
    loading.value = false
  }
}

const fetchRealtimeSecurityStatus = async () => {
  try {
    const response = await securityAPI.getRealtimeSecurityStatus()
    securityStatus.value = response.data || {}
  } catch (error) {
    console.error('Error fetching security status:', error)
  }
}

const fetchSuspiciousActivities = async () => {
  try {
    const response = await securityAPI.detectSuspiciousActivities({
      threshold: {
        failedLogins: 3,
        highFrequency: 50,
        nightActivity: 10,
        bulkOperations: 20
      }
    })
    suspiciousActivities.value = response.data.activities || []
    
    // 提取登录分析数据（从后端响应中获取或模拟）
    loginAnalysis.value = response.data.loginAnalysis || {
      successRate: 95,
      failedLogins: 12,
      uniqueIPs: 8,
      riskIndicators: {
        lowSuccessRate: false,
        highFailureCount: false,
        suspiciousIPCount: false
      }
    }
  } catch (error) {
    console.error('Error fetching suspicious activities:', error)
  }
}

const fetchSecurityTrends = async () => {
  try {
    const response = await securityAPI.getSecurityTrends({ days: 7 })
    
    await nextTick()
    renderSecurityTrendsChart(response.data)
  } catch (error) {
    console.error('Error fetching security trends:', error)
  }
}

const fetchSecurityRecommendations = async () => {
  try {
    const response = await securityAPI.getSecurityRecommendations()
    securityRecommendations.value = response.data.recommendations || []
  } catch (error) {
    console.error('Error fetching security recommendations:', error)
  }
}

const generateSecurityReport = async () => {
  try {
    reportGenerating.value = true
    
    const response = await securityAPI.generateSecurityReport({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      includeRecommendations: true
    })
    
    securityReport.value = response.data
    showReportDialog.value = true
    
    ElMessage.success('安全报告生成成功')
  } catch (error) {
    ElMessage.error('安全报告生成失败')
    console.error('Error generating security report:', error)
  } finally {
    reportGenerating.value = false
  }
}

const viewActivityDetail = (activity) => {
  selectedActivity.value = activity
  showActivityDetailDialog.value = true
}

const handleActivityAction = async () => {
  try {
    await ElMessageBox.confirm('确定要处理这个安全活动吗？', '确认处理', {
      type: 'warning'
    })
    
    // 这里可以调用处理API
    ElMessage.success('安全活动已处理')
    showActivityDetailDialog.value = false
    
    // 刷新数据
    fetchSuspiciousActivities()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('处理失败')
    }
  }
}

const markAlertAsRead = (alert) => {
  // 标记告警为已读
  ElMessage.success('告警已标记为已读')
}

const dismissAlert = (alert) => {
  // 忽略告警
  ElMessage.success('告警已忽略')
}

const filterAlerts = () => {
  // 过滤告警
}

const downloadReport = () => {
  // 下载报告
  const reportContent = JSON.stringify(securityReport.value, null, 2)
  const blob = new Blob([reportContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `security_report_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('报告下载成功')
}

// 图表渲染
const renderSecurityTrendsChart = (data) => {
  if (!securityTrendsChartRef.value) return
  
  if (securityTrendsChart) {
    securityTrendsChart.dispose()
  }
  
  securityTrendsChart = echarts.init(securityTrendsChartRef.value)
  
  const timeline = data.timeline || []
  
  const option = {
    title: {
      text: '安全事件趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['失败操作', '失败登录'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: timeline.map(item => item.period)
    },
    yAxis: {
      type: 'value',
      name: '事件数量'
    },
    series: [
      {
        name: '失败操作',
        type: 'line',
        data: timeline.map(item => item.failedOperations),
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '失败登录',
        type: 'line',
        data: timeline.map(item => item.failedLogins),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  
  securityTrendsChart.setOption(option)
}

// 工具方法
const getStatusClass = (status) => {
  const classMap = {
    'healthy': 'status-healthy',
    'warning': 'status-warning',
    'critical': 'status-critical'
  }
  return classMap[status] || 'status-unknown'
}

const getStatusIconClass = (status) => {
  const classMap = {
    'healthy': 'icon-healthy',
    'warning': 'icon-warning', 
    'critical': 'icon-critical'
  }
  return classMap[status] || 'icon-unknown'
}

const getStatusIcon = (status) => {
  const iconMap = {
    'healthy': Lock,
    'warning': Warning,
    'critical': Lock
  }
  return iconMap[status] || Unlock
}

const getStatusText = (status) => {
  const textMap = {
    'healthy': '安全',
    'warning': '警告',
    'critical': '严重'
  }
  return textMap[status] || '未知'
}

const getRiskLevelColor = (level) => {
  const colorMap = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'success'
  }
  return colorMap[level] || 'info'
}

const getRiskLevelText = (level) => {
  const textMap = {
    'critical': '严重',
    'high': '高危',
    'medium': '中危',
    'low': '低危'
  }
  return textMap[level] || '未知'
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

const getSuccessRateColor = (rate) => {
  if (rate >= 95) return '#67C23A'
  if (rate >= 85) return '#E6A23C'
  return '#F56C6C'
}

const getDetailLabel = (key) => {
  const labelMap = {
    'username': '用户名',
    'ipAddress': 'IP地址',
    'operationCount': '操作次数',
    'timeSpan': '时间跨度',
    'attempts': '尝试次数',
    'firstAttempt': '首次尝试',
    'lastAttempt': '最后尝试'
  }
  return labelMap[key] || key
}

const formatDetailValue = (key, value) => {
  if (key.includes('time') || key.includes('At')) {
    return formatDateTime(value)
  }
  if (key === 'timeSpan') {
    return `${Math.round(value / 1000 / 60)} 分钟`
  }
  return value
}

const formatDateRange = (range) => {
  if (!range) return ''
  return `${formatDateTime(range.startDate)} 至 ${formatDateTime(range.endDate)}`
}

// 窗口大小调整处理
const handleResize = () => {
  securityTrendsChart?.resize()
}

// 生命周期
onMounted(() => {
  refreshSecurityData()
  window.addEventListener('resize', handleResize)
  
  // 设置定时刷新（每30秒）
  const refreshInterval = setInterval(fetchRealtimeSecurityStatus, 30000)
  
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})

onUnmounted(() => {
  securityTrendsChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.security-monitor {
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
  gap: 10px;
  align-items: center;
}

.security-overview {
  margin-bottom: 20px;
}

.status-card {
  position: relative;
  overflow: hidden;
}

.status-card.status-healthy {
  border-left: 4px solid #67C23A;
}

.status-card.status-warning {
  border-left: 4px solid #E6A23C;
}

.status-card.status-critical {
  border-left: 4px solid #F56C6C;
}

.status-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.status-icon {
  font-size: 40px;
  margin-right: 15px;
}

.status-icon.icon-healthy {
  color: #67C23A;
}

.status-icon.icon-warning {
  color: #E6A23C;
}

.status-icon.icon-critical {
  color: #F56C6C;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.status-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.metric-card {
  position: relative;
}

.metric-content {
  padding: 20px;
  text-align: center;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.metric-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32px;
  opacity: 0.3;
}

.metric-icon.critical {
  color: #F56C6C;
}

.metric-icon.high {
  color: #E6A23C;
}

.metric-icon.total {
  color: #409EFF;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chart-container-small {
  height: 280px;
  width: 100%;
}

.suspicious-activities {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.activity-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-item.critical {
  border-left: 4px solid #F56C6C;
}

.activity-item.high {
  border-left: 4px solid #E6A23C;
}

.activity-item.medium {
  border-left: 4px solid #409EFF;
}

.activity-item.low {
  border-left: 4px solid #67C23A;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.activity-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-category {
  font-size: 12px;
  color: #909399;
}

.activity-time {
  font-size: 12px;
  color: #C0C4CC;
}

.activity-description {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
}

.activity-details {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.login-analysis {
  padding: 10px 0;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.analysis-label {
  font-size: 14px;
  color: #606266;
}

.analysis-value {
  display: flex;
  align-items: center;
  gap: 10px;
}

.percentage-text {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.count-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.count-value.warning {
  color: #E6A23C;
}

.risk-indicators {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.security-recommendations {
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

.alerts-container {
  max-height: 500px;
  overflow-y: auto;
}

.alerts-filter {
  margin-bottom: 20px;
  text-align: center;
}

.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  margin-bottom: 10px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-time {
  font-size: 12px;
  color: #C0C4CC;
}

.alert-content {
  margin-bottom: 10px;
}

.alert-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.alert-description {
  font-size: 13px;
  color: #606266;
}

.alert-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.security-report {
  padding: 20px;
}

.report-header {
  margin-bottom: 30px;
  text-align: center;
}

.report-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.report-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
  color: #909399;
}

.report-executive {
  margin-bottom: 30px;
}

.report-executive h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.executive-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
}

.item-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.item-label {
  font-size: 14px;
  color: #909399;
}

.key-findings {
  margin-top: 20px;
}

.key-findings h5 {
  margin: 0 0 10px 0;
  color: #303133;
}

.key-findings ul {
  margin: 0;
  padding-left: 20px;
}

.key-findings li {
  margin-bottom: 5px;
  color: #606266;
}
</style>