// 最简单的控制器
const getList = async (req, res) => {
  res.json({
    success: true,
    message: 'Simple controller works!'
  })
}

const getById = async (req, res) => {
  res.json({
    success: true,
    message: 'getById works!'
  })
}

console.log('Exporting simple controller...')

module.exports = {
  getList,
  getById
} 