const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// 用户登录
router.post('/login', authController.login)

// 用户注册  
router.post('/register', authController.register)

// 用户登出
router.post('/logout', authController.logout)

// 刷新token
router.post('/refresh', authController.refreshToken)

// 忘记密码
router.post('/forgot-password', authController.forgotPassword)

// 重置密码
router.post('/reset-password', authController.resetPassword)

// 验证token
router.get('/verify', authController.verifyToken)

module.exports = router 