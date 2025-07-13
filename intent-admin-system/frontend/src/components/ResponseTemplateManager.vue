<template>
  <div class="response-template-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>首句回复模板管理</h2>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalIntents }}</div>
              <div class="stat-label">总非核心意图</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.intentsWithResponse }}</div>
              <div class="stat-label">已配置回复</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.coveragePercentage }}%</div>
              <div class="stat-label">覆盖率</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.responseCategories }}</div>
              <div class="stat-label">回复分类</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据洞察图表 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>意图回复覆盖情况</span>
            </template>
            <div ref="coverageChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>回复模板分类分布</span>
            </template>
            <div ref="categoryChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 回复模板列表 -->
    <el-card class="response-list">
      <template #header>
        <div class="list-header">
          <span>首句回复模板列表</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索意图名称或回复内容"
            style="width: 300px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-table 
        :data="filteredResponses" 
        stripe 
        :height="400"
        v-loading="loading"
      >
        <el-table-column prop="name" label="意图名称" width="150" />
        <el-table-column prop="response" label="首句回复" min-width="300">
          <template #default="{ row }">
            <div class="response-content">
              {{ row.response }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tone" label="语调" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getToneTagType(row.tone)">
              {{ row.tone }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editResponse(row)">
              编辑
            </el-button>
            <el-button size="small" type="success" @click="testResponse(row)">
              测试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑回复模板对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑首句回复"
      width="50%"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="意图名称">
          <el-input v-model="editForm.name" disabled />
        </el-form-item>
        <el-form-item label="首句回复">
          <el-input
            v-model="editForm.response"
            type="textarea"
            rows="3"
            placeholder="请输入友好、自然的首句回复"
          />
        </el-form-item>
        <el-form-item label="语调">
          <el-select v-model="editForm.tone" placeholder="选择语调">
            <el-option label="友好" value="友好" />
            <el-option label="专业" value="专业" />
            <el-option label="幽默" value="幽默" />
            <el-option label="温暖" value="温暖" />
            <el-option label="活泼" value="活泼" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveResponse">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 测试回复对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="测试首句回复"
      width="40%"
    >
      <div class="test-content">
        <div class="intent-info">
          <h4>{{ testForm.name }}</h4>
          <p>{{ testForm.description }}</p>
        </div>
        <div class="response-preview">
          <h5>首句回复预览：</h5>
          <div class="response-bubble">
            {{ testForm.response }}
          </div>
        </div>
        <div class="test-metrics">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="metric">
                <div class="metric-value">95%</div>
                <div class="metric-label">友好度</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric">
                <div class="metric-value">90%</div>
                <div class="metric-label">自然度</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric">
                <div class="metric-value">88%</div>
                <div class="metric-label">匹配度</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="testDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const editDialogVisible = ref(false)
const testDialogVisible = ref(false)

// 统计数据
const stats = reactive({
  totalIntents: 23,
  intentsWithResponse: 23,
  coveragePercentage: 100,
  responseCategories: 20
})

// 回复模板数据
const responses = ref([
  {
    id: 1,
    name: '唤醒确认',
    response: '嗯哼～',
    category: '交互确认',
    tone: '友好',
    description: '用户呼叫助手时的确认回复'
  },
  {
    id: 2,
    name: '闲聊调侃',
    response: '哈哈，你总能问到点子上～',
    category: '轻松互动',
    tone: '幽默',
    description: '用户闲聊或开玩笑时的轻松回复'
  },
  {
    id: 3,
    name: '情绪表达',
    response: '理解理解，偶尔这样也正常～',
    category: '情感支持',
    tone: '温暖',
    description: '用户表达情绪时的理解回复'
  },
  {
    id: 4,
    name: '情绪发泄',
    response: '理解理解，生气是正常的～',
    category: '情感支持',
    tone: '温暖',
    description: '用户发泄负面情绪时的安抚回复'
  },
  {
    id: 5,
    name: '测试对话',
    response: '哈哈，测试通过了吗？',
    category: '系统交互',
    tone: '友好',
    description: '用户测试系统时的配合回复'
  }
])

// 编辑表单
const editForm = reactive({
  id: null,
  name: '',
  response: '',
  tone: ''
})

// 测试表单
const testForm = reactive({
  name: '',
  response: '',
  description: ''
})

// 计算属性
const filteredResponses = computed(() => {
  if (!searchKeyword.value) return responses.value
  return responses.value.filter(item =>
    item.name.includes(searchKeyword.value) ||
    item.response.includes(searchKeyword.value)
  )
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const getCategoryTagType = (category) => {
  const types = {
    '交互确认': 'primary',
    '轻松互动': 'success',
    '情感支持': 'warning',
    '系统交互': 'info'
  }
  return types[category] || 'default'
}

const getToneTagType = (tone) => {
  const types = {
    '友好': 'success',
    '专业': 'primary',
    '幽默': 'warning',
    '温暖': 'danger',
    '活泼': 'info'
  }
  return types[tone] || 'default'
}

const editResponse = (row) => {
  editForm.id = row.id
  editForm.name = row.name
  editForm.response = row.response
  editForm.tone = row.tone
  editDialogVisible.value = true
}

const saveResponse = () => {
  // 更新数据
  const index = responses.value.findIndex(item => item.id === editForm.id)
  if (index !== -1) {
    responses.value[index].response = editForm.response
    responses.value[index].tone = editForm.tone
  }
  
  editDialogVisible.value = false
  ElMessage.success('首句回复保存成功')
}

const testResponse = (row) => {
  testForm.name = row.name
  testForm.response = row.response
  testForm.description = row.description
  testDialogVisible.value = true
}

const initCharts = () => {
  // 覆盖情况图表
  const coverageChart = echarts.init(document.querySelector('.charts-section .el-card:first-child .echarts'))
  const coverageOption = {
    title: {
      text: '回复覆盖情况',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: '70%',
      data: [
        { value: 23, name: '已配置回复' },
        { value: 0, name: '未配置回复' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  coverageChart.setOption(coverageOption)

  // 分类分布图表
  const categoryChart = echarts.init(document.querySelector('.charts-section .el-card:last-child .echarts'))
  const categoryOption = {
    title: {
      text: '回复分类分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['交互确认', '轻松互动', '情感支持', '系统交互', '其他']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [5, 4, 6, 3, 5],
      type: 'bar',
      itemStyle: {
        color: '#409EFF'
      }
    }]
  }
  categoryChart.setOption(categoryOption)
}

onMounted(() => {
  setTimeout(() => {
    initCharts()
  }, 100)
})
</script>

<style scoped>
.response-template-manager {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.charts-section {
  margin-bottom: 20px;
}

.response-list .list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-content {
  line-height: 1.5;
  word-break: break-word;
}

.test-content {
  padding: 20px 0;
}

.intent-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.intent-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.response-preview {
  margin: 20px 0;
}

.response-preview h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.response-bubble {
  background: #f0f9ff;
  border: 1px solid #409EFF;
  border-radius: 10px;
  padding: 15px;
  color: #333;
  line-height: 1.5;
}

.test-metrics {
  margin-top: 20px;
}

.metric {
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #67C23A;
  margin-bottom: 5px;
}

.metric-label {
  color: #666;
  font-size: 12px;
}
</style> 