#!/usr/bin/env node
/**
 * 语料导入脚本 - 从前置回答语料.csv文件中提取首句回复
 * 用于将真实的语料数据导入到分类回复系统中
 */

const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const iconv = require('iconv-lite')

// 导入数据库模型
const { IntentCategory, PreResponse, sequelize } = require('./src/models')

// 分类映射 - 将CSV中的subtype映射到我们的分类系统
const CATEGORY_MAPPING = {
  '时间查询': { code: 'INFO_TIME', name: '时间日期' },
  '日期查询': { code: 'INFO_TIME', name: '时间日期' },
  '天气查询': { code: 'LIFE_WEATHER', name: '天气查询' },
  '音乐控制': { code: 'ENT_MUSIC', name: '音乐控制' },
  '音乐播放': { code: 'ENT_MUSIC', name: '音乐控制' },
  '智能家居': { code: 'CTRL_SMARTHOME', name: '智能家居' },
  '设备控制': { code: 'CTRL_DEVICE', name: '设备控制' },
  '新闻资讯': { code: 'INFO_NEWS', name: '新闻资讯' },
  '百科知识': { code: 'INFO_ENCYCLOPEDIA', name: '百科知识' },
  '翻译服务': { code: 'INFO_TRANSLATE', name: '翻译服务' },
  '娱乐互动': { code: 'ENT_GAME', name: '游戏互动' },
  '生活服务': { code: 'LIFE_TRANSPORT', name: '交通出行' },
  '美食查询': { code: 'LIFE_FOOD', name: '美食餐饮' }
}

// 统计信息
const stats = {
  totalRecords: 0,
  validRecords: 0,
  importedRecords: 0,
  skippedRecords: 0,
  errors: 0,
  categoriesFound: new Set(),
  uniqueResponses: new Set()
}

/**
 * 清理和标准化回复内容
 */
function cleanResponse(response) {
  if (!response || typeof response !== 'string') return null
  
  return response
    .trim()
    .replace(/^['"「『]|['"」』]$/g, '') // 移除首尾引号
    .replace(/～+/g, '～') // 标准化波浪号
    .replace(/\s+/g, ' ') // 标准化空格
    .trim()
}

/**
 * 根据subtype查找对应的分类ID
 */
async function findCategoryBySubtype(subtype) {
  const mapping = CATEGORY_MAPPING[subtype]
  if (!mapping) return null
  
  try {
    const category = await IntentCategory.findOne({
      where: {
        code: mapping.code,
        level: 2,
        status: 'active'
      }
    })
    return category
  } catch (error) {
    console.error(`查找分类失败 [${subtype}]:`, error.message)
    return null
  }
}

/**
 * 检查回复是否已存在
 */
async function isResponseExists(categoryId, content) {
  try {
    const existingResponse = await PreResponse.findOne({
      where: {
        content: content
      },
      include: [{
        model: require('./src/models').CoreIntent,
        as: 'CoreIntent',
        where: { categoryId: categoryId },
        required: false
      }, {
        model: require('./src/models').NonCoreIntent,
        as: 'NonCoreIntent', 
        where: { categoryId: categoryId },
        required: false
      }]
    })
    return !!existingResponse
  } catch (error) {
    return false
  }
}

/**
 * 创建通用回复记录
 */
async function createPreResponse(categoryId, content, priority, metadata = {}) {
  try {
    // 检查是否已存在相同内容
    if (await isResponseExists(categoryId, content)) {
      stats.skippedRecords++
      return null
    }
    
    const response = await PreResponse.create({
      content: content,
      type: 'text',
      priority: priority,
      status: 'active',
      language: 'zh-CN',
      usageCount: 0,
      successRate: 0.0,
      version: '1.0.0',
      // 不关联具体意图，作为分类级别的通用回复
      coreIntentId: null,
      nonCoreIntentId: null,
      // 在variables字段中存储分类信息
      variables: JSON.stringify({
        categoryId: categoryId,
        source: 'csv_import',
        subtype: metadata.subtype,
        template: metadata.template,
        importDate: new Date().toISOString()
      })
    })
    
    stats.importedRecords++
    stats.uniqueResponses.add(content)
    return response
  } catch (error) {
    console.error(`创建回复失败:`, error.message)
    stats.errors++
    return null
  }
}

/**
 * 处理单条记录
 */
async function processRecord(record, index) {
  try {
    const { subtype, template, pre_response } = record
    
    // 清理数据
    const cleanedResponse = cleanResponse(pre_response)
    if (!cleanedResponse) {
      stats.skippedRecords++
      return
    }
    
    // 查找对应分类
    const category = await findCategoryBySubtype(subtype)
    if (!category) {
      console.log(`未找到分类映射: ${subtype}`)
      stats.skippedRecords++
      return
    }
    
    stats.categoriesFound.add(category.name)
    
    // 创建回复记录
    const response = await createPreResponse(
      category.id,
      cleanedResponse,
      index + 1,
      {
        subtype: subtype,
        template: template
      }
    )
    
    if (response) {
      console.log(`✓ [${category.name}] ${cleanedResponse}`)
    }
    
    stats.validRecords++
    
  } catch (error) {
    console.error(`处理记录失败 [行${index + 2}]:`, error.message)
    stats.errors++
  }
}

/**
 * 主导入函数
 */
async function importPreResponses() {
  const csvFilePath = '/Users/admin/work/zmt-server-yuliao/前置回答语料.csv'
  
  console.log('🚀 开始导入前置回答语料...')
  console.log(`📁 文件路径: ${csvFilePath}`)
  
  // 检查文件是否存在
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSV文件不存在!')
    return
  }
  
  try {
    // 初始化数据库连接
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')
    
    // 读取和处理CSV文件
    const records = []
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(iconv.decodeStream('gbk')) // 处理GBK编码
        .pipe(iconv.encodeStream('utf8'))
        .pipe(csv())
        .on('data', (data) => {
          stats.totalRecords++
          records.push(data)
        })
        .on('end', resolve)
        .on('error', reject)
    })
    
    console.log(`📊 读取到 ${stats.totalRecords} 条记录`)
    
    // 批量处理记录
    console.log('🔄 开始处理记录...')
    
    for (let i = 0; i < records.length; i++) {
      await processRecord(records[i], i)
      
      // 每100条记录显示进度
      if ((i + 1) % 100 === 0) {
        console.log(`📈 进度: ${i + 1}/${records.length} (${((i + 1) / records.length * 100).toFixed(1)}%)`)
      }
    }
    
    // 输出统计信息
    console.log('\n📊 导入统计:')
    console.log(`总记录数: ${stats.totalRecords}`)
    console.log(`有效记录数: ${stats.validRecords}`)
    console.log(`成功导入: ${stats.importedRecords}`)
    console.log(`跳过记录: ${stats.skippedRecords}`)
    console.log(`错误记录: ${stats.errors}`)
    console.log(`唯一回复数: ${stats.uniqueResponses.size}`)
    console.log(`涉及分类: ${Array.from(stats.categoriesFound).join(', ')}`)
    
    console.log('\n✅ 语料导入完成!')
    
  } catch (error) {
    console.error('❌ 导入过程出错:', error.message)
  } finally {
    await sequelize.close()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  importPreResponses().catch(console.error)
}

module.exports = { importPreResponses }