<template>
  <button
    ref="toggleBtn"
    @click="toggle"
    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
    :title="isDark ? '切换到亮色模式' : '切换到暗黑模式'"
  >
    <!-- 太阳图标 - 暗黑模式下显示 -->
    <Icon
      v-if="isDark"
      name="heroicons:sun-solid"
      class="w-5 h-5 text-yellow-400 flex-shrink-0"
    />

    <!-- 月亮图标 - 亮色模式下显示 -->
    <Icon
      v-else
      name="heroicons:moon-solid"
      class="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0"
    />
  </button>
</template>

<script setup>
// 直接从 DOM 读取当前主题状态，确保与实际状态同步
const isDark = ref(false)
const isInitialized = ref(false)
const toggleBtn = ref(null)

// 同步读取当前 DOM 状态
const syncFromDOM = () => {
  return document.documentElement.classList.contains('dark')
}

onMounted(() => {
  // 从 localStorage 读取主题设置
  const savedTheme = localStorage.getItem('theme')
  let shouldBeDark = false

  if (savedTheme) {
    shouldBeDark = savedTheme === 'dark'
  } else {
    // 检测系统主题
    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 直接设置 DOM，然后同步状态
  if (shouldBeDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // 同步响应式状态
  isDark.value = shouldBeDark
  isInitialized.value = true
})

// 执行主题切换
const applyThemeChange = (newDarkState) => {
  if (newDarkState) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  isDark.value = newDarkState
  localStorage.setItem('theme', newDarkState ? 'dark' : 'light')
}

const toggle = async (event) => {
  // 防止未初始化时的点击
  if (!isInitialized.value) return

  // 先从 DOM 读取当前真实状态，避免状态不同步
  const currentDarkState = syncFromDOM()
  const newDarkState = !currentDarkState

  // 检查是否支持 View Transitions API
  if (!document.startViewTransition) {
    // 不支持时直接切换
    applyThemeChange(newDarkState)
    return
  }

  // 获取点击位置（按钮中心）
  const btn = toggleBtn.value
  const rect = btn.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  // 计算扩散半径（从点击位置到最远角落的距离）
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // 设置 CSS 变量用于动画
  document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`)
  document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`)
  document.documentElement.style.setProperty('--theme-toggle-radius', `${endRadius}px`)

  // 使用 View Transitions API 进行过渡
  const transition = document.startViewTransition(() => {
    applyThemeChange(newDarkState)
  })

  // 等待过渡完成
  await transition.ready

  // 圆形扩散动画 - 始终对新视图应用
  const clipPathStart = `circle(0px at ${x}px ${y}px)`
  const clipPathEnd = `circle(${endRadius}px at ${x}px ${y}px)`

  document.documentElement.animate(
    {
      clipPath: [clipPathStart, clipPathEnd]
    },
    {
      duration: 500,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)'
    }
  )
}
</script>
