<script setup lang="ts">
const props = defineProps<{ queue: number | string }>()

function n() {
  const v = Number(props.queue)
  return Number.isFinite(v) ? v : 0
}
</script>

<template>
  <span
    class="rounded px-1.5 py-0.5 font-mono text-xs"
    :class="{
      'bg-red/20 text-red': n() > 200,
      'bg-yellow/20 text-yellow': n() > 50 && n() <= 200,
      'text-text': n() <= 50,
    }"
  >
    {{ queue }}
  </span>
</template>
