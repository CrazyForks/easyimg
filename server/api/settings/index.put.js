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

    // 获取当前设置
    const currentSettings = await db.settings.findOne({ key: 'appSettings' })
    const currentValue = currentSettings?.value || {
      appName: 'easyimg',
      appLogo: '',
      backgroundUrl: '',
      backgroundBlur: 0,
      siteUrl: '',
      announcement: {
        enabled: false,
        content: '',
        displayType: 'modal'
      }
    }

    // 获取请求体
    const body = await readBody(event)

    // 构建更新对象 - 只更新传递的字段
    const updatedValue = { ...currentValue }

    // 更新 appName（如果传递了）
    if (body.appName !== undefined) {
      updatedValue.appName = body.appName || 'easyimg'
    }

    // 更新 appLogo（如果传递了）
    if (body.appLogo !== undefined) {
      updatedValue.appLogo = body.appLogo || ''
    }

    // 更新 backgroundUrl（如果传递了）
    if (body.backgroundUrl !== undefined) {
      updatedValue.backgroundUrl = body.backgroundUrl || ''
    }

    // 更新 backgroundBlur（如果传递了）
    if (body.backgroundBlur !== undefined) {
      let blurValue = parseInt(body.backgroundBlur) || 0
      if (blurValue < 0) blurValue = 0
      if (blurValue > 20) blurValue = 20
      updatedValue.backgroundBlur = blurValue
    }

    // 更新 siteUrl（如果传递了）
    if (body.siteUrl !== undefined) {
      let siteUrlValue = (body.siteUrl || '').trim()
      if (siteUrlValue) {
        siteUrlValue = siteUrlValue.replace(/\/+$/, '')
      }
      updatedValue.siteUrl = siteUrlValue
    }

    // 更新 announcement（如果传递了）
    if (body.announcement !== undefined) {
      if (body.announcement === null) {
        // 如果传递 null，重置为默认值
        updatedValue.announcement = {
          enabled: false,
          content: '',
          displayType: 'modal'
        }
      } else {
        // 部分更新公告配置
        updatedValue.announcement = {
          enabled: body.announcement.enabled !== undefined
            ? !!body.announcement.enabled
            : (currentValue.announcement?.enabled || false),
          content: body.announcement.content !== undefined
            ? body.announcement.content
            : (currentValue.announcement?.content || ''),
          displayType: body.announcement.displayType !== undefined
            ? (['modal', 'banner'].includes(body.announcement.displayType) ? body.announcement.displayType : 'modal')
            : (currentValue.announcement?.displayType || 'modal')
        }
      }
    }

    // 更新设置
    await db.settings.update(
      { key: 'appSettings' },
      {
        $set: {
          value: updatedValue,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    return {
      success: true,
      message: '设置已保存',
      data: updatedValue
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 更新应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '保存设置失败'
    })
  }
})
