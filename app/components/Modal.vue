<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="close"
      >
        <div
          class="card w-full max-w-md p-6"
          @click.stop
        >
          <!-- 标题 -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <button
              @click="close"
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="mb-6">
            <slot></slot>
          </div>

          <!-- 按钮 -->
          <div v-if="showCancel || showConfirm" class="flex justify-end gap-3">
            <button
              v-if="showCancel"
              @click="close"
              class="btn-secondary"
            >
              {{ cancelText }}
            </button>
            <button
              v-if="showConfirm"
              @click="confirm"
              :class="confirmClass"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  confirmType: {
    type: String,
    default: 'primary' // 'primary' | 'danger'
  }
})

const emit = defineEmits(['close', 'confirm'])

const confirmClass = computed(() => {
  return props.confirmType === 'danger' ? 'btn-danger' : 'btn-primary'
})

const close = () => {
  emit('close')
}

const confirm = () => {
  emit('confirm')
}
</script>
