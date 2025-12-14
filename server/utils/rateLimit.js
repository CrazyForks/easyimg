import db from '../utils/db.js'

// 存储请求计数的 Map
const requestCounts = new Map()
// 存储正在上传的 IP/ApiKey
const uploadingClients = new Map()

// 清理过期的计数记录（每分钟清理一次）
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.startTime > 60000) {
      requestCounts.delete(key)
    }
  }
}, 60000)

/**
 * 频率限制中间件
 * @param {string} type - 'public' 或 'private'
 * @param {string} identifier - IP 地址或 ApiKey
 */
export async function checkRateLimit(type, identifier) {
  const configKey = type === 'public' ? 'publicApiConfig' : 'privateApiConfig'
  const config = await db.settings.findOne({ key: configKey })

  if (!config) {
    return { allowed: true }
  }

  const rateLimit = config.value.rateLimit
  const key = `${type}:${identifier}`
  const now = Date.now()

  let record = requestCounts.get(key)

  if (!record || now - record.startTime > 60000) {
    // 新的一分钟周期
    record = { count: 1, startTime: now }
    requestCounts.set(key, record)
    return { allowed: true, remaining: rateLimit - 1 }
  }

  if (record.count >= rateLimit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.startTime + 60000 - now) / 1000)
    }
  }

  record.count++
  return { allowed: true, remaining: rateLimit - record.count }
}

/**
 * 并发限制中间件
 * @param {string} type - 'public' 或 'private'
 * @param {string} identifier - IP 地址或 ApiKey
 */
export async function checkConcurrency(type, identifier) {
  const configKey = type === 'public' ? 'publicApiConfig' : 'privateApiConfig'
  const config = await db.settings.findOne({ key: configKey })

  if (!config) {
    return { allowed: true }
  }

  const key = `${type}:${identifier}`

  if (type === 'public') {
    // 公共 API 不允许并发
    if (!config.value.allowConcurrent) {
      if (uploadingClients.has(key)) {
        return { allowed: false, message: '请等待上一张图片上传完成' }
      }
    }
  } else {
    // 私有 API 限制并发数
    const maxConcurrent = config.value.maxConcurrent || 5
    const currentCount = uploadingClients.get(key) || 0

    if (currentCount >= maxConcurrent) {
      return { allowed: false, message: `并发上传数已达上限 (${maxConcurrent})` }
    }
  }

  return { allowed: true }
}

/**
 * 标记开始上传
 */
export function markUploadStart(type, identifier) {
  const key = `${type}:${identifier}`
  const current = uploadingClients.get(key) || 0
  uploadingClients.set(key, current + 1)
}

/**
 * 标记上传结束
 */
export function markUploadEnd(type, identifier) {
  const key = `${type}:${identifier}`
  const current = uploadingClients.get(key) || 0
  if (current <= 1) {
    uploadingClients.delete(key)
  } else {
    uploadingClients.set(key, current - 1)
  }
}

/**
 * 公共 API 频率限制检查
 */
export function checkPublicRateLimit(ip, rateLimit = 10) {
  const key = `public:${ip}`
  const now = Date.now()

  let record = requestCounts.get(key)

  if (!record || now - record.startTime > 60000) {
    record = { count: 1, startTime: now }
    requestCounts.set(key, record)
    return { allowed: true, remaining: rateLimit - 1 }
  }

  if (record.count >= rateLimit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.startTime + 60000 - now) / 1000)
    }
  }

  record.count++
  return { allowed: true, remaining: rateLimit - record.count }
}

/**
 * 私有 API 频率限制检查
 */
export function checkPrivateRateLimit(apiKey, rateLimit = 100) {
  const key = `private:${apiKey}`
  const now = Date.now()

  let record = requestCounts.get(key)

  if (!record || now - record.startTime > 60000) {
    record = { count: 1, startTime: now }
    requestCounts.set(key, record)
    return { allowed: true, remaining: rateLimit - 1 }
  }

  if (record.count >= rateLimit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.startTime + 60000 - now) / 1000)
    }
  }

  record.count++
  return { allowed: true, remaining: rateLimit - record.count }
}

/**
 * 公共 API 并发检查
 */
export function checkPublicConcurrency(ip) {
  const key = `public:${ip}`
  if (uploadingClients.has(key) && uploadingClients.get(key) > 0) {
    return { allowed: false }
  }
  return { allowed: true }
}

/**
 * 释放公共 API 并发锁
 */
export function releasePublicConcurrency(ip) {
  const key = `public:${ip}`
  uploadingClients.delete(key)
}

/**
 * 获取并标记公共并发
 */
export function acquirePublicConcurrency(ip) {
  const key = `public:${ip}`
  uploadingClients.set(key, 1)
}

/**
 * 私有 API 并发检查
 */
export function checkPrivateConcurrency(ip, maxConcurrent = 5) {
  const key = `private:${ip}`
  const current = uploadingClients.get(key) || 0
  if (current >= maxConcurrent) {
    return { allowed: false, current }
  }
  return { allowed: true, current }
}

/**
 * 获取私有 API 并发锁
 */
export function acquirePrivateConcurrency(ip) {
  const key = `private:${ip}`
  const current = uploadingClients.get(key) || 0
  uploadingClients.set(key, current + 1)
}

/**
 * 释放私有 API 并发锁
 */
export function releasePrivateConcurrency(ip) {
  const key = `private:${ip}`
  const current = uploadingClients.get(key) || 0
  if (current <= 1) {
    uploadingClients.delete(key)
  } else {
    uploadingClients.set(key, current - 1)
  }
}

export default {
  checkRateLimit,
  checkConcurrency,
  markUploadStart,
  markUploadEnd,
  checkPublicRateLimit,
  checkPrivateRateLimit,
  checkPublicConcurrency,
  releasePublicConcurrency,
  acquirePublicConcurrency,
  checkPrivateConcurrency,
  acquirePrivateConcurrency,
  releasePrivateConcurrency
}
