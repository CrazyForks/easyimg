import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'

// 统计缓存，避免频繁计算
let statsCache = null
let statsCacheTime = 0
const CACHE_TTL = 60 * 1000 // 缓存 60 秒

// 计算存储大小的函数（分批处理以减少内存压力）
async function calculateStorageStats() {
  const allImages = await db.images.find({})

  let totalSize = 0
  let deletedSize = 0

  for (const img of allImages) {
    const size = img.size || 0
    totalSize += size
    if (img.isDeleted) {
      deletedSize += size
    }
  }

  return { totalSize, deletedSize, activeSize: totalSize - deletedSize }
}

export default defineEventHandler(async (event) => {
  try {
    // 验证登录
    const token = extractToken(event)
    if (!token) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      })
    }

    const user = await verifyToken(token)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Token 无效或已过期'
      })
    }

    const now = Date.now()
    const forceRefresh = getQuery(event).refresh === 'true'

    // 检查缓存是否有效
    if (!forceRefresh && statsCache && (now - statsCacheTime) < CACHE_TTL) {
      return {
        success: true,
        data: statsCache,
        cached: true
      }
    }

    // 使用 count 查询获取各类图片数量（这些查询很快）
    const [
      totalActiveImages,
      publicImagesCount,
      privateImagesCount,
      apiKeyImagesCount,
      deletedImagesCount,
      nsfwImagesCount,
      moderatedImagesCount
    ] = await Promise.all([
      db.images.count({ isDeleted: false }),
      db.images.count({ isDeleted: false, uploadedByType: 'public' }),
      db.images.count({ isDeleted: false, uploadedByType: 'private' }),
      db.images.count({ isDeleted: false, uploadedByType: 'apikey' }),
      db.images.count({ isDeleted: true }),
      db.images.count({ isNsfw: true }),                                    // 违规图片总数
      db.images.count({ moderationChecked: true })                          // 检测图片总数
    ])

    // 计算存储大小（这个操作较慢，所以使用缓存）
    const storageStats = await calculateStorageStats()

    // 计算违规率（相对于检测图片总数）
    const nsfwRate = moderatedImagesCount > 0 ? (nsfwImagesCount / moderatedImagesCount * 100).toFixed(2) : 0

    const stats = {
      // 活跃图片统计
      totalImages: totalActiveImages,
      publicImages: publicImagesCount,
      privateImages: privateImagesCount + apiKeyImagesCount,

      // 存储空间统计
      totalSize: storageStats.totalSize,        // 总存储空间（包含软删除）
      activeSize: storageStats.activeSize,      // 活跃图片占用空间
      deletedSize: storageStats.deletedSize,    // 软删除图片占用空间

      // 软删除统计
      deletedImagesCount: deletedImagesCount,

      // 内容安全统计
      moderatedImagesCount: moderatedImagesCount, // 检测图片总数
      nsfwImagesCount: nsfwImagesCount,           // 违规图片总数
      nsfwRate: parseFloat(nsfwRate)              // 违规率（百分比）
    }

    // 更新缓存
    statsCache = stats
    statsCacheTime = now

    return {
      success: true,
      data: stats,
      cached: false
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 获取统计数据失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取统计数据失败'
    })
  }
})

// 导出清除缓存的函数，供其他模块调用（如上传、删除图片后）
export function clearStatsCache() {
  statsCache = null
  statsCacheTime = 0
}