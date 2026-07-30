<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import JsonPanel from '@/components/ui/JsonPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { flattenTasksResponse, formatDuration, type FlatTask } from '@/utils/esFormat'
import { matchesSearch } from '@/utils/search'

const props = defineProps<{ data: unknown }>()

const showRaw = ref(false)
const hideMonitorNoise = ref(true)
const familyFilter = ref<string>('all')
const search = ref('')

const allRows = computed(() => flattenTasksResponse(props.data))

const families = computed(() => {
  const map = new Map<string, number>()
  for (const r of allRows.value) {
    if (hideMonitorNoise.value && r.actionFamily === 'cluster:monitor/tasks/lists') continue
    map.set(r.actionFamily, (map.get(r.actionFamily) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const scoped = computed(() => {
  return allRows.value.filter((r) => {
    if (hideMonitorNoise.value && r.actionFamily === 'cluster:monitor/tasks/lists') return false
    if (familyFilter.value !== 'all' && r.actionFamily !== familyFilter.value) return false
    return true
  })
})

const rows = computed(() =>
  scoped.value.filter((r) =>
    matchesSearch(search.value, r.nodeName, r.action, r.group, r.host, r.type, r.parentTaskId),
  ),
)

watch(hideMonitorNoise, () => {
  if (
    familyFilter.value !== 'all' &&
    !families.value.some(([f]) => f === familyFilter.value)
  ) {
    familyFilter.value = 'all'
  }
})

const columns: ColumnDef<FlatTask>[] = [
  {
    accessorKey: 'nodeName',
    header: 'node',
    cell: ({ row }) =>
      h(EntityChip, {
        kind: 'node',
        label: row.original.nodeName,
        payload: { name: row.original.nodeName, node: row.original.nodeName },
      }),
  },
  {
    accessorKey: 'group',
    header: 'rack',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted' }, row.original.group || '—'),
  },
  {
    accessorKey: 'action',
    header: 'action',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs', title: row.original.taskId }, row.original.action),
  },
  { accessorKey: 'type', header: 'type' },
  {
    accessorKey: 'runningNanos',
    header: 'running',
    cell: ({ row }) =>
      h(
        'span',
        {
          class: [
            'font-mono text-xs',
            row.original.runningNanos > 1e9 ? 'text-yellow' : '',
            row.original.runningNanos > 60e9 ? 'text-red' : '',
          ],
        },
        formatDuration(row.original.runningNanos),
      ),
  },
  {
    accessorKey: 'cancellable',
    header: 'cancel?',
    cell: ({ row }) => (row.original.cancellable ? (row.original.cancelled ? 'cancelled' : 'yes') : '—'),
  },
  {
    accessorKey: 'parentTaskId',
    header: 'parent',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'max-w-[10rem] truncate font-mono text-[10px] text-muted', title: row.original.parentTaskId },
        row.original.parentTaskId || '—',
      ),
  },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <SearchInput
        v-model="search"
        placeholder="Search node / action / rack…"
        :count="rows.length"
        :total="scoped.length"
      />
      <label class="flex items-center gap-1.5 text-xs text-muted">
        <input v-model="hideMonitorNoise" type="checkbox" />
        hide tasks/lists noise
      </label>
      <span class="text-xs text-muted">{{ allRows.length }} raw</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button
        type="button"
        class="rounded border border-border px-2 py-0.5 text-xs"
        :class="familyFilter === 'all' ? 'border-blue text-blue' : ''"
        @click="familyFilter = 'all'"
      >
        all
      </button>
      <button
        v-for="[family, count] in families"
        :key="family"
        type="button"
        class="rounded border border-border px-2 py-0.5 font-mono text-[11px]"
        :class="familyFilter === family ? 'border-blue text-blue' : ''"
        :title="family"
        @click="familyFilter = family"
      >
        {{ family.replace(/^indices:data\//, '').replace(/^cluster:/, '') }}
        <span class="text-muted">{{ count }}</span>
      </button>
    </div>

    <div
      v-if="rows.length === 0"
      class="rounded border border-dashed border-border px-4 py-10 text-center text-sm text-muted"
    >
      No matching tasks
      <span v-if="allRows.length === 0"> — cluster returned an empty task list for this filter</span>
    </div>
    <DataTable v-else :columns="columns" :data="rows" />

    <div>
      <button type="button" class="text-xs text-muted hover:text-text" @click="showRaw = !showRaw">
        {{ showRaw ? 'Hide' : 'Show' }} raw JSON
      </button>
      <JsonPanel v-if="showRaw" class="mt-2" :data="data" />
    </div>
  </div>
</template>
