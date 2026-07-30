<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useShardsStore } from '@/stores/shards'
import { useConnectionStore } from '@/stores/connection'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { matchesSearch } from '@/utils/search'
import type { CatShard } from '@/types/es'

const shards = useShardsStore()
const connection = useConnectionStore()
const route = useRoute()
const router = useRouter()

/** Empty string = all indices (default). */
const indexFilter = ref(typeof route.query.index === 'string' ? route.query.index : '')
const stateFilter = ref(typeof route.query.state === 'string' ? route.query.state : '')
const nodeFilter = ref(typeof route.query.node === 'string' ? route.query.node : '')
const search = ref('')

const presets = [
  { label: 'all', index: '' },
  { label: 'products_live_misc', index: 'products_v3_misc' },
  { label: 'kids_toys', index: 'products_v3_kids_toys' },
  { label: 'kitchen_appliances', index: 'products_v3_kitchen_appliances' },
]

watch(
  () => route.query,
  (q) => {
    if ('index' in q) {
      indexFilter.value = typeof q.index === 'string' ? q.index : ''
    }
    if (typeof q.state === 'string') stateFilter.value = q.state
    else if ('state' in q && q.state == null) stateFilter.value = ''
    if (typeof q.node === 'string') nodeFilter.value = q.node
    else if ('node' in q && q.node == null) nodeFilter.value = ''
  },
)

const scoped = computed(() => {
  return shards.shards.filter((s) => {
    if (indexFilter.value && !s.index.includes(indexFilter.value)) return false
    if (stateFilter.value && s.state !== stateFilter.value) return false
    if (nodeFilter.value && s.node !== nodeFilter.value) return false
    return true
  })
})

const filtered = computed(() =>
  scoped.value.filter((s) =>
    matchesSearch(
      search.value,
      s.index,
      s.shard,
      s.prirep,
      s.state,
      s['unassigned.reason'],
      s.node,
      s.docs,
      s.store,
    ),
  ),
)

function applyPreset(index: string) {
  indexFilter.value = index
  if (index) connection.setIndex(index)
  const query = { ...route.query } as Record<string, string | undefined>
  if (index) query.index = index
  else delete query.index
  void router.replace({ query })
}

function setState(state: string) {
  stateFilter.value = stateFilter.value === state ? '' : state
  void router.replace({
    query: { ...route.query, state: stateFilter.value || undefined },
  })
}

function stateClass(state: string) {
  if (state === 'UNASSIGNED') return 'text-red'
  if (state === 'RELOCATING') return 'text-blue'
  if (state === 'INITIALIZING') return 'text-amber'
  return ''
}

const columns: ColumnDef<CatShard>[] = [
  {
    accessorKey: 'index',
    header: 'index',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'index',
        label: row.original.index,
        payload: { index: row.original.index },
      }),
  },
  { accessorKey: 'shard', header: 'shard' },
  { accessorKey: 'prirep', header: 'p/r' },
  {
    accessorKey: 'state',
    header: 'state',
    cell: ({ row }) => {
      const s = row.original
      return h(EntityChip, {
        kind: 'shard',
        label: s.state,
        labelClass: stateClass(s.state),
        payload: {
          index: s.index,
          shard: s.shard,
          prirep: s.prirep,
          state: s.state,
          node: s.node ?? '',
        },
      })
    },
  },
  { accessorKey: 'unassigned.reason', header: 'reason' },
  { accessorKey: 'docs', header: 'docs' },
  { accessorKey: 'store', header: 'store' },
  {
    accessorKey: 'node',
    header: 'node',
    cell: ({ row }) =>
      row.original.node
        ? h(EntityChip, {
            kind: 'node',
            label: row.original.node,
            payload: { name: row.original.node, node: row.original.node },
          })
        : '—',
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">Shards</h1>
      <SearchInput
        v-model="search"
        placeholder="Search index, node, state…"
        :count="filtered.length"
        :total="scoped.length"
      />
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="p in presets"
        :key="p.label"
        type="button"
        class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
        :class="indexFilter === p.index ? 'border-blue text-blue' : ''"
        @click="applyPreset(p.index)"
      >
        {{ p.label }}
      </button>
      <span class="mx-1 self-center text-border">|</span>
      <button
        v-for="s in ['UNASSIGNED', 'RELOCATING', 'INITIALIZING', 'STARTED']"
        :key="s"
        type="button"
        class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
        :class="stateFilter === s ? 'border-blue text-blue' : ''"
        @click="setState(s)"
      >
        {{ s }}
      </button>
    </div>

    <div class="flex flex-wrap gap-3">
      <label class="text-xs text-muted">
        index contains
        <input
          v-model="indexFilter"
          class="ml-1 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
          placeholder="(all)"
        />
      </label>
      <label class="text-xs text-muted">
        node
        <input
          v-model="nodeFilter"
          class="ml-1 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
          placeholder="(all)"
        />
      </label>
    </div>

    <p v-if="shards.error" class="text-sm text-red">{{ shards.error }}</p>
    <DataTable
      :columns="columns"
      :data="filtered"
      :row-class="(row) => stateClass(row.state)"
    />
  </div>
</template>
