/**
 * 日期时间格式化工具函数
 */

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式 (YYYY-MM-DD HH:mm:ss)
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间
 * @param {string|Date} date - 日期
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期
 */
export function formatDate(date) {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的时间
 */
export function formatTime(date) {
  return formatDateTime(date, 'HH:mm:ss')
}

/**
 * 格式化日期时间范围
 * @param {Array} dateRange - 日期范围 [startDate, endDate]
 * @returns {string} 格式化后的日期范围
 */
export function formatDateRange(dateRange) {
  if (!dateRange || dateRange.length !== 2) return ''
  
  const start = formatDateTime(dateRange[0])
  const end = formatDateTime(dateRange[1])
  
  return `${start} 至 ${end}`
}

/**
 * 获取时间段描述
 * @param {string} period - 时间段
 * @returns {string} 时间段描述
 */
export function getPeriodDescription(period) {
  const periodMap = {
    'hour': '小时',
    'day': '天',
    'week': '周',
    'month': '月',
    'quarter': '季度',
    'year': '年'
  }
  
  return periodMap[period] || period
}

/**
 * 计算持续时间
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {string} 持续时间描述
 */
export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return ''
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return ''
  
  const diff = end.getTime() - start.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天${hours % 24}小时`
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

/**
 * 检查日期是否为今天
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否为今天
 */
export function isToday(date) {
  if (!date) return false
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * 检查日期是否为昨天
 * @param {string|Date} date - 日期
 * @returns {boolean} 是否为昨天
 */
export function isYesterday(date) {
  if (!date) return false
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

/**
 * 获取友好的日期时间显示
 * @param {string|Date} date - 日期
 * @returns {string} 友好的日期时间
 */
export function getFriendlyDateTime(date) {
  if (!date) return ''
  
  if (isToday(date)) {
    return `今天 ${formatTime(date)}`
  } else if (isYesterday(date)) {
    return `昨天 ${formatTime(date)}`
  } else {
    return formatDateTime(date)
  }
}

/**
 * 解析时间范围
 * @param {string} range - 时间范围字符串 (如: '1h', '24h', '7d', '30d')
 * @returns {Array} [startDate, endDate]
 */
export function parseTimeRange(range) {
  const now = new Date()
  let startDate = new Date(now)
  
  switch (range) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1)
      break
    case '6h':
      startDate.setHours(startDate.getHours() - 6)
      break
    case '24h':
      startDate.setDate(startDate.getDate() - 1)
      break
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    default:
      startDate.setDate(startDate.getDate() - 1)
  }
  
  return [startDate, now]
}

export default {
  formatDateTime,
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateRange,
  getPeriodDescription,
  calculateDuration,
  isToday,
  isYesterday,
  getFriendlyDateTime,
  parseTimeRange
}