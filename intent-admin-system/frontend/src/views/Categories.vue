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

        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类..."
          style="width: 200px;"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="showDialog">
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
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="table-card">
      <!-- 树形视图 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
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
              <div class="node-content">
                <span class="node-icon">{{ data.icon || '📂' }}</span>
                <span class="node-label">{{ data.name }}</span>
                <span v-if="data.level" class="node-level">L{{ data.level }}</span>
                <el-tag v-if="data.intentCount" type="info" size="small">
                  {{ data.intentCount }}个意图
                </el-tag>
              </div>
              <div class="node-actions">
                <el-button type="primary" link size="small" @click.stop="viewStats(data)">
                  统计
                </el-button>
                <el-button type="primary" link size="small" @click.stop="editItem(data)">
                  编辑
                </el-button>
                <el-button v-if="data.level === 1" type="success" link size="small" @click.stop="addChild(data)">
                  添加子分类
                </el-button>
                <el-button type="danger" link size="small" @click.stop="deleteItem(data)">
                  删除
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-else
        :data="categories" 
        v-loading="loading"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="分类信息" min-width="220">
          <template #default="{ row }">
            <div class="category-info">
              <div class="category-icon" :style="{ background: row.color || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }">
                {{ getCategoryIcon(row.icon) }}
              </div>
              <div class="category-details">
                <div class="category-title-row">
                  <span class="category-name">{{ row.name }}</span>
                  <el-tag v-if="row.level" :type="row.level === 1 ? 'primary' : 'success'" size="small" class="level-tag">
                    L{{ row.level }}
                  </el-tag>
                </div>
                <div class="category-name-en" v-if="row.nameEn">{{ row.nameEn }}</div>
                <div v-if="row.parentName" class="parent-category">
                  父分类: {{ row.parentName }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

        <el-table-column label="意图统计" width="120" align="center">
          <template #default="{ row }">
            <div class="intent-stats">
              <div class="stat-item">
                <span class="stat-value">{{ row.totalIntentCount || 0 }}</span>
                <span class="stat-label">总数</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用量" width="100" align="center" sortable="custom" prop="totalUsageCount">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.totalUsageCount || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />

        <el-table-column prop="createdAt" label="创建时间" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewStats(row)">
              统计
            </el-button>
            <el-button type="primary" link size="small" @click="analyzeCategory(row)">
              分析
            </el-button>
            <el-button type="primary" link size="small" @click="editItem(row)">
              编辑
            </el-button>
            <el-button v-if="row.level === 1" type="success" link size="small" @click="addChild(row)">
              添加子分类
            </el-button>
            <el-button type="danger" link size="small" @click="deleteItem(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <div v-if="dialogVisible" class="dialog-overlay" @click="dialogVisible = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>分类管理</h3>
          <button class="close-btn" @click="dialogVisible = false">×</button>
        </div>
        <form @submit.prevent="saveItem" class="dialog-form">
          <div class="form-item">
            <label>名称</label>
            <input v-model="form.name" type="text" required />
          </div>
          <div class="form-item" v-if="showParentSelector">
            <label>父分类</label>
            <select v-model="form.parentId">
              <option :value="null">无（创建一级分类）</option>
              <option v-for="parent in parentOptions" :key="parent.id" :value="parent.id">
                {{ parent.name }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label>描述</label>
            <textarea v-model="form.description"></textarea>
          </div>
          <div class="form-item">
            <label>图标</label>
            <input v-model="form.icon" type="text" placeholder="📂" />
          </div>
          <div class="form-item">
            <label>状态</label>
            <select v-model="form.status">
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="dialogVisible = false">取消</button>
            <button type="submit">确定</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { 
  Search, Plus, Download, TrendCharts, Edit, Delete, 
  Warning, InfoFilled, ArrowDown 
} from '@element-plus/icons-vue'
import { categoryAPI } from '@/api/categories'
import { debounce } from 'lodash-es'

// 响应式数据
const loading = ref(false)
const categories = ref([])
const treeData = ref([])
const analytics = ref(null)
const searchKeyword = ref('')
const dialogVisible = ref(false)
const statsDialogVisible = ref(false)
const analysisDialogVisible = ref(false)
const editingCategory = ref(null)
const selectedStats = ref(null)
const selectedAnalysis = ref(null)
const parentOptions = ref([])
const breadcrumb = ref([])
const viewMode = ref('table')
const selectedLevel = ref('')
const currentParentId = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// 排序数据
const sortParams = reactive({
  sortBy: 'sortOrder',
  sortOrder: 'ASC'
})

// 表单数据
const form = reactive({
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  icon: '📂',
  parentId: null,
  sortOrder: 0,
  status: 'active',
  tags: [],
  version: '1.0.0'
})

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入分类描述', trigger: 'blur' },
    { max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const isEditing = computed(() => !!editingCategory.value)
const showParentSelector = computed(() => {
  return !isEditing.value || (editingCategory.value && editingCategory.value.level !== 1)
})

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    if (viewMode.value === 'tree') {
      await fetchTreeData()
    } else {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        includeStats: true,
        includeParentName: true,
        ...sortParams
      }
      
      if (searchKeyword.value) {
        params.search = searchKeyword.value
      }
      
      if (selectedLevel.value) {
        params.level = selectedLevel.value
      }

      const response = await categoryAPI.getCategories(params)
      categories.value = response.data.categories || []
      
      if (response.data.pagination) {
        Object.assign(pagination, response.data.pagination)
      }
    }
  } catch (error) {
    ElMessage.error('获取分类列表失败')
    console.error('Error fetching categories:', error)
  } finally {
    loading.value = false
  }
}

// 获取树形数据
const fetchTreeData = async () => {
  try {
    const params = {}
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    if (selectedLevel.value) {
      params.level = selectedLevel.value
    }
    
    const response = await categoryAPI.getCategoryTree(params)
    treeData.value = response.data || []
  } catch (error) {
    ElMessage.error('获取树形数据失败')
    console.error('Error fetching tree data:', error)
  }
}

// 获取父分类选项
const fetchParentOptions = async () => {
  try {
    const response = await categoryAPI.getParentOptions()
    parentOptions.value = response.data || []
  } catch (error) {
    console.error('Error fetching parent options:', error)
  }
}

// 获取分析数据
const fetchAnalytics = async () => {
  try {
    const response = await categoryAPI.getCategoryAnalytics()
    analytics.value = response.data
  } catch (error) {
    console.error('Error fetching analytics:', error)
  }
}

// 搜索处理
const handleSearch = debounce(() => {
  pagination.page = 1
  fetchCategories()
}, 300)

// 视图模式切换
const handleViewModeChange = () => {
  fetchCategories()
}

// 层级筛选
const handleLevelChange = () => {
  pagination.page = 1
  fetchCategories()
}

// 面包屑导航
const navigateToCategory = (category) => {
  if (category.id) {
    currentParentId.value = category.id
    fetchCategories()
  }
}

// 添加子分类
const addChild = (parentCategory) => {
  form.parentId = parentCategory.id
  editingCategory.value = null
  Object.assign(form, {
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    icon: '📂',
    parentId: parentCategory.id,
    sortOrder: 0,
    status: 'active',
    tags: [],
    version: '1.0.0'
  })
  fetchParentOptions()
  dialogVisible.value = true
}

// 排序处理
const handleSortChange = ({ prop, order }) => {
  if (prop) {
    sortParams.sortBy = prop
    sortParams.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
    pagination.page = 1
    fetchCategories()
  }
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

// 显示创建/编辑对话框
const showDialog = () => {
  editingCategory.value = null
  Object.assign(form, {
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    icon: '📂',
    parentId: null,
    sortOrder: 0,
    status: 'active',
    tags: [],
    version: '1.0.0'
  })
  fetchParentOptions()
  dialogVisible.value = true
}

// 编辑分类
const editItem = (category) => {
  editingCategory.value = category
  Object.assign(form, {
    name: category.name || '',
    nameEn: category.nameEn || '',
    description: category.description || '',
    descriptionEn: category.descriptionEn || '',
    icon: category.icon || '📂',
    parentId: category.parentId || null,
    sortOrder: category.sortOrder || 0,
    status: category.status || 'active',
    tags: category.tags ? (typeof category.tags === 'string' ? JSON.parse(category.tags) : category.tags) : [],
    version: category.version || '1.0.0'
  })
  fetchParentOptions()
  dialogVisible.value = true
}

// 保存分类
const saveItem = async () => {
  loading.value = true
  try {
    const data = {
      ...form,
      tags: JSON.stringify(form.tags)
    }

    if (isEditing.value) {
      await categoryAPI.updateCategory(editingCategory.value.id, data)
      ElMessage.success('分类更新成功')
    } else {
      await categoryAPI.createCategory(data)
      ElMessage.success('分类创建成功')
    }

    dialogVisible.value = false
    fetchCategories()
    fetchAnalytics()
  } catch (error) {
    ElMessage.error(isEditing.value ? '更新分类失败' : '创建分类失败')
    console.error('Error saving category:', error)
  } finally {
    loading.value = false
  }
}

// 删除分类
const deleteItem = async (category) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？如果该分类下有意图，将一起删除。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    if (confirmResult === 'confirm') {
      await categoryAPI.deleteCategory(category.id, true)
      ElMessage.success('分类删除成功')
      fetchCategories()
      fetchAnalytics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除分类失败')
      console.error('Error deleting category:', error)
    }
  }
}

// 查看统计
const viewStats = async (category) => {
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
    selectedAnalysis.value = response.data
    analysisDialogVisible.value = true
  } catch (error) {
    ElMessage.error('分析分类失败')
    console.error('Error analyzing category:', error)
  }
}

// 导出数据
const exportData = async () => {
  try {
    const response = await categoryAPI.exportCategories('json')
    
    // 创建下载链接
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
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出数据失败')
    console.error('Error exporting data:', error)
  }
}

// 显示分析页面
const showAnalytics = () => {
  // 这里可以跳转到专门的分析页面或显示分析对话框
  ElNotification({
    title: '数据分析',
    message: '分析功能开发中，敬请期待...',
    type: 'info'
  })
}

// 图标显示逻辑：只显示emoji或单字符
function getCategoryIcon(icon) {
  if (!icon) return '📂';
  // 判断是否为emoji或单字符
  if (icon.length === 1 || /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(icon)) {
    return icon;
  }
  // 否则返回默认
  return '📂';
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchAnalytics()
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
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-left {
  flex: 1;
}

/* 面包屑导航 */
.breadcrumb {
  margin-top: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
}

.breadcrumb-item {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.breadcrumb-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.breadcrumb-item.active {
  color: #3b82f6;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #d1d5db;
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

/* 分类信息 */
.category-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245,87,108,0.12);
  transition: transform 0.2s;
  user-select: none;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
}
.el-table__row:hover .category-icon {
  transform: scale(1.08);
}
.category-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.category-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.category-name {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
}
.category-name-en {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
.level-tag {
  margin-left: 8px;
}
.el-table__row:hover {
  background: #f0f7ff !important;
}

/* 树形视图样式 */
.tree-view {
  padding: 20px;
}

.category-tree {
  background: transparent;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-icon {
  font-size: 18px;
}

.node-label {
  font-weight: 500;
  color: #374151;
}

.node-level {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

/* 意图统计 */
.intent-stats {
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* 分页 */
.pagination-wrapper {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

/* 对话框样式保持原有的设计 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #374151;
  background: #f9fafb;
}

.dialog-form {
  padding: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-item input,
.form-item textarea,
.form-item select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-item textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.form-actions button {
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  border: none;
}

.form-actions button[type="button"] {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.form-actions button[type="button"]:hover {
  background: #f3f4f6;
}

.form-actions button[type="submit"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.form-actions button[type="submit"]:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
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
  
  .header-left {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .header-actions .el-radio-group,
  .header-actions .el-select,
  .header-actions .el-input {
    margin-bottom: 8px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #337ecc;
}

.btn-text {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  padding: 4px 8px;
  margin-right: 8px;
}

.btn-text:hover {
  color: #337ecc;
}

.btn-danger {
  color: #f56c6c;
}

.btn-danger:hover {
  color: #dd6161;
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f0f9ff;
  color: #1f2937;
}

.tag-success {
  background: #f0f9ff;
  color: #059669;
}

.tag-info {
  background: #f3f4f6;
  color: #6b7280;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.dialog-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.close-btn:hover {
  color: #606266;
}

.dialog-form {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #606266;
}

.form-item input,
.form-item textarea,
.form-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  outline: none;
  border-color: #409eff;
}

.form-item textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
}

.form-actions button[type="button"] {
  background: white;
  color: #606266;
}

.form-actions button[type="submit"] {
  background: #409eff;
  color: white;
  border-color: #409eff;
}
</style>