<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import InspectPanel from './InspectPanel.vue'

const ui = useUiStore()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ui.drawer.open"
      class="fixed inset-0 z-40 flex justify-end bg-black/40"
      @click.self="ui.closeDrawer()"
    >
      <aside class="flex h-full w-full max-w-xl flex-col border-l border-border bg-surface">
        <header class="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold">{{ ui.drawer.title }}</h2>
          <button type="button" class="text-muted hover:text-text" @click="ui.closeDrawer()">✕</button>
        </header>
        <div class="flex-1 overflow-auto p-4">
          <p v-if="ui.drawer.loading" class="text-sm text-muted">Loading…</p>
          <p v-else-if="ui.drawer.error" class="text-sm text-red">{{ ui.drawer.error }}</p>
          <InspectPanel
            v-else
            :kind="ui.drawer.inspectKind"
            :data="ui.drawer.data"
            :index-name="ui.drawer.indexName ?? undefined"
          />
        </div>
      </aside>
    </div>
  </Teleport>
</template>
