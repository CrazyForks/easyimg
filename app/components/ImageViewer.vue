<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click="close"
      >
        <!-- 关闭按钮 -->
        <button
          class="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          @click="close"
        >
          <Icon name="heroicons:x-mark" class="w-8 h-8" />
        </button>

        <!-- 图片 -->
        <div
          class="viewer-image max-w-[90vw] max-h-[90vh] transition-transform duration-300"
          @click.stop
        >
          <img
            :src="src"
            :alt="alt"
            class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        <!-- 图片信息 -->
        <div
          v-if="info"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm"
          @click.stop
        >
          {{ info }}
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
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  info: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

// ESC 键关闭
onMounted(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape' && props.visible) {
      close()
    }
  }
  window.addEventListener('keydown', handleEsc)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEsc)
  })
})
</script>
