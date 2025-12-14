<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">关于</h1>

    <div class="space-y-6">
      <!-- 版本信息 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-primary-500" />
          版本信息
        </h2>

        <div class="space-y-4">
          <!-- 当前版本 -->
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-gray-700 dark:text-gray-300">当前版本:</span>
            <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
              v{{ versionInfo.currentVersion }}
            </span>

            <!-- 版本状态 -->
            <template v-if="loading">
              <span class="flex items-center gap-1 text-gray-500 text-sm">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                检测中...
              </span>
            </template>
            <template v-else-if="versionInfo.error">
              <span class="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium flex items-center gap-1">
                <Icon name="heroicons:exclamation-triangle" class="w-3 h-3" />
                检测失败
              </span>
            </template>
            <template v-else-if="versionInfo.hasUpdate">
              <span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                有新版本
              </span>
            </template>
            <template v-else-if="versionInfo.latestVersion">
              <span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                最新
              </span>
            </template>
          </div>

          <!-- 最新版本（如果有更新） -->
          <div v-if="versionInfo.hasUpdate && versionInfo.latestVersion" class="flex items-center gap-3 flex-wrap">
            <span class="text-gray-700 dark:text-gray-300">最新版本:</span>
            <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              v{{ versionInfo.latestVersion }}
            </span>
            <a
              href="https://github.com/chaos-zhu/easyimg/releases"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center gap-1"
            >
              <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
              前往更新
            </a>
          </div>

          <!-- 错误信息 -->
          <div v-if="versionInfo.error" class="text-sm text-yellow-600 dark:text-yellow-400">
            {{ versionInfo.error }}
          </div>

          <!-- 检查更新按钮 -->
          <div class="pt-2">
            <button
              @click="checkVersion"
              :disabled="loading"
              class="btn-secondary text-sm flex items-center gap-2"
            >
              <Icon name="heroicons:arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
              {{ loading ? '检测中...' : '检查更新' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 项目信息 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:link" class="w-5 h-5 text-primary-500" />
          项目信息
        </h2>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <Icon name="simple-icons:telegram" class="w-5 h-5 text-blue-500" />
            <span class="text-gray-700 dark:text-gray-300">TG频道:</span>
            <a
              href="https://t.me/easynode_notify"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              https://t.me/easynode_notify
            </a>
          </div>
          <div class="flex items-center gap-3">
            <Icon name="simple-icons:github" class="w-5 h-5 text-gray-800 dark:text-gray-200" />
            <span class="text-gray-700 dark:text-gray-300">项目地址:</span>
            <a
              href="https://github.com/chaos-zhu/easyimg"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              https://github.com/chaos-zhu/easyimg
            </a>
          </div>
        </div>
      </div>

      <!-- 作者其他项目 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="heroicons:rocket-launch" class="w-5 h-5 text-primary-500" />
          作者其他项目
        </h2>
        <div class="space-y-6">
          <!-- EasyNode -->
          <div class="border-l-4 border-primary-500 pl-4">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">EasyNode</h3>
              <a
                href="https://github.com/chaos-zhu/easynode"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Icon name="simple-icons:github" class="w-4 h-4" />
              </a>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
              一个多功能Linux&win服务器WEB终端面板(webSSH&webSFTP)
            </p>
            <a
              href="https://github.com/chaos-zhu/easynode"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              https://github.com/chaos-zhu/easynode
            </a>
          </div>

          <!-- EasyNavTab -->
          <div class="border-l-4 border-green-500 pl-4">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">EasyNavTab</h3>
              <a
                href="https://github.com/chaos-zhu/easynavtab"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Icon name="simple-icons:github" class="w-4 h-4" />
              </a>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
              开源浏览器插件，自定义新标签页
            </p>
            <a
              href="https://github.com/chaos-zhu/easynavtab"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              https://github.com/chaos-zhu/easynavtab
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// 页面元数据
definePageMeta({
  title: '关于'
})

// 版本信息
const versionInfo = reactive({
  currentVersion: '1.0.0',
  latestVersion: null,
  hasUpdate: false,
  error: null
})

const loading = ref(false)

// 检查版本更新
async function checkVersion() {
  loading.value = true
  versionInfo.error = null

  try {
    const response = await $fetch('/api/version/check')

    if (response.success) {
      versionInfo.currentVersion = response.data.currentVersion
      versionInfo.latestVersion = response.data.latestVersion
      versionInfo.hasUpdate = response.data.hasUpdate
      versionInfo.error = response.data.error
    } else {
      versionInfo.error = response.message || '检测失败'
    }
  } catch (error) {
    versionInfo.error = '网络请求失败'
  } finally {
    loading.value = false
  }
}

// 页面加载时自动检测版本
onMounted(() => {
  checkVersion()
})
</script>