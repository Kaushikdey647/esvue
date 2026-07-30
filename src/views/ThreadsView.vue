<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useThreadPoolsStore } from '@/stores/threadPools'
import { useNodesStore } from '@/stores/nodes'
import { useConnectionStore } from '@/stores/connection'
import DataTable from '@/components/tables/DataTable.vue'
import QueueHeatCell from '@/components/ui/QueueHeatCell.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { matchesSearch } from '@/utils/search'
import type { CatThreadPool } from '@/types/es'

const tp = useThreadPoolsStore()
const nodes = useNodesStore()
const connection = useConnectionStore()
const route = useRoute()
const search = ref('')

const nodeFilter = computed(() =>
  typeof route.query.node === 'string' ? route.query.node : '',
)

const rackNodes = computed(() => {
  const group = connection.esRackGroup
  if (!group || group === '*') return null
  return new Set(
    nodes.nodesWithGroup.filter((n) => n.group === group).map((n) => n.name),
  )
})

function filterRows(rows: CatThreadPool[]) {
  return rows.filter((r) => {
    if (nodeFilter.value && r.node_name !== nodeFilter.value) return false
    if (rackNodes.value && rackNodes.value.size > 0 && !rackNodes.value.has(r.node_name)) {
      return false
    }
    if (
      !matchesSearch(
        search.value,
        r.node_name,
        r.name,
        r.active,
        r.queue,
        r.rejected,
        r.completed,
      )
    ) {
      return false
    }
    return true
  })
}

const searchRows = computed(() => filterRows(tp.search))
const writeRows = computed(() => filterRows(tp.write))
const refreshRows = computed(() => filterRows(tp.refreshPool))
const flushRows = computed(() => filterRows(tp.flushMerge))

const columns: ColumnDef<CatThreadPool>[] = [
  {
    accessorKey: 'node_name',
    header: 'node',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'node',
        label: row.original.node_name,
        payload: { name: row.original.node_name, node: row.original.node_name },
      }),
  },
  { accessorKey: 'active', header: 'active' },
  {
    accessorKey: 'queue',
    header: 'queue',
    cell: ({ row }) => h(QueueHeatCell, { queue: row.original.queue }),
  },
  { accessorKey: 'rejected', header: 'rejected' },
  { accessorKey: 'completed', header: 'completed' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">Thread Pools</h1>
      <span class="text-xs text-muted">
        queue &gt;50 warn · &gt;200 critical · rack {{ connection.esRackGroup || '*' }}
      </span>
      <SearchInput
        v-model="search"
        class="ml-auto"
        placeholder="Search node…"
        :count="searchRows.length"
        :total="tp.search.length"
      />
    </div>
    <p v-if="tp.error" class="text-sm text-red">{{ tp.error }}</p>

    <section>
      <h2 class="mb-2 text-sm font-medium">Search ({{ searchRows.length }})</h2>
      <DataTable :columns="columns" :data="searchRows" />
    </section>
    <section>
      <h2 class="mb-2 text-sm font-medium">Write ({{ writeRows.length }})</h2>
      <DataTable :columns="columns" :data="writeRows" />
    </section>
    <section>
      <h2 class="mb-2 text-sm font-medium">Refresh ({{ refreshRows.length }})</h2>
      <DataTable :columns="columns" :data="refreshRows" />
    </section>
    <section>
      <h2 class="mb-2 text-sm font-medium">Flush / force_merge ({{ flushRows.length }})</h2>
      <DataTable :columns="columns" :data="flushRows" />
    </section>
  </div>
</template>
