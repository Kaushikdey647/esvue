<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useNodesStore } from '@/stores/nodes'
import { useConnectionStore } from '@/stores/connection'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { matchesSearch } from '@/utils/search'
import type { CatNode } from '@/types/es'

const nodes = useNodesStore()
const connection = useConnectionStore()
const route = useRoute()
const search = ref('')

const rackFilter = computed(() => {
  const q = route.query.rack
  return typeof q === 'string' && q ? q : connection.esRackGroup
})

const highlight = computed(() => (typeof route.query.highlight === 'string' ? route.query.highlight : ''))

const rackFiltered = computed(() => {
  let rows = nodes.nodesWithGroup
  const rack = rackFilter.value
  if (rack && rack !== '*') {
    const matched = rows.filter((n) => n.group === rack)
    if (matched.length) rows = matched
  }
  return rows
})

const filtered = computed(() =>
  rackFiltered.value.filter((n) =>
    matchesSearch(
      search.value,
      n.name,
      n['node.role'],
      n.master,
      n.group,
      n.uptime,
      n['disk.avail'],
    ),
  ),
)

function rowClass(row: CatNode & { group?: string }) {
  const heap = Number(row['heap.percent'])
  const disk = Number(row['disk.used_percent'])
  const parts: string[] = []
  if (row.name === highlight.value) parts.push('bg-blue/10')
  if (row.master === '*') parts.push('outline outline-1 outline-green/40')
  if (heap > 85 || disk > 85) parts.push('bg-red/5')
  return parts.join(' ')
}

const columns: ColumnDef<CatNode & { group?: string }>[] = [
  {
    accessorKey: 'name',
    header: 'name',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'node',
        label: row.original.name,
        payload: { name: row.original.name, node: row.original.name },
      }),
  },
  { accessorKey: 'node.role', header: 'role' },
  { accessorKey: 'master', header: 'master' },
  { accessorKey: 'group', header: 'rack' },
  { accessorKey: 'heap.percent', header: 'heap%' },
  { accessorKey: 'cpu', header: 'cpu%' },
  { accessorKey: 'load_1m', header: 'load_1m' },
  { accessorKey: 'disk.used_percent', header: 'disk%' },
  { accessorKey: 'disk.avail', header: 'disk avail' },
  { accessorKey: 'uptime', header: 'uptime' },
]

watch(
  () => route.query.rack,
  (v) => {
    if (typeof v === 'string' && v) connection.setRackGroup(v)
  },
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">Nodes</h1>
      <SearchInput
        v-model="search"
        placeholder="Search name, role, rack…"
        :count="filtered.length"
        :total="rackFiltered.length"
      />
      <label class="ml-auto flex items-center gap-2 text-xs text-muted">
        Rack filter
        <input
          v-model="connection.esRackGroup"
          class="w-20 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
          title="Use * for all racks"
        />
      </label>
    </div>
    <p v-if="nodes.error" class="text-sm text-red">{{ nodes.error }}</p>
    <DataTable :columns="columns" :data="filtered" :row-class="rowClass" />
  </div>
</template>
