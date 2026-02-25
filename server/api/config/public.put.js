import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'
import { validateProviderConfig, getDefaultContentSafetyConfig } from '../../utils/moderation.js'

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
      enabled,
      allowedFormats,
      maxFileSize,
      enableCompression,
      compressionQuality,
      convertToWebp,
      convertToPng,
      rateLimit,
      allowConcurrent,
      contentSafety
    } = body

    // 构建内容安全配置（使用统一的默认配置）
    let contentSafetyConfig = getDefaultContentSafetyConfig()

    if (contentSafety) {
      // 验证内容安全配置
      if (contentSafety.provider && contentSafety.providers?.[contentSafety.provider]) {
        const providerConfig = contentSafety.providers[contentSafety.provider]
        const validation = validateProviderConfig(contentSafety.provider, providerConfig)
        if (!validation.valid) {
          throw createError({
            statusCode: 400,
            message: validation.error
          })
        }
      }

      // 合并用户配置
      contentSafetyConfig = {
        enabled: contentSafety.enabled || false,
        provider: contentSafety.provider || contentSafetyConfig.provider,
        autoBlacklistIp: contentSafety.autoBlacklistIp || false,
        providers: contentSafety.providers || contentSafetyConfig.providers
      }
    }

    // 构建更新对象（convertToWebp 和 convertToPng 互斥）
    const finalConvertToWebp = convertToWebp || false
    const finalConvertToPng = finalConvertToWebp ? false : (convertToPng || false)

    const configValue = {
      enabled: enabled !== undefined ? enabled : true,
      allowedFormats: Array.isArray(allowedFormats) ? allowedFormats : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxFileSize: maxFileSize || 10 * 1024 * 1024,
      enableCompression: enableCompression || false,
      compressionQuality: compressionQuality || 80,
      convertToWebp: finalConvertToWebp,
      convertToPng: finalConvertToPng,
      rateLimit: rateLimit || 10,
      allowConcurrent: allowConcurrent || false,
      contentSafety: contentSafetyConfig
    }

    // 更新配置
    await db.settings.update(
      { key: 'publicApiConfig' },
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

    console.error('[Config] 更新公共 API 配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '保存配置失败'
    })
  }
})
