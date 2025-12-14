import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),

  actions: {
    // 添加 Toast
    add(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random()

      this.toasts.push({
        id,
        message,
        type, // 'success' | 'error' | 'warning' | 'info'
        duration
      })

      // 自动移除
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, duration)
      }

      return id
    },

    // 移除 Toast
    remove(id) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    },

    // 快捷方法
    success(message, duration = 3000) {
      return this.add(message, 'success', duration)
    },

    error(message, duration = 4000) {
      return this.add(message, 'error', duration)
    },

    warning(message, duration = 3500) {
      return this.add(message, 'warning', duration)
    },

    info(message, duration = 3000) {
      return this.add(message, 'info', duration)
    },

    // 清空所有
    clear() {
      this.toasts = []
    }
  }
})
