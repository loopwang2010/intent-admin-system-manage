const { Sequelize } = require('sequelize')
const { sequelize } = require('./index')

/**
 * 角色模型
 * 定义系统中的用户角色
 */
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
    comment: '角色代码，如：admin, editor, viewer'
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
  isSystem: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统内置角色'
  },
  isDefault: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为默认角色'
  },
  level: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    comment: '角色级别，数字越大权限越高'
  },
  color: {
    type: Sequelize.STRING,
    comment: '角色颜色标识'
  },
  icon: {
    type: Sequelize.STRING,
    comment: '角色图标'
  },
  maxUsers: {
    type: Sequelize.INTEGER,
    comment: '最大用户数限制，null表示无限制'
  },
  validFrom: {
    type: Sequelize.DATE,
    comment: '角色生效开始时间'
  },
  validTo: {
    type: Sequelize.DATE,
    comment: '角色生效结束时间'
  },
  parentRoleId: {
    type: Sequelize.INTEGER,
    comment: '父角色ID，用于角色继承'
  },
  settings: {
    type: Sequelize.TEXT,
    comment: '角色设置，JSON格式存储'
  },
  metadata: {
    type: Sequelize.TEXT,
    comment: '额外元数据，JSON格式存储'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active',
    comment: '角色状态'
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  createdBy: {
    type: Sequelize.INTEGER,
    comment: '创建者ID'
  },
  updatedBy: {
    type: Sequelize.INTEGER,
    comment: '更新者ID'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['isSystem'] },
    { fields: ['isDefault'] },
    { fields: ['status'] },
    { fields: ['level'] },
    { fields: ['parentRoleId'] }
  ]
})

// 自关联：父子角色关系
Role.belongsTo(Role, { as: 'ParentRole', foreignKey: 'parentRoleId' })
Role.hasMany(Role, { as: 'ChildRoles', foreignKey: 'parentRoleId' })

module.exports = Role