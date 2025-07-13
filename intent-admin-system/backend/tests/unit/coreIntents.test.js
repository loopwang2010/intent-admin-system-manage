const request = require('supertest')
const app = require('../../src/app')
const { sequelize } = require('../../src/config/database')

describe('Core Intents Tests', () => {
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

  describe('GET /api/core-intents', () => {
    it('should get core intents list', async () => {
      const response = await request(app)
        .get('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents).toBeDefined()
    })

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/api/core-intents')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/core-intents', () => {
    it('should create a new core intent', async () => {
      const newIntent = {
        name: '测试意图',
        description: '这是一个测试意图',
        keywords: ['测试', '示例'],
        categoryId: 1,
        priority: 'medium',
        isActive: true
      }

      const response = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newIntent)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(newIntent.name)
      expect(response.body.data.keywords).toEqual(newIntent.keywords)
    })

    it('should reject invalid intent data', async () => {
      const invalidIntent = {
        name: '', // Empty name
        description: '测试',
        keywords: []
      }

      const response = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidIntent)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/core-intents/:id', () => {
    let intentId

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '待更新意图',
          description: '这是一个待更新的意图',
          keywords: ['更新', '测试'],
          categoryId: 1,
          priority: 'low'
        })
      intentId = createResponse.body.data.id
    })

    it('should update an existing core intent', async () => {
      const updatedData = {
        name: '已更新意图',
        description: '这是一个已更新的意图',
        keywords: ['更新', '测试', '完成'],
        priority: 'high'
      }

      const response = await request(app)
        .put(`/api/core-intents/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updatedData.name)
      expect(response.body.data.priority).toBe(updatedData.priority)
    })

    it('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .put('/api/core-intents/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '不存在的意图',
          description: '测试'
        })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/core-intents/:id', () => {
    let intentId

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/core-intents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '待删除意图',
          description: '这是一个待删除的意图',
          keywords: ['删除', '测试'],
          categoryId: 1
        })
      intentId = createResponse.body.data.id
    })

    it('should delete an existing core intent', async () => {
      const response = await request(app)
        .delete(`/api/core-intents/${intentId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')
    })

    it('should return 404 for non-existent intent', async () => {
      const response = await request(app)
        .delete('/api/core-intents/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Intent Search and Filtering', () => {
    beforeAll(async () => {
      // Create test intents
      const testIntents = [
        {
          name: '音乐播放',
          description: '播放音乐相关意图',
          keywords: ['播放', '音乐', '歌曲'],
          categoryId: 1,
          priority: 'high'
        },
        {
          name: '天气查询',
          description: '查询天气信息',
          keywords: ['天气', '温度', '预报'],
          categoryId: 2,
          priority: 'medium'
        }
      ]

      for (const intent of testIntents) {
        await request(app)
          .post('/api/core-intents')
          .set('Authorization', `Bearer ${authToken}`)
          .send(intent)
      }
    })

    it('should search intents by keyword', async () => {
      const response = await request(app)
        .get('/api/core-intents?search=音乐')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents.length).toBeGreaterThan(0)
      expect(response.body.data.intents[0].name).toContain('音乐')
    })

    it('should filter intents by priority', async () => {
      const response = await request(app)
        .get('/api/core-intents?priority=high')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents.every(intent => intent.priority === 'high')).toBe(true)
    })

    it('should filter intents by category', async () => {
      const response = await request(app)
        .get('/api/core-intents?categoryId=1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.intents.every(intent => intent.categoryId === 1)).toBe(true)
    })
  })
})