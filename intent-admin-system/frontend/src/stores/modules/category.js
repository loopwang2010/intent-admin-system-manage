/**
 * 意图分类Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref([])
  const loading = ref(false)
  const currentCategory = ref(null)
  const searchQuery = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 获取分类列表
  const fetchCategories = async (params = {}) => {
    loading.value = true
    try {
      // 这里应该调用API
      // const response = await categoryAPI.getList(params)
      // categories.value = response.data
      
      // 模拟数据
      categories.value = [
        { id: 1, name: '问候类', description: '各种问候语意图', status: 'active', count: 5 },
        { id: 2, name: '查询类', description: '信息查询相关意图', status: 'active', count: 12 },
        { id: 3, name: '控制类', description: '设备控制相关意图', status: 'active', count: 8 }
      ]
      pagination.total = categories.value.length
      
      console.log('分类列表获取成功')
    } catch (error) {
      console.error('获取分类列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  const createCategory = async (categoryData) => {
    try {
      // const response = await categoryAPI.create(categoryData)
      // categories.value.unshift(response.data)
      
      console.log('分类创建成功:', categoryData)
      return true
    } catch (error) {
      console.error('创建分类失败:', error)
      return false
    }
  }

  // 更新分类
  const updateCategory = async (id, categoryData) => {
    try {
      // const response = await categoryAPI.update(id, categoryData)
      // const index = categories.value.findIndex(cat => cat.id === id)
      // if (index !== -1) {
      //   categories.value[index] = response.data
      // }
      
      console.log('分类更新成功:', id, categoryData)
      return true
    } catch (error) {
      console.error('更新分类失败:', error)
      return false
    }
  }

  // 删除分类
  const deleteCategory = async (id) => {
    try {
      // await categoryAPI.delete(id)
      // categories.value = categories.value.filter(cat => cat.id !== id)
      
      console.log('分类删除成功:', id)
      return true
    } catch (error) {
      console.error('删除分类失败:', error)
      return false
    }
  }

  // 设置当前分类
  const setCurrentCategory = (category) => {
    currentCategory.value = category
  }

  // 重置状态
  const resetState = () => {
    categories.value = []
    currentCategory.value = null
    searchQuery.value = ''
    pagination.page = 1
    pagination.total = 0
  }

  return {
    // 状态
    categories,
    loading,
    currentCategory,
    searchQuery,
    pagination,
    
    // 方法
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setCurrentCategory,
    resetState
  }
}, {
  persist: {
    key: 'category-store',
    storage: localStorage,
    paths: ['categories', 'currentCategory']
  }
}) 