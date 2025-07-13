/**
 * 数据分析Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useAnalyticsStore = defineStore('analytics', () => {
  const dashboardData = ref({})
  const usageStats = ref([])
  const intentTrends = ref([])
  const performanceMetrics = ref({})
  const loading = ref(false)
  const dateRange = reactive({
    start: '',
    end: ''
  })

  const fetchDashboardData = async () => {
    loading.value = true
    try {
      dashboardData.value = {
        totalIntents: 67,
        activeIntents: 58,
        totalCategories: 15,
        todayTests: 234,
        successRate: 87.5,
        avgResponseTime: 156,
        trends: {
          intentUsage: [120, 132, 101, 134, 90, 230, 210],
          testSuccess: [85, 87, 83, 91, 89, 88, 92]
        }
      }
      console.log('仪表板数据获取成功')
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchUsageStats = async (params = {}) => {
    loading.value = true
    try {
      usageStats.value = [
        { intent: '播放音乐', count: 156, percentage: 23.4 },
        { intent: '查看天气', count: 89, percentage: 13.4 },
        { intent: '设置闹钟', count: 76, percentage: 11.4 },
        { intent: '打开应用', count: 65, percentage: 9.8 },
        { intent: '询问时间', count: 54, percentage: 8.1 }
      ]
      console.log('使用统计获取成功')
    } catch (error) {
      console.error('获取使用统计失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchIntentTrends = async (intentId, period = '7d') => {
    loading.value = true
    try {
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10,
        accuracy: Math.random() * 0.2 + 0.8
      }))
      intentTrends.value = mockData
      console.log('意图趋势获取成功')
    } catch (error) {
      console.error('获取意图趋势失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchPerformanceMetrics = async () => {
    loading.value = true
    try {
      performanceMetrics.value = {
        avgLatency: 156,
        throughput: 1250,
        errorRate: 2.3,
        uptime: 99.8,
        memoryUsage: 65.4,
        cpuUsage: 23.7
      }
      console.log('性能指标获取成功')
    } catch (error) {
      console.error('获取性能指标失败:', error)
    } finally {
      loading.value = false
    }
  }

  const exportData = async (type, format = 'csv') => {
    try {
      console.log(`导出${type}数据，格式：${format}`)
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      return false
    }
  }

  return {
    dashboardData,
    usageStats,
    intentTrends,
    performanceMetrics,
    loading,
    dateRange,
    fetchDashboardData,
    fetchUsageStats,
    fetchIntentTrends,
    fetchPerformanceMetrics,
    exportData
  }
}) 