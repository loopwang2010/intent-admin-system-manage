/**
 * 国际化设置
 */
import { createI18n } from 'vue-i18n'

// 中文语言包
const zhCn = {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    reset: '重置',
    loading: '加载中...',
    noData: '暂无数据',
    operation: '操作'
  },
  menu: {
    dashboard: '仪表板',
    intentCategory: '意图分类',
    coreIntent: '核心意图',
    nonCoreIntent: '非核心意图',
    responseTemplate: '回复模板',
    intentTest: '意图测试',
    userManagement: '用户管理',
    dataAnalysis: '数据分析'
  },
  message: {
    success: '操作成功',
    error: '操作失败',
    warning: '警告',
    info: '提示'
  }
}

// 英文语言包
const en = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    reset: 'Reset',
    loading: 'Loading...',
    noData: 'No Data',
    operation: 'Operation'
  },
  menu: {
    dashboard: 'Dashboard',
    intentCategory: 'Intent Category',
    coreIntent: 'Core Intent',
    nonCoreIntent: 'Non-Core Intent',
    responseTemplate: 'Response Template',
    intentTest: 'Intent Test',
    userManagement: 'User Management',
    dataAnalysis: 'Data Analysis'
  },
  message: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  }
}

/**
 * 设置国际化
 */
export function setupI18n() {
  const savedLang = localStorage.getItem('language') || 'zh-cn'
  
  const i18n = createI18n({
    legacy: false,
    locale: savedLang,
    fallbackLocale: 'zh-cn',
    messages: {
      'zh-cn': zhCn,
      'en': en
    }
  })

  console.log('国际化已设置，当前语言:', savedLang)
  
  return i18n
}

/**
 * 切换语言
 * @param {String} locale 语言代码
 */
export function setLocale(locale) {
  localStorage.setItem('language', locale)
  location.reload() // 重新加载页面以应用新语言
} 