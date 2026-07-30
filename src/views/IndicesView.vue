<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useIndicesStore } from '@/stores/indices'
import { useConnectionStore } from '@/stores/connection'
import { useEntityActions } from '@/entities/useEntityActions'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { matchesSearch } from '@/utils/search'
import type { CatAlias, CatIndex } from '@/types/es'

const indices = useIndicesStore()
const connection = useConnectionStore()
const route = useRoute()
const { runAction } = useEntityActions()

const tab = ref(typeof route.query.tab === 'string' ? route.query.tab : 'indices')
const mode = ref<'products' | 'unhealthy' | 'all'>('products')
const search = ref('')

watch(
  () => route.query.tab,
  (v) => {
    if (typeof v === 'string') tab.value = v
  },
)

watch(mode, (m) => void indices.refresh(m), { immediate: false })

const highlight = computed(() =>
  typeof route.query.highlight === 'string' ? route.query.highlight : '',
)

const filteredIndices = computed(() =>
  indices.indices.filter((r) =>
    matchesSearch(
      search.value,
      r.index,
      r.health,
      r.status,
      r.pri,
      r.rep,
      r['docs.count'],
      r['store.size'],
    ),
  ),
)

const filteredAliases = computed(() =>
  indices.aliases.filter((r) => matchesSearch(search.value, r.alias, r.index)),
)

const indexColumns: ColumnDef<CatIndex>[] = [
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
  { accessorKey: 'health', header: 'health' },
  { accessorKey: 'status', header: 'status' },
  { accessorKey: 'pri', header: 'pri' },
  { accessorKey: 'rep', header: 'rep' },
  { accessorKey: 'docs.count', header: 'docs' },
  { accessorKey: 'store.size', header: 'store' },
]

const aliasColumns: ColumnDef<CatAlias>[] = [
  {
    accessorKey: 'alias',
    header: 'alias',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'alias',
        label: row.original.alias,
        payload: { alias: row.original.alias, index: row.original.index },
      }),
  },
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
]

async function resolveContextAlias() {
  await runAction(
    'alias',
    { id: 'alias.resolve', label: 'Resolve', type: 'navigate' },
    { alias: connection.esAlias },
  )
}

function rowClass(row: CatIndex) {
  return row.index === highlight.value ? 'bg-blue/10' : ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">Indices & Aliases</h1>
      <SearchInput
        v-model="search"
        :placeholder="tab === 'indices' ? 'Search index…' : 'Search alias / index…'"
        :count="tab === 'indices' ? filteredIndices.length : filteredAliases.length"
        :total="tab === 'indices' ? indices.indices.length : indices.aliases.length"
      />
      <div class="ml-auto flex gap-2">
        <button
          type="button"
          class="rounded border border-border px-2 py-1 text-xs"
          :class="tab === 'indices' ? 'border-blue text-blue' : ''"
          @click="tab = 'indices'"
        >
          Indices
        </button>
        <button
          type="button"
          class="rounded border border-border px-2 py-1 text-xs"
          :class="tab === 'aliases' ? 'border-blue text-blue' : ''"
          @click="tab = 'aliases'"
        >
          Aliases
        </button>
      </div>
    </div>

    <div v-if="tab === 'indices'" class="flex gap-2">
      <button
        v-for="m in (['products', 'unhealthy', 'all'] as const)"
        :key="m"
        type="button"
        class="rounded border border-border px-2 py-1 text-xs"
        :class="mode === m ? 'border-blue text-blue' : ''"
        @click="mode = m; indices.refresh(m)"
      >
        {{ m }}
      </button>
    </div>

    <div v-else class="flex items-center gap-2">
      <button
        type="button"
        class="rounded border border-border px-2 py-1 text-xs text-blue"
        @click="resolveContextAlias"
      >
        Resolve {{ connection.esAlias }} → index
      </button>
    </div>

    <p v-if="indices.error" class="text-sm text-red">{{ indices.error }}</p>

    <DataTable
      v-if="tab === 'indices'"
      :columns="indexColumns"
      :data="filteredIndices"
      :row-class="rowClass"
    />
    <DataTable v-else :columns="aliasColumns" :data="filteredAliases" />
  </div>
</template>
