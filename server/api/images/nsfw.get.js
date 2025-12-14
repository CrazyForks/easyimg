import db from '../../utils/db.js'
import { authMiddleware } from '../../utils/authMiddleware.js'

export default defineEventHandler(async (event) => {
  // 验证登录
  await authMiddleware(event)

  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const skip = (page - 1) * limit

    // 查询条件：isNsfw 为 true 的图片（包括已软删除的）
    const queryCondition = { isNsfw: true }

    // 获取总数
    const total = await db.images.count(queryCondition)

    // 获取违规图片列表
    let images = await db.images.find(queryCondition)

    // 按上传时间倒序排序
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

    // 分页
    images = images.slice(skip, skip + limit)

    // 返回图片信息
    const nsfwImages = images.map(img => ({
      id: img._id,
      uuid: img.uuid,
      filename: img.filename,
      originalName: img.originalName,
      format: img.format,
      size: img.size,
      width: img.width,
      height: img.height,
      // 使用特殊的管理员预览路由
      url: `/api/images/preview/${img.uuid}.${img.format}`,
      uploadedBy: img.uploadedBy,
      uploadedByType: img.uploadedByType,
      uploadedAt: img.uploadedAt,
      isDeleted: img.isDeleted || false,
      isNsfw: img.isNsfw || false,
      moderationStatus: img.moderationStatus,
      moderationScore: img.moderationResult?.score,
      moderationCategories: img.moderationResult?.categories
    }))

    return {
      success: true,
      data: {
        images: nsfwImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error) {
    console.error('[Images] 获取违规图片列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取违规图片列表失败'
    })
  }
})