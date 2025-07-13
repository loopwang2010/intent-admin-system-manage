const { Sequelize } = require('sequelize')
const { sequelize } = require('./index')

/**
 * 角色权限关联模型
 * 多对多关系：角色 - 权限
 */
const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: '角色ID'
  },
  permissionId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: '权限ID'
  },
  granted: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    comment: '是否授予权限，false表示明确拒绝'
  },
  constraints: {
    type: Sequelize.TEXT,
    comment: '权限约束条件，JSON格式存储'
  },
  validFrom: {
    type: Sequelize.DATE,
    comment: '权限生效开始时间'
  },
  validTo: {
    type: Sequelize.DATE,
    comment: '权限生效结束时间'
  },
  assignedBy: {
    type: Sequelize.INTEGER,
    comment: '权限分配者ID'
  },
  assignedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    comment: '权限分配时间'
  },
  reason: {
    type: Sequelize.TEXT,
    comment: '分配原因'
  },
  metadata: {
    type: Sequelize.TEXT,
    comment: '额外元数据，JSON格式存储'
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  indexes: [
    { fields: ['roleId'] },
    { fields: ['permissionId'] },
    { fields: ['granted'] },
    { fields: ['assignedBy'] },
    { fields: ['validFrom'] },
    { fields: ['validTo'] },
    { fields: ['roleId', 'permissionId'], unique: true }
  ]
})

module.exports = RolePermission