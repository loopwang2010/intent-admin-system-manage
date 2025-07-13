const getDashboardStats = async (req, res) => {
  res.json({
    success: true,
    data: {
      totalIntents: 0,
      totalTests: 0,
      successRate: 0,
      avgResponseTime: 0
    }
  })
}

const getIntentStats = async (req, res) => {
  res.json({
    success: true,
    data: {
      popular: [],
      recent: [],
      categories: []
    }
  })
}

const getUserStats = async (req, res) => {
  res.json({
    success: true,
    data: {
      activeUsers: 0,
      totalUsers: 0,
      recentActivity: []
    }
  })
}

const exportReport = async (req, res) => {
  res.json({
    success: true,
    message: 'Report export placeholder'
  })
}

module.exports = {
  getDashboardStats,
  getIntentStats,
  getUserStats,
  exportReport
} 