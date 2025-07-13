const request = require('supertest')
const app = require('../../src/app')
const { sequelize } = require('../../src/config/database')

describe('API Integration Tests', () => {
  let authToken

  beforeAll(async () => {
    await sequelize.sync({ force: true })
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    authToken = loginResponse.body.data.token
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Complete Intent Management Flow', () => {
    let categoryId, intentId, responseId

    it('should create a category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '集成测试分类',
          description: '用于集成测试的分类'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      categoryId = response.body.data.id
    })

    it('should create an intent in the category', async () => {
      const response = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '集成测试意图',
          description: '用于集成测试的意图',
          keywords: ['集成', '测试', '完整'],
          categoryId: categoryId,
          priority: 'medium'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      intentId = response.body.data.id
    })

    it('should create a response template for the intent', async () => {
      const response = await request(app)
        .post('/api/pre-responses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '集成测试回复',
          content: '这是一个集成测试的回复模板',
          intentId: intentId,
          type: 'text'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      responseId = response.body.data.id
    })

    it('should get the complete intent with relationships', async () => {
      const response = await request(app)
        .get(`/api/core-intents/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('集成测试意图')
      expect(response.body.data.category).toBeDefined()
      expect(response.body.data.category.id).toBe(categoryId)
    })

    it('should test the intent', async () => {
      const response = await request(app)
        .post('/api/test/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: '这是一个集成测试',
          intentId: intentId
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.result).toBeDefined()
    })

    it('should get analytics for the intent', async () => {
      const response = await request(app)
        .get(`/api/analytics/intent/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.stats).toBeDefined()
    })

    it('should update the intent', async () => {
      const response = await request(app)
        .put(`/api/core-intents/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '已更新的集成测试意图',
          description: '这是一个已更新的集成测试意图',
          keywords: ['集成', '测试', '已更新'],
          priority: 'high'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('已更新的集成测试意图')
      expect(response.body.data.priority).toBe('high')
    })

    it('should delete the response template', async () => {
      const response = await request(app)
        .delete(`/api/pre-responses/${responseId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should delete the intent', async () => {
      const response = await request(app)
        .delete(`/api/core-intents/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should delete the category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Create an intent with invalid category
      const response = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '错误测试意图',
          description: '测试错误处理',
          keywords: ['错误', '测试'],
          categoryId: 99999 // Non-existent category
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
          description: '',
          keywords: []
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Pagination and Filtering', () => {
    beforeAll(async () => {
      // Create test data
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/core-intents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `测试意图${i}`,
            description: `测试描述${i}`,
            keywords: [`测试${i}`, '关键词'],
            categoryId: 1,
            priority: i % 2 === 0 ? 'high' : 'low'
          })
      }
    })

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/core-intents?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents.length).toBeLessThanOrEqual(10)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(10)
    })

    it('should filter and paginate simultaneously', async () => {
      const response = await request(app)
        .get('/api/core-intents?priority=high&page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents.every(intent => intent.priority === 'high')).toBe(true)
      expect(response.body.data.intents.length).toBeLessThanOrEqual(5)
    })
  })
})