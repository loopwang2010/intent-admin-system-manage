module.exports = (sequelize, DataTypes) => {
  const NonCoreIntent = sequelize.define('NonCoreIntent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      },
      comment: '非核心意图英文名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    descriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '非核心意图英文描述'
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
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('keywords')
        return value ? JSON.parse(value) : []
      },
      set(value) {
        this.setDataValue('keywords', JSON.stringify(value || []))
      }
    },
    keywordsEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('keywordsEn')
        return value ? JSON.parse(value) : []
      },
      set(value) {
        this.setDataValue('keywordsEn', JSON.stringify(value || []))
      },
      comment: '英文关键词列表'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.8,
      validate: {
        min: 0.1,
        max: 1.0
      }
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '优先级'
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responseEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '非核心意图的英文回复内容'
    },
    firstResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '非核心意图的首句回复内容'
    },
    firstResponseEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '非核心意图的首句回复内容(英文)'
    },
    responseVariables: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('responseVariables')
        return value ? JSON.parse(value) : []
      },
      set(value) {
        this.setDataValue('responseVariables', JSON.stringify(value || []))
      },
      comment: '回复中使用的变量配置'
    },
    responseType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'immediate',
      comment: '回复类型：immediate-立即回复，processing-处理中回复，confirmation-确认回复'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    successCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '成功响应次数'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('tags')
        return value ? JSON.parse(value) : []
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []))
      },
      comment: '标签列表'
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '1.0.0',
      comment: '版本号'
    },
    parentVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '父版本号'
    },
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否AI生成'
    },
    semanticVector: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('semanticVector')
        return value ? JSON.parse(value) : null
      },
      set(value) {
        this.setDataValue('semanticVector', value ? JSON.stringify(value) : null)
      },
      comment: '语义向量'
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'zh-CN',
      comment: '语言'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建者ID'
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '更新者ID'
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
    tableName: 'non_core_intents',
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
        fields: ['confidence']
      },
      {
        fields: ['language']
      },
      {
        fields: ['version']
      }
    ]
  })

  return NonCoreIntent
} 