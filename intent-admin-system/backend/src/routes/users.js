const express = require('express')
const router = express.Router()
const { authenticate, authorize } = require('../middleware/auth')
const userController = require('../controllers/userController')

// 获取用户列表（支持分页、搜索、过滤）
router.get('/', authenticate, authorize(['admin']), userController.getUsers)

// 获取用户统计信息
router.get('/stats', authenticate, authorize(['admin']), userController.getUserStats)

// 搜索用户
router.get('/search', authenticate, authorize(['admin']), userController.searchUsers)

// 检查用户名是否可用
router.get('/check-username', authenticate, authorize(['admin']), userController.checkUsernameAvailable)

// 检查邮箱是否可用
router.get('/check-email', authenticate, authorize(['admin']), userController.checkEmailAvailable)

// 获取当前用户信息
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { User, Role } = require('../models')
    
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] }
      }]
    })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    })
  }
})

// 根据ID获取用户详情
router.get('/:id', authenticate, authorize(['admin']), userController.getUserById)

// 获取用户角色
router.get('/:id/roles', authenticate, authorize(['admin']), userController.getUserRoles)

// 获取用户权限
router.get('/:id/permissions', authenticate, authorize(['admin']), userController.getUserPermissions)

// 创建用户
router.post('/', authenticate, authorize(['admin']), userController.createUser)

// 分配角色
router.post('/:id/roles', authenticate, authorize(['admin']), userController.assignRoles)

// 批量删除用户
router.post('/batch-delete', authenticate, authorize(['admin']), userController.batchDeleteUsers)

// 批量更新状态
router.post('/batch-status', authenticate, authorize(['admin']), userController.batchUpdateStatus)

// 批量分配角色
router.post('/batch-assign-roles', authenticate, authorize(['admin']), userController.batchAssignRoles)

// 更新用户信息
router.put('/:id', authenticate, authorize(['admin']), userController.updateUser)

// 切换用户状态
router.patch('/:id/status', authenticate, authorize(['admin']), userController.toggleUserStatus)

// 重置密码
router.patch('/:id/reset-password', authenticate, authorize(['admin']), userController.resetPassword)

// 删除用户
router.delete('/:id', authenticate, authorize(['admin']), userController.deleteUser)

module.exports = router