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

    // 获取私有 API 配置
    const config = await db.settings.findOne({ key: 'privateApiConfig' })

    if (!config) {
      // 返回默认配置
      return {
        success: true,
        data: {
          maxFileSize: 100 * 1024 * 1024,
          enableCompression: false,
          compressionQuality: 80,
          convertToWebp: false,
          showOnHomepage: false
        }
      }
    }

    return {
      success: true,
      data: config.value
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Config] 获取私有 API 配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取配置失败'
    })
  }
})
