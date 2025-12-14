<template>
  <div class="flex items-center justify-center">
    <svg
      :class="['animate-spin', sizeClass, colorClass]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span v-if="text" :class="['ml-2', colorClass]">{{ text }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md' // 'sm' | 'md' | 'lg'
  },
  color: {
    type: String,
    default: 'primary' // 'primary' | 'white' | 'gray'
  },
  text: {
    type: String,
    default: ''
  }
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  return sizes[props.size] || sizes.md
})

const colorClass = computed(() => {
  const colors = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-500'
  }
  return colors[props.color] || colors.primary
})
</script>
