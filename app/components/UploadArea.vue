<template>
  <div class="upload-section flex gap-4">
    <!-- 主上传区域 -->
    <div
      class="upload-area flex-1 relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300"
      :class="[
        isDisabled
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
          : isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer',
        isUploading ? 'pointer-events-none opacity-60' : ''
      ]"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      tabindex="0"
      @keydown.enter="triggerFileInput"
    >
      <!-- 上传中遮罩 -->
      <div v-if="isUploading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-xl z-10">
        <div class="flex flex-col items-center">
          <Loading size="lg" />
          <span class="mt-3 text-gray-600 dark:text-gray-400">
            {{ uploadProgress }}
          </span>
        </div>
      </div>

      <!-- 禁用状态 -->
      <template v-if="isDisabled">
        <!-- 禁用图标 -->
        <div class="mb-4">
          <Icon name="heroicons:no-symbol" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
        </div>
        <!-- 禁用提示 -->
        <div class="space-y-2">
          <p class="text-lg font-medium text-gray-400 dark:text-gray-500">
            访客上传已禁用
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500">
            请登录后上传图片
          </p>
        </div>
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <!-- 上传图标 -->
        <div class="mb-4">
          <Icon name="heroicons:cloud-arrow-up" class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
        </div>

        <!-- 提示文字 -->
        <div class="space-y-2">
          <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
            点击、拖拽或粘贴上传图片
            <span v-if="authStore.isAuthenticated">
              <span>{{ ' ' }} 或 {{ ' ' }}</span>
              <span
                @click.stop="showUrlModal = true"
                @keydown.enter="showUrlModal = true"
                class="hover:text-primary-600 dark:hover:text-primary-500 cursor-pointer hover:underline transition-all duration-300"
                >使用URL上传</span>
            </span>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            支持 {{ allowedFormats.join(', ').toUpperCase() }} 格式，可选择多张
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            单张最大 {{ formatFileSize(maxFileSize) }}
          </p>
        </div>
      </template>

      <!-- 隐藏的文件输入（支持多选） -->
      <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- URL上传弹窗 -->
    <Modal
      :visible="showUrlModal"
      title="从URL上传图片"
      confirm-text="上传"
      @close="closeUrlModal"
      @confirm="handleUrlUpload"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            图片URL
          </label>
          <input
            ref="urlInput"
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            @keydown.enter="handleUrlUpload"
          />
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          输入图片的HTTP/HTTPS链接，系统将下载并保存到本地图库
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useImagesStore } from '~/stores/images'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const authStore = useAuthStore()
const imagesStore = useImagesStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const fileInput = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref('上传中...')

// URL上传相关
const showUrlModal = ref(false)
const imageUrl = ref('')
const urlInput = ref(null)

// 监听弹窗打开，自动聚焦输入框
watch(showUrlModal, (visible) => {
  if (visible) {
    nextTick(() => {
      urlInput.value?.focus()
    })
  }
})

// 配置
const allowedFormats = ref(['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif'])
const maxFileSize = ref(10 * 1024 * 1024) // 10MB
const publicApiEnabled = ref(true)
const defaultApiKey = ref('')

// 计算是否禁用上传（未登录且公共上传已禁用）
const isDisabled = computed(() => {
  return !authStore.isAuthenticated && !publicApiEnabled.value
})

// 计算接受的文件类型
const acceptTypes = computed(() => {
  const mimeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'avif': 'image/avif',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'apng': 'image/apng',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  }
  return allowedFormats.value.map(f => mimeMap[f] || `image/${f}`).join(',')
})

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取配置
async function fetchConfig() {
  try {
    // 先获取公共 API 配置（用于判断访客上传是否启用）
    const publicResponse = await fetch('/api/config/public')
    if (publicResponse.ok) {
      const data = await publicResponse.json()
      if (data.success) {
        allowedFormats.value = data.data.allowedFormats || ['jpg', 'jpeg', 'png', 'gif', 'webp']
        publicApiEnabled.value = data.data.enabled !== false

        // 未登录用户使用公共 API 的文件大小限制
        if (!authStore.isAuthenticated) {
          maxFileSize.value = data.data.maxFileSize || 10 * 1024 * 1024
        }
      }
    }

    // 已登录用户获取私有 API 配置
    if (authStore.isAuthenticated) {
      try {
        const privateResponse = await fetch('/api/config/private', {
          headers: authStore.authHeader
        })
        if (privateResponse.ok) {
          const data = await privateResponse.json()
          if (data.success) {
            // 使用私有 API 的文件大小限制
            maxFileSize.value = data.data.maxFileSize || 100 * 1024 * 1024
          }
        }
      } catch (error) {
        console.error('获取私有配置失败:', error)
        // 回退到公共配置的限制
        maxFileSize.value = 10 * 1024 * 1024
      }
    }
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

// 获取默认 ApiKey（登录用户）
async function fetchDefaultApiKey() {
  if (!authStore.isAuthenticated) return

  try {
    await settingsStore.fetchApiKeys()
    const keys = settingsStore.apiKeys
    if (keys && keys.length > 0) {
      const defaultKey = keys.find(k => k.isDefault) || keys[0]
      defaultApiKey.value = defaultKey.key
    }
  } catch (error) {
    console.error('获取 ApiKey 失败:', error)
  }
}

// 触发文件选择
function triggerFileInput() {
  if (!isUploading.value && !isDisabled.value) {
    fileInput.value?.click()
  }
}

// 处理文件选择（支持多文件）
function handleFileSelect(event) {
  const files = event.target.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
  // 清空 input 以便重复选择同一文件
  event.target.value = ''
}

// 处理拖拽
function handleDragOver(event) {
  isDragging.value = true
}

function handleDragLeave(event) {
  isDragging.value = false
}

function handleDrop(event) {
  isDragging.value = false
  if (isDisabled.value) return
  const files = event.dataTransfer?.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
}

// 处理粘贴
function handlePaste(event) {
  if (isDisabled.value) return
  const items = event.clipboardData?.items
  if (!items) return

  const files = []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }

  if (files.length > 0) {
    uploadFiles(files)
  }
}

// 全局粘贴监听
function globalPasteHandler(event) {
  // 如果焦点在输入框中，不处理
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  handlePaste(event)
}

// 验证单个文件
function validateFile(file) {
  // 验证文件类型
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!allowedFormats.value.includes(ext)) {
    return { valid: false, error: `${file.name}: 不支持的图片格式` }
  }

  // 验证文件大小
  if (file.size > maxFileSize.value) {
    return { valid: false, error: `${file.name}: 文件大小超过限制` }
  }

  return { valid: true }
}

// 上传单个文件
async function uploadSingleFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  // 根据登录状态选择 API
  const url = authStore.isAuthenticated ? '/api/upload/private' : '/api/upload/public'
  const headers = {}

  if (authStore.isAuthenticated && defaultApiKey.value) {
    headers['X-API-Key'] = defaultApiKey.value
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  })

  const data = await response.json()

  if (response.ok && data.success) {
    return { success: true, filename: file.name }
  } else {
    return { success: false, filename: file.name, error: data.message || '上传失败' }
  }
}

// 上传多个文件（串行上传，避免浏览器并发限制导致失败）
async function uploadFiles(files) {
  // 检查公共 API 是否启用（未登录时）
  if (!authStore.isAuthenticated && !publicApiEnabled.value) {
    toastStore.error('访客上传已禁用，请登录后上传')
    return
  }

  // 过滤出有效的图片文件
  const validFiles = []
  const errors = []

  for (const file of files) {
    const validation = validateFile(file)
    if (validation.valid) {
      validFiles.push(file)
    } else {
      errors.push(validation.error)
    }
  }

  // 显示验证错误
  if (errors.length > 0) {
    errors.forEach(err => toastStore.error(err))
  }

  if (validFiles.length === 0) {
    return
  }

  isUploading.value = true
  let successCount = 0
  let failCount = 0

  try {
    // 串行上传，每次间隔 300ms 避免给服务器造成压力
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      uploadProgress.value = `上传中 (${i + 1}/${validFiles.length})...`

      try {
        const result = await uploadSingleFile(file)
        if (result.success) {
          successCount++
        } else {
          failCount++
          toastStore.error(`${result.filename}: ${result.error}`)
        }
      } catch (error) {
        failCount++
        toastStore.error(`${file.name}: 上传失败`)
      }

      // 如果不是最后一个文件，等待 100ms 再上传下一个
      if (i < validFiles.length - 1) {
        await delay(100)
      }
    }

    // 显示最终结果
    if (successCount > 0) {
      if (failCount > 0) {
        toastStore.success(`成功上传 ${successCount} 张，失败 ${failCount} 张`)
      } else {
        toastStore.success(`成功上传 ${successCount} 张图片`)
      }
      // 刷新图片列表
      await imagesStore.fetchImages(true)
    }
  } catch (error) {
    console.error('上传失败:', error)
    toastStore.error('上传失败，请稍后重试')
  } finally {
    isUploading.value = false
    uploadProgress.value = '上传中...'
  }
}

// 关闭URL上传弹窗
function closeUrlModal() {
  showUrlModal.value = false
  imageUrl.value = ''
}

// 处理URL上传
async function handleUrlUpload() {
  const url = imageUrl.value.trim()

  if (!url) {
    toastStore.error('请输入图片URL')
    return
  }

  // 简单验证URL格式
  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      toastStore.error('仅支持HTTP/HTTPS链接')
      return
    }
  } catch (e) {
    toastStore.error('无效的URL格式')
    return
  }

  closeUrlModal()
  isUploading.value = true

  try {
    const response = await fetch('/api/upload/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.authHeader
      },
      body: JSON.stringify({ url })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toastStore.success('图片上传成功')
      // 刷新图片列表
      await imagesStore.fetchImages(true)
    } else {
      toastStore.error(data.message || '上传失败')
    }
  } catch (error) {
    console.error('URL上传失败:', error)
    toastStore.error('上传失败，请稍后重试')
  } finally {
    isUploading.value = false
  }
}

onMounted(async () => {
  await fetchConfig()
  await fetchDefaultApiKey()
  document.addEventListener('paste', globalPasteHandler)
})

onUnmounted(() => {
  document.removeEventListener('paste', globalPasteHandler)
})
</script>

<style scoped>
.upload-area:focus {
  outline: none;
  @apply ring-2 ring-primary-500 ring-offset-2;
}
</style>
