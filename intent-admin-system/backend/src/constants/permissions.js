/**
 * 权限系统常量定义
 * 定义系统中所有权限和角色
 */

// 权限模块定义
const PERMISSION_MODULES = {
  DASHBOARD: 'dashboard',
  USER: 'user',
  INTENT: 'intent',
  CATEGORY: 'category',
  RESPONSE: 'response',
  TEST: 'test',
  ANALYTICS: 'analytics',
  AUDIT: 'audit',
  SYSTEM: 'system',
  PERMISSION: 'permission',
  ROLE: 'role'
}

// 权限操作定义
const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  REVOKE: 'revoke'
}

// 权限作用域定义
const PERMISSION_SCOPES = {
  GLOBAL: 'global',    // 全局权限
  OWN: 'own',          // 仅自己创建的
  DEPARTMENT: 'department', // 部门范围
  CUSTOM: 'custom'     // 自定义范围
}

// 系统内置权限定义
const SYSTEM_PERMISSIONS = [
  // 仪表板权限
  {
    code: 'dashboard:read',
    name: '查看仪表板',
    description: '查看系统仪表板和概览信息',
    module: PERMISSION_MODULES.DASHBOARD,
    action: PERMISSION_ACTIONS.READ,
    category: '仪表板',
    level: 1
  },

  // 用户管理权限
  {
    code: 'user:read',
    name: '查看用户',
    description: '查看用户列表和详细信息',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.READ,
    category: '用户管理',
    level: 1
  },
  {
    code: 'user:create',
    name: '创建用户',
    description: '创建新用户账户',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.CREATE,
    category: '用户管理',
    level: 2,
    dependencies: ['user:read']
  },
  {
    code: 'user:update',
    name: '更新用户',
    description: '更新用户信息',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '用户管理',
    level: 2,
    dependencies: ['user:read']
  },
  {
    code: 'user:delete',
    name: '删除用户',
    description: '删除用户账户',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.DELETE,
    category: '用户管理',
    level: 3,
    dependencies: ['user:read', 'user:update']
  },
  {
    code: 'user:manage',
    name: '管理用户',
    description: '完整的用户管理权限',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '用户管理',
    level: 4,
    dependencies: ['user:create', 'user:update', 'user:delete']
  },

  // 意图管理权限
  {
    code: 'intent:read',
    name: '查看意图',
    description: '查看意图列表和详细信息',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.READ,
    category: '意图管理',
    level: 1
  },
  {
    code: 'intent:create',
    name: '创建意图',
    description: '创建新意图',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.CREATE,
    category: '意图管理',
    level: 2,
    dependencies: ['intent:read']
  },
  {
    code: 'intent:update',
    name: '更新意图',
    description: '更新意图信息',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '意图管理',
    level: 2,
    dependencies: ['intent:read']
  },
  {
    code: 'intent:delete',
    name: '删除意图',
    description: '删除意图',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.DELETE,
    category: '意图管理',
    level: 3,
    dependencies: ['intent:read', 'intent:update']
  },
  {
    code: 'intent:approve',
    name: '审批意图',
    description: '审批非核心意图',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.APPROVE,
    category: '意图管理',
    level: 3,
    dependencies: ['intent:read']
  },
  {
    code: 'intent:manage',
    name: '管理意图',
    description: '完整的意图管理权限',
    module: PERMISSION_MODULES.INTENT,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '意图管理',
    level: 4,
    dependencies: ['intent:create', 'intent:update', 'intent:delete', 'intent:approve']
  },

  // 分类管理权限
  {
    code: 'category:read',
    name: '查看分类',
    description: '查看意图分类',
    module: PERMISSION_MODULES.CATEGORY,
    action: PERMISSION_ACTIONS.READ,
    category: '分类管理',
    level: 1
  },
  {
    code: 'category:create',
    name: '创建分类',
    description: '创建新的意图分类',
    module: PERMISSION_MODULES.CATEGORY,
    action: PERMISSION_ACTIONS.CREATE,
    category: '分类管理',
    level: 2,
    dependencies: ['category:read']
  },
  {
    code: 'category:update',
    name: '更新分类',
    description: '更新分类信息',
    module: PERMISSION_MODULES.CATEGORY,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '分类管理',
    level: 2,
    dependencies: ['category:read']
  },
  {
    code: 'category:delete',
    name: '删除分类',
    description: '删除分类',
    module: PERMISSION_MODULES.CATEGORY,
    action: PERMISSION_ACTIONS.DELETE,
    category: '分类管理',
    level: 3,
    dependencies: ['category:read', 'category:update']
  },
  {
    code: 'category:manage',
    name: '管理分类',
    description: '完整的分类管理权限',
    module: PERMISSION_MODULES.CATEGORY,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '分类管理',
    level: 4,
    dependencies: ['category:create', 'category:update', 'category:delete']
  },

  // 回复管理权限
  {
    code: 'response:read',
    name: '查看回复',
    description: '查看回复模板',
    module: PERMISSION_MODULES.RESPONSE,
    action: PERMISSION_ACTIONS.READ,
    category: '回复管理',
    level: 1
  },
  {
    code: 'response:create',
    name: '创建回复',
    description: '创建回复模板',
    module: PERMISSION_MODULES.RESPONSE,
    action: PERMISSION_ACTIONS.CREATE,
    category: '回复管理',
    level: 2,
    dependencies: ['response:read']
  },
  {
    code: 'response:update',
    name: '更新回复',
    description: '更新回复模板',
    module: PERMISSION_MODULES.RESPONSE,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '回复管理',
    level: 2,
    dependencies: ['response:read']
  },
  {
    code: 'response:delete',
    name: '删除回复',
    description: '删除回复模板',
    module: PERMISSION_MODULES.RESPONSE,
    action: PERMISSION_ACTIONS.DELETE,
    category: '回复管理',
    level: 3,
    dependencies: ['response:read', 'response:update']
  },
  {
    code: 'response:manage',
    name: '管理回复',
    description: '完整的回复管理权限',
    module: PERMISSION_MODULES.RESPONSE,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '回复管理',
    level: 4,
    dependencies: ['response:create', 'response:update', 'response:delete']
  },

  // 测试权限
  {
    code: 'test:read',
    name: '查看测试',
    description: '查看测试记录',
    module: PERMISSION_MODULES.TEST,
    action: PERMISSION_ACTIONS.READ,
    category: '测试功能',
    level: 1
  },
  {
    code: 'test:create',
    name: '执行测试',
    description: '执行意图测试',
    module: PERMISSION_MODULES.TEST,
    action: PERMISSION_ACTIONS.CREATE,
    category: '测试功能',
    level: 2,
    dependencies: ['test:read']
  },
  {
    code: 'test:manage',
    name: '管理测试',
    description: '完整的测试管理权限',
    module: PERMISSION_MODULES.TEST,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '测试功能',
    level: 3,
    dependencies: ['test:create']
  },

  // 数据分析权限
  {
    code: 'analytics:read',
    name: '查看分析',
    description: '查看数据分析报告',
    module: PERMISSION_MODULES.ANALYTICS,
    action: PERMISSION_ACTIONS.READ,
    category: '数据分析',
    level: 1
  },
  {
    code: 'analytics:export',
    name: '导出分析',
    description: '导出分析数据',
    module: PERMISSION_MODULES.ANALYTICS,
    action: PERMISSION_ACTIONS.EXPORT,
    category: '数据分析',
    level: 2,
    dependencies: ['analytics:read']
  },

  // 审计权限
  {
    code: 'audit:read',
    name: '查看审计',
    description: '查看审计日志',
    module: PERMISSION_MODULES.AUDIT,
    action: PERMISSION_ACTIONS.READ,
    category: '审计日志',
    level: 2
  },
  {
    code: 'audit:export',
    name: '导出审计',
    description: '导出审计日志',
    module: PERMISSION_MODULES.AUDIT,
    action: PERMISSION_ACTIONS.EXPORT,
    category: '审计日志',
    level: 3,
    dependencies: ['audit:read']
  },

  // 数据可视化权限
  {
    code: 'data:visualize',
    name: '数据可视化',
    description: '查看和生成数据可视化图表',
    module: PERMISSION_MODULES.ANALYTICS,
    action: PERMISSION_ACTIONS.READ,
    category: '数据分析',
    level: 2
  },
  {
    code: 'data:analyze',
    name: '数据分析',
    description: '执行高级数据分析功能',
    module: PERMISSION_MODULES.ANALYTICS,
    action: PERMISSION_ACTIONS.READ,
    category: '数据分析',
    level: 3
  },
  {
    code: 'user:analyze',
    name: '用户行为分析',
    description: '分析用户行为模式',
    module: PERMISSION_MODULES.USER,
    action: PERMISSION_ACTIONS.READ,
    category: '用户管理',
    level: 3,
    dependencies: ['user:read', 'audit:read']
  },

  // 安全审计权限
  {
    code: 'security:monitor',
    name: '安全监控',
    description: '监控系统安全状态',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '安全管理',
    level: 3
  },
  {
    code: 'security:audit',
    name: '安全审计',
    description: '执行安全审计和威胁检测',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '安全管理',
    level: 4,
    dependencies: ['audit:read', 'security:monitor']
  },
  {
    code: 'security:analyze',
    name: '安全分析',
    description: '进行安全趋势分析',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '安全管理',
    level: 4,
    dependencies: ['security:audit']
  },

  // 性能优化权限
  {
    code: 'performance:monitor',
    name: '性能监控',
    description: '监控系统性能指标',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '性能管理',
    level: 3
  },
  {
    code: 'performance:analyze',
    name: '性能分析',
    description: '分析系统性能和生成优化建议',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '性能管理',
    level: 4,
    dependencies: ['performance:monitor']
  },
  {
    code: 'system:optimize',
    name: '系统优化',
    description: '执行系统优化操作',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '性能管理',
    level: 4,
    dependencies: ['performance:analyze']
  },
  {
    code: 'database:monitor',
    name: '数据库监控',
    description: '监控数据库性能',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '性能管理',
    level: 3
  },
  {
    code: 'system:health',
    name: '系统健康检查',
    description: '执行系统健康检查',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '系统管理',
    level: 2
  },

  // 权限管理权限
  {
    code: 'permission:read',
    name: '查看权限',
    description: '查看权限列表',
    module: PERMISSION_MODULES.PERMISSION,
    action: PERMISSION_ACTIONS.READ,
    category: '权限管理',
    level: 3
  },
  {
    code: 'permission:assign',
    name: '分配权限',
    description: '分配和撤销权限',
    module: PERMISSION_MODULES.PERMISSION,
    action: PERMISSION_ACTIONS.ASSIGN,
    category: '权限管理',
    level: 4,
    dependencies: ['permission:read']
  },

  // 角色管理权限
  {
    code: 'role:read',
    name: '查看角色',
    description: '查看角色列表',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.READ,
    category: '角色管理',
    level: 3
  },
  {
    code: 'role:create',
    name: '创建角色',
    description: '创建新角色',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.CREATE,
    category: '角色管理',
    level: 4,
    dependencies: ['role:read']
  },
  {
    code: 'role:update',
    name: '更新角色',
    description: '更新角色信息',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '角色管理',
    level: 4,
    dependencies: ['role:read']
  },
  {
    code: 'role:delete',
    name: '删除角色',
    description: '删除角色',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.DELETE,
    category: '角色管理',
    level: 4,
    dependencies: ['role:read', 'role:update']
  },
  {
    code: 'role:assign',
    name: '分配角色',
    description: '为用户分配角色',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.ASSIGN,
    category: '角色管理',
    level: 4,
    dependencies: ['role:read', 'user:read']
  },
  {
    code: 'role:manage',
    name: '管理角色',
    description: '完整的角色管理权限',
    module: PERMISSION_MODULES.ROLE,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '角色管理',
    level: 5,
    dependencies: ['role:create', 'role:update', 'role:delete', 'role:assign']
  },

  // 系统管理权限
  {
    code: 'system:read',
    name: '查看系统',
    description: '查看系统信息',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.READ,
    category: '系统管理',
    level: 2
  },
  {
    code: 'system:config',
    name: '系统配置',
    description: '修改系统配置',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.UPDATE,
    category: '系统管理',
    level: 5,
    dependencies: ['system:read']
  },
  {
    code: 'system:backup',
    name: '系统备份',
    description: '执行系统备份',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.EXPORT,
    category: '系统管理',
    level: 4,
    dependencies: ['system:read']
  },

  // 数据操作权限
  {
    code: 'data:export',
    name: '导出数据',
    description: '导出系统数据',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.EXPORT,
    category: '数据操作',
    level: 3
  },
  {
    code: 'data:import',
    name: '导入数据',
    description: '导入系统数据',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.IMPORT,
    category: '数据操作',
    level: 4,
    dependencies: ['data:export']
  },

  // 安全管理权限
  {
    code: 'security:manage',
    name: '安全管理',
    description: '管理系统安全设置',
    module: PERMISSION_MODULES.SYSTEM,
    action: PERMISSION_ACTIONS.MANAGE,
    category: '安全管理',
    level: 5,
    dependencies: ['audit:read', 'system:config']
  }
]

// 系统内置角色定义
const SYSTEM_ROLES = [
  {
    code: 'super_admin',
    name: '超级管理员',
    description: '拥有系统所有权限的超级管理员',
    level: 100,
    isSystem: true,
    color: '#ff4757',
    icon: 'crown',
    permissions: ['*'] // 特殊标记，表示所有权限
  },
  {
    code: 'admin',
    name: '系统管理员',
    description: '系统管理员，拥有大部分管理权限',
    level: 90,
    isSystem: true,
    color: '#ff6b6b',
    icon: 'shield',
    permissions: [
      'dashboard:read',
      'user:manage',
      'intent:manage',
      'category:manage',
      'response:manage',
      'test:manage',
      'analytics:read',
      'analytics:export',
      'audit:read',
      'audit:export',
      'role:read',
      'role:assign',
      'permission:read',
      'permission:assign',
      'system:read',
      'system:backup',
      'data:export',
      'data:import',
      'data:visualize',
      'data:analyze',
      'user:analyze',
      'security:monitor',
      'security:audit',
      'security:analyze',
      'performance:monitor',
      'performance:analyze',
      'system:optimize',
      'database:monitor',
      'system:health'
    ]
  },
  {
    code: 'manager',
    name: '项目管理员',
    description: '项目管理员，负责业务功能管理',
    level: 70,
    isSystem: true,
    color: '#5352ed',
    icon: 'user-tie',
    permissions: [
      'dashboard:read',
      'user:read',
      'user:update',
      'intent:manage',
      'category:manage',
      'response:manage',
      'test:manage',
      'analytics:read',
      'analytics:export',
      'audit:read',
      'data:export',
      'data:visualize',
      'user:analyze',
      'performance:monitor',
      'system:health'
    ]
  },
  {
    code: 'editor',
    name: '内容编辑员',
    description: '内容编辑员，负责意图和回复的编辑',
    level: 50,
    isSystem: true,
    isDefault: true,
    color: '#3742fa',
    icon: 'edit',
    permissions: [
      'dashboard:read',
      'intent:read',
      'intent:create',
      'intent:update',
      'category:read',
      'response:read',
      'response:create',
      'response:update',
      'test:read',
      'test:create',
      'analytics:read'
    ]
  },
  {
    code: 'reviewer',
    name: '审核员',
    description: '审核员，负责意图审核',
    level: 40,
    isSystem: true,
    color: '#2ed573',
    icon: 'check-circle',
    permissions: [
      'dashboard:read',
      'intent:read',
      'intent:approve',
      'category:read',
      'response:read',
      'test:read',
      'analytics:read'
    ]
  },
  {
    code: 'tester',
    name: '测试员',
    description: '测试员，负责意图测试',
    level: 30,
    isSystem: true,
    color: '#ffa502',
    icon: 'vial',
    permissions: [
      'dashboard:read',
      'intent:read',
      'category:read',
      'response:read',
      'test:manage',
      'analytics:read'
    ]
  },
  {
    code: 'viewer',
    name: '查看者',
    description: '只读用户，只能查看信息',
    level: 10,
    isSystem: true,
    color: '#70a1ff',
    icon: 'eye',
    permissions: [
      'dashboard:read',
      'intent:read',
      'category:read',
      'response:read',
      'test:read',
      'analytics:read'
    ]
  }
]

module.exports = {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  PERMISSION_SCOPES,
  SYSTEM_PERMISSIONS,
  SYSTEM_ROLES
}