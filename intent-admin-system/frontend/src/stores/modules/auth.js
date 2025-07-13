import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const isLoading = ref(false)
  const loginAttempts = ref(0)
  const lastLoginTime = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => ['admin', 'editor'].includes(user.value?.role))
  const canEdit = computed(() => isEditor.value)
  const canDelete = computed(() => isAdmin.value)

  // 用户权限检查
  const hasPermission = (permission) => {
    if (!user.value) return false
    
    // 如果传入的是角色数组，检查用户角色是否在数组中
    if (Array.isArray(permission)) {
      return permission.includes(user.value.role)
    }
    
    // 如果传入的是具体权限字符串，检查角色对应的权限
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'system_config'],
      editor: ['read', 'write'],
      viewer: ['read']
    }
    
    return rolePermissions[user.value.role]?.includes(permission) || false
  }

  // 登录
  const login = async (credentials) => {
    try {
      isLoading.value = true
      const response = await authAPI.login(credentials)
      
      if (response.success) {
        token.value = response.data.token
        user.value = response.data.user
        lastLoginTime.value = new Date().toISOString()
        
        // 存储到localStorage
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        loginAttempts.value = 0
        
        ElMessage.success('登录成功')
        return { success: true }
      } else {
        loginAttempts.value++
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      loginAttempts.value++
      ElMessage.error(error.message || '登录失败')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (registerData) => {
    try {
      isLoading.value = true
      const response = await authAPI.register(registerData)
      
      if (response.success) {
        ElMessage.success('注册成功，请登录')
        return { success: true }
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '注册失败')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      // 调用后端登出接口
      if (token.value) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('登出接口调用失败:', error)
    } finally {
      // 清除本地状态
      token.value = ''
      user.value = null
      lastLoginTime.value = null
      loginAttempts.value = 0
      
      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      ElMessage.success('已登出')
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return false
      
      const response = await authAPI.getUserInfo()
      if (response.success) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(user.value))
        return true
      } else {
        // token无效，清除认证状态
        await logout()
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      await logout()
      return false
    }
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      const response = await authAPI.updateProfile(profileData)
      
      if (response.success) {
        user.value = { ...user.value, ...response.data }
        localStorage.setItem('user', JSON.stringify(user.value))
        ElMessage.success('个人信息更新成功')
        return { success: true }
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '更新失败')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 修改密码
  const changePassword = async (passwordData) => {
    try {
      isLoading.value = true
      const response = await authAPI.changePassword(passwordData)
      
      if (response.success) {
        ElMessage.success('密码修改成功，请重新登录')
        await logout()
        return { success: true }
      } else {
        throw new Error(response.message || '密码修改失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '密码修改失败')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 验证token
  const verifyToken = async () => {
    try {
      if (!token.value) return false
      
      // 开发环境下模拟token验证成功
      if (import.meta.env.DEV && token.value === 'mock-token-123') {
        console.log('开发环境：模拟token验证成功')
        return true
      }
      
      const response = await authAPI.verifyToken()
      return response.success
    } catch (error) {
      console.error('Token验证失败:', error)
      
      // 开发环境下不执行logout
      if (import.meta.env.DEV) {
        console.log('开发环境：忽略token验证错误')
        return true
      }
      
      await logout()
      return false
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    // 开发环境下直接使用模拟数据，不读取localStorage
    if (import.meta.env.DEV) {
      token.value = 'mock-token-123'
      user.value = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        last_login: new Date().toISOString()
      }
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      console.log('开发环境：已设置模拟用户数据')
      return
    }
    
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      
      // 验证token是否有效
      const isValid = await verifyToken()
      if (!isValid) {
        await logout()
      }
    }
  }

  // 检查token有效性（路由守卫使用）
  const checkTokenValid = async () => {
    try {
      if (!token.value) return false
      
      // 先检查本地认证状态
      if (!isAuthenticated.value) return false
      
      // 验证token是否有效
      return await verifyToken()
    } catch (error) {
      console.error('Token有效性检查失败:', error)
      return false
    }
  }

  // 检查登录状态
  const checkAuthStatus = () => {
    return isAuthenticated.value && user.value?.status === 'active'
  }

  // 获取用户显示名称
  const getUserDisplayName = computed(() => {
    if (!user.value) return ''
    return user.value.username || user.value.email || '用户'
  })

  // 获取用户角色显示名称
  const getUserRoleDisplay = computed(() => {
    const roleMap = {
      admin: '管理员',
      editor: '编辑者',
      viewer: '查看者'
    }
    return roleMap[user.value?.role] || '未知角色'
  })

  return {
    // 状态
    token,
    user,
    isLoading,
    loginAttempts,
    lastLoginTime,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isEditor,
    canEdit,
    canDelete,
    getUserDisplayName,
    getUserRoleDisplay,
    
    // 方法
    login,
    register,
    logout,
    fetchUserInfo,
    updateProfile,
    changePassword,
    verifyToken,
    checkTokenValid,
    initAuth,
    checkAuthStatus,
    hasPermission
  }
}, {
  persist: {
    key: 'auth-store',
    storage: localStorage,
    paths: ['token', 'user', 'lastLoginTime']
  }
}) 