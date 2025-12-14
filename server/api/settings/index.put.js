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
    const { appName, appLogo, backgroundUrl, backgroundBlur, siteUrl, announcement } = body

    // 验证毛玻璃效果值范围 (0-20)
    let blurValue = parseInt(backgroundBlur) || 0
    if (blurValue < 0) blurValue = 0
    if (blurValue > 20) blurValue = 20

    // 处理公告配置
    let announcementValue = {
      enabled: false,
      content: '',
      displayType: 'modal'  // 'modal' | 'banner'
    }
    if (announcement) {
      announcementValue = {
        enabled: !!announcement.enabled,
        content: announcement.content || '',
        displayType: ['modal', 'banner'].includes(announcement.displayType) ? announcement.displayType : 'modal'
      }
    }

    // 处理站点 URL（移除末尾斜杠）
    let siteUrlValue = (siteUrl || '').trim()
    if (siteUrlValue) {
      siteUrlValue = siteUrlValue.replace(/\/+$/, '')
    }

    // 构建更新对象
    const settingsValue = {
      appName: appName || 'easyimg',
      appLogo: appLogo || '',
      backgroundUrl: backgroundUrl || '',
      backgroundBlur: blurValue,
      siteUrl: siteUrlValue,
      announcement: announcementValue
    }

    // 更新设置
    await db.settings.update(
      { key: 'appSettings' },
      {
        $set: {
          value: settingsValue,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    )

    return {
      success: true,
      message: '设置已保存',
      data: settingsValue
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
