const { Sequelize } = require('sequelize')
const path = require('path')

// 创建数据库连接
const dbPath = path.join(__dirname, '../../data/intent_admin.db')
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

// 意图分类模型
const IntentCategory = sequelize.define('IntentCategory', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nameEn: {
    type: Sequelize.STRING,
    comment: '英文名称'
  },
  description: {
    type: Sequelize.TEXT
  },
  descriptionEn: {
    type: Sequelize.TEXT,
    comment: '英文描述'
  },
  icon: {
    type: Sequelize.STRING
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'draft'),
    defaultValue: 'active'
  },
  tags: {
    type: Sequelize.TEXT,
    comment: '标签，JSON格式存储'
  },
  version: {
    type: Sequelize.STRING,
    defaultValue: '1.0.0'
  },
  createdBy: {
    type: Sequelize.INTEGER,
    comment: '创建用户ID'
  },
  updatedBy: {
    type: Sequelize.INTEGER,
    comment: '更新用户ID'
  }
}, {
  tableName: 'intent_categories',
  timestamps: true
})

// 核心意图模型
const CoreIntent = sequelize.define('CoreIntent', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nameEn: {
    type: Sequelize.STRING,
    comment: '英文名称'
  },
  description: {
    type: Sequelize.TEXT
  },
  descriptionEn: {
    type: Sequelize.TEXT,
    comment: '英文描述'
  },
  categoryId: {
    type: Sequelize.INTEGER,
    references: {
      model: IntentCategory,
      key: 'id'
    }
  },
  keywords: {
    type: Sequelize.TEXT,
    comment: '关键词，JSON格式存储'
  },
  keywordsEn: {
    type: Sequelize.TEXT,
    comment: '英文关键词，JSON格式存储'
  },
  confidence: {
    type: Sequelize.FLOAT,
    defaultValue: 0.8
  },
  priority: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'draft', 'testing'),
    defaultValue: 'active'
  },
  usageCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  successCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: '成功识别次数'
  },
  lastUsedAt: {
    type: Sequelize.DATE
  },
  tags: {
    type: Sequelize.TEXT,
    comment: '标签，JSON格式存储'
  },
  version: {
    type: Sequelize.STRING,
    defaultValue: '1.0.0'
  },
  parentVersion: {
    type: Sequelize.STRING,
    comment: '父版本号'
  },
  aiGenerated: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否AI生成'
  },
  semanticVector: {
    type: Sequelize.TEXT,
    comment: '语义向量，用于相似度计算'
  },
  language: {
    type: Sequelize.STRING,
    defaultValue: 'zh-CN'
  },
  createdBy: {
    type: Sequelize.INTEGER
  },
  updatedBy: {
    type: Sequelize.INTEGER
  }
}, {
  tableName: 'core_intents',
  timestamps: true,
  indexes: [
    { fields: ['categoryId'] },
    { fields: ['status'] },
    { fields: ['language'] },
    { fields: ['version'] }
  ]
})

// 非核心意图模型
const NonCoreIntent = sequelize.define('NonCoreIntent', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nameEn: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  descriptionEn: {
    type: Sequelize.TEXT
  },
  categoryId: {
    type: Sequelize.INTEGER,
    references: {
      model: IntentCategory,
      key: 'id'
    }
  },
  keywords: {
    type: Sequelize.TEXT
  },
  keywordsEn: {
    type: Sequelize.TEXT
  },
  confidence: {
    type: Sequelize.FLOAT,
    defaultValue: 0.8
  },
  priority: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  },
  response: {
    type: Sequelize.TEXT
  },
  responseEn: {
    type: Sequelize.TEXT
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'draft', 'testing'),
    defaultValue: 'active'
  },
  usageCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  successCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  lastUsedAt: {
    type: Sequelize.DATE
  },
  tags: {
    type: Sequelize.TEXT
  },
  version: {
    type: Sequelize.STRING,
    defaultValue: '1.0.0'
  },
  parentVersion: {
    type: Sequelize.STRING
  },
  aiGenerated: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  semanticVector: {
    type: Sequelize.TEXT
  },
  language: {
    type: Sequelize.STRING,
    defaultValue: 'zh-CN'
  },
  createdBy: {
    type: Sequelize.INTEGER
  },
  updatedBy: {
    type: Sequelize.INTEGER
  }
}, {
  tableName: 'non_core_intents',
  timestamps: true,
  indexes: [
    { fields: ['categoryId'] },
    { fields: ['status'] },
    { fields: ['language'] },
    { fields: ['version'] }
  ]
})

// 回复模板模型
const PreResponse = sequelize.define('PreResponse', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  coreIntentId: {
    type: Sequelize.INTEGER,
    references: {
      model: CoreIntent,
      key: 'id'
    }
  },
  nonCoreIntentId: {
    type: Sequelize.INTEGER,
    references: {
      model: NonCoreIntent,
      key: 'id'
    }
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  contentEn: {
    type: Sequelize.TEXT
  },
  type: {
    type: Sequelize.ENUM('text', 'audio', 'image', 'card', 'voice'),
    defaultValue: 'text'
  },
  variables: {
    type: Sequelize.TEXT,
    comment: '模板变量，JSON格式'
  },
  priority: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'testing'),
    defaultValue: 'active'
  },
  usageCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  successRate: {
    type: Sequelize.FLOAT,
    defaultValue: 0.0,
    comment: '成功率'
  },
  lastUsedAt: {
    type: Sequelize.DATE
  },
  abTestGroup: {
    type: Sequelize.STRING,
    comment: 'A/B测试分组'
  },
  language: {
    type: Sequelize.STRING,
    defaultValue: 'zh-CN'
  },
  version: {
    type: Sequelize.STRING,
    defaultValue: '1.0.0'
  },
  createdBy: {
    type: Sequelize.INTEGER
  },
  updatedBy: {
    type: Sequelize.INTEGER
  }
}, {
  tableName: 'pre_responses',
  timestamps: true,
  indexes: [
    { fields: ['coreIntentId'] },
    { fields: ['nonCoreIntentId'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['language'] }
  ]
})

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  realName: {
    type: Sequelize.STRING,
    comment: '真实姓名'
  },
  phone: {
    type: Sequelize.STRING,
    comment: '手机号码'
  },
  avatar: {
    type: Sequelize.STRING,
    comment: '头像URL'
  },
  department: {
    type: Sequelize.STRING,
    comment: '部门'
  },
  position: {
    type: Sequelize.STRING,
    comment: '职位'
  },
  role: {
    type: Sequelize.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'editor'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'locked'),
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: Sequelize.DATE
  },
  remark: {
    type: Sequelize.TEXT,
    comment: '备注信息'
  },
  preferences: {
    type: Sequelize.TEXT,
    comment: '用户偏好设置，JSON格式'
  }
}, {
  tableName: 'users',
  timestamps: true
})

// 系统日志模型 - 增强版
const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '操作类型：CREATE/UPDATE/DELETE/LOGIN等'
  },
  operationType: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '具体操作类型：INTENT_CREATE/USER_LOGIN等'
  },
  resource: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '资源类型：intent/category/user等'
  },
  resourceId: {
    type: Sequelize.INTEGER,
    comment: '资源ID'
  },
  resourceName: {
    type: Sequelize.STRING,
    comment: '资源名称'
  },
  method: {
    type: Sequelize.STRING,
    comment: 'HTTP方法：GET/POST/PUT/DELETE'
  },
  path: {
    type: Sequelize.STRING,
    comment: '请求路径'
  },
  details: {
    type: Sequelize.TEXT,
    comment: '详细信息，JSON格式'
  },
  oldValues: {
    type: Sequelize.TEXT,
    comment: '修改前的值，JSON格式'
  },
  newValues: {
    type: Sequelize.TEXT,
    comment: '修改后的值，JSON格式'
  },
  requestId: {
    type: Sequelize.STRING,
    comment: '请求ID，用于关联相关操作'
  },
  sessionId: {
    type: Sequelize.STRING,
    comment: '会话ID'
  },
  ip: {
    type: Sequelize.STRING,
    comment: 'IP地址'
  },
  userAgent: {
    type: Sequelize.TEXT,
    comment: '用户代理'
  },
  responseStatus: {
    type: Sequelize.INTEGER,
    comment: 'HTTP响应状态码'
  },
  responseTime: {
    type: Sequelize.INTEGER,
    comment: '响应时间(ms)'
  },
  errorCode: {
    type: Sequelize.STRING,
    comment: '错误代码'
  },
  errorMessage: {
    type: Sequelize.TEXT,
    comment: '错误信息'
  },
  level: {
    type: Sequelize.ENUM('info', 'warning', 'error', 'debug', 'audit'),
    defaultValue: 'info',
    comment: '日志级别'
  },
  success: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    comment: '操作是否成功'
  },
  tags: {
    type: Sequelize.TEXT,
    comment: '标签，用于分类和检索，JSON格式'
  },
  metadata: {
    type: Sequelize.TEXT,
    comment: '额外元数据，JSON格式'
  }
}, {
  tableName: 'system_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['operationType'] },
    { fields: ['resource'] },
    { fields: ['resourceId'] },
    { fields: ['level'] },
    { fields: ['success'] },
    { fields: ['createdAt'] },
    { fields: ['sessionId'] },
    { fields: ['requestId'] },
    { fields: ['ip'] },
    { fields: ['responseStatus'] }
  ]
})

// 测试记录模型
const TestRecord = sequelize.define('TestRecord', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  inputText: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  language: {
    type: Sequelize.STRING,
    defaultValue: 'zh-CN'
  },
  matchedIntentId: {
    type: Sequelize.INTEGER
  },
  matchedIntentType: {
    type: Sequelize.ENUM('core', 'non_core'),
    comment: '匹配的意图类型'
  },
  confidence: {
    type: Sequelize.FLOAT
  },
  responseTime: {
    type: Sequelize.INTEGER,
    comment: '响应时间(ms)'
  },
  isSuccessful: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  feedback: {
    type: Sequelize.ENUM('positive', 'negative', 'neutral'),
    comment: '用户反馈'
  },
  metadata: {
    type: Sequelize.TEXT,
    comment: '其他元数据，JSON格式'
  }
}, {
  tableName: 'test_records',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['matchedIntentId'] },
    { fields: ['matchedIntentType'] },
    { fields: ['isSuccessful'] },
    { fields: ['createdAt'] }
  ]
})

// 数据统计模型
const DataStatistics = sequelize.define('DataStatistics', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  totalTests: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  successfulTests: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  avgResponseTime: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  },
  topIntents: {
    type: Sequelize.TEXT,
    comment: '热门意图统计，JSON格式'
  },
  categoryStats: {
    type: Sequelize.TEXT,
    comment: '分类统计，JSON格式'
  },
  userStats: {
    type: Sequelize.TEXT,
    comment: '用户统计，JSON格式'
  }
}, {
  tableName: 'data_statistics',
  timestamps: true,
  indexes: [
    { fields: ['date'], unique: true }
  ]
})

// 定义关联关系
IntentCategory.hasMany(CoreIntent, { foreignKey: 'categoryId', as: 'CoreIntents' })
CoreIntent.belongsTo(IntentCategory, { foreignKey: 'categoryId', as: 'Category' })

IntentCategory.hasMany(NonCoreIntent, { foreignKey: 'categoryId', as: 'NonCoreIntents' })
NonCoreIntent.belongsTo(IntentCategory, { foreignKey: 'categoryId', as: 'Category' })

CoreIntent.hasMany(PreResponse, { foreignKey: 'coreIntentId', as: 'Responses' })
PreResponse.belongsTo(CoreIntent, { foreignKey: 'coreIntentId', as: 'CoreIntent' })

NonCoreIntent.hasMany(PreResponse, { foreignKey: 'nonCoreIntentId', as: 'Responses' })
PreResponse.belongsTo(NonCoreIntent, { foreignKey: 'nonCoreIntentId', as: 'NonCoreIntent' })

User.hasMany(SystemLog, { foreignKey: 'userId', as: 'Logs' })
SystemLog.belongsTo(User, { foreignKey: 'userId', as: 'User' })

User.hasMany(TestRecord, { foreignKey: 'userId', as: 'TestRecords' })
TestRecord.belongsTo(User, { foreignKey: 'userId', as: 'User' })

// 权限模型
const Permission = sequelize.define('Permission', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    comment: '权限代码，如：user:create, intent:read'
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '权限名称'
  },
  description: {
    type: Sequelize.TEXT,
    comment: '权限描述'
  },
  module: {
    type: Sequelize.STRING,
    comment: '所属模块'
  },
  action: {
    type: Sequelize.STRING,
    comment: '权限操作类型'
  },
  category: {
    type: Sequelize.STRING,
    comment: '权限分类'
  },
  level: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    comment: '权限级别'
  },
  dependencies: {
    type: Sequelize.TEXT,
    comment: '权限依赖，JSON格式存储'
  },
  type: {
    type: Sequelize.ENUM('menu', 'button', 'api', 'data'),
    defaultValue: 'api',
    comment: '权限类型'
  },
  parentId: {
    type: Sequelize.INTEGER,
    comment: '父权限ID，用于构建权限树'
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  isSystem: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统权限'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'permissions',
  timestamps: true
})

// 角色模型
const Role = sequelize.define('Role', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    comment: '角色代码'
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '角色名称'
  },
  description: {
    type: Sequelize.TEXT,
    comment: '角色描述'
  },
  level: {
    type: Sequelize.INTEGER,
    defaultValue: 3,
    comment: '角色级别，数字越小权限越高'
  },
  color: {
    type: Sequelize.STRING,
    comment: '角色颜色标识'
  },
  icon: {
    type: Sequelize.STRING,
    comment: '角色图标'
  },
  isSystem: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统角色'
  },
  isDefault: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为默认角色'
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'roles',
  timestamps: true
})

// 角色权限关联模型
const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permissionId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'permissionId']
    }
  ]
})

// 用户角色关联模型
const UserRole = sequelize.define('UserRole', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'roleId']
    }
  ]
})

// 权限模型关联关系
// 角色和权限的多对多关系
Role.belongsToMany(Permission, { 
  through: RolePermission, 
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
})
Permission.belongsToMany(Role, { 
  through: RolePermission, 
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
})

// 用户和角色的多对多关系
User.belongsToMany(Role, { 
  through: UserRole, 
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
})
Role.belongsToMany(User, { 
  through: UserRole, 
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
})

// 直接关联关系
RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' })
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'Permission' })
Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'RolePermissions' })
Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'RolePermissions' })

UserRole.belongsTo(User, { foreignKey: 'userId', as: 'User' })
UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' })
User.hasMany(UserRole, { foreignKey: 'userId', as: 'UserRoles' })
Role.hasMany(UserRole, { foreignKey: 'roleId', as: 'UserRoles' })

// 审计日志关联
SystemLog.belongsTo(Role, { foreignKey: 'resourceId', as: 'RelatedRole', constraints: false })
SystemLog.belongsTo(Permission, { foreignKey: 'resourceId', as: 'RelatedPermission', constraints: false })

// 数据库初始化函数
async function initDatabase() {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 同步所有模型，不使用alter避免无限循环
    await sequelize.sync({ force: false })
    console.log('数据库模型同步完成')
    
    // 创建种子数据
    try {
      const { createSeeds } = require('../seeds')
      await createSeeds()
      console.log('种子数据初始化完成')
    } catch (seedError) {
      console.log('种子数据已存在或创建失败:', seedError.message)
    }
    
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

// 关闭数据库连接
async function closeDatabase() {
  try {
    await sequelize.close()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('关闭数据库连接失败:', error)
  }
}

module.exports = {
  sequelize,
  IntentCategory,
  CoreIntent,
  NonCoreIntent,
  PreResponse,
  User,
  SystemLog,
  TestRecord,
  DataStatistics,
  Permission,
  Role,
  RolePermission,
  UserRole,
  initDatabase,
  closeDatabase
} 