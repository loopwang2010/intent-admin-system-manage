/**
 * 核心意图Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useCoreIntentStore = defineStore('coreIntent', () => {
  // 状态
  const intents = ref([])
  const loading = ref(false)
  const currentIntent = ref(null)
  const searchQuery = ref('')
  const filterCategory = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 获取核心意图列表
  const fetchIntents = async (params = {}) => {
    loading.value = true
    try {
      // 模拟数据
      intents.value = [
        { 
          id: 1, 
          name: '播放音乐', 
          category: '娱乐类',
          keywords: ['播放', '音乐', '歌曲'],
          confidence: 0.85,
          priority: 1,
          status: 'active',
          usage_count: 156
        },
        { 
          id: 2, 
          name: '查看天气', 
          category: '查询类',
          keywords: ['天气', '温度', '气温'],
          confidence: 0.92,
          priority: 2,
          status: 'active',
          usage_count: 89
        }
      ]
      pagination.total = intents.value.length
      console.log('核心意图列表获取成功')
    } catch (error) {
      console.error('获取核心意图列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建意图
  const createIntent = async (intentData) => {
    try {
      console.log('核心意图创建成功:', intentData)
      return true
    } catch (error) {
      console.error('创建核心意图失败:', error)
      return false
    }
  }

  // 更新意图
  const updateIntent = async (id, intentData) => {
    try {
      console.log('核心意图更新成功:', id, intentData)
      return true
    } catch (error) {
      console.error('更新核心意图失败:', error)
      return false
    }
  }

  // 删除意图
  const deleteIntent = async (id) => {
    try {
      console.log('核心意图删除成功:', id)
      return true
    } catch (error) {
      console.error('删除核心意图失败:', error)
      return false
    }
  }

  return {
    intents,
    loading,
    currentIntent,
    searchQuery,
    filterCategory,
    pagination,
    fetchIntents,
    createIntent,
    updateIntent,
    deleteIntent
  }
}) 