import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useImagesStore = defineStore('images', {
  state: () => ({
    images: [],
    loading: false,
    uploading: false,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    hasMore: true,
    selectedIds: []
  }),

  actions: {
    // 获取图片列表
    async fetchImages(reset = false) {
      if (this.loading) return

      if (reset) {
        this.pagination.page = 1
        this.images = []
        this.hasMore = true
      }

      if (!this.hasMore) return

      this.loading = true

      try {
        const authStore = useAuthStore()
        const response = await $fetch('/api/images', {
          params: {
            page: this.pagination.page,
            limit: this.pagination.limit
          },
          headers: authStore.authHeader
        })

        if (response.success) {
          if (reset) {
            this.images = response.data.images
          } else {
            this.images.push(...response.data.images)
          }

          this.pagination = response.data.pagination
          this.hasMore = this.pagination.page < this.pagination.totalPages
        }
      } catch (error) {
        console.error('获取图片列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 加载更多
    async loadMore() {
      if (!this.hasMore || this.loading) return

      this.pagination.page++
      await this.fetchImages()
    },

    // 上传图片
    async uploadImage(file) {
      const authStore = useAuthStore()

      this.uploading = true

      try {
        const formData = new FormData()
        formData.append('file', file)

        // 根据登录状态选择 API
        const endpoint = authStore.isAuthenticated ? '/api/upload/private' : '/api/upload/public'

        const headers = {}
        if (authStore.isAuthenticated) {
          // 获取默认 ApiKey
          const keysResponse = await $fetch('/api/apikeys', {
            headers: authStore.authHeader
          })

          if (keysResponse.success && keysResponse.data.length > 0) {
            const defaultKey = keysResponse.data.find(k => k.isDefault) || keysResponse.data[0]
            headers['X-API-Key'] = defaultKey.key
          }
        }

        const response = await $fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers
        })

        if (response.success) {
          // 将新图片添加到列表顶部
          this.images.unshift({
            ...response.data,
            id: response.data.id,
            uploadedBy: authStore.isAuthenticated ? authStore.user?.username : '访客'
          })
          this.pagination.total++

          return { success: true, data: response.data }
        }

        return { success: false, message: response.message || '上传失败' }
      } catch (error) {
        const message = error.data?.message || '上传失败，请稍后重试'
        return { success: false, message }
      } finally {
        this.uploading = false
      }
    },

    // 删除图片
    async deleteImage(id) {
      const authStore = useAuthStore()

      try {
        const response = await $fetch(`/api/images/${id}`, {
          method: 'DELETE',
          headers: authStore.authHeader
        })

        if (response.success) {
          // 从列表中移除
          this.images = this.images.filter(img => img.id !== id)
          this.pagination.total--
          return { success: true }
        }

        return { success: false, message: response.message || '删除失败' }
      } catch (error) {
        return { success: false, message: error.data?.message || '删除失败，请稍后重试' }
      }
    },

    // 批量删除
    async batchDelete() {
      if (this.selectedIds.length === 0) return { success: false, message: '请选择要删除的图片' }

      const authStore = useAuthStore()

      try {
        const response = await $fetch('/api/images/batch', {
          method: 'DELETE',
          body: { ids: this.selectedIds },
          headers: authStore.authHeader
        })

        if (response.success) {
          // 从列表中移除
          this.images = this.images.filter(img => !this.selectedIds.includes(img.id))
          this.pagination.total -= response.data.deletedCount
          this.selectedIds = []
          return { success: true, message: response.message }
        }

        return { success: false, message: response.message || '删除失败' }
      } catch (error) {
        return { success: false, message: error.data?.message || '批量删除失败' }
      }
    },

    // 切换选中状态
    toggleSelect(id) {
      const index = this.selectedIds.indexOf(id)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(id)
      }
    },

    // 清空选中
    clearSelection() {
      this.selectedIds = []
    },

    // 全选/取消全选
    toggleSelectAll() {
      if (this.selectedIds.length === this.images.length) {
        this.selectedIds = []
      } else {
        this.selectedIds = this.images.map(img => img.id)
      }
    }
  },

  getters: {
    isAllSelected: (state) => {
      return state.images.length > 0 && state.selectedIds.length === state.images.length
    },

    hasSelection: (state) => {
      return state.selectedIds.length > 0
    }
  }
})
