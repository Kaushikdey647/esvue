<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as shardsApi from '@/api/es/shards'
import * as allocationApi from '@/api/es/allocation'
import { useConnectionStore } from '@/stores/connection'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import RelatedLinks from '@/components/ui/RelatedLinks.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import ExplainResult from '@/components/ui/ExplainResult.vue'
import IndexAllocationSettings from '@/components/ui/IndexAllocationSettings.vue'
import type { CatShard } from '@/types/es'

const route = useRoute()
const connection = useConnectionStore()

const index = computed(() => decodeURIComponent(String(route.params.index ?? '')))
const shard = computed(() => String(route.params.shard ?? '0'))
const prirep = computed(() => (typeof route.query.prirep === 'string' ? route.query.prirep : 'r'))
const primary = computed(() => prirep.value === 'p')

const loading = ref(false)
const error = ref<string | null>(null)
const row = ref<CatShard | null>(null)
const explain = ref<unknown>(null)
const settings = ref<unknown>(null)

const stateTone = computed(() => {
  const s = row.value?.state
  if (s === 'STARTED') return 'green' as const
  if (s === 'UNASSIGNED') return 'red' as const
  if (s === 'RELOCATING' || s === 'INITIALIZING') return 'yellow' as const
  return 'unknown' as const
})

const links = computed(() => [
  { to: { name: 'entity-index', params: { index: index.value } }, label: 'Index dashboard' },
  ...(row.value?.node
    ? [{ to: { name: 'entity-node', params: { name: row.value.node } }, label: 'Node dashboard' }]
    : []),
  { to: { path: '/shards', query: { index: index.value } }, label: 'Shards table (index)' },
  {
    to: {
      path: '/explain',
      query: { index: index.value, shard: shard.value, primary: primary.value ? 'true' : 'false' },
    },
    label: 'Explain page',
  },
  { to: { path: '/disk', query: { index: index.value, panel: 'recovery' } }, label: 'Recovery' },
  { to: { path: '/disk', query: { index: index.value, panel: 'segments' } }, label: 'Segments' },
])

async function load() {
  if (!index.value) return
  loading.value = true
  error.value = null
  connection.setIndex(index.value)
  try {
    const [shards, expl, settingsRes] = await Promise.all([
      shardsApi.catShards(index.value),
      allocationApi.allocationExplain({
        index: index.value,
        shard: Number(shard.value),
        primary: primary.value,
      }),
      shardsApi.indexReplicaSettings(index.value),
    ])
    row.value =
      shards.find(
        (s) =>
          s.shard === shard.value &&
          (!prirep.value || s.prirep === prirep.value || (!s.prirep && true)),
      ) ??
      shards.find((s) => s.shard === shard.value) ??
      null
    explain.value = expl
    settings.value = settingsRes
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(
  () => [index.value, shard.value, prirep.value],
  () => void load(),
  { immediate: true },
)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start gap-3">
      <div>
        <div class="text-xs uppercase tracking-wide text-muted">Shard</div>
        <h1 class="font-mono text-xl font-semibold">
          <EntityChip kind="index" :label="index" :payload="{ index }" />
          <span class="text-muted">[</span>{{ shard }}<span class="text-muted">]</span>
          <span class="ml-2 text-sm text-muted">{{ primary ? 'primary' : 'replica' }}</span>
        </h1>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge v-if="row" :status="stateTone" :label="row.state" />
          <span v-if="row?.['unassigned.reason']" class="font-mono text-xs text-red">
            {{ row['unassigned.reason'] }}
          </span>
          <EntityChip
            v-if="row?.node"
            kind="node"
            :label="row.node"
            :payload="{ name: row.node, node: row.node }"
          />
          <span v-else-if="row && !row.node" class="text-xs text-muted">no node</span>
        </div>
      </div>
      <button type="button" class="ml-auto rounded border border-border px-2 py-1 text-xs" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <p v-else-if="loading && !row && !explain" class="text-sm text-muted">Loading shard dashboard…</p>

    <div v-if="row" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Docs" :value="row.docs ?? '—'" />
      <MetricCard label="Store" :value="row.store ?? '—'" />
      <MetricCard label="Pri/Rep" :value="row.prirep" />
      <MetricCard label="State" :value="row.state" :tone="row.state === 'UNASSIGNED' ? 'red' : 'default'" />
    </div>

    <RelatedLinks :links="links" />

    <section class="space-y-2">
      <h2 class="text-sm font-medium">Allocation explain</h2>
      <ExplainResult v-if="explain" :data="explain" />
    </section>

    <IndexAllocationSettings :data="settings" :index-name="index" />
  </div>
</template>
