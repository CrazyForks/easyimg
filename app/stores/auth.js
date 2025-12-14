import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isAuthenticated: false
  }),

  actions: {
    // 初始化（从 localStorage 恢复）
    init() {
      if (import.meta.client) {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        if (token && user) {
          this.token = token
          this.user = JSON.parse(user)
          this.isAuthenticated = true
        }
      }
    },

    // 登录
    async login(username, password) {
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { username, password }
        })

        if (response.success) {
          this.token = response.data.token
          this.user = response.data.user
          this.isAuthenticated = true

          // 保存到 localStorage
          if (import.meta.client) {
            localStorage.setItem('token', this.token)
            localStorage.setItem('user', JSON.stringify(this.user))
          }

          return { success: true }
        }

        return { success: false, message: response.message || '登录失败' }
      } catch (error) {
        return { success: false, message: error.data?.message || '登录失败，请稍后重试' }
      }
    },

    // 登出
    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false

      if (import.meta.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    },

    // 验证 Token
    async verify() {
      if (!this.token) {
        return false
      }

      try {
        const response = await $fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (response.success && response.authenticated) {
          this.user = response.data.user
          return true
        }

        // Token 无效，清除
        this.logout()
        return false
      } catch (error) {
        this.logout()
        return false
      }
    },

    // 更新用户名
    updateUsername(username, newToken) {
      this.user = { ...this.user, username }
      if (newToken) {
        this.token = newToken
      }

      if (import.meta.client) {
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    }
  },

  getters: {
    authHeader: (state) => {
      return state.token ? { 'Authorization': `Bearer ${state.token}` } : {}
    }
  }
})
