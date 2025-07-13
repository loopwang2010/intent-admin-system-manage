/**
 * 非核心意图Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useNonCoreIntentStore = defineStore('nonCoreIntent', () => {
  const intents = ref([])
  const loading = ref(false)
  const currentIntent = ref(null)
  const searchQuery = ref('')
  const filterStatus = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const fetchIntents = async (params = {}) => {
    loading.value = true
    try {
      intents.value = [
        { 
          id: 1, 
          name: '设置闹钟', 
          category: '工具类',
          status: 'pending',
          direct_reply: '好的，已为您设置闹钟',
          confidence: 0.75,
          created_at: '2024-01-15'
        }
      ]
      pagination.total = intents.value.length
      console.log('非核心意图列表获取成功')
    } catch (error) {
      console.error('获取非核心意图列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const approveIntent = async (id) => {
    try {
      console.log('非核心意图审批成功:', id)
      return true
    } catch (error) {
      console.error('审批非核心意图失败:', error)
      return false
    }
  }

  const rejectIntent = async (id, reason) => {
    try {
      console.log('非核心意图拒绝成功:', id, reason)
      return true
    } catch (error) {
      console.error('拒绝非核心意图失败:', error)
      return false
    }
  }

  return {
    intents,
    loading,
    currentIntent,
    searchQuery,
    filterStatus,
    pagination,
    fetchIntents,
    approveIntent,
    rejectIntent
  }
}) 