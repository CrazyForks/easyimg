<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">数据统计</h1>

    <div class="space-y-6">
      <!-- 数据管理 -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">数据管理</h2>

        <div class="space-y-4">
          <!-- 回收站 -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">回收站</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                删除的图片进入回收站，但仍占用存储空间，清空后可释放空间
              </p>
              <p class="text-sm text-orange-600 dark:text-orange-400 mt-1">
                <span class="mr-6">总量：{{ stats.deletedImagesCount }}</span>
                占用空间：{{ formatFileSize(stats.deletedSize) }}
              </p>
            </div>
            <div class="flex items-center gap-4">
              <button
                @click="showHardDeleteModal = true"
                class="btn-danger"
                :disabled="stats.deletedImagesCount === 0"
              >
                清空回收站
              </button>
            </div>
          </div>

          <!-- 存储统计 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-900 dark:text-white">存储统计</h3>
              <button
                @click="refreshStats"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                :disabled="loadingStats"
              >
                <Icon v-if="loadingStats" name="heroicons:arrow-path" class="animate-spin h-4 w-4" />
                {{ loadingStats ? '刷新中...' : '刷新统计' }}
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">活跃图片</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.totalImages }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">公共上传</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.publicImages }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">私有上传</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stats.privateImages }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">活跃空间</p>
                <p class="text-xl font-semibold text-green-600 dark:text-green-400">{{ formatFileSize(stats.activeSize) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">回收站</p>
                <p class="text-xl font-semibold text-orange-600 dark:text-orange-400">{{ formatFileSize(stats.deletedSize) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">总占用</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ formatFileSize(stats.totalSize) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容安全 -->
      <div class="card p-6">
        <div class="flex items-center gap-2 mb-4">
          <Icon name="heroicons:shield-exclamation" class="w-6 h-6 text-orange-500" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">内容安全</h2>
        </div>

        <!-- 统计数据 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
          <div class="flex items-start justify-between">
            <div class="grid grid-cols-3 gap-4 flex-1">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">检测图片总数</p>
                <p class="text-xl font-semibold text-blue-600 dark:text-blue-400">{{ stats.moderatedImagesCount || 0 }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">违规图片总数</p>
                <p class="text-xl font-semibold text-red-600 dark:text-red-400">{{ stats.nsfwImagesCount || 0 }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">违规率</p>
                <p class="text-xl font-semibold" :class="stats.nsfwRate > 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
                  {{ stats.nsfwRate || 0 }}%
                </p>
              </div>
            </div>
            <button
              @click="showClearNsfwModal = true"
              class="btn-danger ml-4"
              :disabled="stats.nsfwImagesCount === 0"
            >
              清空违规
            </button>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
            违规图片会被自动软删除，可在下方列表中查看和管理
          </p>
        </div>

        <!-- 违规图片列表 -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-medium text-gray-900 dark:text-white">违规图片列表</h3>
            <button
              @click="fetchNsfwImages"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              :disabled="loadingNsfwImages"
            >
              <Icon v-if="loadingNsfwImages" name="heroicons:arrow-path" class="animate-spin h-4 w-4" />
              {{ loadingNsfwImages ? '加载中...' : '刷新列表' }}
            </button>
          </div>

          <!-- 列表内容 -->
          <div class="max-h-96 overflow-y-auto">
            <div v-if="loadingNsfwImages && nsfwImages.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
              <Icon name="heroicons:arrow-path" class="animate-spin h-8 w-8 mx-auto mb-2" />
              <p>加载中...</p>
            </div>
            <div v-else-if="nsfwImages.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
              <Icon name="heroicons:check-circle" class="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>暂无违规图片</p>
            </div>
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="image in nsfwImages"
                :key="image.id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <button
                      @click="previewNsfwImage(image)"
                      class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block text-left"
                      :title="image.originalName"
                    >
                      {{ image.originalName }}
                    </button>
                    <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{{ formatFileSize(image.size) }}</span>
                      <span>{{ image.width }}x{{ image.height }}</span>
                      <span>{{ formatDate(image.uploadedAt) }}</span>
                      <span v-if="image.moderationScore" class="text-red-500">
                        风险分数: {{ (image.moderationScore * 100).toFixed(1) }}%
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <span
                      v-if="image.isDeleted"
                      class="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    >
                      已删除
                    </span>
                    <span
                      v-else
                      class="px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                    >
                      违规
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="nsfwPagination.totalPages > 1" class="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              共 {{ nsfwPagination.total }} 张违规图片
            </p>
            <div class="flex items-center gap-2">
              <button
                @click="loadNsfwPage(nsfwPagination.page - 1)"
                :disabled="nsfwPagination.page <= 1"
                class="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                上一页
              </button>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ nsfwPagination.page }} / {{ nsfwPagination.totalPages }}
              </span>
              <button
                @click="loadNsfwPage(nsfwPagination.page + 1)"
                :disabled="nsfwPagination.page >= nsfwPagination.totalPages"
                class="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 清空回收站确认弹窗 -->
    <Modal
      :visible="showHardDeleteModal"
      title="清空回收站"
      confirm-text="确认清空"
      confirm-type="danger"
      @close="showHardDeleteModal = false"
      @confirm="hardDeleteImages"
    >
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-gray-400">
          确定要清空回收站吗？
        </p>
        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">
            <strong>警告：</strong>此操作将永久删除回收站中的 {{ stats.deletedImagesCount }} 张图片（{{ formatFileSize(stats.deletedSize) }}），无法恢复！
          </p>
        </div>
      </div>
    </Modal>

    <!-- 违规图片预览弹窗 -->
    <Modal
      :visible="showNsfwPreviewModal"
      :title="previewingImage?.originalName || '图片预览'"
      :show-confirm="false"
      :show-cancel="false"
      @close="showNsfwPreviewModal = false"
    >
      <div class="space-y-4">
        <!-- 警告提示 -->
        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5" />
            <span>此图片被标记为违规内容</span>
          </p>
        </div>

        <!-- 图片预览 -->
        <div class="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <img
            v-if="previewingImage"
            :src="previewingImage.url"
            :alt="previewingImage.originalName"
            class="max-w-full max-h-96 mx-auto object-contain"
            @error="handlePreviewError"
          />
        </div>

        <!-- 图片信息 -->
        <div v-if="previewingImage" class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>文件名：</strong>{{ previewingImage.originalName }}</p>
          <p><strong>尺寸：</strong>{{ previewingImage.width }}x{{ previewingImage.height }}</p>
          <p><strong>大小：</strong>{{ formatFileSize(previewingImage.size) }}</p>
          <p><strong>上传时间：</strong>{{ formatDate(previewingImage.uploadedAt) }}</p>
          <p><strong>上传方式：</strong>{{ previewingImage.uploadedByType === 'public' ? '公共上传' : '私有上传' }}</p>
          <p v-if="previewingImage.moderationScore">
            <strong>风险分数：</strong>
            <span class="text-red-600 dark:text-red-400">{{ (previewingImage.moderationScore * 100).toFixed(1) }}%</span>
          </p>
          <p><strong>状态：</strong>
            <span :class="previewingImage.isDeleted ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'">
              {{ previewingImage.isDeleted ? '已软删除' : '违规标记' }}
            </span>
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="showNsfwPreviewModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
          <button
            @click="unmarkNsfwImage"
            :disabled="unmarkingNsfw"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Icon v-if="unmarkingNsfw" name="heroicons:arrow-path" class="animate-spin w-4 h-4" />
            <Icon v-else name="heroicons:check-circle" class="w-4 h-4" />
            {{ unmarkingNsfw ? '处理中...' : '标记为非违规' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- 清空违规确认弹窗 -->
    <Modal
      :visible="showClearNsfwModal"
      title="清空违规图片"
      confirm-text="确认清空"
      confirm-type="danger"
      @close="showClearNsfwModal = false"
      @confirm="clearNsfwImages"
    >
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-gray-400">
          确定要清空所有违规图片吗？
        </p>
        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">
            <strong>警告：</strong>此操作将永久删除 {{ stats.nsfwImagesCount }} 张违规图片，无法恢复！
          </p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'

// 使用认证中间件
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// 数据管理
const showHardDeleteModal = ref(false)
const loadingStats = ref(false)

// 违规图片相关
const loadingNsfwImages = ref(false)
const nsfwImages = ref([])
const nsfwPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})
const showNsfwPreviewModal = ref(false)
const previewingImage = ref(null)
const unmarkingNsfw = ref(false)
const showClearNsfwModal = ref(false)

// 统计数据
const stats = reactive({
  totalImages: 0,
  publicImages: 0,
  privateImages: 0,
  totalSize: 0,
  activeSize: 0,
  deletedSize: 0,
  deletedImagesCount: 0,
  // 内容安全统计
  moderatedImagesCount: 0,
  nsfwImagesCount: 0,
  nsfwRate: 0
})

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 清空回收站
async function hardDeleteImages() {
  try {
    const result = await settingsStore.hardDeleteImages()
    if (result.success) {
      toastStore.success(`已清空回收站，删除了 ${result.count} 张图片`)
      // 刷新统计数据
      await fetchStats(true)
      // 刷新违规图片列表
      await fetchNsfwImages()
    } else {
      toastStore.error(result.message || '删除失败')
    }
  } catch (error) {
    toastStore.error('删除失败')
  } finally {
    showHardDeleteModal.value = false
  }
}

// 获取统计数据
async function fetchStats(refresh = false) {
  loadingStats.value = true
  try {
    const response = await $fetch('/api/settings/stats', {
      params: refresh ? { refresh: 'true' } : {},
      headers: authStore.authHeader
    })

    if (response.success && response.data) {
      Object.assign(stats, response.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loadingStats.value = false
  }
}

// 刷新统计数据
async function refreshStats() {
  await fetchStats(true)
  toastStore.success('统计数据已刷新')
}

// 获取违规图片列表
async function fetchNsfwImages(page = 1) {
  loadingNsfwImages.value = true
  try {
    const response = await $fetch('/api/images/nsfw', {
      params: {
        page,
        limit: nsfwPagination.limit
      },
      headers: authStore.authHeader
    })

    if (response.success && response.data) {
      nsfwImages.value = response.data.images
      Object.assign(nsfwPagination, response.data.pagination)
    }
  } catch (error) {
    console.error('获取违规图片列表失败:', error)
    toastStore.error('获取违规图片列表失败')
  } finally {
    loadingNsfwImages.value = false
  }
}

// 加载指定页
function loadNsfwPage(page) {
  if (page < 1 || page > nsfwPagination.totalPages) return
  fetchNsfwImages(page)
}

// 预览违规图片
function previewNsfwImage(image) {
  // 为图片 URL 添加 token 参数，因为 <img> 标签无法设置 Authorization header
  const imageWithToken = {
    ...image,
    url: `${image.url}?token=${encodeURIComponent(authStore.token)}`
  }
  previewingImage.value = imageWithToken
  showNsfwPreviewModal.value = true
}

// 处理预览图片加载错误
function handlePreviewError(event) {
  console.error('图片加载失败')
  toastStore.error('图片加载失败，文件可能已被删除')
}

// 取消违规标记
async function unmarkNsfwImage() {
  if (!previewingImage.value) return

  unmarkingNsfw.value = true
  try {
    const response = await $fetch(`/api/images/${previewingImage.value.id}/unmark-nsfw`, {
      method: 'PUT',
      headers: authStore.authHeader
    })

    if (response.success) {
      toastStore.success(response.message || '已取消违规标记')
      // 关闭弹窗
      showNsfwPreviewModal.value = false
      previewingImage.value = null
      // 刷新违规图片列表
      await fetchNsfwImages(nsfwPagination.page)
      // 刷新统计数据
      await fetchStats(true)
    } else {
      toastStore.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('取消违规标记失败:', error)
    toastStore.error('取消违规标记失败')
  } finally {
    unmarkingNsfw.value = false
  }
}

// 清空违规图片
async function clearNsfwImages() {
  try {
    const response = await $fetch('/api/images/nsfw-clear', {
      method: 'POST',
      headers: authStore.authHeader
    })

    if (response.success) {
      toastStore.success(response.message || `已清空 ${response.data?.deletedCount || 0} 张违规图片`)
      // 刷新违规图片列表
      await fetchNsfwImages()
      // 刷新统计数据
      await fetchStats(true)
    } else {
      toastStore.error(response.message || '清空失败')
    }
  } catch (error) {
    console.error('清空违规图片失败:', error)
    toastStore.error('清空违规图片失败')
  } finally {
    showClearNsfwModal.value = false
  }
}

// 初始化
onMounted(async () => {
  // 获取统计数据
  await fetchStats()
  // 获取违规图片列表
  await fetchNsfwImages()
})
</script>