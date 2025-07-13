// 操作类型定义
const OPERATION_TYPES = {
  // 用户认证操作
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  USER_PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
  USER_PROFILE_UPDATE: 'USER_PROFILE_UPDATE',
  
  // 用户管理操作
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  
  // 意图分类操作
  CATEGORY_CREATE: 'CATEGORY_CREATE',
  CATEGORY_UPDATE: 'CATEGORY_UPDATE',
  CATEGORY_DELETE: 'CATEGORY_DELETE',
  CATEGORY_SORT: 'CATEGORY_SORT',
  CATEGORY_STATUS_CHANGE: 'CATEGORY_STATUS_CHANGE',
  
  // 核心意图操作
  CORE_INTENT_CREATE: 'CORE_INTENT_CREATE',
  CORE_INTENT_UPDATE: 'CORE_INTENT_UPDATE',
  CORE_INTENT_DELETE: 'CORE_INTENT_DELETE',
  CORE_INTENT_ACTIVATE: 'CORE_INTENT_ACTIVATE',
  CORE_INTENT_DEACTIVATE: 'CORE_INTENT_DEACTIVATE',
  CORE_INTENT_SORT: 'CORE_INTENT_SORT',
  CORE_INTENT_KEYWORDS_UPDATE: 'CORE_INTENT_KEYWORDS_UPDATE',
  
  // 非核心意图操作
  NON_CORE_INTENT_CREATE: 'NON_CORE_INTENT_CREATE',
  NON_CORE_INTENT_UPDATE: 'NON_CORE_INTENT_UPDATE',
  NON_CORE_INTENT_DELETE: 'NON_CORE_INTENT_DELETE',
  NON_CORE_INTENT_APPROVE: 'NON_CORE_INTENT_APPROVE',
  NON_CORE_INTENT_REJECT: 'NON_CORE_INTENT_REJECT',
  NON_CORE_INTENT_PROMOTE: 'NON_CORE_INTENT_PROMOTE',
  
  // 回复模板操作
  RESPONSE_CREATE: 'RESPONSE_CREATE',
  RESPONSE_UPDATE: 'RESPONSE_UPDATE',
  RESPONSE_DELETE: 'RESPONSE_DELETE',
  RESPONSE_ACTIVATE: 'RESPONSE_ACTIVATE',
  RESPONSE_DEACTIVATE: 'RESPONSE_DEACTIVATE',
  RESPONSE_TEST: 'RESPONSE_TEST',
  
  // 测试操作
  INTENT_TEST_SINGLE: 'INTENT_TEST_SINGLE',
  INTENT_TEST_BATCH: 'INTENT_TEST_BATCH',
  INTENT_TEST_SUITE_CREATE: 'INTENT_TEST_SUITE_CREATE',
  INTENT_TEST_SUITE_RUN: 'INTENT_TEST_SUITE_RUN',
  
  // 数据操作
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  DATA_BACKUP: 'DATA_BACKUP',
  DATA_RESTORE: 'DATA_RESTORE',
  
  // 系统操作
  SYSTEM_CONFIG_UPDATE: 'SYSTEM_CONFIG_UPDATE',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SYSTEM_LOGIN_ATTEMPT: 'SYSTEM_LOGIN_ATTEMPT',
  SYSTEM_ACCESS_DENIED: 'SYSTEM_ACCESS_DENIED',
  
  // 权限操作
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  ROLE_REMOVE: 'ROLE_REMOVE',
  
  // 安全审计操作
  SECURITY_AUDIT: 'SECURITY_AUDIT',
  SECURITY_ALERT: 'SECURITY_ALERT',
  SECURITY_SCAN: 'SECURITY_SCAN',
  
  // 性能监控操作
  PERFORMANCE_ANALYSIS: 'PERFORMANCE_ANALYSIS',
  PERFORMANCE_OPTIMIZATION: 'PERFORMANCE_OPTIMIZATION',
  
  // 数据可视化操作
  DATA_VISUALIZATION: 'DATA_VISUALIZATION',
  REPORT_GENERATION: 'REPORT_GENERATION'
}

// 操作类型描述
const OPERATION_DESCRIPTIONS = {
  [OPERATION_TYPES.USER_LOGIN]: '用户登录',
  [OPERATION_TYPES.USER_LOGOUT]: '用户退出',
  [OPERATION_TYPES.USER_REGISTER]: '用户注册',
  [OPERATION_TYPES.USER_PASSWORD_CHANGE]: '修改密码',
  [OPERATION_TYPES.USER_PROFILE_UPDATE]: '更新个人资料',
  
  [OPERATION_TYPES.USER_CREATE]: '创建用户',
  [OPERATION_TYPES.USER_UPDATE]: '更新用户信息',
  [OPERATION_TYPES.USER_DELETE]: '删除用户',
  [OPERATION_TYPES.USER_ROLE_CHANGE]: '变更用户角色',
  [OPERATION_TYPES.USER_STATUS_CHANGE]: '变更用户状态',
  
  [OPERATION_TYPES.CATEGORY_CREATE]: '创建意图分类',
  [OPERATION_TYPES.CATEGORY_UPDATE]: '更新意图分类',
  [OPERATION_TYPES.CATEGORY_DELETE]: '删除意图分类',
  [OPERATION_TYPES.CATEGORY_SORT]: '调整分类顺序',
  [OPERATION_TYPES.CATEGORY_STATUS_CHANGE]: '变更分类状态',
  
  [OPERATION_TYPES.CORE_INTENT_CREATE]: '创建核心意图',
  [OPERATION_TYPES.CORE_INTENT_UPDATE]: '更新核心意图',
  [OPERATION_TYPES.CORE_INTENT_DELETE]: '删除核心意图',
  [OPERATION_TYPES.CORE_INTENT_ACTIVATE]: '激活核心意图',
  [OPERATION_TYPES.CORE_INTENT_DEACTIVATE]: '停用核心意图',
  [OPERATION_TYPES.CORE_INTENT_SORT]: '调整意图顺序',
  [OPERATION_TYPES.CORE_INTENT_KEYWORDS_UPDATE]: '更新意图关键词',
  
  [OPERATION_TYPES.NON_CORE_INTENT_CREATE]: '创建非核心意图',
  [OPERATION_TYPES.NON_CORE_INTENT_UPDATE]: '更新非核心意图',
  [OPERATION_TYPES.NON_CORE_INTENT_DELETE]: '删除非核心意图',
  [OPERATION_TYPES.NON_CORE_INTENT_APPROVE]: '批准非核心意图',
  [OPERATION_TYPES.NON_CORE_INTENT_REJECT]: '拒绝非核心意图',
  [OPERATION_TYPES.NON_CORE_INTENT_PROMOTE]: '提升为核心意图',
  
  [OPERATION_TYPES.RESPONSE_CREATE]: '创建回复模板',
  [OPERATION_TYPES.RESPONSE_UPDATE]: '更新回复模板',
  [OPERATION_TYPES.RESPONSE_DELETE]: '删除回复模板',
  [OPERATION_TYPES.RESPONSE_ACTIVATE]: '激活回复模板',
  [OPERATION_TYPES.RESPONSE_DEACTIVATE]: '停用回复模板',
  [OPERATION_TYPES.RESPONSE_TEST]: '测试回复模板',
  
  [OPERATION_TYPES.INTENT_TEST_SINGLE]: '单次意图测试',
  [OPERATION_TYPES.INTENT_TEST_BATCH]: '批量意图测试',
  [OPERATION_TYPES.INTENT_TEST_SUITE_CREATE]: '创建测试套件',
  [OPERATION_TYPES.INTENT_TEST_SUITE_RUN]: '运行测试套件',
  
  [OPERATION_TYPES.DATA_EXPORT]: '导出数据',
  [OPERATION_TYPES.DATA_IMPORT]: '导入数据',
  [OPERATION_TYPES.DATA_BACKUP]: '备份数据',
  [OPERATION_TYPES.DATA_RESTORE]: '恢复数据',
  
  [OPERATION_TYPES.SYSTEM_CONFIG_UPDATE]: '更新系统配置',
  [OPERATION_TYPES.SYSTEM_MAINTENANCE]: '系统维护',
  [OPERATION_TYPES.SYSTEM_LOGIN_ATTEMPT]: '登录尝试',
  [OPERATION_TYPES.SYSTEM_ACCESS_DENIED]: '访问被拒绝',
  
  [OPERATION_TYPES.PERMISSION_GRANT]: '授予权限',
  [OPERATION_TYPES.PERMISSION_REVOKE]: '撤销权限',
  [OPERATION_TYPES.ROLE_ASSIGN]: '分配角色',
  [OPERATION_TYPES.ROLE_REMOVE]: '移除角色',
  
  [OPERATION_TYPES.SECURITY_AUDIT]: '安全审计',
  [OPERATION_TYPES.SECURITY_ALERT]: '安全告警',
  [OPERATION_TYPES.SECURITY_SCAN]: '安全扫描',
  
  [OPERATION_TYPES.PERFORMANCE_ANALYSIS]: '性能分析',
  [OPERATION_TYPES.PERFORMANCE_OPTIMIZATION]: '性能优化',
  
  [OPERATION_TYPES.DATA_VISUALIZATION]: '数据可视化',
  [OPERATION_TYPES.REPORT_GENERATION]: '报告生成'
}

// 资源类型
const RESOURCE_TYPES = {
  USER: 'user',
  CATEGORY: 'category',
  CORE_INTENT: 'core_intent',
  NON_CORE_INTENT: 'non_core_intent',
  RESPONSE: 'response',
  TEST: 'test',
  SYSTEM: 'system',
  PERMISSION: 'permission',
  ROLE: 'role'
}

// 操作动作类型
const ACTION_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  TEST: 'TEST',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE'
}

// 根据路由和方法获取操作类型
const getOperationTypeFromRoute = (method, path, body = {}) => {
  const pathLower = path.toLowerCase()
  
  // 用户认证相关
  if (pathLower.includes('/auth/login')) return OPERATION_TYPES.USER_LOGIN
  if (pathLower.includes('/auth/logout')) return OPERATION_TYPES.USER_LOGOUT
  if (pathLower.includes('/auth/register')) return OPERATION_TYPES.USER_REGISTER
  if (pathLower.includes('/auth/change-password')) return OPERATION_TYPES.USER_PASSWORD_CHANGE
  if (pathLower.includes('/auth/profile')) return OPERATION_TYPES.USER_PROFILE_UPDATE
  
  // 用户管理相关
  if (pathLower.includes('/users')) {
    if (method === 'POST') return OPERATION_TYPES.USER_CREATE
    if (method === 'PUT' || method === 'PATCH') {
      if (body.role) return OPERATION_TYPES.USER_ROLE_CHANGE
      if (body.status) return OPERATION_TYPES.USER_STATUS_CHANGE
      return OPERATION_TYPES.USER_UPDATE
    }
    if (method === 'DELETE') return OPERATION_TYPES.USER_DELETE
  }
  
  // 分类相关
  if (pathLower.includes('/categories')) {
    if (method === 'POST') return OPERATION_TYPES.CATEGORY_CREATE
    if (method === 'PUT' || method === 'PATCH') {
      if (pathLower.includes('/sort')) return OPERATION_TYPES.CATEGORY_SORT
      return OPERATION_TYPES.CATEGORY_UPDATE
    }
    if (method === 'DELETE') return OPERATION_TYPES.CATEGORY_DELETE
  }
  
  // 核心意图相关
  if (pathLower.includes('/core-intents')) {
    if (method === 'POST') return OPERATION_TYPES.CORE_INTENT_CREATE
    if (method === 'PUT' || method === 'PATCH') {
      if (pathLower.includes('/sort')) return OPERATION_TYPES.CORE_INTENT_SORT
      if (body.keywords) return OPERATION_TYPES.CORE_INTENT_KEYWORDS_UPDATE
      if (body.status === 'active') return OPERATION_TYPES.CORE_INTENT_ACTIVATE
      if (body.status === 'inactive') return OPERATION_TYPES.CORE_INTENT_DEACTIVATE
      return OPERATION_TYPES.CORE_INTENT_UPDATE
    }
    if (method === 'DELETE') return OPERATION_TYPES.CORE_INTENT_DELETE
  }
  
  // 非核心意图相关
  if (pathLower.includes('/non-core-intents')) {
    if (method === 'POST') {
      if (pathLower.includes('/approve')) return OPERATION_TYPES.NON_CORE_INTENT_APPROVE
      if (pathLower.includes('/reject')) return OPERATION_TYPES.NON_CORE_INTENT_REJECT
      if (pathLower.includes('/promote')) return OPERATION_TYPES.NON_CORE_INTENT_PROMOTE
      return OPERATION_TYPES.NON_CORE_INTENT_CREATE
    }
    if (method === 'PUT' || method === 'PATCH') return OPERATION_TYPES.NON_CORE_INTENT_UPDATE
    if (method === 'DELETE') return OPERATION_TYPES.NON_CORE_INTENT_DELETE
  }
  
  // 回复模板相关
  if (pathLower.includes('/pre-responses') || pathLower.includes('/responses')) {
    if (method === 'POST') {
      if (pathLower.includes('/test')) return OPERATION_TYPES.RESPONSE_TEST
      return OPERATION_TYPES.RESPONSE_CREATE
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (body.status === 'active') return OPERATION_TYPES.RESPONSE_ACTIVATE
      if (body.status === 'inactive') return OPERATION_TYPES.RESPONSE_DEACTIVATE
      return OPERATION_TYPES.RESPONSE_UPDATE
    }
    if (method === 'DELETE') return OPERATION_TYPES.RESPONSE_DELETE
  }
  
  // 测试相关
  if (pathLower.includes('/test')) {
    if (pathLower.includes('/batch')) return OPERATION_TYPES.INTENT_TEST_BATCH
    if (pathLower.includes('/suites')) {
      if (method === 'POST' && pathLower.includes('/run')) return OPERATION_TYPES.INTENT_TEST_SUITE_RUN
      if (method === 'POST') return OPERATION_TYPES.INTENT_TEST_SUITE_CREATE
    }
    return OPERATION_TYPES.INTENT_TEST_SINGLE
  }
  
  // 数据操作相关
  if (pathLower.includes('/export')) return OPERATION_TYPES.DATA_EXPORT
  if (pathLower.includes('/import')) return OPERATION_TYPES.DATA_IMPORT
  if (pathLower.includes('/backup')) return OPERATION_TYPES.DATA_BACKUP
  if (pathLower.includes('/restore')) return OPERATION_TYPES.DATA_RESTORE
  
  // 默认操作类型
  const methodActionMap = {
    'POST': ACTION_TYPES.CREATE,
    'GET': ACTION_TYPES.READ,
    'PUT': ACTION_TYPES.UPDATE,
    'PATCH': ACTION_TYPES.UPDATE,
    'DELETE': ACTION_TYPES.DELETE
  }
  
  return methodActionMap[method] || 'UNKNOWN'
}

// 获取资源类型
const getResourceTypeFromRoute = (path) => {
  const pathLower = path.toLowerCase()
  
  if (pathLower.includes('/users') || pathLower.includes('/auth')) return RESOURCE_TYPES.USER
  if (pathLower.includes('/categories')) return RESOURCE_TYPES.CATEGORY
  if (pathLower.includes('/core-intents')) return RESOURCE_TYPES.CORE_INTENT
  if (pathLower.includes('/non-core-intents')) return RESOURCE_TYPES.NON_CORE_INTENT
  if (pathLower.includes('/responses') || pathLower.includes('/pre-responses')) return RESOURCE_TYPES.RESPONSE
  if (pathLower.includes('/test')) return RESOURCE_TYPES.TEST
  if (pathLower.includes('/system') || pathLower.includes('/config')) return RESOURCE_TYPES.SYSTEM
  if (pathLower.includes('/permission')) return RESOURCE_TYPES.PERMISSION
  if (pathLower.includes('/role')) return RESOURCE_TYPES.ROLE
  
  return 'unknown'
}

module.exports = {
  OPERATION_TYPES,
  OPERATION_DESCRIPTIONS,
  RESOURCE_TYPES,
  ACTION_TYPES,
  getOperationTypeFromRoute,
  getResourceTypeFromRoute
}