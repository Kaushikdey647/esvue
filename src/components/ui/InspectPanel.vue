<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InspectKind } from '@/utils/inspect'
import { formatBytes, formatCount, parseCountResponse } from '@/utils/inspect'
import { breakerPct, firstNodePayload } from '@/utils/nodeStats'
import IndexAllocationSettings from '@/components/ui/IndexAllocationSettings.vue'
import MetricCard from '@/components/ui/MetricCard.vue'
import JsonPanel from '@/components/ui/JsonPanel.vue'

const props = defineProps<{
  kind: InspectKind
  data: unknown
  indexName?: string
}>()

const showRaw = ref(false)

const countView = computed(() =>
  props.kind === 'count' ? parseCountResponse(props.data) : null,
)

const node = computed(() =>
  ['breakers', 'contexts', 'osjvm', 'searchStats'].includes(props.kind)
    ? firstNodePayload(props.data)
    : null,
)

const parentBreaker = computed(() => breakerPct(node.value, 'parent'))
const requestBreaker = computed(() => breakerPct(node.value, 'request'))

const openContexts = computed(() => {
  const indices = node.value?.indices as { search?: { open_contexts?: number } } | undefined
  return indices?.search?.open_contexts ?? null
})

const osJvmView = computed(() => {
  if (!node.value) return null
  const os = node.value.os as { cpu?: { percent?: number } } | undefined
  const jvm = node.value.jvm as { mem?: { heap_used_percent?: number } } | undefined
  const fs = node.value.fs as { total?: { total_in_bytes?: number; free_in_bytes?: number; available_in_bytes?: number } } | undefined
  return {
    cpu: os?.cpu?.percent ?? null,
    heap: jvm?.mem?.heap_used_percent ?? null,
    total: fs?.total?.total_in_bytes ?? null,
    free: fs?.total?.free_in_bytes ?? null,
    available: fs?.total?.available_in_bytes ?? null,
  }
})

const searchStatsView = computed(() => {
  const search = (node.value?.indices as { search?: Record<string, number> } | undefined)?.search
  if (!search) return null
  return {
    queryTotal: search.query_total ?? 0,
    queryMs: search.query_time_in_millis ?? 0,
    fetchTotal: search.fetch_total ?? 0,
    fetchMs: search.fetch_time_in_millis ?? 0,
  }
})

const indexStatsView = computed(() => {
  if (props.kind !== 'stats' || !props.data || typeof props.data !== 'object') return null
  const indices = (props.data as { indices?: Record<string, { total?: { search?: Record<string, number>; indexing?: Record<string, number> } }> }).indices
  const first = indices ? Object.values(indices)[0] : null
  const total = first?.total
  if (!total) return null
  return {
    queryTotal: total.search?.query_total ?? 0,
    queryMs: total.search?.query_time_in_millis ?? 0,
    fetchTotal: total.search?.fetch_total ?? 0,
    indexTotal: total.indexing?.index_total ?? 0,
    indexMs: total.indexing?.index_time_in_millis ?? 0,
  }
})

const storeView = computed(() => {
  if (props.kind !== 'store' || !props.data || typeof props.data !== 'object') return null
  const indices = (props.data as {
    indices?: Record<
      string,
      { total?: { store?: { size_in_bytes?: number } }; primaries?: { store?: { size_in_bytes?: number } } }
    >
  }).indices
  const first = indices ? Object.values(indices)[0] : null
  if (!first) return null
  return {
    total: first.total?.store?.size_in_bytes ?? null,
    primaries: first.primaries?.store?.size_in_bytes ?? null,
  }
})

const fielddataRows = computed(() => {
  if (props.kind !== 'fielddata' || !Array.isArray(props.data)) return []
  return props.data as Array<Record<string, string>>
})

const mappingProps = computed(() => {
  if (props.kind !== 'mapping' || !props.data || typeof props.data !== 'object') return [] as Array<{ path: string; type: string }>
  const out: Array<{ path: string; type: string }> = []
  function walk(obj: unknown, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    const rec = obj as Record<string, unknown>
    if (typeof rec.type === 'string' && !rec.properties) {
      out.push({ path: prefix || '(root)', type: rec.type })
      return
    }
    const propsMap = rec.properties as Record<string, unknown> | undefined
    if (propsMap) {
      for (const [k, v] of Object.entries(propsMap)) {
        walk(v, prefix ? `${prefix}.${k}` : k)
      }
      return
    }
    // index → mappings → properties shape from filter_path=**.properties
    for (const [k, v] of Object.entries(rec)) {
      if (k === 'mappings' || k === 'properties') walk(v, prefix)
      else if (v && typeof v === 'object') walk(v, prefix ? `${prefix}.${k}` : k)
    }
  }
  walk(props.data, '')
  return out.slice(0, 200)
})

const hotText = computed(() => (props.kind === 'hotThreads' && typeof props.data === 'string' ? props.data : null))

const structured = computed(() => {
  if (props.kind === 'count') return !!countView.value
  if (props.kind === 'settings') return true
  if (props.kind === 'breakers') return true
  if (props.kind === 'contexts') return true
  if (props.kind === 'osjvm') return !!osJvmView.value
  if (props.kind === 'searchStats') return !!searchStatsView.value
  if (props.kind === 'stats') return !!indexStatsView.value
  if (props.kind === 'store') return !!storeView.value
  if (props.kind === 'fielddata') return true
  if (props.kind === 'hotThreads') return !!hotText.value
  if (props.kind === 'mapping') return mappingProps.value.length > 0
  return false
})
</script>

<template>
  <div class="space-y-4">
    <!-- Count -->
    <template v-if="countView">
      <MetricCard label="Documents" :value="formatCount(countView.count)" tone="blue" />
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="Shards total" :value="countView.shards.total" />
        <MetricCard label="Successful" :value="countView.shards.successful" tone="green" />
        <MetricCard label="Skipped" :value="countView.shards.skipped" />
        <MetricCard
          label="Failed"
          :value="countView.shards.failed"
          :tone="countView.shards.failed > 0 ? 'red' : 'default'"
        />
      </div>
    </template>

    <!-- Settings -->
    <IndexAllocationSettings v-else-if="kind === 'settings'" :data="data" :index-name="indexName" />

    <!-- Breakers -->
    <template v-else-if="kind === 'breakers'">
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Parent breaker"
          :value="parentBreaker != null ? `${parentBreaker.toFixed(1)}%` : '—'"
          :tone="(parentBreaker ?? 0) > 85 ? 'red' : 'default'"
          hint=">85% or tripped = memory pressure"
        />
        <MetricCard
          label="Request breaker"
          :value="requestBreaker != null ? `${requestBreaker.toFixed(1)}%` : '—'"
        />
      </div>
    </template>

    <!-- Open contexts -->
    <template v-else-if="kind === 'contexts'">
      <MetricCard
        label="Open search contexts"
        :value="openContexts ?? '—'"
        :tone="(openContexts ?? 0) > 100 ? 'yellow' : 'default'"
        hint="Hundreds+ during incident = scroll/KNN pressure"
      />
    </template>

    <!-- OS / JVM / FS -->
    <template v-else-if="kind === 'osjvm' && osJvmView">
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricCard label="CPU %" :value="osJvmView.cpu ?? '—'" />
        <MetricCard
          label="Heap %"
          :value="osJvmView.heap ?? '—'"
          :tone="(osJvmView.heap ?? 0) > 85 ? 'red' : 'default'"
        />
        <MetricCard label="Disk total" :value="formatBytes(osJvmView.total)" />
        <MetricCard label="Disk available" :value="formatBytes(osJvmView.available)" />
      </div>
    </template>

    <!-- Node search stats -->
    <template v-else-if="kind === 'searchStats' && searchStatsView">
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricCard label="query_total" :value="formatCount(searchStatsView.queryTotal)" />
        <MetricCard label="query_time" :value="`${formatCount(searchStatsView.queryMs)} ms`" />
        <MetricCard label="fetch_total" :value="formatCount(searchStatsView.fetchTotal)" />
        <MetricCard label="fetch_time" :value="`${formatCount(searchStatsView.fetchMs)} ms`" />
      </div>
    </template>

    <!-- Index search + indexing -->
    <template v-else-if="kind === 'stats' && indexStatsView">
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricCard label="query_total" :value="formatCount(indexStatsView.queryTotal)" />
        <MetricCard label="query_time" :value="`${formatCount(indexStatsView.queryMs)} ms`" />
        <MetricCard label="fetch_total" :value="formatCount(indexStatsView.fetchTotal)" />
        <MetricCard label="index_total" :value="formatCount(indexStatsView.indexTotal)" />
        <MetricCard label="index_time" :value="`${formatCount(indexStatsView.indexMs)} ms`" />
      </div>
    </template>

    <!-- Store -->
    <template v-else-if="kind === 'store' && storeView">
      <div class="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Total store" :value="formatBytes(storeView.total)" tone="blue" />
        <MetricCard label="Primaries store" :value="formatBytes(storeView.primaries)" />
      </div>
    </template>

    <!-- Fielddata -->
    <template v-else-if="kind === 'fielddata'">
      <p v-if="fielddataRows.length === 0" class="text-sm text-muted">No fielddata on this node.</p>
      <div v-else class="overflow-auto rounded border border-border">
        <table class="min-w-full text-left text-xs">
          <thead class="bg-surface-2 text-muted">
            <tr>
              <th class="px-2 py-1.5">field</th>
              <th class="px-2 py-1.5">size</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in fielddataRows" :key="i" class="border-t border-border/60 font-mono">
              <td class="px-2 py-1.5">{{ r.field }}</td>
              <td class="px-2 py-1.5">{{ r.size }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Hot threads -->
    <pre
      v-else-if="hotText"
      class="max-h-[70vh] overflow-auto rounded border border-border bg-bg p-3 font-mono text-[11px] leading-relaxed text-muted whitespace-pre-wrap"
    >{{ hotText }}</pre>

    <!-- Mapping summary -->
    <template v-else-if="kind === 'mapping' && mappingProps.length">
      <p class="text-xs text-muted">Showing {{ mappingProps.length }} fields (capped at 200)</p>
      <div class="overflow-auto rounded border border-border">
        <table class="min-w-full text-left text-xs">
          <thead class="bg-surface-2 text-muted">
            <tr>
              <th class="px-2 py-1.5">path</th>
              <th class="px-2 py-1.5">type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in mappingProps" :key="row.path" class="border-t border-border/60 font-mono">
              <td class="px-2 py-1.5">{{ row.path }}</td>
              <td class="px-2 py-1.5 text-blue">{{ row.type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Fallback / routing -->
    <JsonPanel v-else :data="data" />

    <div v-if="structured">
      <button type="button" class="text-xs text-muted hover:text-text" @click="showRaw = !showRaw">
        {{ showRaw ? 'Hide' : 'Show' }} raw JSON
      </button>
      <JsonPanel v-if="showRaw" class="mt-2" :data="data" />
    </div>
  </div>
</template>
