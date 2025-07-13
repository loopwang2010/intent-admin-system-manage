import { request } from './index'

export const authAPI = {
  // 用户登录
  login: (credentials) => {
    return request.post('/api/auth/login', credentials)
  },

  // 用户注册
  register: (userData) => {
    return request.post('/api/auth/register', userData)
  },

  // 获取当前用户信息
  getUserInfo: () => {
    return request.get('/api/auth/me')
  },

  // 更新用户信息
  updateProfile: (profileData) => {
    return request.put('/api/auth/me', profileData)
  },

  // 修改密码
  changePassword: (passwordData) => {
    return request.put('/api/auth/password', passwordData)
  },

  // 验证token
  verifyToken: () => {
    return request.post('/api/auth/verify')
  },

  // 登出
  logout: () => {
    return request.post('/api/auth/logout')
  },

  // 刷新token (如果后端支持)
  refreshToken: () => {
    return request.post('/api/auth/refresh')
  },

  // 重置密码 (如果后端支持)
  resetPassword: (email) => {
    return request.post('/api/auth/reset-password', { email })
  },

  // 确认重置密码 (如果后端支持)
  confirmResetPassword: (token, newPassword) => {
    return request.post('/api/auth/confirm-reset-password', {
      token,
      newPassword
    })
  }
} 