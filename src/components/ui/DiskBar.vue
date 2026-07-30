<script setup lang="ts">
defineProps<{
  percent: number | string
  low?: number
  high?: number
}>()

function num(v: number | string) {
  const n = typeof v === 'number' ? v : Number(String(v).replace('%', ''))
  return Number.isFinite(n) ? n : 0
}
</script>

<template>
  <div class="w-full">
    <div class="mb-1 flex justify-between font-mono text-xs text-muted">
      <span>{{ num(percent).toFixed(1) }}%</span>
    </div>
    <div class="relative h-2 overflow-hidden rounded bg-surface-2">
      <div
        class="absolute inset-y-0 left-0 rounded"
        :class="{
          'bg-green': num(percent) < (low ?? 85),
          'bg-yellow': num(percent) >= (low ?? 85) && num(percent) < (high ?? 90),
          'bg-red': num(percent) >= (high ?? 90),
        }"
        :style="{ width: `${Math.min(100, Math.max(0, num(percent)))}%` }"
      />
      <div
        class="absolute inset-y-0 w-px bg-yellow/80"
        :style="{ left: `${low ?? 85}%` }"
      />
      <div
        class="absolute inset-y-0 w-px bg-red/80"
        :style="{ left: `${high ?? 90}%` }"
      />
    </div>
  </div>
</template>
