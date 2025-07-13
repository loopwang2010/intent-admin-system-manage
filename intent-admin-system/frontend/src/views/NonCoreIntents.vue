<template>
  <div class="non-core-intents-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-number">{{ statistics.overview?.totalCount || 0 }}</div>
          <div class="stat-label">总意图数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ statistics.overview?.activeCount || 0 }}</div>
          <div class="stat-label">活跃意图</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-number">{{ statistics.overview?.withFirstResponseCount || 0 }}</div>
          <div class="stat-label">有首句回复</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-number">{{ statistics.overview?.avgConfidence || 0 }}%</div>
          <div class="stat-label">平均置信度</div>
        </div>
      </div>
    </div>

    <div class="page-header">
      <h1>非核心意图管理</h1>
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
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建意图
        </el-button>
        <el-dropdown @command="handleBatchAction" v-if="selectedIntents.length > 0">
          <el-button type="warning">
            批量操作({{selectedIntents.length}})
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="activate">批量激活</el-dropdown-item>
              <el-dropdown-item command="deactivate">批量停用</el-dropdown-item>
              <el-dropdown-item command="moveCategory">移动分类</el-dropdown-item>
              <el-dropdown-item command="export">导出选中</el-dropdown-item>
              <el-dropdown-item command="delete" divided>批量删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="handleMoreActions">
          <el-button>
            更多操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export">导出数据</el-dropdown-item>
              <el-dropdown-item command="import">导入数据</el-dropdown-item>
              <el-dropdown-item command="detectConflicts">检测冲突</el-dropdown-item>
              <el-dropdown-item command="refreshStats">刷新统计</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag 
              v-if="row.Category"
              :color="row.Category.color"
              size="small"
            >
              {{ row.Category.name }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="关键词" width="200">
          <template #default="{ row }">
            <div class="keywords">
              <el-tag
                v-for="keyword in (row.keywords || []).slice(0, 3)"
                :key="keyword"
                size="small"
                type="info"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ keyword }}
              </el-tag>
              <span v-if="(row.keywords || []).length > 3" class="more-keywords">
                +{{ (row.keywords || []).length - 3 }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="首句回复" min-width="200">
          <template #default="{ row }">
            <div class="first-response">
              <div v-if="row.firstResponse" class="response-text">
                {{ row.firstResponse.length > 50 ? row.firstResponse.slice(0, 50) + '...' : row.firstResponse }}
              </div>
              <div v-else class="no-response">
                <span>未设置</span>
                <el-button 
                  type="primary" 
                  link 
                  size="small"
                  @click="editFirstResponse(row)"
                >
                  设置
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="置信度" width="100" sortable="custom" prop="confidence">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.confidence * 100)" 
              :stroke-width="6"
              :show-text="false"
              :color="getConfidenceColor(row.confidence)"
            />
            <span style="margin-left: 8px; font-size: 12px;">
              {{ Math.round(row.confidence * 100) }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="优先级" width="80" sortable="custom" prop="priority">
          <template #default="{ row }">
            <el-tag 
              :type="getPriorityType(row.priority)"
              size="small"
            >
              P{{ row.priority || 1 }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <div class="tags">
              <el-tag
                v-for="tag in (row.tags || []).slice(0, 2)"
                :key="tag"
                size="small"
                type="success"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ tag }}
              </el-tag>
              <span v-if="(row.tags || []).length > 2" class="more-tags">
                +{{ (row.tags || []).length - 2 }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用次数" width="100" sortable="custom" prop="usageCount">
          <template #default="{ row }">
            <div class="usage-stats">
              <span class="usage-count">{{ row.usageCount || 0 }}</span>
              <div v-if="row.successCount !== undefined" class="success-rate">
                成功: {{ row.successCount || 0 }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewIntent(row)">
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="editIntent(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="editFirstResponse(row)">
              首句回复
            </el-button>
            <el-popconfirm
              title="确定要删除这个意图吗？"
              @confirm="deleteIntent(row.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="意图名称" prop="name" required>
              <el-input v-model="formData.name" placeholder="请输入意图名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="nameEn">
              <el-input v-model="formData.nameEn" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId" required>
              <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
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
            <el-form-item label="置信度" prop="confidence">
              <el-slider 
                v-model="confidencePercent" 
                :min="10" 
                :max="100" 
                show-input
                :show-input-controls="false"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入意图描述"
          />
        </el-form-item>

        <el-form-item label="英文描述" prop="descriptionEn">
          <el-input
            v-model="formData.descriptionEn"
            type="textarea"
            :rows="3"
            placeholder="请输入英文描述"
          />
        </el-form-item>

        <el-form-item label="关键词" prop="keywords">
          <el-select
            v-model="formData.keywords"
            multiple
            filterable
            allow-create
            placeholder="请输入关键词，按回车添加"
            style="width: 100%"
          >
          </el-select>
          <div style="margin-top: 8px;">
            <el-button 
              type="primary" 
              link 
              size="small" 
              @click="suggestKeywords"
              :loading="keywordSuggesting"
            >
              AI推荐关键词
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="英文关键词" prop="keywordsEn">
          <el-select
            v-model="formData.keywordsEn"
            multiple
            filterable
            allow-create
            placeholder="请输入英文关键词，按回车添加"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-slider 
                v-model="formData.priority" 
                :min="1" 
                :max="10" 
                show-input
                :show-input-controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言" prop="language">
              <el-select v-model="formData.language" placeholder="选择语言" style="width: 100%">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            placeholder="请输入标签，按回车添加"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <el-form-item label="回复内容" prop="response">
          <el-input
            v-model="formData.response"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>

        <el-form-item label="英文回复" prop="responseEn">
          <el-input
            v-model="formData.responseEn"
            type="textarea"
            :rows="4"
            placeholder="请输入英文回复内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 首句回复编辑对话框 -->
    <el-dialog
      v-model="firstResponseDialogVisible"
      title="编辑首句回复"
      width="700px"
    >
      <el-form
        ref="firstResponseFormRef"
        :model="firstResponseForm"
        label-width="120px"
      >
        <el-form-item label="回复类型">
          <el-radio-group v-model="firstResponseForm.responseType">
            <el-radio label="immediate">立即回复</el-radio>
            <el-radio label="processing">处理中回复</el-radio>
            <el-radio label="confirmation">确认回复</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="中文回复">
          <el-input
            v-model="firstResponseForm.firstResponse"
            type="textarea"
            :rows="4"
            placeholder="请输入中文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="英文回复">
          <el-input
            v-model="firstResponseForm.firstResponseEn"
            type="textarea"
            :rows="4"
            placeholder="请输入英文首句回复内容"
          />
        </el-form-item>

        <el-form-item label="变量配置">
          <div class="variables-config">
            <div 
              v-for="(variable, index) in firstResponseForm.responseVariables"
              :key="index"
              class="variable-item"
            >
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
              <el-button type="danger" size="small" @click="removeVariable(index)">
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addVariable">
              添加变量
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="firstResponseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFirstResponse" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量移动分类对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="批量移动分类"
      width="500px"
    >
      <el-form label-width="120px">
        <el-form-item label="目标分类">
          <el-select v-model="moveCategoryId" placeholder="请选择目标分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选中意图">
          <div>已选择 {{ selectedIntents.length }} 个意图</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveCategory" :loading="submitting">
          确认移动
        </el-button>
      </template>
    </el-dialog>

    <!-- 冲突检测对话框 -->
    <el-dialog
      v-model="conflictDialogVisible"
      title="意图冲突检测"
      width="900px"
    >
      <div class="conflict-detection">
        <div class="detection-controls">
          <el-form inline>
            <el-form-item label="相似度阈值">
              <el-slider 
                v-model="conflictThreshold" 
                :min="50" 
                :max="100" 
                show-input
                :show-input-controls="false"
                style="width: 200px;"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="detectConflicts" :loading="detectingConflicts">
                重新检测
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="conflicts.length > 0" class="conflict-results">
          <div class="conflict-summary">
            <el-alert
              :title="`检测到 ${conflicts.length} 组冲突`"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <div>
                  高风险: {{ conflictStats.high }} | 
                  中风险: {{ conflictStats.medium }} | 
                  低风险: {{ conflictStats.low }}
                </div>
              </template>
            </el-alert>
          </div>

          <div class="conflict-list" style="margin-top: 16px;">
            <el-card 
              v-for="(conflict, index) in conflicts" 
              :key="index"
              class="conflict-item"
              style="margin-bottom: 12px;"
            >
              <div class="conflict-header">
                <el-tag 
                  :type="conflict.riskLevel === 'high' ? 'danger' : conflict.riskLevel === 'medium' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ conflict.riskLevel === 'high' ? '高风险' : conflict.riskLevel === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
                <span style="margin-left: 8px;">相似度: {{ (conflict.similarity * 100).toFixed(1) }}%</span>
              </div>
              
              <div class="conflict-content">
                <div class="intent-pair">
                  <div class="intent-item">
                    <strong>{{ conflict.intent1.name }}</strong>
                    <div class="keywords">关键词: {{ conflict.intent1.keywords.join(', ') }}</div>
                  </div>
                  <div class="vs">VS</div>
                  <div class="intent-item">
                    <strong>{{ conflict.intent2.name }}</strong>
                    <div class="keywords">关键词: {{ conflict.intent2.keywords.join(', ') }}</div>
                  </div>
                </div>
                <div class="common-keywords">
                  <span>重复关键词: </span>
                  <el-tag 
                    v-for="keyword in conflict.commonKeywords" 
                    :key="keyword"
                    size="small"
                    type="danger"
                    style="margin-right: 4px;"
                  >
                    {{ keyword }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <div v-else-if="!detectingConflicts" class="no-conflicts">
          <el-result
            icon="success"
            title="未发现冲突"
            sub-title="当前设置的相似度阈值下，没有检测到意图冲突"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 导入数据对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入意图数据"
      width="600px"
    >
      <el-form label-width="120px">
        <el-form-item label="导入模式">
          <el-radio-group v-model="importMode">
            <el-radio label="create">仅创建新记录</el-radio>
            <el-radio label="update">仅更新现有记录</el-radio>
            <el-radio label="create_if_not_exists">不存在则创建</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="上传文件">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            accept=".json,.csv"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JSON 和 CSV 格式文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item v-if="importFile" label="文件信息">
          <div>
            <div>文件名: {{ importFile.name }}</div>
            <div>文件大小: {{ (importFile.size / 1024).toFixed(2) }} KB</div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing" :disabled="!importFile">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, ArrowDown, UploadFilled } from '@element-plus/icons-vue'
import { nonCoreIntentsAPI } from '@/api/nonCoreIntents'
import { categoryAPI } from '@/api/categories'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const intents = ref([])
const categories = ref([])
const statistics = ref({})
const selectedIntents = ref([])

// 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const firstResponseDialogVisible = ref(false)
const moveDialogVisible = ref(false)
const conflictDialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEditing = ref(false)
const currentIntentId = ref(null)

// 新增状态
const keywordSuggesting = ref(false)
const detectingConflicts = ref(false)
const importing = ref(false)
const conflictThreshold = ref(80)
const conflicts = ref([])
const conflictStats = ref({ high: 0, medium: 0, low: 0 })
const moveCategoryId = ref(null)
const importMode = ref('create')
const importFile = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  categoryId: null,
  keywords: [],
  keywordsEn: [],
  confidence: 0.6,
  priority: 1,
  response: '',
  responseEn: '',
  tags: [],
  language: 'zh-CN',
  status: 'active'
})

const firstResponseForm = reactive({
  firstResponse: '',
  firstResponseEn: '',
  responseVariables: [],
  responseType: 'immediate'
})

// 计算属性
const dialogTitle = computed(() => isEditing.value ? '编辑非核心意图' : '新建非核心意图')
const confidencePercent = computed({
  get: () => Math.round(formData.confidence * 100),
  set: (val) => { formData.confidence = val / 100 }
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入意图名称', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  response: [
    { required: true, message: '请输入回复内容', trigger: 'blur' }
  ]
}

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchKeyword.value,
      categoryId: selectedCategory.value,
      status: selectedStatus.value
    }

    const [intentsRes, categoriesRes, statsRes] = await Promise.allSettled([
      nonCoreIntentsAPI.getList(params),
      categoryAPI.getCategories(),
      nonCoreIntentsAPI.getStatistics()
    ])

    if (intentsRes.status === 'fulfilled' && intentsRes.value.success) {
      intents.value = intentsRes.value.data || []
      pagination.total = intentsRes.value.pagination?.total || 0
    } else {
      intents.value = []
      pagination.total = 0
    }

    if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
      categories.value = categoriesRes.value.data?.categories || categoriesRes.value.data || []
    } else {
      categories.value = []
    }

    if (statsRes.status === 'fulfilled' && statsRes.value && statsRes.value.success) {
      statistics.value = statsRes.value.data || {}
    } else {
      statistics.value = {}
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleCategoryChange = () => {
  pagination.page = 1
  loadData()
}

const handleStatusChange = () => {
  pagination.page = 1
  loadData()
}

const handleSortChange = ({ prop, order }) => {
  // 处理排序
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedIntents.value = selection
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadData()
}

const showCreateDialog = () => {
  isEditing.value = false
  currentIntentId.value = null
  resetForm()
  dialogVisible.value = true
}

const viewIntent = (intent) => {
  // 查看意图详情
  ElMessage.info('查看功能开发中...')
}

const editIntent = (intent) => {
  isEditing.value = true
  currentIntentId.value = intent.id
  
  // 填充表单数据
  Object.assign(formData, {
    name: intent.name,
    nameEn: intent.nameEn,
    description: intent.description,
    descriptionEn: intent.descriptionEn,
    categoryId: intent.categoryId,
    keywords: intent.keywords || [],
    keywordsEn: intent.keywordsEn || [],
    confidence: intent.confidence,
    priority: intent.priority || 1,
    response: intent.response,
    responseEn: intent.responseEn,
    tags: intent.tags || [],
    language: intent.language || 'zh-CN',
    status: intent.status
  })
  
  dialogVisible.value = true
}

const editFirstResponse = (intent) => {
  currentIntentId.value = intent.id
  
  // 填充首句回复表单数据
  Object.assign(firstResponseForm, {
    firstResponse: intent.firstResponse || '',
    firstResponseEn: intent.firstResponseEn || '',
    responseVariables: intent.responseVariables || [],
    responseType: intent.responseType || 'immediate'
  })
  
  firstResponseDialogVisible.value = true
}

const deleteIntent = async (id) => {
  try {
    const result = await nonCoreIntentsAPI.delete(id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

const submitForm = async () => {
  submitting.value = true
  try {
    let result
    if (isEditing.value) {
      result = await nonCoreIntentsAPI.update(currentIntentId.value, formData)
    } else {
      result = await nonCoreIntentsAPI.create(formData)
    }

    if (result.success) {
      ElMessage.success(isEditing.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadData()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const submitFirstResponse = async () => {
  submitting.value = true
  try {
    const result = await nonCoreIntentsAPI.updateFirstResponse(currentIntentId.value, firstResponseForm)
    if (result.success) {
      ElMessage.success('首句回复更新成功')
      firstResponseDialogVisible.value = false
      loadData()
    }
  } catch (error) {
    console.error('更新首句回复失败:', error)
    ElMessage.error('更新首句回复失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    categoryId: null,
    keywords: [],
    keywordsEn: [],
    confidence: 0.6,
    priority: 1,
    response: '',
    responseEn: '',
    tags: [],
    language: 'zh-CN',
    status: 'active'
  })
}

const handleDialogClose = () => {
  resetForm()
}

const addVariable = () => {
  firstResponseForm.responseVariables.push({
    name: '',
    description: ''
  })
}

const removeVariable = (index) => {
  firstResponseForm.responseVariables.splice(index, 1)
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getPriorityType = (priority) => {
  if (priority >= 8) return 'danger'
  if (priority >= 5) return 'warning'
  return 'success'
}

// 批量操作处理
const handleBatchAction = async (command) => {
  if (selectedIntents.value.length === 0) {
    ElMessage.warning('请先选择要操作的意图')
    return
  }

  const ids = selectedIntents.value.map(intent => intent.id)

  try {
    switch (command) {
      case 'activate':
        await nonCoreIntentsAPI.batchOperation('updateStatus', ids, { status: 'active' })
        ElMessage.success('批量激活成功')
        break
      case 'deactivate':
        await nonCoreIntentsAPI.batchOperation('updateStatus', ids, { status: 'inactive' })
        ElMessage.success('批量停用成功')
        break
      case 'moveCategory':
        moveDialogVisible.value = true
        return
      case 'export':
        await exportSelectedData(ids)
        return
      case 'delete':
        await ElMessageBox.confirm('确定要删除选中的意图吗？此操作不可恢复', '确认删除', {
          type: 'warning'
        })
        await nonCoreIntentsAPI.batchOperation('delete', ids)
        ElMessage.success('批量删除成功')
        break
    }
    loadData()
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  }
}

// 更多操作处理
const handleMoreActions = async (command) => {
  switch (command) {
    case 'export':
      await exportData()
      break
    case 'import':
      importDialogVisible.value = true
      break
    case 'detectConflicts':
      conflictDialogVisible.value = true
      await detectConflicts()
      break
    case 'refreshStats':
      await loadData()
      ElMessage.success('统计数据已刷新')
      break
  }
}

// 导出数据
const exportData = async (format = 'json') => {
  try {
    const params = {
      format,
      categoryId: selectedCategory.value,
      status: selectedStatus.value
    }
    
    const result = await nonCoreIntentsAPI.export(params)
    
    if (format === 'csv') {
      // 处理CSV文件下载
      const blob = new Blob([result], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'non_core_intents.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } else {
      // JSON格式
      const dataStr = JSON.stringify(result.data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'non_core_intents.json'
      link.click()
      window.URL.revokeObjectURL(url)
    }
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 导出选中数据
const exportSelectedData = async (ids) => {
  try {
    const selectedData = intents.value.filter(intent => ids.includes(intent.id))
    const dataStr = JSON.stringify(selectedData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'selected_intents.json'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出选中数据成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 确认移动分类
const confirmMoveCategory = async () => {
  if (!moveCategoryId.value) {
    ElMessage.warning('请选择目标分类')
    return
  }

  try {
    submitting.value = true
    const ids = selectedIntents.value.map(intent => intent.id)
    await nonCoreIntentsAPI.batchMoveCategory(ids, moveCategoryId.value)
    ElMessage.success('批量移动分类成功')
    moveDialogVisible.value = false
    moveCategoryId.value = null
    loadData()
  } catch (error) {
    console.error('移动分类失败:', error)
    ElMessage.error('移动分类失败')
  } finally {
    submitting.value = false
  }
}

// 关键词推荐
const suggestKeywords = async () => {
  if (!formData.name) {
    ElMessage.warning('请先输入意图名称')
    return
  }

  try {
    keywordSuggesting.value = true
    const result = await nonCoreIntentsAPI.suggestKeywords({
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId
    })

    if (result.success && result.data.suggestedKeywords.length > 0) {
      // 合并推荐的关键词
      const newKeywords = [...new Set([...formData.keywords, ...result.data.suggestedKeywords])]
      formData.keywords = newKeywords
      ElMessage.success(`推荐了 ${result.data.suggestedKeywords.length} 个关键词`)
    } else {
      ElMessage.info('暂无关键词推荐')
    }
  } catch (error) {
    console.error('关键词推荐失败:', error)
    ElMessage.error('关键词推荐失败')
  } finally {
    keywordSuggesting.value = false
  }
}

// 冲突检测
const detectConflicts = async () => {
  try {
    detectingConflicts.value = true
    const result = await nonCoreIntentsAPI.detectConflicts(conflictThreshold.value / 100)
    
    if (result.success) {
      conflicts.value = result.data.conflicts || []
      conflictStats.value = result.data.riskLevels || { high: 0, medium: 0, low: 0 }
      
      if (conflicts.value.length > 0) {
        ElMessage.warning(`检测到 ${conflicts.value.length} 组意图冲突`)
      } else {
        ElMessage.success('未发现意图冲突')
      }
    }
  } catch (error) {
    console.error('冲突检测失败:', error)
    ElMessage.error('冲突检测失败')
  } finally {
    detectingConflicts.value = false
  }
}

// 文件上传处理
const handleFileChange = (file) => {
  importFile.value = file.raw
}

// 确认导入
const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  try {
    importing.value = true
    
    const fileContent = await readFileContent(importFile.value)
    let intentData

    if (importFile.value.name.endsWith('.json')) {
      intentData = JSON.parse(fileContent)
    } else if (importFile.value.name.endsWith('.csv')) {
      // 简单的CSV解析（实际项目中建议使用专门的CSV解析库）
      intentData = parseCSV(fileContent)
    } else {
      throw new Error('不支持的文件格式')
    }

    const result = await nonCoreIntentsAPI.import(intentData, importMode.value)
    
    if (result.success) {
      ElMessage.success(result.message)
      importDialogVisible.value = false
      importFile.value = null
      loadData()
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

// 读取文件内容
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 简单的CSV解析
const parseCSV = (csvContent) => {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  const data = []

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index]
      })
      data.push(obj)
    }
  }

  return data
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.non-core-intents-page {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.intent-info {
  padding: 8px 0;
}

.intent-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.intent-name-en {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-style: italic;
}

.intent-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.more-keywords {
  font-size: 12px;
  color: #909399;
}

.first-response {
  padding: 4px 0;
}

.response-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
}

.no-response {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-response span {
  font-size: 12px;
  color: #c0c4cc;
}

.usage-count {
  font-weight: 600;
  color: #409eff;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.variables-config {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;
}

.variable-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.variable-item:last-child {
  margin-bottom: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.more-tags {
  font-size: 12px;
  color: #909399;
}

.usage-stats {
  text-align: center;
}

.usage-count {
  font-weight: 600;
  color: #409eff;
  display: block;
}

.success-rate {
  font-size: 11px;
  color: #67c23a;
  margin-top: 2px;
}

.conflict-detection {
  padding: 8px 0;
}

.detection-controls {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.conflict-results {
  max-height: 500px;
  overflow-y: auto;
}

.conflict-item {
  margin-bottom: 12px;
}

.conflict-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.conflict-content .intent-pair {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.conflict-content .intent-item {
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.conflict-content .vs {
  margin: 0 16px;
  font-weight: bold;
  color: #e6a23c;
}

.conflict-content .keywords {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.common-keywords {
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 13px;
}

.no-conflicts {
  text-align: center;
  padding: 40px 0;
}
</style>