<template>
  <div class="categories-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards" v-if="analytics">
      <div class="stat-card">
        <div class="stat-icon">📂</div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.totalCategories }}</div>
          <div class="stat-label">总分类数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.totalIntents }}</div>
          <div class="stat-label">总意图数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.totalUsage }}</div>
          <div class="stat-label">总使用量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ (analytics.overview.avgSuccessRate * 100).toFixed(1) }}%</div>
          <div class="stat-label">平均成功率</div>
        </div>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>意图分类管理</h1>
        <!-- 面包屑导航 -->
        <div class="breadcrumb" v-if="breadcrumb.length > 0">
          <span 
            v-for="(item, index) in breadcrumb" 
            :key="item.id"
            class="breadcrumb-item"
            :class="{ active: index === breadcrumb.length - 1 }"
            @click="navigateToCategory(item)"
          >
            {{ item.name }}
            <span v-if="index < breadcrumb.length - 1" class="breadcrumb-separator">></span>
          </span>
        </div>
      </div>
      <div class="header-actions">
        <!-- 视图切换 -->
        <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
          <el-radio-button label="tree">树形</el-radio-button>
          <el-radio-button label="table">表格</el-radio-button>
        </el-radio-group>
        
        <!-- 层级筛选 -->
        <el-select 
          v-model="selectedLevel" 
          placeholder="选择层级" 
          size="small" 
          style="width: 120px"
          @change="handleLevelChange"
          clearable
        >
          <el-option label="全部层级" value="" />
          <el-option label="一级分类" :value="1" />
          <el-option label="二级分类" :value="2" />
        </el-select>

        <!-- 搜索 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类..."
          style="width: 200px"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建分类
        </el-button>
        
        <el-dropdown>
          <el-button>
            更多操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportData">
                <el-icon><Download /></el-icon>
                导出数据
              </el-dropdown-item>
              <el-dropdown-item @click="showAnalytics">
                <el-icon><TrendCharts /></el-icon>
                数据分析
              </el-dropdown-item>
              <el-dropdown-item @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 树形视图 -->
    <div v-if="viewMode === 'tree'" class="tree-view-card">
      <el-tree
        :data="treeData"
        :props="treeProps"
        :expand-on-click-node="false"
        :default-expand-all="true"
        node-key="id"
        ref="categoryTree"
        class="category-tree"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="tree-node-content">
              <div class="node-icon" :style="{ backgroundColor: data.color || '#409EFF' }">
                {{ data.icon || '📂' }}
              </div>
              <div class="node-info">
                <div class="node-name">
                  {{ data.name }}
                  <el-tag v-if="data.level === 1" type="success" size="small">一级</el-tag>
                  <el-tag v-else type="info" size="small">二级</el-tag>
                </div>
                <div class="node-stats" v-if="data.stats">
                  <span class="stat-item">
                    <el-icon><Collection /></el-icon>
                    {{ data.stats.totalIntentCount || 0 }}个意图
                  </span>
                  <span class="stat-item" v-if="data.childrenCount">
                    <el-icon><FolderOpened /></el-icon>
                    {{ data.childrenCount }}个子分类
                  </span>
                </div>
              </div>
            </div>
            <div class="tree-node-actions">
              <el-button type="primary" link size="small" @click="viewCategoryStats(data)">
                统计
              </el-button>
              <el-button type="primary" link size="small" @click="editCategory(data)">
                编辑
              </el-button>
              <el-dropdown @command="(command) => handleTreeAction(command, data)">
                <el-button type="primary" link size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="add-child" v-if="data.level === 1">
                      <el-icon><Plus /></el-icon>
                      添加子分类
                    </el-dropdown-item>
                    <el-dropdown-item command="move">
                      <el-icon><Switch /></el-icon>
                      移动分类
                    </el-dropdown-item>
                    <el-dropdown-item command="analyze">
                      <el-icon><DataAnalysis /></el-icon>
                      深度分析
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除分类
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 表格视图 -->
    <div v-else class="table-card">
      <el-table 
        :data="tableData" 
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        
        <!-- 分类信息列 -->
        <el-table-column label="分类信息" min-width="250">
          <template #default="{ row }">
            <div class="category-info">
              <div 
                class="category-icon" 
                :style="{ backgroundColor: row.color || '#409EFF' }"
              >
                {{ row.icon || '📂' }}
              </div>
              <div class="category-details">
                <div class="category-name-wrapper">
                  <span class="category-name">{{ row.name }}</span>
                  <el-tag 
                    :type="row.level === 1 ? 'success' : 'info'" 
                    size="small"
                    class="level-tag"
                  >
                    {{ row.level === 1 ? '一级' : '二级' }}
                  </el-tag>
                  <el-tag 
                    v-if="row.code" 
                    type="warning" 
                    size="small"
                    class="code-tag"
                  >
                    {{ row.code }}
                  </el-tag>
                </div>
                <div class="category-name-en" v-if="row.nameEn">{{ row.nameEn }}</div>
                <div class="category-path" v-if="row.Parent">
                  <el-icon><ArrowUp /></el-icon>
                  {{ row.Parent.name }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 描述列 -->
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

        <!-- 子分类数量 -->
        <el-table-column label="子分类" width="100" align="center" v-if="selectedLevel !== 2">
          <template #default="{ row }">
            <el-tag v-if="row.level === 1" type="primary" size="small">
              {{ row.childrenCount || 0 }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 意图统计 -->
        <el-table-column label="意图统计" width="140" align="center">
          <template #default="{ row }">
            <div class="intent-stats">
              <div class="stat-row">
                <span class="stat-label">核心:</span>
                <span class="stat-value">{{ row.coreIntentCount || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">非核心:</span>
                <span class="stat-value">{{ row.nonCoreIntentCount || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 使用量 -->
        <el-table-column label="使用量" width="100" align="center" sortable="custom" prop="totalUsageCount">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.totalUsageCount || 0 }}</el-tag>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 排序 -->
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" sortable="custom" />

        <!-- 创建时间 -->
        <el-table-column prop="createdAt" label="创建时间" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewCategoryStats(row)">
              统计
            </el-button>
            <el-button type="primary" link size="small" @click="editCategory(row)">
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleTableAction(command, row)">
              <el-button type="primary" link size="small">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="add-child" v-if="row.level === 1">
                    <el-icon><Plus /></el-icon>
                    添加子分类
                  </el-dropdown-item>
                  <el-dropdown-item command="move">
                    <el-icon><Switch /></el-icon>
                    移动分类
                  </el-dropdown-item>
                  <el-dropdown-item command="analyze">
                    <el-icon><DataAnalysis /></el-icon>
                    深度分析
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除分类
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="!treeMode && pagination.total > 0">
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
      :title="isEditing ? '编辑分类' : '新建分类'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="form" 
        :rules="formRules" 
        ref="formRef" 
        label-width="100px"
        @submit.prevent="saveCategory"
      >
        <el-form-item label="父分类" prop="parentId" v-if="showParentSelector">
          <el-select 
            v-model="form.parentId" 
            placeholder="选择父分类（可选）"
            clearable
            style="width: 100%"
          >
            <el-option label="无（创建一级分类）" :value="null" />
            <el-option 
              v-for="parent in parentOptions" 
              :key="parent.id"
              :label="parent.name"
              :value="parent.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="英文名称" prop="nameEn">
          <el-input v-model="form.nameEn" placeholder="请输入英文名称（可选）" />
        </el-form-item>

        <el-form-item label="分类代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入分类代码（如：ENT_MUSIC）" />
        </el-form-item>

        <el-form-item label="分类图标" prop="icon">
          <div class="icon-selector">
            <el-input v-model="form.icon" placeholder="选择或输入图标" style="width: 200px" />
            <div class="icon-preview">{{ form.icon || '📂' }}</div>
            <div class="icon-options">
              <span 
                v-for="icon in iconOptions" 
                :key="icon"
                class="icon-option"
                :class="{ active: form.icon === icon }"
                @click="form.icon = icon"
              >
                {{ icon }}
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="分类颜色" prop="color">
          <el-color-picker v-model="form.color" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>

        <el-form-item label="英文描述" prop="descriptionEn">
          <el-input 
            v-model="form.descriptionEn" 
            type="textarea" 
            :rows="3"
            placeholder="请输入英文描述（可选）"
          />
        </el-form-item>

        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number 
            v-model="form.sortOrder" 
            :min="0" 
            :max="9999"
            placeholder="排序号"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="选择状态">
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCategory" :loading="saving">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 移动分类对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动分类" width="500px">
      <div class="move-category-content">
        <p>将分类 <strong>{{ movingCategory?.name }}</strong> 移动到：</p>
        <el-select 
          v-model="moveToParentId" 
          placeholder="选择新的父分类"
          style="width: 100%"
          clearable
        >
          <el-option label="移动到根级别（一级分类）" :value="null" />
          <el-option 
            v-for="parent in availableParents" 
            :key="parent.id"
            :label="parent.name"
            :value="parent.id"
          />
        </el-select>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="moveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMove" :loading="moving">
            确认移动
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 统计对话框 -->
    <el-dialog v-model="statsDialogVisible" title="分类统计" width="800px">
      <div v-if="selectedStats" class="stats-content">
        <!-- 基础统计信息 -->
        <div class="stats-overview">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ selectedStats.totalIntents }}</div>
              <div class="stat-label">总意图数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ selectedStats.activeIntents }}</div>
              <div class="stat-label">活跃意图</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ selectedStats.totalUsage }}</div>
              <div class="stat-label">总使用量</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ (selectedStats.successRate * 100).toFixed(1) }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </div>

        <!-- 热门意图排行 -->
        <div class="top-intents" v-if="selectedStats.topIntents?.length">
          <h4>热门意图排行</h4>
          <el-table :data="selectedStats.topIntents" size="small">
            <el-table-column prop="name" label="意图名称" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'core' ? 'success' : 'info'" size="small">
                  {{ row.type === 'core' ? '核心' : '非核心' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="usageCount" label="使用次数" width="100" />
            <el-table-column prop="confidence" label="置信度" width="100">
              <template #default="{ row }">
                {{ (row.confidence * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Search, Plus, Download, TrendCharts, Edit, Delete, 
  ArrowDown, ArrowUp, Collection, FolderOpened, Switch,
  DataAnalysis, Refresh
} from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'

// API接口 (需要扩展)
const categoryAPI = {
  // 基础API
  async getCategories(params = {}) {
    // 模拟API调用
    return { data: { categories: [], pagination: { total: 0, page: 1, limit: 20 } } }
  },
  
  // 新增的层级API
  async getCategoryTree(params = {}) {
    // 获取树形结构数据
    return { data: [] }
  },
  
  async moveCategory(id, data) {
    // 移动分类
    return { data: {} }
  },
  
  async getCategoryBreadcrumb(id) {
    // 获取面包屑
    return { data: [] }
  }
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const moving = ref(false)
const analytics = ref(null)
const searchKeyword = ref('')
const viewMode = ref('tree') // tree | table
const selectedLevel = ref('')
const treeMode = ref(true)

// 对话框状态
const dialogVisible = ref(false)
const moveDialogVisible = ref(false)
const statsDialogVisible = ref(false)
const editingCategory = ref(null)
const movingCategory = ref(null)
const moveToParentId = ref(null)
const selectedStats = ref(null)

// 数据
const treeData = ref([])
const tableData = ref([])
const parentOptions = ref([])
const availableParents = ref([])
const breadcrumb = ref([])

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const form = reactive({
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  icon: '📂',
  color: '#409EFF',
  code: '',
  parentId: null,
  sortOrder: 0,
  status: 'active'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 图标选项
const iconOptions = [
  '📂', '📁', '🎯', '🎵', '🌤️', '🏠', '📰', '💬', 
  '📚', '🏃', '💼', '🎮', '📺', '🍔', '🚗', '❓'
]

// 计算属性
const isEditing = computed(() => !!editingCategory.value)
const showParentSelector = computed(() => !isEditing.value || editingCategory.value?.level === 2)

// 获取分类数据
const fetchCategories = async () => {
  loading.value = true
  try {
    const params = {
      includeStats: true,
      treeMode: viewMode.value === 'tree',
      level: selectedLevel.value || undefined,
      search: searchKeyword.value || undefined
    }

    if (viewMode.value === 'tree') {
      const response = await categoryAPI.getCategoryTree(params)
      treeData.value = response.data
    } else {
      const response = await categoryAPI.getCategories(params)
      tableData.value = response.data.categories || []
      Object.assign(pagination, response.data.pagination || {})
    }
  } catch (error) {
    ElMessage.error('获取分类数据失败')
    console.error('Error fetching categories:', error)
  } finally {
    loading.value = false
  }
}

// 获取父分类选项
const fetchParentOptions = async () => {
  try {
    const response = await categoryAPI.getCategories({ level: 1, includeStats: false })
    parentOptions.value = response.data.categories || []
    availableParents.value = response.data.categories || []
  } catch (error) {
    console.error('Error fetching parent options:', error)
  }
}

// 搜索处理
const handleSearch = debounce(() => {
  fetchCategories()
}, 300)

// 视图模式切换
const handleViewModeChange = (mode) => {
  viewMode.value = mode
  treeMode.value = mode === 'tree'
  fetchCategories()
}

// 层级筛选
const handleLevelChange = () => {
  fetchCategories()
}

// 表格排序
const handleSortChange = ({ prop, order }) => {
  // 实现排序逻辑
  fetchCategories()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchCategories()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchCategories()
}

// 状态相关
const getStatusType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'info',
    draft: 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    active: '活跃',
    inactive: '停用',
    draft: '草稿'
  }
  return labelMap[status] || status
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 显示创建对话框
const showCreateDialog = (parentCategory = null) => {
  editingCategory.value = null
  Object.assign(form, {
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    icon: '📂',
    color: '#409EFF',
    code: '',
    parentId: parentCategory?.id || null,
    sortOrder: 0,
    status: 'active'
  })
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (category) => {
  editingCategory.value = category
  Object.assign(form, {
    name: category.name || '',
    nameEn: category.nameEn || '',
    description: category.description || '',
    descriptionEn: category.descriptionEn || '',
    icon: category.icon || '📂',
    color: category.color || '#409EFF',
    code: category.code || '',
    parentId: category.parentId || null,
    sortOrder: category.sortOrder || 0,
    status: category.status || 'active'
  })
  dialogVisible.value = true
}

// 保存分类
const saveCategory = async () => {
  saving.value = true
  try {
    const formData = { ...form }
    
    if (isEditing.value) {
      await categoryAPI.updateCategory(editingCategory.value.id, formData)
      ElMessage.success('分类更新成功')
    } else {
      await categoryAPI.createCategory(formData)
      ElMessage.success('分类创建成功')
    }

    dialogVisible.value = false
    fetchCategories()
    fetchParentOptions()
  } catch (error) {
    ElMessage.error(isEditing.value ? '更新失败' : '创建失败')
    console.error('Error saving category:', error)
  } finally {
    saving.value = false
  }
}

// 树形/表格操作处理
const handleTreeAction = (command, data) => {
  handleAction(command, data)
}

const handleTableAction = (command, data) => {
  handleAction(command, data)
}

const handleAction = (command, data) => {
  switch (command) {
    case 'add-child':
      showCreateDialog(data)
      break
    case 'move':
      showMoveDialog(data)
      break
    case 'analyze':
      analyzeCategory(data)
      break
    case 'delete':
      deleteCategory(data)
      break
  }
}

// 显示移动对话框
const showMoveDialog = (category) => {
  movingCategory.value = category
  moveToParentId.value = category.parentId
  // 过滤掉自己和自己的子分类
  availableParents.value = parentOptions.value.filter(p => p.id !== category.id)
  moveDialogVisible.value = true
}

// 确认移动
const confirmMove = async () => {
  moving.value = true
  try {
    await categoryAPI.moveCategory(movingCategory.value.id, {
      newParentId: moveToParentId.value
    })
    ElMessage.success('分类移动成功')
    moveDialogVisible.value = false
    fetchCategories()
  } catch (error) {
    ElMessage.error('移动失败')
    console.error('Error moving category:', error)
  } finally {
    moving.value = false
  }
}

// 查看统计
const viewCategoryStats = async (category) => {
  try {
    const response = await categoryAPI.getCategoryStats(category.id, {
      includeDetails: true
    })
    selectedStats.value = {
      category,
      ...response.data
    }
    statsDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取统计数据失败')
    console.error('Error fetching stats:', error)
  }
}

// 分析分类
const analyzeCategory = async (category) => {
  try {
    const response = await categoryAPI.analyzeCategoryIntents(category.id)
    // 显示分析结果
    ElNotification({
      title: '分类分析',
      message: `分析完成，共发现 ${response.data.intentSummary.total} 个意图`,
      type: 'success'
    })
  } catch (error) {
    ElMessage.error('分析失败')
    console.error('Error analyzing category:', error)
  }
}

// 删除分类
const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await categoryAPI.deleteCategory(category.id, true)
    ElMessage.success('分类删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('Error deleting category:', error)
    }
  }
}

// 导出数据
const exportData = async () => {
  try {
    const response = await categoryAPI.exportCategories('json')
    
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/json'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `categories_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Error exporting data:', error)
  }
}

// 显示分析
const showAnalytics = () => {
  ElNotification({
    title: '数据分析',
    message: '分析功能开发中...',
    type: 'info'
  })
}

// 刷新数据
const refreshData = () => {
  fetchCategories()
  fetchParentOptions()
}

// 面包屑导航
const navigateToCategory = (category) => {
  // 实现面包屑导航逻辑
  console.log('Navigate to category:', category)
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchParentOptions()
})
</script>

<style scoped>
.categories-page {
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

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-item:hover:not(.active) {
  color: #3b82f6;
}

.breadcrumb-item.active {
  color: #1f2937;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #d1d5db;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 树形视图 */
.tree-view-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.category-tree {
  font-size: 14px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  width: 100%;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.node-info {
  flex: 1;
}

.node-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.node-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tree-node-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .tree-node-actions {
  opacity: 1;
}

/* 表格视图 */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.category-details {
  flex: 1;
}

.category-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.category-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.level-tag {
  margin-left: 8px;
}

.code-tag {
  font-family: 'Monaco', 'Consolas', monospace;
}

.category-name-en {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.category-path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.intent-stats {
  text-align: center;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

/* 分页 */
.pagination-wrapper {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

/* 图标选择器 */
.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-selector .el-input {
  flex: 1;
}

.icon-preview {
  width: 40px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f5f7fa;
}

.icon-options {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  max-width: 320px;
}

.icon-option {
  width: 36px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.icon-option:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.icon-option.active {
  border-color: #409eff;
  background: #409eff;
  color: white;
}

/* 移动对话框 */
.move-category-content {
  padding: 20px 0;
}

.move-category-content p {
  margin-bottom: 16px;
  color: #606266;
}

/* 统计内容 */
.stats-content {
  padding: 20px 0;
}

.stats-overview {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stats-grid .stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-grid .stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stats-grid .stat-label {
  font-size: 12px;
  color: #6b7280;
}

.top-intents h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .categories-page {
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
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>