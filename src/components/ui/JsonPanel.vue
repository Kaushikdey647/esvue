<script setup lang="ts">
defineProps<{ data: unknown }>()
</script>

<template>
  <pre
    class="max-h-[70vh] overflow-auto rounded border border-border bg-bg p-3 font-mono text-xs leading-relaxed text-text whitespace-pre-wrap"
  >{{ typeof data === 'string' ? data : JSON.stringify(data, null, 2) }}</pre>
</template>
