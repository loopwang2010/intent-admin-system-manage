/**
 * 全局指令注册
 */

// 示例：权限指令
const permission = {
  mounted(el, binding) {
    // 可以在这里添加权限检查逻辑
    // 如果没有权限，可以隐藏元素
    if (binding.value && typeof binding.value === 'string') {
      // 这里可以添加权限检查逻辑
      console.log('权限检查:', binding.value)
    }
  }
}

// 示例：加载指令
const loading = {
  mounted(el, binding) {
    if (binding.value) {
      el.style.opacity = '0.5'
      el.style.pointerEvents = 'none'
    }
  },
  updated(el, binding) {
    if (binding.value) {
      el.style.opacity = '0.5'
      el.style.pointerEvents = 'none'
    } else {
      el.style.opacity = '1'
      el.style.pointerEvents = 'auto'
    }
  }
}

export default {
  install(app) {
    // 注册全局指令
    app.directive('permission', permission)
    app.directive('loading', loading)
    
    console.log('全局指令已注册')
  }
} 