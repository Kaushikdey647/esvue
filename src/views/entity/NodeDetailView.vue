<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as nodesApi from '@/api/es/nodes'
import * as allocationApi from '@/api/es/allocation'
import * as shardsApi from '@/api/es/shards'
import * as tpApi from '@/api/es/threadPools'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DiskBar from '@/components/ui/DiskBar.vue'
import RelatedLinks from '@/components/ui/RelatedLinks.vue'
import JsonPanel from '@/components/ui/JsonPanel.vue'
import { firstNodePayload, breakerPct } from '@/utils/nodeStats'
import type { CatNode, CatAllocation } from '@/types/es'

const route = useRoute()
const name = computed(() => String(route.params.name ?? ''))

const loading = ref(false)
const error = ref<string | null>(null)
const cat = ref<(CatNode & { group?: string }) | null>(null)
const alloc = ref<CatAllocation | null>(null)
const info = ref<Record<string, unknown> | null>(null)
const breakers = ref<Record<string, unknown> | null>(null)
const contexts = ref<Record<string, unknown> | null>(null)
const osJvm = ref<Record<string, unknown> | null>(null)
const searchStats = ref<Record<string, unknown> | null>(null)
const threadPools = ref<Record<string, unknown> | null>(null)
const shardCounts = ref({ total: 0, unassigned: 0, started: 0 })
const showRaw = ref(false)
const hotText = ref<string | null>(null)
const hotLoading = ref(false)

const parentBreaker = computed(() => breakerPct(breakers.value, 'parent'))
const requestBreaker = computed(() => breakerPct(breakers.value, 'request'))

const openContexts = computed(() => {
  const indices = contexts.value?.indices as { search?: { open_contexts?: number } } | undefined
  return indices?.search?.open_contexts ?? null
})

const searchSummary = computed(() => {
  const s = (searchStats.value?.indices as { search?: Record<string, number> } | undefined)?.search
  if (!s) return null
  return {
    queryTotal: s.query_total ?? 0,
    queryMs: s.query_time_in_millis ?? 0,
    fetchTotal: s.fetch_total ?? 0,
  }
})

const tpSearch = computed(() => {
  const tp = threadPools.value?.thread_pool as Record<string, { queue?: number; active?: number; rejected?: number }> | undefined
  return tp?.search ?? null
})

const links = computed(() => [
  { to: { path: '/shards', query: { node: name.value } }, label: 'Shards on this node', hint: '_cat/shards filtered' },
  { to: { path: '/threads', query: { node: name.value } }, label: 'Thread pools', hint: 'search/write queues' },
  { to: { path: '/disk', query: { highlight: name.value } }, label: 'Disk allocation', hint: '_cat/allocation' },
  {
    to: { path: '/nodes', query: { rack: cat.value?.group || undefined, highlight: name.value } },
    label: 'Nodes table',
    hint: 'highlight in nodes list',
  },
])

async function load() {
  if (!name.value) return
  loading.value = true
  error.value = null
  hotText.value = null
  try {
    const [nodes, attrs, allocation, shards, infoRes, br, ctx, os, ss, tp] = await Promise.all([
      nodesApi.catNodes(),
      nodesApi.catNodeAttrs(),
      allocationApi.catAllocation(),
      shardsApi.catShards(),
      nodesApi.nodesInfo(name.value),
      nodesApi.nodesBreakers(name.value),
      nodesApi.nodesOpenContexts(name.value),
      nodesApi.nodesStatsOsJvmFs(name.value),
      nodesApi.nodesSearchStats(name.value),
      nodesApi.nodesThreadPoolStats(name.value),
    ])
    const group = attrs.find((a) => a.node === name.value && a.attr === 'group')?.value
    const row = nodes.find((n) => n.name === name.value)
    cat.value = row ? { ...row, group: group ?? '' } : null
    alloc.value = allocation.find((a) => a.node === name.value) ?? null
    info.value = firstNodePayload(infoRes)
    breakers.value = firstNodePayload(br)
    contexts.value = firstNodePayload(ctx)
    osJvm.value = firstNodePayload(os)
    searchStats.value = firstNodePayload(ss)
    threadPools.value = firstNodePayload(tp)

    const mine = shards.filter((s) => s.node === name.value)
    shardCounts.value = {
      total: mine.length,
      unassigned: mine.filter((s) => s.state === 'UNASSIGNED').length,
      started: mine.filter((s) => s.state === 'STARTED').length,
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function loadHotThreads() {
  hotLoading.value = true
  try {
    hotText.value = await nodesApi.hotThreads(name.value)
  } catch (e) {
    hotText.value = e instanceof Error ? e.message : String(e)
  } finally {
    hotLoading.value = false
  }
}

watch(name, () => void load(), { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start gap-3">
      <div>
        <div class="text-xs uppercase tracking-wide text-muted">Node</div>
        <h1 class="font-mono text-xl font-semibold">{{ name }}</h1>
        <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted">
          <StatusBadge
            v-if="cat?.master === '*'"
            status="green"
            label="elected master"
          />
          <span v-if="cat?.group" class="rounded bg-surface-2 px-2 py-0.5 font-mono">rack {{ cat.group }}</span>
          <span v-if="info?.version" class="font-mono">v{{ (info as { version?: string }).version }}</span>
          <span v-if="info?.roles" class="font-mono">{{ ((info as { roles?: string[] }).roles ?? []).join(',') }}</span>
        </div>
      </div>
      <button
        type="button"
        class="ml-auto rounded border border-border px-2 py-1 text-xs"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <p v-else-if="loading && !cat" class="text-sm text-muted">Loading node dashboard…</p>

    <div v-if="cat" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Heap %" :value="cat['heap.percent']" :tone="Number(cat['heap.percent']) > 85 ? 'red' : 'default'" />
      <MetricCard label="CPU %" :value="cat.cpu" />
      <MetricCard label="Load 1m" :value="cat.load_1m" />
      <MetricCard label="Uptime" :value="cat.uptime" />
      <MetricCard label="Disk %" :value="cat['disk.used_percent']" :tone="Number(cat['disk.used_percent']) > 85 ? 'yellow' : 'default'" />
      <MetricCard label="Disk avail" :value="cat['disk.avail']" />
      <MetricCard label="Shards on node" :value="shardCounts.total" tone="blue" />
      <MetricCard label="Role" :value="cat['node.role']" />
    </div>

    <div v-if="alloc" class="rounded border border-border bg-surface p-4">
      <div class="mb-2 text-xs uppercase text-muted">Disk allocation</div>
      <DiskBar :percent="alloc['disk.percent']" />
      <div class="mt-2 grid gap-2 font-mono text-xs text-muted sm:grid-cols-4">
        <div>shards {{ alloc.shards }}</div>
        <div>used {{ alloc['disk.used'] }}</div>
        <div>avail {{ alloc['disk.avail'] }}</div>
        <div>indices {{ alloc['disk.indices'] }}</div>
      </div>
    </div>

    <div class="grid gap-3 lg:grid-cols-3">
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Circuit breakers</div>
        <div class="mt-2 space-y-1 font-mono text-sm">
          <div>parent <span :class="(parentBreaker ?? 0) > 85 ? 'text-red' : ''">{{ parentBreaker?.toFixed(1) ?? '—' }}%</span></div>
          <div>request {{ requestBreaker?.toFixed(1) ?? '—' }}%</div>
        </div>
      </div>
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Open search contexts</div>
        <div class="mt-2 font-mono text-2xl" :class="(openContexts ?? 0) > 100 ? 'text-yellow' : ''">
          {{ openContexts ?? '—' }}
        </div>
        <div class="mt-1 text-xs text-muted">Hundreds+ = scroll/KNN pressure</div>
      </div>
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Search thread pool</div>
        <div class="mt-2 font-mono text-sm">
          active {{ tpSearch?.active ?? '—' }} ·
          queue <span :class="(tpSearch?.queue ?? 0) > 50 ? 'text-yellow' : ''">{{ tpSearch?.queue ?? '—' }}</span> ·
          rejected {{ tpSearch?.rejected ?? '—' }}
        </div>
      </div>
    </div>

    <div v-if="searchSummary" class="rounded border border-border bg-surface p-4">
      <div class="text-xs uppercase text-muted">Search index stats</div>
      <div class="mt-2 grid gap-2 font-mono text-sm sm:grid-cols-3">
        <div>query_total {{ searchSummary.queryTotal }}</div>
        <div>query_time {{ searchSummary.queryMs }}ms</div>
        <div>fetch_total {{ searchSummary.fetchTotal }}</div>
      </div>
    </div>

    <RelatedLinks :links="links" />

    <div class="rounded border border-border bg-surface p-4">
      <div class="flex items-center gap-2">
        <div class="text-xs uppercase text-muted">Hot threads</div>
        <button
          type="button"
          class="rounded border border-border px-2 py-0.5 text-xs"
          :disabled="hotLoading"
          @click="loadHotThreads"
        >
          {{ hotLoading ? 'Sampling…' : 'Sample now' }}
        </button>
        <span class="text-[10px] text-muted">on-demand — slow</span>
      </div>
      <pre
        v-if="hotText"
        class="mt-3 max-h-64 overflow-auto font-mono text-[11px] text-muted whitespace-pre-wrap"
      >{{ hotText }}</pre>
    </div>

    <div>
      <button type="button" class="text-xs text-muted hover:text-text" @click="showRaw = !showRaw">
        {{ showRaw ? 'Hide' : 'Show' }} raw node info
      </button>
      <JsonPanel v-if="showRaw" class="mt-2" :data="{ cat, info, breakers, contexts, osJvm, searchStats, threadPools }" />
    </div>
  </div>
</template>
