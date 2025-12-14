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

    // 获取图片 ID
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少图片 ID'
      })
    }

    // 查找图片
    const image = await db.images.findOne({ _id: id })
    if (!image) {
      throw createError({
        statusCode: 404,
        message: '图片不存在'
      })
    }

    // 软删除
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

    return {
      success: true,
      message: '删除成功'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Images] 删除图片失败:', error)
    throw createError({
      statusCode: 500,
      message: '删除图片失败'
    })
  }
})
