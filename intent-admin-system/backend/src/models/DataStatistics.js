module.exports = (sequelize, DataTypes) => {
  const DataStatistics = sequelize.define('DataStatistics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true
    },
    totalRequests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    successRequests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    failureRequests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    avgResponseTime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    uniqueUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    topIntent: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'data_statistics',
    timestamps: true,
    indexes: [
      {
        fields: ['date']
      },
      {
        fields: ['topIntent']
      }
    ]
  })

  return DataStatistics
} 