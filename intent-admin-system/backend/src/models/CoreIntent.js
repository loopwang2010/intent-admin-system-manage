module.exports = (sequelize, DataTypes) => {
  const CoreIntent = sequelize.define('CoreIntent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'intent_categories',
        key: 'id'
      }
    },
    keywords: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Keywords must be an array')
          }
        }
      }
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
      validate: {
        min: 0.1,
        max: 1.0
      }
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 100
      }
    },
    // 首句回复字段
    firstResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      },
      comment: '核心意图的首句回复内容'
    },
    firstResponseEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      },
      comment: '核心意图的首句回复内容(英文)'
    },
    // 回复变量配置
    responseVariables: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '首句回复中使用的变量配置'
    },
    // 回复类型
    responseType: {
      type: DataTypes.ENUM('immediate', 'processing', 'confirmation'),
      allowNull: false,
      defaultValue: 'immediate',
      comment: '回复类型：immediate-立即回复，processing-处理中回复，confirmation-确认回复'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastUsedAt: {
      type: DataTypes.DATE,
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
    tableName: 'core_intents',
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['confidence']
      }
    ]
  })

  return CoreIntent
} 