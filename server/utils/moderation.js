import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uploadsDir = join(__dirname, '../../uploads')

/**
 * 内容审核服务 - 支持多厂商API适配
 */

// 厂商默认配置（统一定义，其他地方引用）
export const MODERATION_PROVIDERS = {
  nsfwdet: {
    name: 'NSFW Detector',
    apiUrl: 'https://nsfwdet.com/api/v1/detect-nsfw',
    apiKey: 'nsfw_2f7ab4f1d743d69ee242eec932b19671',  // 厂商开放的默认 API Key
    threshold: 0.5
  },
  elysiatools: {
    name: 'Elysia Tools',
    uploadUrl: 'https://elysiatools.com/upload/nsfw-image-detector',
    apiUrl: 'https://elysiatools.com/zh/api/tools/nsfw-image-detector'
    // 不需要 API Key 和阈值配置，使用 isSafe 字段判断
  },
  'nsfw_detector': {
    name: 'nsfw_detector',
    apiUrl: '',  // 需在设置中自行配置
    apiKey: '',  // 如需认证需自行配置
    threshold: 0.8  // 违规阈值，默认80%，nsfw值超过此阈值判定为违规
  }
}

// 获取默认的内容安全配置
export function getDefaultContentSafetyConfig() {
  return {
    enabled: false,
    provider: 'elysiatools',  // 默认使用免费的 elysiatools
    autoBlacklistIp: false,  // 是否自动将违规 IP 加入黑名单
    providers: Object.fromEntries(
      Object.entries(MODERATION_PROVIDERS).map(([key, config]) => [
        key,
        { ...config }
      ])
    )
  }
}

// 厂商适配器注册表
const providerAdapters = {
  /**
   * nsfwdet.com 适配器
   * API: https://nsfwdet.com/api/v1/detect-nsfw
   * Request: multipart/form-data, image file
   * Response: { result: { normal: 0.96, nsfw: 0.04 }, code: 0 }
   */
  nsfwdet: {
    name: MODERATION_PROVIDERS.nsfwdet.name,
    defaultApiUrl: MODERATION_PROVIDERS.nsfwdet.apiUrl,
    defaultApiKey: MODERATION_PROVIDERS.nsfwdet.apiKey,
    defaultThreshold: MODERATION_PROVIDERS.nsfwdet.threshold,

    /**
     * 调用API进行检测
     * @param {Buffer} imageBuffer - 图片二进制数据
     * @param {string} filename - 文件名
     * @param {object} config - 厂商配置
     * @returns {Promise<object>} - { success, isNsfw, score, rawResult, error }
     */
    async detect(imageBuffer, filename, config) {
      try {
        const apiUrl = config.apiUrl || this.defaultApiUrl
        const apiKey = config.apiKey || this.defaultApiKey

        // 构建 FormData（使用 Node.js 原生支持的方式）
        const FormData = (await import('form-data')).default
        const formData = new FormData()
        formData.append('image', imageBuffer, {
          filename: filename,
          contentType: getMimeType(filename)
        })

        // 构建请求头
        const headers = {
          ...formData.getHeaders()
        }

        // 添加 API Key 请求头
        if (apiKey) {
          headers['X-API-Key'] = apiKey
        }

        // 使用 undici 或 node-fetch 兼容的方式发送请求
        // form-data 库需要转换为 Buffer 才能正确与 fetch 配合使用
        const formBuffer = formData.getBuffer()

        // 发送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formBuffer,
          headers: headers
        })

        if (!response.ok) {
          return {
            success: false,
            error: `API请求失败: ${response.status} ${response.statusText}`
          }
        }

        const result = await response.json()

        // 解析响应
        if (result.code !== 0) {
          return {
            success: false,
            error: `API返回错误: code=${result.code}`
          }
        }

        const nsfwScore = result.result?.nsfw || 0
        const threshold = config.threshold || this.defaultThreshold

        return {
          success: true,
          isNsfw: nsfwScore >= threshold,
          score: nsfwScore,
          threshold: threshold,
          rawResult: result
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || '检测请求失败'
        }
      }
    }
  },

  /**
   * elysiatools.com 适配器
   * 流程：1. 先上传图片到 upload 接口  2. 用返回的 filePath 调用检测接口
   * Upload: https://elysiatools.com/upload/nsfw-image-detector
   * API: https://elysiatools.com/zh/api/tools/nsfw-image-detector
   * Response: { data: { isSafe: true/false, ... } }
   */
  elysiatools: {
    name: MODERATION_PROVIDERS.elysiatools.name,
    defaultUploadUrl: MODERATION_PROVIDERS.elysiatools.uploadUrl,
    defaultApiUrl: MODERATION_PROVIDERS.elysiatools.apiUrl,

    /**
     * 调用API进行检测
     * @param {Buffer} imageBuffer - 图片二进制数据
     * @param {string} filename - 文件名
     * @param {object} config - 厂商配置
     * @returns {Promise<object>} - { success, isNsfw, score, rawResult, error }
     */
    async detect(imageBuffer, filename, config) {
      try {
        const uploadUrl = config.uploadUrl || this.defaultUploadUrl
        const apiUrl = config.apiUrl || this.defaultApiUrl
        const FormData = (await import('form-data')).default

        // 第一步：上传图片
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageBuffer, {
          filename: filename,
          contentType: getMimeType(filename)
        })

        const uploadHeaders = {
          ...uploadFormData.getHeaders()
        }
        const uploadBuffer = uploadFormData.getBuffer()

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadBuffer,
          headers: uploadHeaders
        })

        if (!uploadResponse.ok) {
          return {
            success: false,
            error: `上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`
          }
        }

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.filePath) {
          return {
            success: false,
            error: '上传响应中缺少 filePath'
          }
        }

        // 第二步：调用检测接口（使用 JSON 格式）
        const detectResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageFile: uploadResult.filePath,
            sensitivity: 0.5,
            analysisMode: 'auto'
          })
        })

        if (!detectResponse.ok) {
          return {
            success: false,
            error: `检测失败: ${detectResponse.status} ${detectResponse.statusText}`
          }
        }

        const result = await detectResponse.json()

        // 解析响应 - 使用 isSafe 字段判断
        if (!result.data) {
          return {
            success: false,
            error: 'API返回数据格式错误'
          }
        }
        const isSafe = result.data.data.isSafe === true
        const confidence = result.data.confidence || 0

        return {
          success: true,
          isNsfw: !isSafe,
          score: isSafe ? 0 : (100 - confidence) / 100,  // 转换为 0-1 的分数
          rawResult: result
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || '检测请求失败'
        }
      }
    }
  },

  /**
   * nsfw_detector 适配器（自建服务）
   * API: 需在设置中自行配置
   * Request: multipart/form-data, file 字段
   * Response: { code: 200, msg: "success", data: { sfw: 0.0014, nsfw: 0.9986, is_nsfw: true } }
   */
  'nsfw_detector': {
    name: MODERATION_PROVIDERS['nsfw_detector'].name,
    defaultApiUrl: MODERATION_PROVIDERS['nsfw_detector'].apiUrl,
    defaultApiKey: MODERATION_PROVIDERS['nsfw_detector'].apiKey,

    /**
     * 调用API进行检测
     * @param {Buffer} imageBuffer - 图片二进制数据
     * @param {string} filename - 文件名
     * @param {object} config - 厂商配置
     * @returns {Promise<object>} - { success, isNsfw, score, rawResult, error }
     */
    async detect(imageBuffer, filename, config) {
      try {
        const apiUrl = config.apiUrl || this.defaultApiUrl
        const apiKey = config.apiKey || this.defaultApiKey

        // 检查 API URL 是否已配置
        if (!apiUrl) {
          return {
            success: false,
            error: 'nsfw_detector 服务 API 地址未配置，请在设置中配置'
          }
        }

        // 构建 FormData
        const FormData = (await import('form-data')).default
        const formData = new FormData()
        formData.append('file', imageBuffer, {
          filename: filename,
          contentType: getMimeType(filename)
        })

        // 构建请求头
        const headers = {
          ...formData.getHeaders(),
          'Accept': 'application/json, text/plain, */*'
        }

        // 添加 Bearer Token 认证（如果配置了 API Key）
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }

        // 发送请求
        const formBuffer = formData.getBuffer()
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formBuffer,
          headers: headers
        })

        if (!response.ok) {
          return {
            success: false,
            error: `API请求失败: ${response.status} ${response.statusText}`
          }
        }

        const result = await response.json()

        // 解析响应
        if (result.status !== 'success') {
          return {
            success: false,
            error: `API返回错误: ${JSON.stringify(result) || 'unknown error'}`
          }
        }

        // 使用配置的阈值判断是否违规（默认80%）
        const nsfwScore = result.result?.nsfw || 0
        const threshold = config.threshold !== undefined ? config.threshold : 0.8
        const isNsfw = nsfwScore >= threshold

        return {
          success: true,
          isNsfw: isNsfw,
          score: nsfwScore,
          threshold: threshold,
          rawResult: result
        }
      } catch (error) {
        return {
          success: false,
          error: error.message || '检测请求失败'
        }
      }
    }
  }
}

/**
 * 根据文件名获取 MIME 类型
 */
function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'avif': 'image/avif',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * 执行内容审核
 * @param {string} imageId - 图片ID
 * @param {string} filename - 文件名
 * @param {object} contentSafetyConfig - 内容安全配置
 * @returns {Promise<object>} - 审核结果
 */
export async function moderateImage(imageId, filename, contentSafetyConfig) {
  if (!contentSafetyConfig?.enabled) {
    return {
      success: true,
      skipped: true,
      reason: '内容安全检测未启用'
    }
  }

  const providerKey = contentSafetyConfig.provider
  // 优先使用用户配置，如果不存在则使用默认配置
  let providerConfig = contentSafetyConfig.providers?.[providerKey]

  // 如果用户配置不存在，使用默认配置
  if (!providerConfig) {
    const defaultConfig = getDefaultContentSafetyConfig()
    providerConfig = defaultConfig.providers?.[providerKey]
  }

  if (!providerConfig) {
    return {
      success: false,
      error: `检测服务 ${providerKey} 配置不存在`
    }
  }

  const adapter = providerAdapters[providerKey]
  if (!adapter) {
    return {
      success: false,
      error: `不支持的检测服务: ${providerKey}`
    }
  }

  // 读取图片文件
  const filePath = join(uploadsDir, filename)
  if (!existsSync(filePath)) {
    return {
      success: false,
      error: '图片文件不存在'
    }
  }

  try {
    const imageBuffer = await readFile(filePath)
    const result = await adapter.detect(imageBuffer, filename, providerConfig)

    return {
      ...result,
      provider: providerKey,
      imageId: imageId
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || '读取图片文件失败'
    }
  }
}

/**
 * 获取支持的厂商列表
 */
export function getSupportedProviders() {
  return Object.entries(providerAdapters).map(([key, adapter]) => ({
    key,
    name: adapter.name,
    defaultApiUrl: adapter.defaultApiUrl,
    defaultThreshold: adapter.defaultThreshold
  }))
}

/**
 * 验证厂商配置是否有效
 */
export function validateProviderConfig(providerKey, config) {
  const adapter = providerAdapters[providerKey]
  if (!adapter) {
    return { valid: false, error: `不支持的检测服务: ${providerKey}` }
  }

  if (config.threshold !== undefined) {
    if (typeof config.threshold !== 'number' || config.threshold < 0 || config.threshold > 1) {
      return { valid: false, error: '阈值必须是 0-1 之间的数字' }
    }
  }

  return { valid: true }
}

export default {
  moderateImage,
  getSupportedProviders,
  validateProviderConfig,
  getDefaultContentSafetyConfig,
  MODERATION_PROVIDERS
}