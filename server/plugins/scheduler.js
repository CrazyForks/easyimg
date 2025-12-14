import db from '../utils/db.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { startProcessor as startModerationProcessor } from '../utils/moderationQueue.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uploadsDir = join(__dirname, '../../uploads')

// 硬删除已软删除的图片文件
export async function hardDeleteImages() {
  try {
    const deletedImages = await db.images.find({ isDeleted: true })

    if (deletedImages.length === 0) {
      return { success: true, count: 0, message: '没有需要硬删除的图片' }
    }

    let deletedCount = 0
    for (const image of deletedImages) {
      try {
        // 删除物理文件
        const filePath = join(uploadsDir, image.filename)
        if (existsSync(filePath)) {
          await unlink(filePath)
        }

        // 从数据库中彻底删除记录
        await db.images.remove({ _id: image._id })
        deletedCount++
      } catch (err) {
        console.error(`[Scheduler] 硬删除图片失败 ${image.uuid}:`, err)
      }
    }

    console.log(`[Scheduler] 已硬删除 ${deletedCount} 张图片`)
    return { success: true, count: deletedCount, message: `已硬删除 ${deletedCount} 张图片` }
  } catch (error) {
    console.error('[Scheduler] 硬删除图片时出错:', error)
    return { success: false, count: 0, message: error.message }
  }
}

export default defineNitroPlugin(() => {
  // 启动内容审核任务处理器
  startModerationProcessor()
  console.log('[Scheduler] 内容审核任务处理器已启动')
})
