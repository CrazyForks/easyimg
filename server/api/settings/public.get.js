import db from '../../utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // 获取应用设置（公共部分，无需登录）
    const settings = await db.settings.findOne({ key: 'appSettings' })

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
        announcement: settings.value.announcement || defaultAnnouncement
      }
    }
  } catch (error) {
    console.error('[Settings] 获取公共应用设置失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取设置失败'
    })
  }
})