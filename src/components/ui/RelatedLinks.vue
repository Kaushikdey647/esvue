<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

export interface RelatedLink {
  to: RouteLocationRaw
  label: string
  hint?: string
}

defineProps<{ links: RelatedLink[]; title?: string }>()
</script>

<template>
  <section class="rounded border border-border bg-surface p-4">
    <h3 class="mb-3 text-xs uppercase tracking-wide text-muted">{{ title ?? 'Related views' }}</h3>
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-for="link in links"
        :key="link.label"
        :to="link.to"
        class="rounded border border-border px-3 py-1.5 text-sm text-blue hover:border-blue hover:bg-blue/10"
        :title="link.hint"
      >
        {{ link.label }}
      </RouterLink>
    </div>
  </section>
</template>
