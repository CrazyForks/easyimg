import { verifyToken, extractToken } from '../../utils/jwt.js'
import { addToBlacklist } from '../../utils/ipBlacklist.js'

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

    // 获取请求体
    const body = await readBody(event)
    const { ip, reason } = body

    if (!ip) {
      throw createError({
        statusCode: 400,
        message: '请输入 IP 地址'
      })
    }

    // 简单的 IP 格式验证
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:([0-9a-fA-F]{1,4}:){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/

    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      throw createError({
        statusCode: 400,
        message: 'IP 地址格式不正确'
      })
    }

    // 添加到黑名单
    const result = await addToBlacklist(ip, reason || '手动添加')

    if (!result.success) {
      throw createError({
        statusCode: 400,
        message: result.error
      })
    }

    return {
      success: true,
      message: `IP ${ip} 已添加到黑名单`,
      data: result.record
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Blacklist] 添加黑名单失败:', error)
    throw createError({
      statusCode: 500,
      message: '添加黑名单失败'
    })
  }
})