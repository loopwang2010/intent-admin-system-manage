/**
 * 用户管理Store模块
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const loading = ref(false)
  const currentUser = ref(null)
  const searchQuery = ref('')
  const filterRole = ref('')
  const filterStatus = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    loading.value = true
    try {
      // 模拟用户数据
      users.value = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          last_login: '2024-01-15 10:30:00',
          created_at: '2024-01-01 09:00:00',
          permissions: ['all']
        },
        {
          id: 2,
          username: 'editor01',
          email: 'editor@example.com',
          role: 'editor',
          status: 'active',
          last_login: '2024-01-15 09:15:00',
          created_at: '2024-01-02 14:20:00',
          permissions: ['read', 'write']
        },
        {
          id: 3,
          username: 'viewer01',
          email: 'viewer@example.com',
          role: 'viewer',
          status: 'active',
          last_login: '2024-01-14 16:45:00',
          created_at: '2024-01-03 11:10:00',
          permissions: ['read']
        }
      ]
      pagination.total = users.value.length
      console.log('用户列表获取成功')
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建用户
  const createUser = async (userData) => {
    try {
      const newUser = {
        id: Date.now(),
        ...userData,
        created_at: new Date().toISOString(),
        last_login: null
      }
      users.value.unshift(newUser)
      console.log('用户创建成功:', newUser)
      return true
    } catch (error) {
      console.error('创建用户失败:', error)
      return false
    }
  }

  // 更新用户
  const updateUser = async (id, userData) => {
    try {
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value[index] = { ...users.value[index], ...userData }
      }
      console.log('用户更新成功:', id, userData)
      return true
    } catch (error) {
      console.error('更新用户失败:', error)
      return false
    }
  }

  // 删除用户
  const deleteUser = async (id) => {
    try {
      users.value = users.value.filter(user => user.id !== id)
      console.log('用户删除成功:', id)
      return true
    } catch (error) {
      console.error('删除用户失败:', error)
      return false
    }
  }

  // 更改用户状态
  const toggleUserStatus = async (id) => {
    try {
      const user = users.value.find(u => u.id === id)
      if (user) {
        user.status = user.status === 'active' ? 'disabled' : 'active'
      }
      console.log('用户状态切换成功:', id)
      return true
    } catch (error) {
      console.error('切换用户状态失败:', error)
      return false
    }
  }

  // 重置用户密码
  const resetPassword = async (id) => {
    try {
      console.log('用户密码重置成功:', id)
      return true
    } catch (error) {
      console.error('重置用户密码失败:', error)
      return false
    }
  }

  // 获取用户统计
  const getUserStats = () => {
    const total = users.value.length
    const active = users.value.filter(u => u.status === 'active').length
    const disabled = users.value.filter(u => u.status === 'disabled').length
    const roles = users.value.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    return {
      total,
      active,
      disabled,
      roles
    }
  }

  // 搜索用户
  const searchUsers = (query) => {
    if (!query) return users.value
    
    return users.value.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase())
    )
  }

  // 设置当前用户
  const setCurrentUser = (user) => {
    currentUser.value = user
  }

  // 重置状态
  const resetState = () => {
    users.value = []
    currentUser.value = null
    searchQuery.value = ''
    filterRole.value = ''
    filterStatus.value = ''
    pagination.page = 1
    pagination.total = 0
  }

  return {
    // 状态
    users,
    loading,
    currentUser,
    searchQuery,
    filterRole,
    filterStatus,
    pagination,
    
    // 方法
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
    getUserStats,
    searchUsers,
    setCurrentUser,
    resetState
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['users', 'currentUser']
  }
}) 