<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'green' | 'yellow' | 'red' | 'blue'
  clickable?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="rounded border border-border bg-surface p-4 text-left transition-colors"
    :class="clickable ? 'hover:border-blue cursor-pointer' : 'cursor-default'"
    @click="$emit('click')"
  >
    <div class="text-xs uppercase tracking-wide text-muted">{{ label }}</div>
    <div
      class="mt-1 font-mono text-2xl font-semibold"
      :class="{
        'text-green': tone === 'green',
        'text-yellow': tone === 'yellow',
        'text-red': tone === 'red',
        'text-blue': tone === 'blue',
      }"
    >
      {{ value }}
    </div>
    <div v-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</div>
  </button>
</template>
