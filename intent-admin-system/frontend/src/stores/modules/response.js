/**
 * 回复模板Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useResponseStore = defineStore('response', () => {
  const templates = ref([])
  const loading = ref(false)
  const currentTemplate = ref(null)
  const searchQuery = ref('')
  const filterType = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const fetchTemplates = async (params = {}) => {
    loading.value = true
    try {
      templates.value = [
        { 
          id: 1, 
          name: '欢迎模板', 
          type: 'text',
          content: '您好，欢迎使用智能音箱！',
          variables: ['用户名'],
          status: 'active',
          usage_count: 245
        },
        { 
          id: 2, 
          name: '天气播报模板', 
          type: 'text',
          content: '今天{{city}}的天气是{{weather}}，温度{{temperature}}度',
          variables: ['city', 'weather', 'temperature'],
          status: 'active',
          usage_count: 189
        }
      ]
      pagination.total = templates.value.length
      console.log('回复模板列表获取成功')
    } catch (error) {
      console.error('获取回复模板列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const createTemplate = async (templateData) => {
    try {
      console.log('回复模板创建成功:', templateData)
      return true
    } catch (error) {
      console.error('创建回复模板失败:', error)
      return false
    }
  }

  const updateTemplate = async (id, templateData) => {
    try {
      console.log('回复模板更新成功:', id, templateData)
      return true
    } catch (error) {
      console.error('更新回复模板失败:', error)
      return false
    }
  }

  const deleteTemplate = async (id) => {
    try {
      console.log('回复模板删除成功:', id)
      return true
    } catch (error) {
      console.error('删除回复模板失败:', error)
      return false
    }
  }

  const previewTemplate = (template, variables = {}) => {
    let content = template.content
    Object.keys(variables).forEach(key => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key])
    })
    return content
  }

  return {
    templates,
    loading,
    currentTemplate,
    searchQuery,
    filterType,
    pagination,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate
  }
}) 