<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    count?: number
    total?: number
  }>(),
  { placeholder: 'Search…' },
)

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      class="w-64 max-w-full rounded border border-border bg-bg px-2.5 py-1.5 font-mono text-xs outline-none focus:border-blue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="total != null" class="text-xs text-muted">
      <span class="font-mono text-text">{{ count ?? total }}</span>
      / {{ total }}
    </span>
  </div>
</template>
