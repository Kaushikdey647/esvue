<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'
import { useClusterStore } from '@/stores/cluster'
import { useClusterRefresh } from '@/composables/useClusterRefresh'
import { usePolling } from '@/composables/usePolling'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EntityContextMenu from '@/components/ui/EntityContextMenu.vue'
import EntityDrawer from '@/components/ui/EntityDrawer.vue'

const connection = useConnectionStore()
const cluster = useClusterStore()
const router = useRouter()
const { refreshAll } = useClusterRefresh()
const { pause, resume } = usePolling(refreshAll)

const nav = [
  { to: '/overview', label: 'Overview' },
  { to: '/nodes', label: 'Nodes' },
  { to: '/shards', label: 'Shards' },
  { to: '/disk', label: 'Disk' },
  { to: '/threads', label: 'Threads' },
  { to: '/indices', label: 'Indices' },
  { to: '/explain', label: 'Explain' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/settings', label: 'Settings' },
]

const healthStatus = computed(() => cluster.health?.status ?? 'unknown')

function onKey(e: KeyboardEvent) {
  if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    e.preventDefault()
    void refreshAll()
  }
}

onMounted(() => {
  void refreshAll()
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => document.removeEventListener('keydown', onKey))

async function disconnect() {
  connection.disconnect()
  await router.push('/login')
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <aside class="flex w-48 shrink-0 flex-col border-r border-border bg-surface">
      <div class="border-b border-border px-4 py-4">
        <div class="text-lg font-semibold tracking-tight">esvue</div>
        <div class="mt-0.5 truncate font-mono text-[10px] text-muted">{{ connection.clusterName || '—' }}</div>
      </div>
      <nav class="flex flex-1 flex-col gap-0.5 p-2">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="rounded px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text"
          active-class="!bg-surface-2 !text-text"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <button
        type="button"
        class="m-2 rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-text"
        @click="disconnect"
      >
        Disconnect
      </button>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span class="font-mono text-xs text-muted">{{ connection.displayEndpoint }}</span>
        <StatusBadge :status="healthStatus as 'green' | 'yellow' | 'red' | 'unknown'" />
        <span v-if="connection.version" class="font-mono text-xs text-muted">v{{ connection.version }}</span>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-1 text-xs text-muted">
            index
            <input
              v-model="connection.esIndex"
              class="w-40 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
            />
          </label>
          <label class="flex items-center gap-1 text-xs text-muted">
            alias
            <input
              v-model="connection.esAlias"
              class="w-40 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
            />
          </label>
          <label class="flex items-center gap-1 text-xs text-muted">
            rack
            <input
              v-model="connection.esRackGroup"
              class="w-16 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
            />
          </label>
          <button
            type="button"
            class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
            @click="refreshAll"
          >
            Refresh
          </button>
          <button
            type="button"
            class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
            @click="connection.pollPaused ? resume() : pause()"
          >
            {{ connection.pollPaused ? 'Resume' : 'Pause' }}
          </button>
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-auto p-4">
        <RouterView />
      </main>
    </div>

    <EntityContextMenu />
    <EntityDrawer />
  </div>
</template>
