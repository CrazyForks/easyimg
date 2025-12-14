import { verifyToken, extractToken } from '../../utils/jwt.js'
import { getBlacklist } from '../../utils/ipBlacklist.js'

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

    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20

    // 获取黑名单列表
    const result = await getBlacklist({ page, limit })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Blacklist] 获取黑名单列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取黑名单列表失败'
    })
  }
})