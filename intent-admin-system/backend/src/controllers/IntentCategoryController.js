const getList = async (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [],
      total: 0
    }
  })
}

const getById = async (req, res) => {
  res.json({
    success: true,
    data: {}
  })
}

const create = async (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Category created'
  })
}

const update = async (req, res) => {
  res.json({
    success: true,
    message: 'Category updated'
  })
}

const deleteCategory = async (req, res) => {
  res.json({
    success: true,
    message: 'Category deleted'
  })
}

const updateSort = async (req, res) => {
  res.json({
    success: true,
    message: 'Sort order updated'
  })
}

module.exports = {
  getList,
  getById,
  create,
  update,
  delete: deleteCategory,
  updateSort
} 