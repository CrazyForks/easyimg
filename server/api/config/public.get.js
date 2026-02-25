import db from '../../utils/db.js'
import { verifyToken, extractToken } from '../../utils/jwt.js'
import { getDefaultContentSafetyConfig, MODERATION_PROVIDERS } from '../../utils/moderation.js'

export default defineEventHandler(async (event) => {
  try {
    // 检查是否登录（可选）
    const token = extractToken(event)
    let isAdmin = false

    if (token) {
      const user = await verifyToken(token)
      isAdmin = !!user
    }

    // 获取公共 API 配置
    const config = await db.settings.findOne({ key: 'publicApiConfig' })

    const defaultConfig = {
      enabled: true,
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif'],
      maxFileSize: 10 * 1024 * 1024,
      enableCompression: false,
      compressionQuality: 80,
      convertToWebp: false,
      convertToPng: false,
      rateLimit: 10,
      allowConcurrent: false,
      contentSafety: getDefaultContentSafetyConfig()
    }

    let configData = config?.value || defaultConfig

    // 确保 contentSafety 配置完整（兼容旧数据）
    if (!configData.contentSafety) {
      configData.contentSafety = getDefaultContentSafetyConfig()
    } else {
      // 确保每个 provider 的配置完整（包括默认 apiKey）
      const defaultProviders = getDefaultContentSafetyConfig().providers
      for (const [key, defaultProvider] of Object.entries(defaultProviders)) {
        if (configData.contentSafety.providers?.[key]) {
          // 如果没有 apiKey，使用默认值
          if (!configData.contentSafety.providers[key].apiKey) {
            configData.contentSafety.providers[key].apiKey = defaultProvider.apiKey
          }
          // 如果没有 name，使用默认值
          if (!configData.contentSafety.providers[key].name) {
            configData.contentSafety.providers[key].name = defaultProvider.name
          }
        }
      }
    }

    // 未登录用户只返回上传所需的基本配置
    if (!isAdmin) {
      return {
        success: true,
        data: {
          enabled: configData.enabled,
          allowedFormats: configData.allowedFormats,
          maxFileSize: configData.maxFileSize,
          allowConcurrent: configData.allowConcurrent
        }
      }
    }

    // 登录用户返回完整配置
    return {
      success: true,
      data: configData
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Config] 获取公共 API 配置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取配置失败'
    })
  }
})
