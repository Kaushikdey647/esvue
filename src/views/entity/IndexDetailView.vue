<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as clusterApi from '@/api/es/cluster'
import * as indicesApi from '@/api/es/indices'
import * as shardsApi from '@/api/es/shards'
import * as allocationApi from '@/api/es/allocation'
import { useConnectionStore } from '@/stores/connection'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import RelatedLinks from '@/components/ui/RelatedLinks.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import IndexAllocationSettings from '@/components/ui/IndexAllocationSettings.vue'
import JsonPanel from '@/components/ui/JsonPanel.vue'
import type { CatAlias, CatIndex, CatShard } from '@/types/es'

const route = useRoute()
const connection = useConnectionStore()
const index = computed(() => decodeURIComponent(String(route.params.index ?? '')))

const loading = ref(false)
const error = ref<string | null>(null)
const cat = ref<CatIndex | null>(null)
const health = ref<{ status?: string; unassigned_shards?: number; active_shards?: number } | null>(null)
const count = ref<number | null>(null)
const store = ref<unknown>(null)
const stats = ref<unknown>(null)
const settings = ref<unknown>(null)
const aliases = ref<CatAlias[]>([])
const shards = ref<CatShard[]>([])
const segments = ref(0)
const recoveryActive = ref(0)
const showRaw = ref(false)

const healthTone = computed(() => {
  const s = cat.value?.health ?? health.value?.status
  if (s === 'green') return 'green' as const
  if (s === 'yellow') return 'yellow' as const
  if (s === 'red') return 'red' as const
  return 'unknown' as const
})

const shardByState = computed(() => {
  const map: Record<string, number> = {}
  for (const s of shards.value) {
    map[s.state] = (map[s.state] ?? 0) + 1
  }
  return map
})

const searchStats = computed(() => {
  const idx = (stats.value as { indices?: Record<string, { total?: { search?: Record<string, number>; indexing?: Record<string, number> } }> })?.indices?.[index.value]
  return idx?.total ?? null
})

const storeBytes = computed(() => {
  const idx = (store.value as { indices?: Record<string, { total?: { store?: { size_in_bytes?: number } }; primaries?: { store?: { size_in_bytes?: number } } }> })?.indices?.[index.value]
  return idx ?? null
})

const links = computed(() => [
  { to: { path: '/shards', query: { index: index.value } }, label: 'Shards table' },
  { to: { path: '/shards', query: { index: index.value, state: 'UNASSIGNED' } }, label: 'Unassigned shards' },
  { to: { path: '/disk', query: { index: index.value, panel: 'recovery' } }, label: 'Recovery' },
  { to: { path: '/disk', query: { index: index.value, panel: 'segments' } }, label: 'Segments' },
  { to: { path: '/explain', query: { index: index.value, shard: '0', primary: 'false' } }, label: 'Explain template' },
  { to: { path: '/indices', query: { highlight: index.value } }, label: 'Indices table' },
  { to: { path: '/tasks', query: { action: 'reindex' } }, label: 'Reindex tasks' },
])

function formatBytes(n?: number) {
  if (n == null) return '—'
  if (n < 1024) return `${n}b`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)}kb`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)}mb`
  return `${(n / 1024 ** 3).toFixed(2)}gb`
}

async function load() {
  if (!index.value) return
  loading.value = true
  error.value = null
  connection.setIndex(index.value)
  try {
    const [indices, h, c, st, storeRes, settingsRes, allAliases, shardRows, segs, rec] =
      await Promise.all([
        indicesApi.catIndices(),
        clusterApi.clusterHealth('shards', index.value).catch(() => null),
        indicesApi.indexCount(index.value),
        indicesApi.indexStatsSearchIndexing(index.value),
        indicesApi.indexStatsStore(index.value),
        shardsApi.indexReplicaSettings(index.value),
        indicesApi.catAliases(),
        shardsApi.catShards(index.value),
        allocationApi.catSegments(index.value),
        allocationApi.catRecovery(index.value),
      ])
    cat.value = indices.find((i) => i.index === index.value) ?? null
    health.value = h
    count.value = (c as { count?: number }).count ?? null
    stats.value = st
    store.value = storeRes
    settings.value = settingsRes
    aliases.value = allAliases.filter((a) => a.index === index.value)
    shards.value = shardRows
    segments.value = segs.length
    recoveryActive.value = rec.filter((r) => r.stage && r.stage !== 'done').length
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(index, () => void load(), { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start gap-3">
      <div>
        <div class="text-xs uppercase tracking-wide text-muted">Index</div>
        <h1 class="font-mono text-xl font-semibold">{{ index }}</h1>
        <div class="mt-1 flex flex-wrap gap-2">
          <StatusBadge :status="healthTone" :label="cat?.health ?? health?.status ?? 'unknown'" />
          <span v-if="cat?.status" class="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">{{ cat.status }}</span>
        </div>
      </div>
      <button type="button" class="ml-auto rounded border border-border px-2 py-1 text-xs" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <p v-else-if="loading && !cat" class="text-sm text-muted">Loading index dashboard…</p>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Docs" :value="count ?? cat?.['docs.count'] ?? '—'" />
      <MetricCard label="Store" :value="cat?.['store.size'] ?? formatBytes(storeBytes?.total?.store?.size_in_bytes)" />
      <MetricCard label="Primaries" :value="cat?.pri ?? '—'" />
      <MetricCard label="Replicas" :value="cat?.rep ?? '—'" />
      <MetricCard label="Unassigned" :value="health?.unassigned_shards ?? shardByState.UNASSIGNED ?? 0" :tone="(health?.unassigned_shards ?? 0) > 0 ? 'red' : 'green'" />
      <MetricCard label="Segments" :value="segments" :tone="segments > 80 ? 'yellow' : 'default'" hint="merge pressure if high" />
      <MetricCard label="Active recovery" :value="recoveryActive" :tone="recoveryActive > 0 ? 'blue' : 'default'" />
      <MetricCard label="Active shards" :value="health?.active_shards ?? '—'" />
    </div>

    <div class="grid gap-3 lg:grid-cols-2">
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Shard states</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="(n, state) in shardByState"
            :key="state"
            class="rounded border border-border px-2 py-1 font-mono text-xs"
            :class="{
              'text-red': state === 'UNASSIGNED',
              'text-blue': state === 'RELOCATING',
              'text-amber': state === 'INITIALIZING',
            }"
          >
            {{ state }} {{ n }}
          </span>
          <span v-if="Object.keys(shardByState).length === 0" class="text-sm text-muted">—</span>
        </div>
      </div>
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Aliases → this index</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <EntityChip
            v-for="a in aliases"
            :key="a.alias"
            kind="alias"
            :label="a.alias"
            :payload="{ alias: a.alias, index }"
          />
          <span v-if="aliases.length === 0" class="text-sm text-muted">none</span>
        </div>
      </div>
    </div>

    <div v-if="searchStats" class="rounded border border-border bg-surface p-4">
      <div class="text-xs uppercase text-muted">Search + indexing</div>
      <div class="mt-2 grid gap-2 font-mono text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>query_total {{ searchStats.search?.query_total ?? '—' }}</div>
        <div>query_time {{ searchStats.search?.query_time_in_millis ?? '—' }}ms</div>
        <div>index_total {{ searchStats.indexing?.index_total ?? '—' }}</div>
        <div>index_time {{ searchStats.indexing?.index_time_in_millis ?? '—' }}ms</div>
      </div>
    </div>

    <IndexAllocationSettings :data="settings" :index-name="index" />

    <RelatedLinks :links="links" />

    <div>
      <button type="button" class="text-xs text-muted hover:text-text" @click="showRaw = !showRaw">
        {{ showRaw ? 'Hide' : 'Show' }} raw
      </button>
      <JsonPanel v-if="showRaw" class="mt-2" :data="{ cat, health, count, store, stats, settings }" />
    </div>
  </div>
</template>
