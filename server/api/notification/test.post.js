import { verifyToken, extractToken } from '../../utils/jwt.js'
import { testWebhook, testTelegram, testEmail, testServerChan } from '../../utils/notification.js'

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

    // 获取请求体中的配置
    const body = await readBody(event)
    const { webhook, telegram, email, serverchan, method } = body

    // 根据通知方式测试
    if (method === 'serverchan') {
      // 测试 Server酱
      if (!serverchan?.sendKey) {
        throw createError({
          statusCode: 400,
          message: '请提供 Server酱 SendKey'
        })
      }

      const result = await testServerChan({
        sendKey: serverchan.sendKey
      })

      if (!result.success) {
        return {
          success: false,
          message: result.error || '测试失败'
        }
      }

      return {
        success: true,
        message: '测试通知发送成功'
      }
    } else if (method === 'email') {
      // 测试 Email
      if (!email?.service || !email?.user || !email?.pass) {
        throw createError({
          statusCode: 400,
          message: '请提供完整的邮件配置（service、user、pass）'
        })
      }

      const result = await testEmail({
        service: email.service,
        user: email.user,
        pass: email.pass,
        to: email.to || ''
      })

      if (!result.success) {
        return {
          success: false,
          message: result.error || '测试失败'
        }
      }

      return {
        success: true,
        message: '测试通知发送成功'
      }
    } else if (method === 'telegram') {
      // 测试 Telegram
      if (!telegram?.token || !telegram?.chatId) {
        throw createError({
          statusCode: 400,
          message: '请提供 Telegram Token 和 Chat ID'
        })
      }

      const result = await testTelegram({
        token: telegram.token,
        chatId: telegram.chatId
      })

      if (!result.success) {
        return {
          success: false,
          message: result.error || '测试失败'
        }
      }

      return {
        success: true,
        message: '测试通知发送成功'
      }
    } else {
      // 默认测试 Webhook
      if (!webhook?.url) {
        throw createError({
          statusCode: 400,
          message: '请提供 Webhook URL'
        })
      }

      const result = await testWebhook({
        url: webhook.url,
        method: webhook.method || 'POST',
        contentType: webhook.contentType || 'application/json',
        headers: webhook.headers || {},
        bodyTemplate: webhook.bodyTemplate || JSON.stringify({
          type: '{{type}}',
          title: '{{title}}',
          message: '{{message}}',
          timestamp: '{{timestamp}}',
          data: '{{data}}'
        }, null, 2)
      })

      if (!result.success) {
        return {
          success: false,
          message: result.error || '测试失败'
        }
      }

      return {
        success: true,
        message: '测试通知发送成功'
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Notification] 测试通知失败:', error)
    throw createError({
      statusCode: 500,
      message: '测试失败: ' + error.message
    })
  }
})