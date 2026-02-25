import db from '../../utils/db.js'
import { getImageMetadata, saveUploadedFile } from '../../utils/image.js'
import { authMiddleware } from '../../utils/authMiddleware.js'
import { getRandomHeaders } from '../../utils/fetchHeaders.js'
import { processImageWithConfig } from '../../utils/upload.js'
import { v4 as uuidv4 } from 'uuid'

// 供第三方API调用
export default defineEventHandler(async (event) => {
  const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  try {
    // 检查是否使用 API Key
    const apiKey = getHeader(event, 'x-api-key') || getQuery(event).apiKey
    let uploadedBy = '管理员'
    let uploadedByType = 'url'
    let apiKeyId = null

    if (apiKey) {
      // API Key 认证
      const keyDoc = await db.apikeys.findOne({ key: apiKey, enabled: true })
      if (!keyDoc) {
        throw createError({
          statusCode: 401,
          message: 'API Key 无效或已禁用'
        })
      }
      uploadedBy = keyDoc.name || 'API用户'
      uploadedByType = 'url-api'
      apiKeyId = keyDoc._id
    } else {
      // 登录认证
      await authMiddleware(event)
      const user = event.context.user
      uploadedBy = user.username || '管理员'
    }

    // 解析请求体
    const body = await readBody(event)
    const { url, returnBase64 = false } = body

    if (!url) {
      throw createError({
        statusCode: 400,
        message: '请提供图片URL'
      })
    }

    // 判断 url 是字符串还是数组
    const isArrayUrl = Array.isArray(url)
    const urls = isArrayUrl ? url : [url]

    // 验证数组不为空
    if (urls.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请提供至少一个图片URL'
      })
    }

    // 获取私有 API 配置
    const configDoc = await db.settings.findOne({ key: 'privateApiConfig' })
    const config = configDoc?.value || {}

    // 处理所有 URL
    const results = []
    const errors = []

    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i]

      // 批量上传时，在第二次及之后的请求前延迟1秒
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      try {
        // 验证URL格式
        let imageUrl
        try {
          imageUrl = new URL(currentUrl)
          if (!['http:', 'https:'].includes(imageUrl.protocol)) {
            throw new Error('协议不支持')
          }
        } catch (e) {
          throw createError({
            statusCode: 400,
            message: '无效的URL格式'
          })
        }

        // 下载图片
        let response
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

          // 构建随机请求头
          const fetchHeaders = getRandomHeaders(imageUrl)

          response = await fetch(currentUrl, {
            signal: controller.signal,
            headers: fetchHeaders,
            redirect: 'follow' // 自动跟随重定向
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
        } catch (e) {
          if (e.name === 'AbortError') {
            throw createError({
              statusCode: 408,
              message: '下载超时，请稍后重试'
            })
          }
          throw createError({
            statusCode: 400,
            message: `无法下载图片: ${e.message}`
          })
        }

        // 检查 Content-Type
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.startsWith('image/')) {
          throw createError({
            statusCode: 400,
            message: 'URL指向的不是有效的图片'
          })
        }

        // 获取图片数据
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 检查文件大小
        const maxFileSize = config.maxFileSize || 100 * 1024 * 1024
        if (buffer.length > maxFileSize) {
          throw createError({
            statusCode: 400,
            message: `图片大小超过限制 (最大 ${Math.round(maxFileSize / 1024 / 1024)}MB)`
          })
        }

        // 从URL或Content-Type推断文件格式
        let fileExt = ''
        const urlPath = imageUrl.pathname.toLowerCase()
        const extMatch = urlPath.match(/\.([a-z0-9]+)$/i)
        if (extMatch) {
          fileExt = extMatch[1]
        } else {
          // 从 Content-Type 推断
          const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/avif': 'avif',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/x-icon': 'ico',
            'image/apng': 'apng',
            'image/tiff': 'tiff'
          }
          fileExt = mimeToExt[contentType.split(';')[0]] || 'jpg'
        }

        // 生成 UUID
        const imageUuid = uuidv4()

        // 处理图片（根据配置决定是否压缩和转换格式，只有文件大于200kb才进行压缩）
        const { processedBuffer, finalFormat, isWebp } = await processImageWithConfig(buffer, fileExt, config, 200)

        // 获取图片元数据
        const metadata = await getImageMetadata(processedBuffer)

        // 保存文件
        const filename = `${imageUuid}.${finalFormat}`
        await saveUploadedFile(processedBuffer, filename)

        // 从URL提取原始文件名
        let originalName = imageUrl.pathname.split('/').pop() || 'image'
        if (!originalName.includes('.')) {
          originalName += `.${fileExt}`
        }

        // 保存到数据库
        const imageDoc = {
          _id: uuidv4(),
          uuid: imageUuid,
          originalName: originalName,
          filename: filename,
          format: finalFormat,
          size: processedBuffer.length,
          width: metadata.width || 0,
          height: metadata.height || 0,
          isWebp: isWebp,
          isDeleted: false,
          uploadedBy: uploadedBy,
          uploadedByType: uploadedByType, // 标记为URL上传
          sourceUrl: currentUrl, // 保存原始URL
          ip: clientIP,
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // 如果是 API Key 上传，添加 apiKeyId
        if (apiKeyId) {
          imageDoc.apiKeyId = apiKeyId
        }

        await db.images.insert(imageDoc)

        // 构建返回数据
        const responseData = {
          id: imageDoc._id,
          uuid: imageUuid,
          filename: filename,
          format: finalFormat,
          size: Math.round(processedBuffer.length / 1024 * 100) / 100, // 转换为KB，保留2位小数
          width: metadata.width || 0,
          height: metadata.height || 0,
          url: `/i/${imageUuid}.${finalFormat}`,
          uploadedAt: imageDoc.uploadedAt
        }

        // 如果需要返回 base64
        if (returnBase64) {
          const base64 = processedBuffer.toString('base64')
          responseData.base64 = base64
        }

        results.push({
          success: true,
          data: responseData
        })
      } catch (error) {
        // 记录单个URL的错误
        errors.push({
          success: false,
          error: error.statusCode ? error.message : '上传失败，请稍后重试'
        })
      }
    }

    // 返回结果
    if (isArrayUrl) {
      // 数组模式：返回所有结果（成功和失败）
      return {
        success: true,
        message: `处理完成：${results.length}个成功，${errors.length}个失败`,
        data: {
          results: results,
          errors: errors,
          total: urls.length,
          successCount: results.length,
          errorCount: errors.length
        }
      }
    } else {
      // 字符串模式：保持原有行为
      if (results.length > 0) {
        return {
          success: true,
          message: '上传成功',
          data: results[0].data
        }
      } else {
        // 如果单个URL失败，抛出错误
        throw createError({
          statusCode: 400,
          message: errors[0].error
        })
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Upload] URL上传失败:', error)
    throw createError({
      statusCode: 500,
      message: '上传失败，请稍后重试'
    })
  }
})