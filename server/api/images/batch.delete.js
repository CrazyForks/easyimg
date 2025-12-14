import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'

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

    // 获取要删除的图片 ID 列表
    const body = await readBody(event)
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请选择要删除的图片'
      })
    }

    // 批量软删除
    let deletedCount = 0
    for (const id of ids) {
      // 先查找图片是否存在且未被删除
      const image = await db.images.findOne({ _id: id })
      if (image && !image.isDeleted) {
        await db.images.update(
          { _id: id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              deletedBy: user.username
            }
          }
        )
        // 更新成功，增加计数
        deletedCount++
      }
    }

    return {
      success: true,
      message: `成功删除 ${deletedCount} 张图片`,
      data: {
        deletedCount
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Images] 批量删除图片失败:', error)
    throw createError({
      statusCode: 500,
      message: '批量删除图片失败'
    })
  }
})
