module.exports = (sequelize, DataTypes) => {
  const SystemLog = sequelize.define('SystemLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    level: {
      type: DataTypes.ENUM('error', 'warn', 'info', 'debug'),
      allowNull: false,
      defaultValue: 'info'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'system_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['level']
      },
      {
        fields: ['source']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      }
    ]
  })

  return SystemLog
} 