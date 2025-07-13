// 测试控制器导入问题
console.log('开始导入依赖...')

try {
  const { CoreIntent, IntentCategory, PreResponse, sequelize } = require('./src/models')
  console.log('✓ 模型导入成功')
} catch (error) {
  console.log('✗ 模型导入失败:', error.message)
  process.exit(1)
}

try {
  const { Op } = require('sequelize')
  console.log('✓ Sequelize Op 导入成功')
} catch (error) {
  console.log('✗ Sequelize Op 导入失败:', error.message)
  process.exit(1)
}

try {
  const aiService = require('./src/services/aiService')
  console.log('✓ AI服务导入成功')
} catch (error) {
  console.log('✗ AI服务导入失败:', error.message)
  process.exit(1)
}

try {
  const { logAction } = require('./src/middleware/logger')
  console.log('✓ Logger导入成功')
} catch (error) {
  console.log('✗ Logger导入失败:', error.message)
  process.exit(1)
}

// 测试简单的控制器类
console.log('创建测试控制器...')

class TestController {
  async getList(req, res) {
    res.json({ message: 'Test controller works!' })
  }
}

console.log('✓ 测试控制器创建成功')

const testController = new TestController()
console.log('✓ 控制器实例化成功')
console.log('控制器方法:', Object.getOwnPropertyNames(TestController.prototype))
console.log('实例方法类型:', typeof testController.getList)

module.exports = testController 