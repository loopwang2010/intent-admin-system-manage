// 意图测试控制器 - 完整版本
const testIntent = async (req, res) => {
  try {
    const { text, context = {} } = req.body

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '测试文本不能为空'
      })
    }

    // 模拟意图识别结果
    const testResult = {
      input: {
        text: text.trim(),
        context,
        timestamp: new Date()
      },
      recognition: {
        success: true,
        confidence: 0.89,
        executionTime: 125, // ms
        intent: {
          id: 1,
          name: '天气查询',
          type: 'core',
          categoryId: 1,
          categoryName: '生活服务'
        },
        entities: [
          {
            name: 'location',
            value: '北京',
            confidence: 0.95,
            start: 0,
            end: 2
          },
          {
            name: 'time',
            value: '今天',
            confidence: 0.88,
            start: 3,
            end: 5
          }
        ],
        keywords: ['天气', '北京', '今天'],
        alternativeIntents: [
          {
            id: 5,
            name: '空气质量查询',
            confidence: 0.72
          },
          {
            id: 8,
            name: '出行建议',
            confidence: 0.65
          }
        ]
      },
      response: {
        selected: {
          id: 1,
          content: '今天北京天气晴朗，温度25°C，湿度60%，适合户外活动。',
          type: 'text',
          priority: 1,
          variables: {
            location: '北京',
            temperature: 25,
            humidity: 60,
            weather: 'sunny'
          }
        },
        alternatives: [
          {
            id: 2,
            content: '北京今日天气不错，建议您外出活动。',
            priority: 2,
            confidence: 0.82
          }
        ]
      },
      performance: {
        totalTime: 145,
        recognitionTime: 125,
        responseTime: 20,
        cacheHit: false
      }
    }

    res.json({
      success: true,
      message: '意图测试完成',
      data: testResult
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '意图测试失败',
      error: error.message
    })
  }
}

const batchTest = async (req, res) => {
  try {
    const { testCases } = req.body

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: '测试用例列表不能为空'
      })
    }

    // 模拟批量测试结果
    const results = testCases.map((testCase, index) => {
      const success = Math.random() > 0.1 // 90% 成功率
      const confidence = Math.random() * 0.3 + 0.7 // 0.7-1.0

      return {
        index: index + 1,
        input: testCase.text,
        expectedIntent: testCase.expectedIntentId,
        actualIntent: success ? testCase.expectedIntentId : Math.floor(Math.random() * 10) + 1,
        success,
        confidence: success ? confidence : Math.random() * 0.6,
        executionTime: Math.floor(Math.random() * 100) + 50,
        match: success
      }
    })

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      avgExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
      accuracy: results.filter(r => r.match).length / results.length
    }

    res.json({
      success: true,
      message: '批量测试完成',
      data: {
        summary,
        results,
        timestamp: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量测试失败',
      error: error.message
    })
  }
}

const getTestHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      intentId,
      status = 'all',
      timeRange = '7d'
    } = req.query

    // 模拟测试历史数据
    const mockHistory = [
      {
        id: 1,
        text: '今天北京天气怎么样',
        intentId: 1,
        intentName: '天气查询',
        confidence: 0.92,
        success: true,
        executionTime: 156,
        response: '今天北京天气晴朗，温度25°C',
        userId: 'test_user_1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        text: '播放一首音乐',
        intentId: 2,
        intentName: '音乐播放',
        confidence: 0.87,
        success: true,
        executionTime: 134,
        response: '正在为您播放音乐',
        userId: 'test_user_2',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 3,
        text: '帮我开灯',
        intentId: 3,
        intentName: '智能家居控制',
        confidence: 0.45,
        success: false,
        executionTime: 89,
        response: '抱歉，我没有理解您的意思',
        userId: 'test_user_3',
        error: '置信度过低',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]

    // 根据查询参数过滤
    let filteredHistory = mockHistory
    if (intentId) {
      filteredHistory = filteredHistory.filter(item => 
        item.intentId === parseInt(intentId)
      )
    }
    if (status !== 'all') {
      const isSuccess = status === 'success'
      filteredHistory = filteredHistory.filter(item => item.success === isSuccess)
    }

    res.json({
      success: true,
      data: {
        history: filteredHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredHistory.length,
          pages: Math.ceil(filteredHistory.length / parseInt(limit))
        },
        stats: {
          total: mockHistory.length,
          successful: mockHistory.filter(h => h.success).length,
          failed: mockHistory.filter(h => !h.success).length,
          avgConfidence: mockHistory.reduce((sum, h) => sum + h.confidence, 0) / mockHistory.length,
          avgExecutionTime: mockHistory.reduce((sum, h) => sum + h.executionTime, 0) / mockHistory.length
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取测试历史失败',
      error: error.message
    })
  }
}

const createTestSuite = async (req, res) => {
  try {
    const {
      name,
      description,
      testCases = [],
      tags = []
    } = req.body

    if (!name || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: '测试套件名称和测试用例为必填项'
      })
    }

    const newTestSuite = {
      id: Date.now(),
      name,
      description,
      testCases,
      tags,
      status: 'active',
      createdBy: req.user?.username || 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalCases: testCases.length,
        lastRunTime: null,
        lastRunResult: null
      }
    }

    res.status(201).json({
      success: true,
      message: '测试套件创建成功',
      data: newTestSuite
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建测试套件失败',
      error: error.message
    })
  }
}

const getTestSuites = async (req, res) => {
  try {
    const { status = 'active' } = req.query

    const mockTestSuites = [
      {
        id: 1,
        name: '基础功能测试',
        description: '测试基本的天气、音乐、新闻功能',
        testCases: [
          { text: '今天天气怎么样', expectedIntentId: 1 },
          { text: '播放音乐', expectedIntentId: 2 },
          { text: '最新新闻', expectedIntentId: 3 }
        ],
        tags: ['基础', '核心功能'],
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastRunTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastRunResult: {
          total: 3,
          passed: 2,
          failed: 1,
          accuracy: 0.67
        }
      },
      {
        id: 2,
        name: '智能家居测试',
        description: '测试智能家居控制功能',
        testCases: [
          { text: '开灯', expectedIntentId: 4 },
          { text: '关闭空调', expectedIntentId: 5 },
          { text: '调节温度到25度', expectedIntentId: 6 }
        ],
        tags: ['智能家居', '物联网'],
        status: 'active',
        createdBy: 'editor1',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastRunTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastRunResult: {
          total: 3,
          passed: 3,
          failed: 0,
          accuracy: 1.0
        }
      }
    ]

    const filteredSuites = status === 'all' ? 
      mockTestSuites : 
      mockTestSuites.filter(suite => suite.status === status)

    res.json({
      success: true,
      data: filteredSuites
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取测试套件列表失败',
      error: error.message
    })
  }
}

const runTestSuite = async (req, res) => {
  try {
    const { id } = req.params

    // 模拟测试套件执行
    const results = {
      suiteId: parseInt(id),
      executionId: Date.now(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 5000), // 5秒后完成
      status: 'completed',
      summary: {
        total: 5,
        passed: 4,
        failed: 1,
        skipped: 0,
        accuracy: 0.8,
        avgExecutionTime: 142
      },
      results: [
        {
          caseId: 1,
          text: '今天天气怎么样',
          expected: 1,
          actual: 1,
          status: 'passed',
          confidence: 0.92,
          executionTime: 156
        },
        {
          caseId: 2,
          text: '播放音乐',
          expected: 2,
          actual: 2,
          status: 'passed',
          confidence: 0.87,
          executionTime: 134
        },
        {
          caseId: 3,
          text: '最新新闻',
          expected: 3,
          actual: 3,
          status: 'passed',
          confidence: 0.91,
          executionTime: 128
        },
        {
          caseId: 4,
          text: '开灯',
          expected: 4,
          actual: 4,
          status: 'passed',
          confidence: 0.85,
          executionTime: 145
        },
        {
          caseId: 5,
          text: '不明确的指令',
          expected: 5,
          actual: 8,
          status: 'failed',
          confidence: 0.45,
          executionTime: 147,
          error: '意图识别错误'
        }
      ]
    }

    res.json({
      success: true,
      message: '测试套件执行完成',
      data: results
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '执行测试套件失败',
      error: error.message
    })
  }
}

const getTestSuiteResults = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    // 模拟历史执行结果
    const mockResults = [
      {
        executionId: Date.now() - 1000,
        executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        executedBy: 'admin',
        summary: {
          total: 5,
          passed: 4,
          failed: 1,
          accuracy: 0.8,
          duration: 5.2
        }
      },
      {
        executionId: Date.now() - 2000,
        executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        executedBy: 'auto_test',
        summary: {
          total: 5,
          passed: 5,
          failed: 0,
          accuracy: 1.0,
          duration: 4.8
        }
      }
    ]

    res.json({
      success: true,
      data: {
        results: mockResults,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockResults.length,
          pages: Math.ceil(mockResults.length / parseInt(limit))
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取测试套件结果失败',
      error: error.message
    })
  }
}

// A/B测试功能
const createABTest = async (req, res) => {
  try {
    const {
      name,
      description,
      variants,
      trafficSplit = 50,
      duration = 7 // 天
    } = req.body

    if (!name || !variants || variants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A/B测试需要名称和至少2个变体'
      })
    }

    const abTest = {
      id: Date.now(),
      name,
      description,
      variants,
      trafficSplit,
      duration,
      status: 'active',
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      stats: {
        totalRequests: 0,
        variantA: { requests: 0, successRate: 0 },
        variantB: { requests: 0, successRate: 0 }
      },
      createdBy: req.user?.username || 'admin',
      createdAt: new Date()
    }

    res.status(201).json({
      success: true,
      message: 'A/B测试创建成功',
      data: abTest
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建A/B测试失败',
      error: error.message
    })
  }
}

const getABTests = async (req, res) => {
  try {
    const { status = 'active' } = req.query

    const mockABTests = [
      {
        id: 1,
        name: '天气回复优化测试',
        description: '测试不同的天气回复模板效果',
        status: 'active',
        variants: [
          { name: 'A组', description: '简洁回复' },
          { name: 'B组', description: '详细回复' }
        ],
        trafficSplit: 50,
        stats: {
          totalRequests: 1250,
          variantA: { requests: 625, successRate: 0.89 },
          variantB: { requests: 625, successRate: 0.92 }
        },
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      }
    ]

    res.json({
      success: true,
      data: mockABTests
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取A/B测试列表失败',
      error: error.message
    })
  }
}

// 性能测试
const performanceTest = async (req, res) => {
  try {
    const {
      concurrency = 10,
      duration = 60, // 秒
      rampUp = 10 // 秒
    } = req.body

    // 模拟性能测试结果
    const results = {
      testConfig: {
        concurrency,
        duration,
        rampUp
      },
      metrics: {
        totalRequests: 5420,
        requestsPerSecond: 90.3,
        avgResponseTime: 156,
        minResponseTime: 45,
        maxResponseTime: 890,
        p50ResponseTime: 142,
        p95ResponseTime: 234,
        p99ResponseTime: 456,
        errorRate: 0.023,
        successRate: 0.977
      },
      timeline: Array.from({ length: duration }, (_, i) => ({
        time: i + 1,
        rps: Math.floor(Math.random() * 20) + 80,
        avgResponseTime: Math.floor(Math.random() * 50) + 130,
        errorRate: Math.random() * 0.05
      })),
      errors: [
        { type: 'timeout', count: 15, percentage: 0.3 },
        { type: 'connection_error', count: 8, percentage: 0.15 },
        { type: 'server_error', count: 3, percentage: 0.06 }
      ]
    }

    res.json({
      success: true,
      message: '性能测试完成',
      data: results
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '性能测试失败',
      error: error.message
    })
  }
}

const deleteTestRecord = async (req, res) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '测试记录ID为必填项'
      })
    }

    // 这里应该删除测试记录
    // 目前只返回成功响应
    res.json({
      success: true,
      message: '测试记录删除成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除测试记录失败',
      error: error.message
    })
  }
}

module.exports = {
  testIntent,
  batchTest,
  getTestHistory,
  deleteTestRecord,
  createTestSuite,
  getTestSuites,
  runTestSuite,
  getTestSuiteResults,
  createABTest,
  getABTests,
  performanceTest
} 