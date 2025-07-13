// 统一响应格式工具

const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}

const errorResponse = (res, message = '操作失败', statusCode = 500, code = null, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
    timestamp: new Date().toISOString()
  })
}

const paginatedResponse = (res, data, pagination, message = '获取成功') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  })
}

const createdResponse = (res, data, message = '创建成功') => {
  return successResponse(res, data, message, 201)
}

const updatedResponse = (res, data, message = '更新成功') => {
  return successResponse(res, data, message, 200)
}

const deletedResponse = (res, message = '删除成功') => {
  return successResponse(res, null, message, 200)
}

const validationErrorResponse = (res, errors, message = '请求参数验证失败') => {
  return errorResponse(res, message, 400, 'VALIDATION_ERROR', errors)
}

const authErrorResponse = (res, message = '认证失败') => {
  return errorResponse(res, message, 401, 'AUTHENTICATION_ERROR')
}

const forbiddenResponse = (res, message = '权限不足') => {
  return errorResponse(res, message, 403, 'AUTHORIZATION_ERROR')
}

const notFoundResponse = (res, message = '资源未找到') => {
  return errorResponse(res, message, 404, 'NOT_FOUND_ERROR')
}

const conflictResponse = (res, message = '资源冲突') => {
  return errorResponse(res, message, 409, 'CONFLICT_ERROR')
}

const serverErrorResponse = (res, message = '服务器内部错误') => {
  return errorResponse(res, message, 500, 'INTERNAL_SERVER_ERROR')
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  validationErrorResponse,
  authErrorResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse
}