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

    // 获取应用设置
    const settings = await db.settings.findOne({ key: 'appSettings' })

    // 获取已删除图片数量
    const deletedCount = await db.images.count({ isDeleted: true })

    // 默认公告配置
    const defaultAnnouncement = {
      enabled: false,
      content: '',
      displayType: 'modal'  // 'modal' | 'banner'
    }

    if (!settings) {
      return {
        success: true,
        data: {
          appName: 'easyimg',
          appLogo: '',
          backgroundUrl: '',
          backgroundBlur: 0,
          siteUrl: '',
          deletedImagesCount: deletedCount,
          announcement: defaultAnnouncement
        }
      }
    }

    return {
      success: true,
      data: {
        appName: settings.value.appName || 'easyimg',
        appLogo: settings.value.appLogo || '',
        backgroundUrl: settings.value.backgroundUrl || '',
        backgroundBlur: settings.value.backgroundBlur || 0,
        siteUrl: settings.value.siteUrl || '',
        deletedImagesCount: deletedCount,
        announcement: settings.value.announcement || defaultAnnouncement
      }
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Settings] 获取应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取设置失败'
    })
  }
})
