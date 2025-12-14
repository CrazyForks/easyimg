<template>
  <!-- 弹窗形式 -->
  <Teleport to="body">
    <Transition name="announcement-modal">
      <div
        v-if="visible && displayType === 'modal'"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="close"
      >
        <div
          class="card w-full max-w-lg p-6 shadow-2xl"
          @click.stop
        >
          <!-- 标题 -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="heroicons:megaphone" class="w-5 h-5 text-primary-500" />
              公告
            </h3>
            <button
              @click="close"
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="mb-6 prose prose-sm dark:prose-invert max-w-none">
            <div v-html="content"></div>
          </div>

          <!-- 按钮 -->
          <div class="flex justify-end gap-3">
            <button
              @click="dismissForDay"
              class="btn-secondary"
            >
              不再提示
            </button>
            <button
              @click="close"
              class="btn-primary"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 顶部横幅形式（在首页上传区域上方显示） -->
  <Transition name="announcement-banner">
    <div
      v-if="visible && displayType === 'banner'"
      class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-lg mb-4"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <Icon name="heroicons:megaphone" class="w-5 h-5 flex-shrink-0" />
          <div class="prose prose-sm prose-invert max-w-none flex-1 min-w-0 truncate-content" v-html="content"></div>
        </div>
        <button
          @click="close"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
          title="关闭公告"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

// localStorage key for dismissal
const DISMISS_KEY = 'announcement_dismissed_until'

// 是否显示公告
const visible = ref(false)

// 公告配置
const announcement = computed(() => settingsStore.appSettings.announcement || {})
const enabled = computed(() => announcement.value.enabled || false)
const content = computed(() => announcement.value.content || '')
const displayType = computed(() => announcement.value.displayType || 'modal')

// 检查是否在"不再提示"有效期内
function isDismissed() {
  if (typeof window === 'undefined') return false

  const dismissedUntil = localStorage.getItem(DISMISS_KEY)
  if (!dismissedUntil) return false

  const dismissedTime = parseInt(dismissedUntil, 10)
  return Date.now() < dismissedTime
}

// 关闭公告（仅本次）
function close() {
  visible.value = false
}

// 不再提示（有效期1天）
function dismissForDay() {
  if (typeof window !== 'undefined') {
    // 设置24小时后过期
    const expireTime = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, expireTime.toString())
  }
  visible.value = false
}

// 检查并显示公告
function checkAndShowAnnouncement() {
  if (enabled.value && content.value && !isDismissed()) {
    visible.value = true
  }
}

// 监听公告配置变化
watch(
  () => settingsStore.appSettings.announcement,
  (newAnnouncement) => {
    if (newAnnouncement?.enabled && newAnnouncement?.content && !isDismissed()) {
      visible.value = true
    }
  },
  { immediate: true }
)

// 初始化时检查是否需要显示公告
onMounted(() => {
  checkAndShowAnnouncement()
})
</script>

<style scoped>
/* 弹窗动画 */
.announcement-modal-enter-active,
.announcement-modal-leave-active {
  transition: opacity 0.3s ease;
}

.announcement-modal-enter-active .card,
.announcement-modal-leave-active .card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.announcement-modal-enter-from,
.announcement-modal-leave-to {
  opacity: 0;
}

.announcement-modal-enter-from .card,
.announcement-modal-leave-to .card {
  transform: scale(0.95);
  opacity: 0;
}

/* 横幅动画 */
.announcement-banner-enter-active,
.announcement-banner-leave-active {
  transition: all 0.3s ease;
}

.announcement-banner-enter-from,
.announcement-banner-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 横幅内容截断 */
.truncate-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate-content :deep(p) {
  margin: 0;
  display: inline;
}

.truncate-content :deep(br) {
  display: none;
}
</style>