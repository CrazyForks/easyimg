import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    // 读取本地 package.json 获取当前版本
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const currentVersion = packageJson.version || '1.0.0'

    // 从 GitHub 获取最新版本
    let latestVersion = null
    let hasUpdate = false
    let error = null

    try {
      const response = await fetch(
        'https://cf.111443.xyz/https://raw.githubusercontent.com/chaos-zhu/easyimg/main/package.json',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EasyImg-Version-Check'
          }
        }
      )

      if (response.ok) {
        const remotePackage = await response.json()
        latestVersion = remotePackage.version

        // 比较版本号
        if (latestVersion) {
          hasUpdate = compareVersions(latestVersion, currentVersion) > 0
        }
      } else {
        error = `GitHub 请求失败: ${response.status}`
      }
    } catch (fetchError) {
      error = `无法连接到 GitHub: ${fetchError.message}`
    }

    return {
      success: true,
      data: {
        currentVersion,
        latestVersion,
        hasUpdate,
        error
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
})

/**
 * 比较两个语义化版本号
 * @param {string} v1 - 版本号1
 * @param {string} v2 - 版本号2
 * @returns {number} - 1: v1 > v2, -1: v1 < v2, 0: v1 = v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number)
  const parts2 = v2.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}