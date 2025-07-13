const bcrypt = require('bcrypt')
const { 
  User, 
  IntentCategory, 
  CoreIntent, 
  NonCoreIntent, 
  PreResponse,
  Role,
  Permission,
  RolePermission,
  UserRole,
  SystemLog
} = require('../models')

async function createSeeds() {
  try {
    console.log('开始创建种子数据...')

    // 创建权限数据
    await createPermissions()
    
    // 创建角色数据
    await createRoles()
    
    // 分配权限给角色
    await assignPermissionsToRoles()

    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      }
    })

    // 为管理员分配超级管理员角色
    const superAdminRole = await Role.findOne({ where: { code: 'super_admin' } })
    if (superAdminRole && admin[1]) { // admin[1] indicates if user was created
      await UserRole.findOrCreate({
        where: {
          userId: admin[0].id,
          roleId: superAdminRole.id
        }
      })
      console.log('为管理员用户分配了超级管理员角色')
    }

    console.log('管理员用户创建完成')

    // 创建测试分类
    const categories = [
      {
        name: '音乐控制',
        nameEn: 'Music Control',
        icon: 'music-note',
        description: '播放音乐、暂停、切换歌曲等音乐相关控制',
        status: 'active',
        sortOrder: 1
      },
      {
        name: '天气查询',
        nameEn: 'Weather Query',
        icon: 'weather',
        description: '查询天气、温度、空气质量等天气信息',
        status: 'active',
        sortOrder: 2
      },
      {
        name: '智能家居',
        nameEn: 'Smart Home',
        icon: 'home',
        description: '控制灯光、空调、窗帘等智能家居设备',
        status: 'active',
        sortOrder: 3
      },
      {
        name: '时间日期',
        nameEn: 'Time Date',
        icon: 'clock',
        description: '查询时间、日期、设置闹钟等时间相关功能',
        status: 'active',
        sortOrder: 4
      },
      {
        name: '新闻资讯',
        nameEn: 'News',
        icon: 'newspaper',
        description: '播报新闻、查询资讯等信息获取功能',
        status: 'active',
        sortOrder: 5
      }
    ]

    const createdCategories = []
    for (const category of categories) {
      const [categoryInstance] = await IntentCategory.findOrCreate({
        where: { name: category.name },
        defaults: category
      })
      createdCategories.push(categoryInstance)
    }

    console.log('意图分类创建完成')

    // 创建核心意图
    const coreIntents = [
      {
        name: '播放音乐',
        nameEn: 'Play Music',
        description: '播放指定的音乐或歌手的歌曲',
        categoryId: createdCategories[0].id,
        keywords: JSON.stringify(['播放', '放', '来一首', '听', '音乐', '歌']),
        confidence: 0.9,
        priority: 1,
        status: 'active'
      },
      {
        name: '暂停音乐',
        nameEn: 'Pause Music',
        description: '暂停当前播放的音乐',
        categoryId: createdCategories[0].id,
        keywords: JSON.stringify(['暂停', '停', '停止', '别播了']),
        confidence: 0.95,
        priority: 2,
        status: 'active'
      },
      {
        name: '查询天气',
        nameEn: 'Check Weather',
        description: '查询指定地区的天气情况',
        categoryId: createdCategories[1].id,
        keywords: JSON.stringify(['天气', '气温', '温度', '下雨', '晴天']),
        confidence: 0.9,
        priority: 1,
        status: 'active'
      },
      {
        name: '开灯',
        nameEn: 'Turn On Light',
        description: '打开指定房间的灯光',
        categoryId: createdCategories[2].id,
        keywords: JSON.stringify(['开灯', '开', '亮', '灯']),
        confidence: 0.85,
        priority: 1,
        status: 'active'
      },
      {
        name: '查询时间',
        nameEn: 'Check Time',
        description: '查询当前时间',
        categoryId: createdCategories[3].id,
        keywords: JSON.stringify(['时间', '几点', '现在', '点钟']),
        confidence: 0.9,
        priority: 1,
        status: 'active'
      }
    ]

    const createdCoreIntents = []
    for (const intent of coreIntents) {
      const [intentInstance] = await CoreIntent.findOrCreate({
        where: { name: intent.name, categoryId: intent.categoryId },
        defaults: intent
      })
      createdCoreIntents.push(intentInstance)
    }

    console.log('核心意图创建完成')

    // 创建非核心意图
    const nonCoreIntents = [
      {
        name: '问候',
        nameEn: 'Greeting',
        description: '用户的问候语',
        keywords: JSON.stringify(['你好', '早上好', '晚上好', '嗨']),
        directReply: '你好！很高兴为您服务',
        confidence: 0.8,
        priority: 1,
        status: 'active'
      },
      {
        name: '感谢',
        nameEn: 'Thanks',
        description: '用户表示感谢',
        keywords: JSON.stringify(['谢谢', '感谢', '辛苦了']),
        directReply: '不客气，随时为您服务！',
        confidence: 0.8,
        priority: 2,
        status: 'active'
      },
      {
        name: '再见',
        nameEn: 'Goodbye',
        description: '用户告别',
        keywords: JSON.stringify(['再见', '拜拜', '晚安', '结束']),
        directReply: '再见！期待下次为您服务',
        confidence: 0.8,
        priority: 3,
        status: 'active'
      }
    ]

    for (const intent of nonCoreIntents) {
      await NonCoreIntent.findOrCreate({
        where: { name: intent.name },
        defaults: intent
      })
    }

    console.log('非核心意图创建完成')

    // 创建回复模板
    const responses = [
      {
        coreIntentId: createdCoreIntents[0].id,
        content: '正在为您播放音乐...',
        type: 'text',
        priority: 1,
        status: 'active'
      },
      {
        coreIntentId: createdCoreIntents[1].id,
        content: '音乐已暂停',
        type: 'text',
        priority: 1,
        status: 'active'
      },
      {
        coreIntentId: createdCoreIntents[2].id,
        content: '今天的天气是{weather}，温度{temperature}度',
        type: 'text',
        priority: 1,
        status: 'active'
      },
      {
        coreIntentId: createdCoreIntents[3].id,
        content: '{room}的灯已为您打开',
        type: 'text',
        priority: 1,
        status: 'active'
      },
      {
        coreIntentId: createdCoreIntents[4].id,
        content: '现在是{time}',
        type: 'text',
        priority: 1,
        status: 'active'
      }
    ]

    for (const response of responses) {
      await PreResponse.findOrCreate({
        where: { 
          coreIntentId: response.coreIntentId,
          content: response.content 
        },
        defaults: response
      })
    }

    console.log('回复模板创建完成')
    console.log('种子数据创建完成！')
    
    return {
      admin: admin[0],
      categories: createdCategories,
      coreIntents: createdCoreIntents
    }

  } catch (error) {
    console.error('创建种子数据失败:', error)
    throw error
  }
}

/**
 * 创建权限数据
 */
async function createPermissions() {
  console.log('创建权限数据...')
  
  const permissions = [
    // 用户管理权限
    { code: 'user:read', name: '查看用户', description: '查看用户列表和用户详情', module: 'user', type: 'api', sortOrder: 1 },
    { code: 'user:create', name: '创建用户', description: '创建新用户', module: 'user', type: 'api', sortOrder: 2 },
    { code: 'user:update', name: '编辑用户', description: '编辑用户信息', module: 'user', type: 'api', sortOrder: 3 },
    { code: 'user:delete', name: '删除用户', description: '删除用户', module: 'user', type: 'api', sortOrder: 4 },
    { code: 'user:manage', name: '用户管理', description: '完整的用户管理权限', module: 'user', type: 'menu', sortOrder: 10 },
    
    // 角色管理权限
    { code: 'role:read', name: '查看角色', description: '查看角色列表和角色详情', module: 'role', type: 'api', sortOrder: 1 },
    { code: 'role:create', name: '创建角色', description: '创建新角色', module: 'role', type: 'api', sortOrder: 2 },
    { code: 'role:update', name: '编辑角色', description: '编辑角色信息', module: 'role', type: 'api', sortOrder: 3 },
    { code: 'role:delete', name: '删除角色', description: '删除角色', module: 'role', type: 'api', sortOrder: 4 },
    { code: 'role:assign', name: '分配角色', description: '为用户分配角色', module: 'role', type: 'api', sortOrder: 5 },
    { code: 'role:manage', name: '角色管理', description: '完整的角色管理权限', module: 'role', type: 'menu', sortOrder: 10 },
    
    // 权限管理权限
    { code: 'permission:read', name: '查看权限', description: '查看权限列表', module: 'permission', type: 'api', sortOrder: 1 },
    { code: 'permission:create', name: '创建权限', description: '创建新权限', module: 'permission', type: 'api', sortOrder: 2 },
    { code: 'permission:update', name: '编辑权限', description: '编辑权限信息', module: 'permission', type: 'api', sortOrder: 3 },
    { code: 'permission:delete', name: '删除权限', description: '删除权限', module: 'permission', type: 'api', sortOrder: 4 },
    { code: 'permission:manage', name: '权限管理', description: '完整的权限管理权限', module: 'permission', type: 'menu', sortOrder: 10 },
    
    // 意图管理权限
    { code: 'intent:read', name: '查看意图', description: '查看意图列表和详情', module: 'intent', type: 'api', sortOrder: 1 },
    { code: 'intent:create', name: '创建意图', description: '创建新意图', module: 'intent', type: 'api', sortOrder: 2 },
    { code: 'intent:update', name: '编辑意图', description: '编辑意图信息', module: 'intent', type: 'api', sortOrder: 3 },
    { code: 'intent:delete', name: '删除意图', description: '删除意图', module: 'intent', type: 'api', sortOrder: 4 },
    { code: 'intent:test', name: '测试意图', description: '测试意图识别', module: 'intent', type: 'button', sortOrder: 5 },
    { code: 'intent:manage', name: '意图管理', description: '完整的意图管理权限', module: 'intent', type: 'menu', sortOrder: 10 },
    
    // 分类管理权限
    { code: 'category:read', name: '查看分类', description: '查看分类列表', module: 'category', type: 'api', sortOrder: 1 },
    { code: 'category:create', name: '创建分类', description: '创建新分类', module: 'category', type: 'api', sortOrder: 2 },
    { code: 'category:update', name: '编辑分类', description: '编辑分类信息', module: 'category', type: 'api', sortOrder: 3 },
    { code: 'category:delete', name: '删除分类', description: '删除分类', module: 'category', type: 'api', sortOrder: 4 },
    { code: 'category:manage', name: '分类管理', description: '完整的分类管理权限', module: 'category', type: 'menu', sortOrder: 10 },
    
    // 系统管理权限
    { code: 'system:config', name: '系统配置', description: '修改系统配置', module: 'system', type: 'api', sortOrder: 1 },
    { code: 'system:backup', name: '系统备份', description: '执行系统备份', module: 'system', type: 'button', sortOrder: 2 },
    { code: 'system:manage', name: '系统管理', description: '完整的系统管理权限', module: 'system', type: 'menu', sortOrder: 10 },
    
    // 审计日志权限
    { code: 'audit:read', name: '查看日志', description: '查看审计日志', module: 'audit', type: 'api', sortOrder: 1 },
    { code: 'audit:manage', name: '日志管理', description: '完整的日志管理权限', module: 'audit', type: 'menu', sortOrder: 10 },
    
    // 报表统计权限
    { code: 'report:read', name: '查看报表', description: '查看统计报表', module: 'report', type: 'api', sortOrder: 1 },
    { code: 'report:manage', name: '报表管理', description: '完整的报表管理权限', module: 'report', type: 'menu', sortOrder: 10 },
    
    // 测试管理权限
    { code: 'test:read', name: '查看测试', description: '查看测试记录', module: 'test', type: 'api', sortOrder: 1 },
    { code: 'test:create', name: '创建测试', description: '创建测试任务', module: 'test', type: 'api', sortOrder: 2 },
    { code: 'test:manage', name: '测试管理', description: '完整的测试管理权限', module: 'test', type: 'menu', sortOrder: 10 },
    
    // 超级权限
    { code: '*', name: '超级管理员', description: '拥有所有权限', module: 'system', type: 'api', sortOrder: 999 }
  ]

  for (const permissionData of permissions) {
    const [permission, created] = await Permission.findOrCreate({
      where: { code: permissionData.code },
      defaults: permissionData
    })
    
    if (created) {
      console.log(`创建权限: ${permission.name} (${permission.code})`)
    }
  }
}

/**
 * 创建角色数据
 */
async function createRoles() {
  console.log('创建角色数据...')
  
  const roles = [
    {
      code: 'super_admin',
      name: '超级管理员',
      description: '拥有系统所有权限的超级管理员角色',
      level: 1,
      color: '#ff4d4f',
      icon: 'crown',
      isSystem: true,
      isDefault: false,
      status: 'active',
      sortOrder: 1
    },
    {
      code: 'admin',
      name: '系统管理员',
      description: '拥有大部分管理权限的管理员角色',
      level: 2,
      color: '#1890ff',
      icon: 'user-tie',
      isSystem: true,
      isDefault: false,
      status: 'active',
      sortOrder: 2
    },
    {
      code: 'editor',
      name: '编辑员',
      description: '拥有内容编辑权限的角色',
      level: 3,
      color: '#52c41a',
      icon: 'edit',
      isSystem: true,
      isDefault: true,
      status: 'active',
      sortOrder: 3
    },
    {
      code: 'viewer',
      name: '查看员',
      description: '只有查看权限的角色',
      level: 4,
      color: '#722ed1',
      icon: 'eye',
      isSystem: true,
      isDefault: false,
      status: 'active',
      sortOrder: 4
    },
    {
      code: 'tester',
      name: '测试员',
      description: '负责测试功能的角色',
      level: 4,
      color: '#fa8c16',
      icon: 'bug',
      isSystem: true,
      isDefault: false,
      status: 'active',
      sortOrder: 5
    }
  ]

  for (const roleData of roles) {
    const [role, created] = await Role.findOrCreate({
      where: { code: roleData.code },
      defaults: roleData
    })
    
    if (created) {
      console.log(`创建角色: ${role.name} (${role.code})`)
    }
  }
}

/**
 * 分配权限给角色
 */
async function assignPermissionsToRoles() {
  console.log('分配权限给角色...')
  
  // 超级管理员 - 所有权限
  await assignPermissionsToRole('super_admin', ['*'])
  
  // 系统管理员 - 除超级权限外的大部分权限
  await assignPermissionsToRole('admin', [
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:manage',
    'role:read', 'role:create', 'role:update', 'role:delete', 'role:manage', 'role:assign',
    'permission:read', 'permission:manage',
    'intent:read', 'intent:create', 'intent:update', 'intent:delete', 'intent:manage', 'intent:test',
    'category:read', 'category:create', 'category:update', 'category:delete', 'category:manage',
    'system:config', 'system:backup', 'system:manage',
    'audit:read', 'audit:manage',
    'report:read', 'report:manage',
    'test:read', 'test:create', 'test:manage'
  ])
  
  // 编辑员 - 内容编辑权限
  await assignPermissionsToRole('editor', [
    'user:read',
    'role:read',
    'permission:read',
    'intent:read', 'intent:create', 'intent:update', 'intent:test',
    'category:read', 'category:create', 'category:update',
    'report:read',
    'test:read', 'test:create'
  ])
  
  // 查看员 - 只读权限
  await assignPermissionsToRole('viewer', [
    'user:read',
    'role:read',
    'permission:read',
    'intent:read',
    'category:read',
    'report:read',
    'test:read'
  ])
  
  // 测试员 - 测试相关权限
  await assignPermissionsToRole('tester', [
    'intent:read', 'intent:test',
    'category:read',
    'test:read', 'test:create', 'test:manage',
    'report:read'
  ])
}

/**
 * 为角色分配权限
 */
async function assignPermissionsToRole(roleCode, permissionCodes) {
  try {
    const role = await Role.findOne({ where: { code: roleCode } })
    if (!role) {
      console.warn(`角色 ${roleCode} 不存在`)
      return
    }

    const permissions = await Permission.findAll({
      where: { code: permissionCodes }
    })

    if (permissions.length !== permissionCodes.length) {
      console.warn(`角色 ${roleCode} 的某些权限不存在`)
    }

    // 清除现有权限关联
    await RolePermission.destroy({ where: { roleId: role.id } })

    // 创建新的权限关联
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: {
          roleId: role.id,
          permissionId: permission.id
        }
      })
    }

    console.log(`为角色 ${role.name} 分配了 ${permissions.length} 个权限`)
  } catch (error) {
    console.error(`为角色 ${roleCode} 分配权限失败:`, error)
  }
}

module.exports = { createSeeds } 