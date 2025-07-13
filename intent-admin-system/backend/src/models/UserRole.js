const { Sequelize } = require('sequelize')
const { sequelize } = require('./index')

/**
 * 用户角色关联模型
 * 多对多关系：用户 - 角色
 */
const UserRole = sequelize.define('UserRole', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  roleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: '角色ID'
  },
  isPrimary: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    comment: '是否为主要角色'
  },
  validFrom: {
    type: Sequelize.DATE,
    comment: '角色生效开始时间'
  },
  validTo: {
    type: Sequelize.DATE,
    comment: '角色生效结束时间'
  },
  assignedBy: {
    type: Sequelize.INTEGER,
    comment: '角色分配者ID'
  },
  assignedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    comment: '角色分配时间'
  },
  reason: {
    type: Sequelize.TEXT,
    comment: '分配原因'
  },
  department: {
    type: Sequelize.STRING,
    comment: '所属部门'
  },
  position: {
    type: Sequelize.STRING,
    comment: '职位'
  },
  constraints: {
    type: Sequelize.TEXT,
    comment: '角色约束条件，JSON格式存储'
  },
  metadata: {
    type: Sequelize.TEXT,
    comment: '额外元数据，JSON格式存储'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'suspended', 'expired'),
    defaultValue: 'active',
    comment: '用户角色状态'
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['roleId'] },
    { fields: ['isPrimary'] },
    { fields: ['assignedBy'] },
    { fields: ['status'] },
    { fields: ['validFrom'] },
    { fields: ['validTo'] },
    { fields: ['userId', 'roleId'], unique: true }
  ]
})

module.exports = UserRole