<template>
  <div class="core-intents-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalIntents }}</div>
          <div class="stat-label">总意图数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ activeIntents }}</div>
          <div class="stat-label">活跃意图</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-number">{{ intentsWithResponse }}</div>
          <div class="stat-label">有首句回复</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-number">{{ avgConfidence.toFixed(1) }}%</div>
          <div class="stat-label">平均置信度</div>
        </div>
      </div>
    </div>

    <div class="page-header">
      <h1>核心意图管理</h1>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索意图名称或关键词..."
          style="width: 250px; margin-right: 12px;"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          style="width: 150px; margin-right: 12px;"
          @change="handleCategoryChange"
          clearable
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
        <el-select
          v-model="selectedStatus"
          placeholder="状态"
          style="width: 120px; margin-right: 12px;"
          @change="handleStatusChange"
          clearable
        >
          <el-option label="活跃" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
        <el-button type="primary" @click="showDialog">
          <el-icon><Plus /></el-icon>
          新建意图
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table 
        :data="intents" 
        v-loading="loading"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="意图信息" min-width="200">
          <template #default="{ row }">
            <div class="intent-info">
              <div class="intent-name">{{ row.name }}</div>
              <div class="intent-name-en" v-if="row.nameEn">{{ row.nameEn }}</div>
              <div class="intent-description">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120" align="center">
          <template #default="{ row }">
            <div class="category-tag">
              <span class="category-icon">{{ row.Category?.icon || '📂' }}</span>
              <span>{{ row.Category?.name || '未分类' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="关键词" min-width="150">
          <template #default="{ row }">
            <div class="keywords">
              <el-tag
                v-for="keyword in getKeywords(row.keywords)"
                :key="keyword"
                size="small"
                style="margin: 2px;"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="首句回复" min-width="200">
          <template #default="{ row }">
            <div class="first-response">
              <div v-if="row.firstResponse" class="response-content">
                <div class="response-text">{{ row.firstResponse }}</div>
                <el-tag :type="getResponseTypeTag(row.responseType)" size="small">
                  {{ getResponseTypeLabel(row.responseType) }}
                </el-tag>
              </div>
              <div v-else class="no-response">
                <el-text type="info">未设置首句回复</el-text>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="confidence" label="置信度" width="100" align="center" sortable="custom">
          <template #default="{ row }">
            <el-progress
              :percentage="row.confidence * 100"
              :color="getConfidenceColor(row.confidence)"
              :show-text="false"
              :stroke-width="8"
            />
            <div class="confidence-text">{{ (row.confidence * 100).toFixed(1) }}%</div>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="80" align="center" sortable="custom" />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="usageCount" label="使用次数" width="100" align="center" sortable="custom" />

        <el-table-column prop="createdAt" label="创建时间" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editFirstResponse(row)">
              首句回复
            </el-button>
            <el-button type="primary" link size="small" @click="viewDetails(row)">
              详情
            </el-button>
            <el-button type="primary" link size="small" @click="editItem(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="deleteItem(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作栏 -->
      <div class="batch-actions" v-if="selectedItems.length > 0">
        <span>已选择 {{ selectedItems.length }} 项</span>
        <el-button size="small" @click="batchSetFirstResponse">批量设置首句回复</el-button>
        <el-button size="small" @click="batchUpdateStatus">批量更新状态</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
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
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑核心意图' : '新建核心意图'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="意图名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入意图名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="nameEn">
              <el-input v-model="form.nameEn" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="活跃" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入意图描述"
          />
        </el-form-item>

        <el-form-item label="关键词" prop="keywords">
          <el-select
            v-model="form.keywords"
            multiple
            filterable
            allow-create
            placeholder="请输入关键词"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="置信度" prop="confidence">
              <el-slider
                v-model="form.confidence"
                :min="0.1"
                :max="1"
                :step="0.01"
                :format-tooltip="val => (val * 100).toFixed(1) + '%'"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="form.priority" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 首句回复配置 -->
        <el-divider content-position="left">首句回复配置</el-divider>
        
        <el-form-item label="回复类型" prop="responseType">
          <el-radio-group v-model="form.responseType">
            <el-radio label="immediate">立即回复</el-radio>
            <el-radio label="processing">处理中回复</el-radio>
            <el-radio label="confirmation">确认回复</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="中文回复" prop="firstResponse">
          <el-input
            v-model="form.firstResponse"
            type="textarea"
            :rows="2"
            placeholder="请输入中文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="英文回复" prop="firstResponseEn">
          <el-input
            v-model="form.firstResponseEn"
            type="textarea"
            :rows="2"
            placeholder="请输入英文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="回复变量">
          <div class="response-variables">
            <div v-for="(variable, index) in form.responseVariables" :key="index" class="variable-item">
              <el-input
                v-model="variable.name"
                placeholder="变量名"
                style="width: 150px; margin-right: 8px;"
              />
              <el-input
                v-model="variable.description"
                placeholder="变量描述"
                style="width: 200px; margin-right: 8px;"
              />
              <el-button size="small" type="danger" @click="removeVariable(index)">删除</el-button>
            </div>
            <el-button size="small" @click="addVariable">添加变量</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 首句回复编辑对话框 -->
    <el-dialog
      v-model="responseDialogVisible"
      title="编辑首句回复"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="responseFormRef"
        :model="responseForm"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="意图名称">
          <el-text>{{ responseForm.intentName }}</el-text>
        </el-form-item>

        <el-form-item label="回复类型">
          <el-radio-group v-model="responseForm.responseType">
            <el-radio label="immediate">立即回复</el-radio>
            <el-radio label="processing">处理中回复</el-radio>
            <el-radio label="confirmation">确认回复</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="中文回复">
          <el-input
            v-model="responseForm.firstResponse"
            type="textarea"
            :rows="3"
            placeholder="请输入中文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="英文回复">
          <el-input
            v-model="responseForm.firstResponseEn"
            type="textarea"
            :rows="3"
            placeholder="请输入英文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="变量配置">
          <div class="response-variables">
            <div v-for="(variable, index) in responseForm.responseVariables" :key="index" class="variable-item">
              <el-input
                v-model="variable.name"
                placeholder="变量名"
                style="width: 120px; margin-right: 8px;"
              />
              <el-input
                v-model="variable.description"
                placeholder="描述"
                style="width: 150px; margin-right: 8px;"
              />
              <el-input
                v-model="variable.defaultValue"
                placeholder="默认值"
                style="width: 100px; margin-right: 8px;"
              />
              <el-button size="small" type="danger" @click="removeResponseVariable(index)">删除</el-button>
            </div>
            <el-button size="small" @click="addResponseVariable">添加变量</el-button>
          </div>
        </el-form-item>

        <el-form-item label="预览">
          <div class="response-preview">
            <div class="preview-item" v-if="responseForm.firstResponse">
              <strong>中文:</strong> {{ responseForm.firstResponse }}
            </div>
            <div class="preview-item" v-if="responseForm.firstResponseEn">
              <strong>英文:</strong> {{ responseForm.firstResponseEn }}
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="responseDialogVisible = false">取消</el-button>
        <el-button @click="testResponse" :loading="testing">测试回复</el-button>
        <el-button type="primary" @click="saveFirstResponse" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Search, Plus, Download, Edit, Delete, 
  Warning, InfoFilled 
} from '@element-plus/icons-vue'
import { coreIntentsAPI } from '@/api/coreIntents'
import { categoryAPI } from '@/api/categories'
import { debounce } from 'lodash-es'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const intents = ref([])
const categories = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedItems = ref([])
const dialogVisible = ref(false)
const responseDialogVisible = ref(false)
const editingIntent = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// 排序数据
const sortParams = reactive({
  sortBy: 'id',
  sortOrder: 'ASC'
})

// 主表单数据
const form = reactive({
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  categoryId: '',
  keywords: [],
  keywordsEn: [],
  confidence: 0.7,
  priority: 1,
  firstResponse: '',
  firstResponseEn: '',
  responseVariables: [],
  responseType: 'immediate',
  status: 'active',
  tags: [],
  version: '1.0.0'
})

// 首句回复表单数据
const responseForm = reactive({
  intentId: '',
  intentName: '',
  firstResponse: '',
  firstResponseEn: '',
  responseVariables: [],
  responseType: 'immediate'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入意图名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ],
  keywords: [
    { required: true, message: '请输入至少一个关键词', trigger: 'change' }
  ]
}

// 计算属性
const isEditing = computed(() => !!editingIntent.value)

const totalIntents = computed(() => intents.value.length)
const activeIntents = computed(() => intents.value.filter(intent => intent.status === 'active').length)
const intentsWithResponse = computed(() => intents.value.filter(intent => intent.firstResponse).length)
const avgConfidence = computed(() => {
  if (intents.value.length === 0) return 0
  const sum = intents.value.reduce((acc, intent) => acc + (intent.confidence || 0), 0)
  return (sum / intents.value.length) * 100
})

// 获取核心意图列表
const fetchIntents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      includeResponses: false,
      ...sortParams
    }
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    
    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value
    }
    
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }

    const response = await coreIntentsAPI.getList(params)
    intents.value = response.data.intents || []
    
    if (response.data.pagination) {
      Object.assign(pagination, response.data.pagination)
    }
  } catch (error) {
    ElMessage.error('获取核心意图列表失败')
    console.error('Error fetching intents:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await categoryAPI.getCategories()
    categories.value = response.data.categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

// 搜索处理
const handleSearch = debounce(() => {
  pagination.page = 1
  fetchIntents()
}, 300)

// 分类变化处理
const handleCategoryChange = () => {
  pagination.page = 1
  fetchIntents()
}

// 状态变化处理
const handleStatusChange = () => {
  pagination.page = 1
  fetchIntents()
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  if (prop) {
    sortParams.sortBy = prop
    sortParams.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
    pagination.page = 1
    fetchIntents()
  }
}

// 选择处理
const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchIntents()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchIntents()
}

// 工具函数
const getKeywords = (keywords) => {
  if (!keywords) return []
  if (typeof keywords === 'string') {
    try {
      return JSON.parse(keywords)
    } catch {
      return []
    }
  }
  return Array.isArray(keywords) ? keywords : []
}

const getStatusType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    active: '活跃',
    inactive: '停用'
  }
  return labelMap[status] || status
}

const getResponseTypeTag = (type) => {
  const typeMap = {
    immediate: 'success',
    processing: 'warning',
    confirmation: 'info'
  }
  return typeMap[type] || 'info'
}

const getResponseTypeLabel = (type) => {
  const labelMap = {
    immediate: '立即回复',
    processing: '处理中',
    confirmation: '确认回复'
  }
  return labelMap[type] || type
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 对话框操作
const showDialog = () => {
  editingIntent.value = null
  Object.assign(form, {
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    categoryId: '',
    keywords: [],
    keywordsEn: [],
    confidence: 0.7,
    priority: 1,
    firstResponse: '',
    firstResponseEn: '',
    responseVariables: [],
    responseType: 'immediate',
    status: 'active',
    tags: [],
    version: '1.0.0'
  })
  dialogVisible.value = true
}

// 编辑意图
const editItem = (intent) => {
  editingIntent.value = intent
  Object.assign(form, {
    name: intent.name || '',
    nameEn: intent.nameEn || '',
    description: intent.description || '',
    descriptionEn: intent.descriptionEn || '',
    categoryId: intent.categoryId || '',
    keywords: getKeywords(intent.keywords),
    keywordsEn: getKeywords(intent.keywordsEn),
    confidence: intent.confidence || 0.7,
    priority: intent.priority || 1,
    firstResponse: intent.firstResponse || '',
    firstResponseEn: intent.firstResponseEn || '',
    responseVariables: intent.responseVariables ? 
      (typeof intent.responseVariables === 'string' ? 
        JSON.parse(intent.responseVariables) : intent.responseVariables) : [],
    responseType: intent.responseType || 'immediate',
    status: intent.status || 'active',
    tags: intent.tags ? 
      (typeof intent.tags === 'string' ? JSON.parse(intent.tags) : intent.tags) : [],
    version: intent.version || '1.0.0'
  })
  dialogVisible.value = true
}

// 保存意图
const saveItem = async () => {
  const formRef = ref()
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true

    const data = {
      ...form,
      tags: JSON.stringify(form.tags),
      responseVariables: JSON.stringify(form.responseVariables)
    }

    if (isEditing.value) {
      await coreIntentsAPI.update(editingIntent.value.id, data)
      ElMessage.success('意图更新成功')
    } else {
      await coreIntentsAPI.create(data)
      ElMessage.success('意图创建成功')
    }

    dialogVisible.value = false
    fetchIntents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(isEditing.value ? '更新意图失败' : '创建意图失败')
      console.error('Error saving intent:', error)
    }
  } finally {
    saving.value = false
  }
}

// 删除意图
const deleteItem = async (intent) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除意图 "${intent.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmResult === 'confirm') {
      await coreIntentsAPI.delete(intent.id)
      ElMessage.success('意图删除成功')
      fetchIntents()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除意图失败')
      console.error('Error deleting intent:', error)
    }
  }
}

// 首句回复操作
const editFirstResponse = async (intent) => {
  try {
    // 获取首句回复数据
    const response = await coreIntentsAPI.getFirstResponse(intent.id)
    
    Object.assign(responseForm, {
      intentId: intent.id,
      intentName: intent.name,
      firstResponse: intent.firstResponse || '',
      firstResponseEn: intent.firstResponseEn || '',
      responseVariables: intent.responseVariables ? 
        (typeof intent.responseVariables === 'string' ? 
          JSON.parse(intent.responseVariables) : intent.responseVariables) : [],
      responseType: intent.responseType || 'immediate'
    })
    
    responseDialogVisible.value = true
  } catch (error) {
    // 如果获取失败，使用意图本身的数据
    Object.assign(responseForm, {
      intentId: intent.id,
      intentName: intent.name,
      firstResponse: intent.firstResponse || '',
      firstResponseEn: intent.firstResponseEn || '',
      responseVariables: intent.responseVariables ? 
        (typeof intent.responseVariables === 'string' ? 
          JSON.parse(intent.responseVariables) : intent.responseVariables) : [],
      responseType: intent.responseType || 'immediate'
    })
    
    responseDialogVisible.value = true
  }
}

// 保存首句回复
const saveFirstResponse = async () => {
  try {
    saving.value = true

    const data = {
      firstResponse: responseForm.firstResponse,
      firstResponseEn: responseForm.firstResponseEn,
      responseVariables: responseForm.responseVariables,
      responseType: responseForm.responseType
    }

    await coreIntentsAPI.updateFirstResponse(responseForm.intentId, data)
    ElMessage.success('首句回复更新成功')
    
    responseDialogVisible.value = false
    fetchIntents()
  } catch (error) {
    ElMessage.error('更新首句回复失败')
    console.error('Error updating first response:', error)
  } finally {
    saving.value = false
  }
}

// 测试回复
const testResponse = async () => {
  try {
    testing.value = true
    
    const variables = {}
    responseForm.responseVariables.forEach(variable => {
      variables[variable.name] = variable.defaultValue || `{${variable.name}}`
    })

    const response = await coreIntentsAPI.testFirstResponse(responseForm.intentId, variables)
    
    ElNotification({
      title: '回复测试',
      message: response.data.processedResponse || responseForm.firstResponse,
      type: 'success',
      duration: 5000
    })
  } catch (error) {
    ElMessage.error('测试回复失败')
    console.error('Error testing response:', error)
  } finally {
    testing.value = false
  }
}

// 变量管理
const addVariable = () => {
  form.responseVariables.push({
    name: '',
    description: '',
    defaultValue: ''
  })
}

const removeVariable = (index) => {
  form.responseVariables.splice(index, 1)
}

const addResponseVariable = () => {
  responseForm.responseVariables.push({
    name: '',
    description: '',
    defaultValue: ''
  })
}

const removeResponseVariable = (index) => {
  responseForm.responseVariables.splice(index, 1)
}

// 批量操作
const batchSetFirstResponse = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要操作的意图')
    return
  }
  
  ElNotification({
    title: '批量设置首句回复',
    message: '批量设置功能开发中...',
    type: 'info'
  })
}

const batchUpdateStatus = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要操作的意图')
    return
  }

  try {
    const { value: status } = await ElMessageBox.prompt('请选择状态', '批量更新状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'select',
      inputOptions: {
        active: '活跃',
        inactive: '停用'
      }
    })

    const ids = selectedItems.value.map(item => item.id)
    await coreIntentsAPI.batchUpdateStatus(ids, status)
    
    ElMessage.success(`成功更新 ${ids.length} 个意图的状态`)
    fetchIntents()
    selectedItems.value = []
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量更新状态失败')
      console.error('Error batch updating status:', error)
    }
  }
}

const batchDelete = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要删除的意图')
    return
  }

  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 个意图吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmResult === 'confirm') {
      const ids = selectedItems.value.map(item => item.id)
      await coreIntentsAPI.batchDelete(ids)
      
      ElMessage.success(`成功删除 ${ids.length} 个意图`)
      fetchIntents()
      selectedItems.value = []
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error('Error batch deleting:', error)
    }
  }
}

// 查看详情
const viewDetails = (intent) => {
  ElNotification({
    title: '意图详情',
    message: '详情页面开发中...',
    type: 'info'
  })
}

// 导出数据
const exportData = async () => {
  try {
    await coreIntentsAPI.export()
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出数据失败')
    console.error('Error exporting data:', error)
  }
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchIntents()
})
</script>

<style scoped>
.core-intents-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  min-height: 56px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 意图信息 */
.intent-info {
  padding: 8px 0;
}

.intent-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  margin-bottom: 4px;
}

.intent-name-en {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.intent-description {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

/* 分类标签 */
.category-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.category-icon {
  font-size: 14px;
}

/* 关键词 */
.keywords {
  max-width: 150px;
  overflow: hidden;
}

/* 首句回复 */
.first-response {
  max-width: 200px;
}

.response-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.response-text {
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.no-response {
  color: #9ca3af;
  font-style: italic;
  font-size: 12px;
}

/* 置信度 */
.confidence-text {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  margin-top: 4px;
}

/* 批量操作栏 */
.batch-actions {
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 分页 */
.pagination-wrapper {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

/* 回复变量 */
.response-variables {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.variable-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.variable-item:last-child {
  margin-bottom: 0;
}

/* 回复预览 */
.response-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
  min-height: 60px;
}

.preview-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.preview-item:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .core-intents-page {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>