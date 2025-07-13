const { Sequelize } = require('sequelize')
const { sequelize } = require('./index')

/**
 * 权限模型
 * 定义系统中的所有权限项
 */
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
    allowNull: false,
    comment: '所属模块：user, intent, category等'
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: '操作类型：create, read, update, delete, manage'
  },
  resource: {
    type: Sequelize.STRING,
    comment: '资源类型，更具体的权限控制'
  },
  scope: {
    type: Sequelize.ENUM('global', 'own', 'department', 'custom'),
    defaultValue: 'global',
    comment: '权限作用域'
  },
  category: {
    type: Sequelize.STRING,
    comment: '权限分类，用于权限管理界面分组'
  },
  isSystem: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为系统内置权限'
  },
  level: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    comment: '权限级别，数字越大权限越高'
  },
  dependencies: {
    type: Sequelize.TEXT,
    comment: '依赖的权限，JSON格式存储'
  },
  constraints: {
    type: Sequelize.TEXT,
    comment: '权限约束条件，JSON格式存储'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active',
    comment: '权限状态'
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
  tableName: 'permissions',
  timestamps: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['module'] },
    { fields: ['action'] },
    { fields: ['scope'] },
    { fields: ['category'] },
    { fields: ['isSystem'] },
    { fields: ['status'] },
    { fields: ['level'] }
  ]
})

module.exports = Permission