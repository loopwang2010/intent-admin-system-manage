<template>
  <div class="cascading-categories-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalCategories }}</div>
          <div class="stat-label">总分类数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalResponses }}</div>
          <div class="stat-label">回复内容数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-number">{{ selectedCategory ? childCategories.length : 0 }}</div>
          <div class="stat-label">当前子分类数</div>
        </div>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>级联分类管理</h1>
        <div class="breadcrumb" v-if="selectedCategory">
          <span class="breadcrumb-item" @click="resetSelection">
            所有分类
          </span>
          <span class="breadcrumb-separator">></span>
          <span class="breadcrumb-item active">
            {{ selectedCategory.name }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：一级分类列表 -->
      <div class="primary-categories">
        <div class="section-header">
          <h3>📁 一级分类</h3>
          <span class="count">{{ primaryCategories.length }}</span>
        </div>
        <div class="category-list">
          <div 
            v-for="category in primaryCategories" 
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory?.id === category.id }"
            @click="selectPrimaryCategory(category)"
          >
            <div class="category-info">
              <span class="category-icon">{{ category.icon || '📂' }}</span>
              <div class="category-details">
                <div class="category-name">{{ category.name }}</div>
                <div class="category-code">{{ category.code }}</div>
              </div>
            </div>
            <div class="category-stats">
              <el-tag type="info" size="small">{{ category.childCount || 0 }}个子分类</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：二级分类和回复内容 -->
      <div class="secondary-content" v-if="selectedCategory">
        <!-- 二级分类列表 -->
        <div class="secondary-categories">
          <div class="section-header">
            <h3>📋 {{ selectedCategory.name }} - 子分类</h3>
            <span class="count">{{ childCategories.length }}</span>
          </div>
          <div class="category-grid">
            <div 
              v-for="child in childCategories" 
              :key="child.id"
              class="child-category-card"
              :class="{ selected: selectedChildCategory?.id === child.id }"
              @click="selectChildCategory(child)"
            >
              <div class="card-header">
                <span class="category-icon">{{ child.icon || '📄' }}</span>
                <span class="category-name">{{ child.name }}</span>
              </div>
              <div class="card-content">
                <div class="category-description">{{ child.description }}</div>
                <div class="response-count">
                  <el-tag type="success" size="small">
                    {{ child.responseCount || 0 }}条回复
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 回复内容管理 -->
        <div class="response-management" v-if="selectedChildCategory">
          <div class="section-header">
            <h3>💬 {{ selectedChildCategory.name }} - 回复内容</h3>
            <div class="header-actions">
              <el-dropdown @command="handleQuickAction">
                <el-button size="small">
                  快速操作
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="addBatch">
                      <el-icon><Plus /></el-icon>
                      批量添加回复
                    </el-dropdown-item>
                    <el-dropdown-item command="clearAll">
                      <el-icon><Delete /></el-icon>
                      清空所有回复
                    </el-dropdown-item>
                    <el-dropdown-item command="generateSample">
                      <el-icon><Star /></el-icon>
                      生成示例回复
                    </el-dropdown-item>
                    <el-dropdown-item command="getAIRecommendations">
                      <el-icon><Star /></el-icon>
                      获取AI推荐
                    </el-dropdown-item>
                    <el-dropdown-item command="sortByLength">
                      <el-icon><Sort /></el-icon>
                      按长度排序
                    </el-dropdown-item>
                    <el-dropdown-item command="exportResponses" divided>
                      <el-icon><Download /></el-icon>
                      导出回复内容
                    </el-dropdown-item>
                    <el-dropdown-item command="importResponses">
                      <el-icon><Upload /></el-icon>
                      导入回复内容
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button type="primary" size="small" @click="addResponse">
                <el-icon><Plus /></el-icon>
                添加回复
              </el-button>
              <el-button size="small" @click="saveAllResponses" :loading="saving" :disabled="!hasModifiedResponses">
                <el-icon><Check /></el-icon>
                保存全部 {{ modifiedCount > 0 ? `(${modifiedCount})` : '' }}
              </el-button>
            </div>
          </div>
          
          <div class="response-list" v-loading="loadingResponses">
            <div 
              v-for="(response, index) in responses" 
              :key="response.id || index"
              class="response-item"
            >
              <div class="response-header">
                <span class="response-index">#{{ index + 1 }}</span>
                <div class="response-actions">
                  <el-button 
                    type="danger" 
                    link 
                    size="small" 
                    @click="removeResponse(index)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
              <div class="response-content">
                <el-input
                  v-model="response.content"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入回复内容..."
                  @input="markResponseAsModified(index)"
                  :class="{ modified: response.isModified }"
                />
                <div class="response-meta">
                  <el-tag v-if="response.type" size="small">{{ response.type }}</el-tag>
                  <el-tag v-if="response.priority" type="info" size="small">
                    优先级: {{ response.priority }}
                  </el-tag>
                  <el-tag v-if="response.source === 'ai_recommendation'" type="success" size="small">
                    AI推荐 ({{ response.confidence }})
                  </el-tag>
                  <el-tag v-if="response.isModified" type="warning" size="small">
                    已修改
                  </el-tag>
                </div>
              </div>
            </div>
            
            <div v-if="responses.length === 0" class="empty-responses">
              <el-empty description="暂无回复内容">
                <el-button type="primary" @click="addResponse">添加第一条回复</el-button>
              </el-empty>
            </div>
          </div>
        </div>
      </div>

      <!-- 未选择状态 -->
      <div class="empty-selection" v-else>
        <el-empty description="请选择一个一级分类查看详情">
          <template #image>
            <div class="empty-icon">📁</div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, Plus, Check, Delete, ArrowDown, Sort, Download, Upload, Star
} from '@element-plus/icons-vue'
import { categoryAPI } from '@/api/categories'

// 响应式数据
const loading = ref(false)
const loadingResponses = ref(false)
const saving = ref(false)
const primaryCategories = ref([])
const childCategories = ref([])
const responses = ref([])
const selectedCategory = ref(null)
const selectedChildCategory = ref(null)

// 统计数据
const totalCategories = computed(() => {
  return primaryCategories.value.length + childCategories.value.length
})

const totalResponses = computed(() => {
  return childCategories.value.reduce((sum, cat) => sum + (cat.responseCount || 0), 0)
})

// 计算修改的回复数量
const modifiedCount = computed(() => {
  return responses.value.filter(r => r.isModified || r.isNew).length
})

// 是否有修改的回复
const hasModifiedResponses = computed(() => {
  return modifiedCount.value > 0
})

// 获取一级分类列表
const fetchPrimaryCategories = async () => {
  loading.value = true
  try {
    const response = await categoryAPI.getCategories({
      level: 1,
      includeChildCount: true
    })
    primaryCategories.value = response.data.categories || []
  } catch (error) {
    ElMessage.error('获取一级分类失败')
    console.error('Error fetching primary categories:', error)
  } finally {
    loading.value = false
  }
}

// 获取子分类列表
const fetchChildCategories = async (parentId) => {
  if (!parentId) return
  
  loading.value = true
  try {
    const response = await categoryAPI.getChildCategories(parentId, {
      includeResponseCount: true
    })
    childCategories.value = response.data.categories || []
  } catch (error) {
    ElMessage.error('获取子分类失败')
    console.error('Error fetching child categories:', error)
  } finally {
    loading.value = false
  }
}

// 获取回复内容
const fetchResponses = async (categoryId) => {
  if (!categoryId) return
  
  loadingResponses.value = true
  try {
    const response = await categoryAPI.getCategoryResponses(categoryId)
    responses.value = (response.data.responses || []).map(r => ({
      ...r,
      isModified: false
    }))
  } catch (error) {
    ElMessage.error('获取回复内容失败')
    console.error('Error fetching responses:', error)
  } finally {
    loadingResponses.value = false
  }
}

// 选择一级分类
const selectPrimaryCategory = async (category) => {
  selectedCategory.value = category
  selectedChildCategory.value = null
  responses.value = []
  await fetchChildCategories(category.id)
}

// 选择二级分类
const selectChildCategory = async (category) => {
  selectedChildCategory.value = category
  await fetchResponses(category.id)
}

// 重置选择
const resetSelection = () => {
  selectedCategory.value = null
  selectedChildCategory.value = null
  childCategories.value = []
  responses.value = []
}

// 添加回复
const addResponse = () => {
  responses.value.push({
    id: null,
    content: '',
    type: 'text',
    priority: responses.value.length + 1,
    status: 'active',
    isModified: true,
    isNew: true
  })
}

// 删除回复
const removeResponse = async (index) => {
  const response = responses.value[index]
  
  if (response.id && !response.isNew) {
    // 如果是已存在的回复，需要调用API删除
    try {
      await ElMessageBox.confirm('确定要删除这条回复吗？', '确认删除', {
        type: 'warning'
      })
      
      await categoryAPI.deleteCategoryResponse(selectedChildCategory.value.id, response.id)
      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
        return
      }
    }
  }
  
  responses.value.splice(index, 1)
  // 重新计算优先级
  responses.value.forEach((r, i) => {
    r.priority = i + 1
    if (r.id) r.isModified = true
  })
}

// 标记回复为已修改
const markResponseAsModified = (index) => {
  const response = responses.value[index]
  if (!response.isNew) {
    response.isModified = true
  }
}

// 保存所有回复
const saveAllResponses = async () => {
  if (!selectedChildCategory.value) return
  
  saving.value = true
  try {
    const modifiedResponses = responses.value.filter(r => r.isModified || r.isNew)
    
    if (modifiedResponses.length === 0) {
      ElMessage.info('没有需要保存的修改')
      return
    }
    
    // 准备保存的数据
    const saveData = responses.value.map((r, index) => ({
      id: r.id,
      content: r.content,
      type: r.type || 'text',
      priority: index + 1,
      status: r.status || 'active'
    }))
    
    await categoryAPI.batchUpdateCategoryResponses(selectedChildCategory.value.id, saveData)
    
    // 重新获取数据
    await fetchResponses(selectedChildCategory.value.id)
    
    // 更新子分类的回复数量
    await fetchChildCategories(selectedCategory.value.id)
    
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('Error saving responses:', error)
  } finally {
    saving.value = false
  }
}

// 快速操作处理
const handleQuickAction = async (command) => {
  switch (command) {
    case 'addBatch':
      await handleBatchAdd()
      break
    case 'clearAll':
      await handleClearAll()
      break
    case 'generateSample':
      await handleGenerateSample()
      break
    case 'sortByLength':
      handleSortByLength()
      break
    case 'exportResponses':
      handleExportResponses()
      break
    case 'importResponses':
      handleImportResponses()
      break
    case 'getAIRecommendations':
      await handleGetAIRecommendations()
      break
  }
}

// 批量添加回复
const handleBatchAdd = async () => {
  try {
    const { value: inputText } = await ElMessageBox.prompt(
      '请输入回复内容，每行一个回复：',
      '批量添加回复',
      {
        confirmButtonText: '添加',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '示例：\n正在处理您的请求...\n处理完成\n请稍等'
      }
    )
    
    if (inputText && inputText.trim()) {
      const lines = inputText.trim().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        responses.value.push({
          id: null,
          content: line.trim(),
          type: 'text',
          priority: responses.value.length + 1,
          status: 'active',
          isModified: true,
          isNew: true
        })
      })
      ElMessage.success(`已添加 ${lines.length} 条回复`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('添加失败')
    }
  }
}

// 清空所有回复
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有回复内容吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    responses.value = []
    ElMessage.success('已清空所有回复')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

// 生成示例回复
const handleGenerateSample = () => {
  const categoryName = selectedChildCategory.value?.name || '功能'
  const sampleResponses = [
    `正在为您${categoryName}中...`,
    `${categoryName}已完成`,
    `${categoryName}功能已启动`,
    `正在处理您的${categoryName}请求`,
    `${categoryName}操作成功`
  ]
  
  sampleResponses.forEach(content => {
    responses.value.push({
      id: null,
      content,
      type: 'text',
      priority: responses.value.length + 1,
      status: 'active',
      isModified: true,
      isNew: true
    })
  })
  
  ElMessage.success(`已生成 ${sampleResponses.length} 条示例回复`)
}

// 按长度排序
const handleSortByLength = () => {
  responses.value.sort((a, b) => a.content.length - b.content.length)
  // 重新设置优先级
  responses.value.forEach((r, index) => {
    r.priority = index + 1
    if (r.id) r.isModified = true
  })
  ElMessage.success('已按长度排序')
}

// 导出回复内容
const handleExportResponses = () => {
  if (responses.value.length === 0) {
    ElMessage.warning('没有回复内容可以导出')
    return
  }

  const exportData = {
    category: {
      id: selectedChildCategory.value.id,
      name: selectedChildCategory.value.name,
      code: selectedChildCategory.value.code
    },
    responses: responses.value.map(r => ({
      content: r.content,
      type: r.type,
      priority: r.priority,
      status: r.status
    })),
    exportTime: new Date().toISOString(),
    count: responses.value.length
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${selectedChildCategory.value.name}_回复内容_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  ElMessage.success('回复内容导出成功')
}

// 导入回复内容
const handleImportResponses = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.responses || !Array.isArray(data.responses)) {
        ElMessage.error('文件格式不正确')
        return
      }

      const confirmResult = await ElMessageBox.confirm(
        `确定要导入 ${data.responses.length} 条回复内容吗？这将替换当前的所有回复内容。`,
        '确认导入',
        {
          confirmButtonText: '确定导入',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      if (confirmResult === 'confirm') {
        responses.value = data.responses.map((r, index) => ({
          id: null,
          content: r.content,
          type: r.type || 'text',
          priority: index + 1,
          status: r.status || 'active',
          isModified: true,
          isNew: true
        }))
        
        ElMessage.success(`成功导入 ${data.responses.length} 条回复内容`)
      }
    } catch (error) {
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  input.click()
}

// 获取AI推荐回复
const handleGetAIRecommendations = async () => {
  if (!selectedChildCategory.value) {
    ElMessage.warning('请先选择一个二级分类')
    return
  }
  
  try {
    const loading = ElMessage({
      message: '正在获取AI推荐回复...',
      type: 'info',
      duration: 0
    })
    
    const response = await categoryAPI.getAIRecommendedResponses(selectedChildCategory.value.id)
    loading.close()
    
    if (response.data.recommendations && response.data.recommendations.length > 0) {
      const recommendations = response.data.recommendations
      
      // 显示推荐内容选择对话框
      const recommendationsList = recommendations.map((rec, index) => 
        `${index + 1}. ${rec.content} (置信度: ${rec.confidence})`
      ).join('\n')
      
      const confirmResult = await ElMessageBox.confirm(
        `AI为您推荐了 ${recommendations.length} 条回复内容：\n\n${recommendationsList}\n\n是否添加这些推荐回复？`,
        'AI智能推荐',
        {
          confirmButtonText: '添加推荐回复',
          cancelButtonText: '取消',
          type: 'info',
          customClass: 'ai-recommendation-dialog'
        }
      )
      
      if (confirmResult === 'confirm') {
        // 添加推荐的回复
        recommendations.forEach(rec => {
          responses.value.push({
            id: null,
            content: rec.content,
            type: rec.type || 'text',
            priority: responses.value.length + 1,
            status: 'active',
            isModified: true,
            isNew: true,
            source: 'ai_recommendation',
            confidence: rec.confidence
          })
        })
        
        ElMessage.success(`已添加 ${recommendations.length} 条AI推荐回复`)
      }
    } else {
      ElMessage.info('暂无AI推荐内容')
    }
  } catch (error) {
    console.error('获取AI推荐失败:', error)
    ElMessage.error('获取AI推荐失败，请稍后重试')
  }
}

// 刷新数据
const refreshData = async () => {
  await fetchPrimaryCategories()
  if (selectedCategory.value) {
    await fetchChildCategories(selectedCategory.value.id)
    if (selectedChildCategory.value) {
      await fetchResponses(selectedChildCategory.value.id)
    }
  }
  ElMessage.success('数据已刷新')
}

// 生命周期
onMounted(() => {
  fetchPrimaryCategories()
})
</script>

<style scoped>
.cascading-categories-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
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

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  min-height: 600px;
}

/* 一级分类列表 */
.primary-categories {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.count {
  background: #e5e7eb;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.category-list {
  max-height: 70vh;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-item:hover {
  background: #f8f9fa;
}

.category-item.active {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.category-icon {
  font-size: 20px;
}

.category-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.category-code {
  font-size: 12px;
  color: #6b7280;
}

/* 二级内容区域 */
.secondary-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.secondary-categories {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 24px;
}

.child-category-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.child-category-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.child-category-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-header .category-icon {
  font-size: 18px;
}

.card-header .category-name {
  font-weight: 500;
  color: #1f2937;
}

.category-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.response-count {
  text-align: right;
}

/* 回复内容管理 */
.response-management {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.response-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 24px;
}

.response-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.response-index {
  font-weight: 500;
  color: #6b7280;
}

.response-content {
  padding: 16px;
}

.response-content .el-textarea {
  margin-bottom: 12px;
}

.response-content .el-textarea.modified {
  border-color: #f59e0b;
}

.response-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 空状态 */
.empty-selection {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-responses {
  text-align: center;
  padding: 40px;
}

/* AI推荐对话框样式 */
:deep(.ai-recommendation-dialog) {
  .el-message-box__content {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .el-message-box__message {
    white-space: pre-wrap;
    line-height: 1.6;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .primary-categories {
    order: 2;
  }
  
  .secondary-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .cascading-categories-page {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>