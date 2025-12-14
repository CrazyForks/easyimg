import { verifyToken, extractToken } from '../utils/jwt.js'

// 认证中间件 - 验证用户是否登录
export async function authMiddleware(event) {
  const token = extractToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未登录，请先登录'
    })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    throw createError({
      statusCode: 401,
      message: 'Token 无效或已过期'
    })
  }

  // 将用户信息附加到 event.context
  event.context.user = decoded
  return decoded
}

// 可选认证中间件 - 不强制要求登录，但如果有 token 则验证
export async function optionalAuthMiddleware(event) {
  const token = extractToken(event)

  if (!token) {
    event.context.user = null
    return null
  }

  const decoded = await verifyToken(token)
  event.context.user = decoded || null
  return decoded
}

// 包装为 eventHandler 的认证中间件
export const authHandler = defineEventHandler(async (event) => {
  return authMiddleware(event)
})

// 包装为 eventHandler 的可选认证中间件
export const optionalAuthHandler = defineEventHandler(async (event) => {
  return optionalAuthMiddleware(event)
})

export default authMiddleware
