/**
 * 意图测试Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useTestStore = defineStore('test', () => {
  const testResults = ref([])
  const loading = ref(false)
  const currentTest = ref(null)
  const testHistory = ref([])
  const batchTestResults = ref([])

  const singleTest = async (inputText) => {
    loading.value = true
    try {
      // 模拟意图识别测试
      const result = {
        id: Date.now(),
        input: inputText,
        recognizedIntent: '播放音乐',
        confidence: 0.87,
        category: '娱乐类',
        response: '正在为您播放音乐',
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 500) + 100
      }
      
      testResults.value.unshift(result)
      testHistory.value.unshift(result)
      
      console.log('单次测试完成:', result)
      return result
    } catch (error) {
      console.error('意图测试失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  const batchTest = async (testCases) => {
    loading.value = true
    try {
      const results = []
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]
        const result = {
          id: Date.now() + i,
          input: testCase.input,
          expectedIntent: testCase.expectedIntent,
          recognizedIntent: '播放音乐', // 模拟识别结果
          confidence: Math.random() * 0.3 + 0.7,
          isCorrect: Math.random() > 0.2, // 80%正确率
          timestamp: new Date().toISOString()
        }
        results.push(result)
      }
      
      batchTestResults.value = results
      console.log('批量测试完成:', results)
      return results
    } catch (error) {
      console.error('批量测试失败:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  const getTestStats = () => {
    const total = testHistory.value.length
    const avgConfidence = total > 0 
      ? testHistory.value.reduce((sum, test) => sum + test.confidence, 0) / total 
      : 0
    const avgDuration = total > 0
      ? testHistory.value.reduce((sum, test) => sum + (test.duration || 0), 0) / total
      : 0

    return {
      total,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgDuration: Math.round(avgDuration)
    }
  }

  const clearHistory = () => {
    testHistory.value = []
    testResults.value = []
    batchTestResults.value = []
  }

  return {
    testResults,
    loading,
    currentTest,
    testHistory,
    batchTestResults,
    singleTest,
    batchTest,
    getTestStats,
    clearHistory
  }
}) 