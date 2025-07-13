<template>
  <div class="audit-logs">
    <div class="header">
      <h2>审计日志管理</h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Search" 
          @click="showSearchDialog = true"
        >
          高级搜索
        </el-button>
        <el-button 
          type="success" 
          :icon="Download" 
          @click="exportLogs"
          :loading="exportLoading"
        >
          导出日志
        </el-button>
        <el-button 
          :icon="Refresh" 
          @click="fetchLogs"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="操作类型">
          <el-select 
            v-model="filters.operationType" 
            placeholder="选择操作类型"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="type in operationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户">
          <el-select 
            v-model="filters.userId" 
            placeholder="选择用户"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 320px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select 
            v-model="filters.success" 
            placeholder="操作状态"
            clearable
            style="width: 120px"
          >
            <el-option label="成功" :value="true" />
            <el-option label="失败" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleFilter" :loading="loading">
            筛选
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalOperations || 0 }}</div>
              <div class="stat-label">总操作数</div>
            </div>
            <el-icon class="stat-icon" color="#409EFF">
              <Document />
            </el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.todayOperations || 0 }}</div>
              <div class="stat-label">今日操作</div>
            </div>
            <el-icon class="stat-icon" color="#67C23A">
              <Calendar />
            </el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ statistics.activeUsers || 0 }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
            <el-icon class="stat-icon" color="#E6A23C">
              <User />
            </el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
            <el-icon class="stat-icon" color="#F56C6C">
              <TrendCharts />
            </el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 日志表格 -->
    <el-card>
      <el-table 
        :data="logs" 
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="请求ID">
                  {{ row.requestId || '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="响应时间">
                  {{ row.responseTime ? `${row.responseTime}ms` : '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="旧值">
                  <el-tag v-if="!row.oldValues" type="info">无</el-tag>
                  <pre v-else class="json-content">{{ formatJSON(row.oldValues) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="新值">
                  <el-tag v-if="!row.newValues" type="info">无</el-tag>
                  <pre v-else class="json-content">{{ formatJSON(row.newValues) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="元数据" :span="2">
                  <pre v-if="row.metadata" class="json-content">{{ formatJSON(row.metadata) }}</pre>
                  <el-tag v-else type="info">无</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="operationType" label="操作类型" width="160">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeColor(row.operationType)">
              {{ getOperationTypeLabel(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="user" label="操作用户" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="24" :src="row.user?.avatar">
                {{ row.user?.username?.charAt(0) || 'U' }}
              </el-avatar>
              <span>{{ row.user?.username || '系统' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="resource" label="资源" width="100" />

        <el-table-column prop="resourceName" label="资源名称" width="150" show-overflow-tooltip />

        <el-table-column prop="operationDescription" label="操作描述" min-width="200" show-overflow-tooltip />

        <el-table-column prop="ipAddress" label="IP地址" width="130" />

        <el-table-column prop="success" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="timestamp" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.timestamp) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="text" 
              size="small" 
              @click.stop="viewLogDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 高级搜索对话框 -->
    <el-dialog
      v-model="showSearchDialog"
      title="高级搜索"
      width="600px"
    >
      <el-form :model="searchForm" label-width="100px">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="搜索操作描述、资源名称等"
          />
        </el-form-item>
        
        <el-form-item label="操作类型">
          <el-select 
            v-model="searchForm.operationTypes" 
            multiple
            placeholder="选择操作类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in operationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="IP地址">
          <el-input 
            v-model="searchForm.ipAddress" 
            placeholder="IP地址"
          />
        </el-form-item>

        <el-form-item label="用户代理">
          <el-input 
            v-model="searchForm.userAgent" 
            placeholder="User-Agent"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSearchDialog = false">取消</el-button>
        <el-button type="primary" @click="performAdvancedSearch">搜索</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="日志详情"
      width="800px"
    >
      <el-descriptions :column="2" border v-if="selectedLog">
        <el-descriptions-item label="操作ID">
          {{ selectedLog.id }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeColor(selectedLog.operationType)">
            {{ getOperationTypeLabel(selectedLog.operationType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作用户">
          {{ selectedLog.user?.username || '系统' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户角色">
          {{ selectedLog.user?.role || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="资源">
          {{ selectedLog.resource }}
        </el-descriptions-item>
        <el-descriptions-item label="资源ID">
          {{ selectedLog.resourceId || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ selectedLog.operationDescription }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ selectedLog.ipAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">
          {{ selectedLog.userAgent || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求ID">
          {{ selectedLog.requestId || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="响应时间">
          {{ selectedLog.responseTime ? `${selectedLog.responseTime}ms` : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="selectedLog.success ? 'success' : 'danger'">
            {{ selectedLog.success ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(selectedLog.timestamp) }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="selectedLog?.oldValues || selectedLog?.newValues" style="margin-top: 20px">
        <h4>数据变更</h4>
        <el-row :gutter="20">
          <el-col :span="12" v-if="selectedLog.oldValues">
            <h5>变更前</h5>
            <pre class="json-content">{{ formatJSON(selectedLog.oldValues) }}</pre>
          </el-col>
          <el-col :span="12" v-if="selectedLog.newValues">
            <h5>变更后</h5>
            <pre class="json-content">{{ formatJSON(selectedLog.newValues) }}</pre>
          </el-col>
        </el-row>
      </div>

      <div v-if="selectedLog?.metadata" style="margin-top: 20px">
        <h4>元数据</h4>
        <pre class="json-content">{{ formatJSON(selectedLog.metadata) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Download, Refresh, Document, Calendar, 
  User, TrendCharts 
} from '@element-plus/icons-vue'
import { auditAPI } from '@/api/audit'
import { formatDateTime } from '@/utils/date'

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const logs = ref([])
const users = ref([])
const statistics = ref({})
const showSearchDialog = ref(false)
const showDetailDialog = ref(false)
const selectedLog = ref(null)

// 过滤器
const filters = reactive({
  operationType: '',
  userId: '',
  dateRange: [],
  success: null
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  operationTypes: [],
  ipAddress: '',
  userAgent: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 操作类型选项
const operationTypes = ref([
  { label: '用户登录', value: 'USER_LOGIN' },
  { label: '用户登出', value: 'USER_LOGOUT' },
  { label: '创建用户', value: 'USER_CREATE' },
  { label: '更新用户', value: 'USER_UPDATE' },
  { label: '删除用户', value: 'USER_DELETE' },
  { label: '创建意图', value: 'INTENT_CREATE' },
  { label: '更新意图', value: 'INTENT_UPDATE' },
  { label: '删除意图', value: 'INTENT_DELETE' },
  { label: '角色分配', value: 'ROLE_ASSIGN' },
  { label: '权限授予', value: 'PERMISSION_GRANT' },
  { label: '数据导出', value: 'DATA_EXPORT' },
  { label: '系统配置', value: 'SYSTEM_CONFIG' },
  { label: '安全审计', value: 'SECURITY_AUDIT' }
])

// 计算属性
const successRate = computed(() => {
  const total = statistics.value.totalOperations || 0
  const successful = statistics.value.successfulOperations || 0
  return total > 0 ? Math.round((successful / total) * 100) : 0
})

// 方法
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }

    const response = await auditAPI.getAuditLogs(params)
    logs.value = response.data.logs || []
    pagination.total = response.data.total || 0
    statistics.value = response.data.statistics || {}
  } catch (error) {
    ElMessage.error('获取审计日志失败')
    console.error('Error fetching audit logs:', error)
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pagination.page = 1
  fetchLogs()
}

const resetFilter = () => {
  Object.assign(filters, {
    operationType: '',
    userId: '',
    dateRange: [],
    success: null
  })
  pagination.page = 1
  fetchLogs()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchLogs()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchLogs()
}

const handleRowClick = (row) => {
  viewLogDetail(row)
}

const viewLogDetail = (log) => {
  selectedLog.value = log
  showDetailDialog.value = true
}

const performAdvancedSearch = async () => {
  showSearchDialog.value = false
  loading.value = true
  
  try {
    const response = await auditAPI.searchAuditLogs({
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    })
    
    logs.value = response.data.logs || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error('搜索失败')
    console.error('Error searching logs:', error)
  } finally {
    loading.value = false
  }
}

const exportLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要导出当前筛选条件下的审计日志吗？', '确认导出', {
      type: 'warning'
    })
    
    exportLoading.value = true
    
    const params = { ...filters }
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    
    const response = await auditAPI.exportAuditLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
      console.error('Error exporting logs:', error)
    }
  } finally {
    exportLoading.value = false
  }
}

const getOperationTypeLabel = (type) => {
  const option = operationTypes.value.find(op => op.value === type)
  return option ? option.label : type
}

const getOperationTypeColor = (type) => {
  const colorMap = {
    'USER_LOGIN': 'success',
    'USER_LOGOUT': 'info',
    'USER_CREATE': 'primary',
    'USER_UPDATE': 'warning',
    'USER_DELETE': 'danger',
    'INTENT_CREATE': 'primary',
    'INTENT_UPDATE': 'warning',
    'INTENT_DELETE': 'danger',
    'ROLE_ASSIGN': 'success',
    'PERMISSION_GRANT': 'success',
    'DATA_EXPORT': 'info',
    'SYSTEM_CONFIG': 'warning',
    'SECURITY_AUDIT': 'danger'
  }
  return colorMap[type] || ''
}

const formatJSON = (data) => {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  } catch {
    return data
  }
}

// 生命周期
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.audit-logs {
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
}

.filter-card {
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  opacity: 0.3;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-content {
  padding: 20px;
  background-color: #f8f9fa;
}

.json-content {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__expand-icon) {
  color: #409EFF;
}

:deep(.el-table__expanded-cell) {
  padding: 0 !important;
}
</style>