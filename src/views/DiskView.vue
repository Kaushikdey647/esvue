<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useAllocationStore } from '@/stores/allocation'
import { useClusterStore } from '@/stores/cluster'
import { useConnectionStore } from '@/stores/connection'
import DataTable from '@/components/tables/DataTable.vue'
import DiskBar from '@/components/ui/DiskBar.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { matchesSearch } from '@/utils/search'
import type { CatAllocation, CatRecovery, CatSegment } from '@/types/es'

const allocation = useAllocationStore()
const cluster = useClusterStore()
const connection = useConnectionStore()
const route = useRoute()

const allocSearch = ref('')
const detailSearch = ref('')

const highlight = computed(() =>
  typeof route.query.highlight === 'string' ? route.query.highlight : '',
)

const panel = computed(() =>
  typeof route.query.panel === 'string' ? route.query.panel : 'recovery',
)

const low = computed(() => parseInt(String(cluster.watermarks?.low ?? '85'), 10) || 85)
const high = computed(() => parseInt(String(cluster.watermarks?.high ?? '90'), 10) || 90)

watch(
  () => [route.query.index, connection.esIndex],
  () => {
    const idx =
      typeof route.query.index === 'string' ? route.query.index : connection.esIndex
    if (typeof route.query.index === 'string') connection.setIndex(route.query.index)
    void allocation.refresh(idx)
  },
)

const filteredAllocation = computed(() =>
  allocation.allocation.filter((r) =>
    matchesSearch(
      allocSearch.value,
      r.node,
      r.shards,
      r['disk.indices'],
      r['disk.used'],
      r['disk.avail'],
      r['disk.percent'],
    ),
  ),
)

const filteredRecovery = computed(() =>
  allocation.recovery.filter((r) =>
    matchesSearch(
      detailSearch.value,
      r.index,
      r.shard,
      r.type,
      r.stage,
      r.source_host,
      r.target_host,
    ),
  ),
)

const filteredSegments = computed(() =>
  allocation.segments.filter((r) =>
    matchesSearch(detailSearch.value, r.index, r.shard, r.segment, r.size, r['docs.count']),
  ),
)

const allocColumns: ColumnDef<CatAllocation>[] = [
  {
    accessorKey: 'node',
    header: 'node',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'node',
        label: row.original.node,
        payload: { name: row.original.node, node: row.original.node },
      }),
  },
  { accessorKey: 'shards', header: 'shards' },
  { accessorKey: 'disk.indices', header: 'indices' },
  { accessorKey: 'disk.used', header: 'used' },
  { accessorKey: 'disk.avail', header: 'avail' },
  {
    accessorKey: 'disk.percent',
    header: 'disk%',
    cell: ({ row }) =>
      h(DiskBar, {
        percent: row.original['disk.percent'],
        low: low.value,
        high: high.value,
      }),
  },
]

const recoveryColumns: ColumnDef<CatRecovery>[] = [
  { accessorKey: 'index', header: 'index' },
  { accessorKey: 'shard', header: 'shard' },
  { accessorKey: 'type', header: 'type' },
  { accessorKey: 'stage', header: 'stage' },
  { accessorKey: 'files_percent', header: 'files%' },
  { accessorKey: 'bytes_percent', header: 'bytes%' },
  { accessorKey: 'source_host', header: 'source' },
  { accessorKey: 'target_host', header: 'target' },
]

const segmentColumns: ColumnDef<CatSegment>[] = [
  { accessorKey: 'index', header: 'index' },
  { accessorKey: 'shard', header: 'shard' },
  { accessorKey: 'segment', header: 'segment' },
  { accessorKey: 'size', header: 'size' },
  { accessorKey: 'docs.count', header: 'docs' },
]

function rowClass(row: CatAllocation) {
  return row.node === highlight.value ? 'bg-blue/10' : ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">Disk & Allocation</h1>
      <span class="text-xs text-muted">
        watermarks low {{ cluster.watermarks?.low ?? '85%' }} / high
        {{ cluster.watermarks?.high ?? '90%' }}
      </span>
    </div>

    <p v-if="allocation.error" class="text-sm text-red">{{ allocation.error }}</p>

    <section class="space-y-2">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-sm font-medium">Allocation (tightest disk first)</h2>
        <SearchInput
          v-model="allocSearch"
          placeholder="Search node…"
          :count="filteredAllocation.length"
          :total="allocation.allocation.length"
        />
      </div>
      <DataTable :columns="allocColumns" :data="filteredAllocation" :row-class="rowClass" />
    </section>

    <section class="space-y-2">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-sm font-medium">
          {{ panel === 'segments' ? 'Segments' : 'Recovery' }} —
          <span class="font-mono text-blue">{{ connection.esIndex }}</span>
        </h2>
        <SearchInput
          v-model="detailSearch"
          :placeholder="panel === 'segments' ? 'Search segments…' : 'Search recovery…'"
          :count="panel === 'segments' ? filteredSegments.length : filteredRecovery.length"
          :total="panel === 'segments' ? allocation.segments.length : allocation.recovery.length"
        />
      </div>
      <DataTable
        v-if="panel === 'segments'"
        :columns="segmentColumns"
        :data="filteredSegments"
      />
      <DataTable v-else :columns="recoveryColumns" :data="filteredRecovery" />
    </section>
  </div>
</template>
