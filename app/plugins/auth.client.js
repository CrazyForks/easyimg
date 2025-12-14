// 客户端插件：在应用启动时初始化认证状态
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // 从 localStorage 恢复认证状态
  authStore.init()
})