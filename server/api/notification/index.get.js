import { verifyToken, extractToken } from '../../utils/jwt.js'
import { getNotificationConfig } from '../../utils/notification.js'

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

    // 获取通知配置
    const config = await getNotificationConfig()

    return {
      success: true,
      data: config
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Notification] 获取通知配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取通知配置失败'
    })
  }
})