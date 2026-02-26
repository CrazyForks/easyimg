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

    // 获取请求体
    const body = await readBody(event)

    // 验证配置项
    const {
      maxFileSize,
      enableCompression,
      compressionQuality,
      convertToWebp,
      convertToPng,
      convertToJpg,
      showOnHomepage
    } = body

    // 构建更新对象（格式转换三选一：webp > jpg > png 优先级）
    const finalConvertToWebp = convertToWebp || false
    const finalConvertToJpg = finalConvertToWebp ? false : (convertToJpg || false)
    const finalConvertToPng = (finalConvertToWebp || finalConvertToJpg) ? false : (convertToPng || false)

    const configValue = {
      maxFileSize: maxFileSize || 100 * 1024 * 1024,
      enableCompression: enableCompression || false,
      compressionQuality: compressionQuality || 80,
      convertToWebp: finalConvertToWebp,
      convertToPng: finalConvertToPng,
      convertToJpg: finalConvertToJpg,
      showOnHomepage: showOnHomepage === true
    }

    // 更新配置
    await db.settings.update(
      { key: 'privateApiConfig' },
      {
        $set: {
          value: configValue,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    return {
      success: true,
      message: '配置已保存',
      data: configValue
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Config] 更新私有 API 配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '保存配置失败'
    })
  }
})
