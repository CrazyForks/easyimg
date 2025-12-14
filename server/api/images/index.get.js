import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const skip = (page - 1) * limit

    // 检查用户是否已登录
    const token = extractToken(event)
    let isAdmin = false

    if (token) {
      try {
        const user = await verifyToken(token)
        isAdmin = !!user
      } catch (e) {
        // Token 无效，视为未登录
      }
    }

    // 获取私有 API 配置，检查是否允许首页展示私有图片
    const privateConfig = await db.settings.findOne({ key: 'privateApiConfig' })
    // 默认不显示私有图片，只有明确设置为 true 时才显示
    const showPrivateOnHomepage = privateConfig?.value?.showOnHomepage === true

    // 构建查询条件
    // 如果配置允许展示私有图片，则所有人都能看到私有图片
    // 否则未登录用户只能看到公开上传的图片
    let queryCondition
    if (isAdmin) {
      // 管理员可以看到所有非违规的图片（违规图片不在首页显示）
      queryCondition = { isDeleted: false, isNsfw: { $ne: true } }
    } else if (showPrivateOnHomepage) {
      // 配置开启时展示所有非违规图片
      queryCondition = { isDeleted: false, isNsfw: { $ne: true } }
    } else {
      // 配置关闭且未登录时只展示公开的非违规图片
      queryCondition = { isDeleted: false, uploadedByType: 'public', isNsfw: { $ne: true } }
    }

    // 获取总数
    const total = await db.images.count(queryCondition)

    // 获取图片列表（按上传时间倒序）
    let images = await db.images.find(queryCondition)

    // 手动排序（按上传时间倒序）
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

    // 手动分页
    images = images.slice(skip, skip + limit)

    // 过滤敏感信息
    const safeImages = images.map(img => {
      const baseInfo = {
        id: img._id,
        uuid: img.uuid,
        filename: img.filename,
        originalName: img.originalName,
        format: img.format,
        size: img.size,
        width: img.width,
        height: img.height,
        url: `/i/${img.uuid}.${img.format}`,
        uploadedBy: img.uploadedBy,
        uploadedAt: img.uploadedAt
      }

      // 管理员可见额外信息
      if (isAdmin) {
        return {
          ...baseInfo,
          isNsfw: img.isNsfw || false,
          isDeleted: img.isDeleted || false,
          moderationStatus: img.moderationStatus,
          moderationScore: img.moderationResult?.score
        }
      }

      return baseInfo
    })

    return {
      success: true,
      data: {
        images: safeImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error) {
    console.error('[Images] 获取图片列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取图片列表失败'
    })
  }
})
