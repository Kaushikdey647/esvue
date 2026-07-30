<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  status: {
    type: String as PropType<'green' | 'yellow' | 'red' | 'unknown'>,
    default: 'unknown',
  },
  label: { type: String, default: '' },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
    :class="{
      'bg-green/15 text-green': status === 'green',
      'bg-yellow/15 text-yellow': status === 'yellow',
      'bg-red/15 text-red': status === 'red',
      'bg-surface-2 text-muted': status === 'unknown',
    }"
  >
    <span
      class="h-1.5 w-1.5 rounded-full"
      :class="{
        'bg-green': status === 'green',
        'bg-yellow': status === 'yellow',
        'bg-red': status === 'red',
        'bg-muted': status === 'unknown',
      }"
    />
    {{ label || status }}
  </span>
</template>
