console.log('开始创建控制器...')

const getList = async (req, res) => {
  console.log('getList called')
  res.json({
    success: true,
    message: 'Hello from controller!'
  })
}

const getById = async (req, res) => {
  console.log('getById called')
  res.json({
    success: true,
    message: 'getById works!'
  })
}

console.log('导出控制器...')

module.exports = {
  getList,
  getById
}

console.log('控制器文件完成') 