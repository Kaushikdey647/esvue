<script setup lang="ts" generic="T">
import { FlexRender, getCoreRowModel, getSortedRowModel, useVueTable, type ColumnDef, type SortingState } from '@tanstack/vue-table'
import { ref, computed } from 'vue'

const props = defineProps<{
  columns: ColumnDef<T, unknown>[]
  data: T[]
  rowClass?: (row: T) => string
}>()

const sorting = ref<SortingState>([])

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

const rows = computed(() => table.getRowModel().rows)
</script>

<template>
  <div class="overflow-auto rounded border border-border">
    <table class="min-w-full border-collapse text-left text-sm">
      <thead class="sticky top-0 z-10 bg-surface-2">
        <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="border-b border-border px-3 py-2 font-medium text-muted"
            :class="{ 'cursor-pointer select-none hover:text-text': header.column.getCanSort() }"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
            <span v-if="header.column.getIsSorted() === 'asc'" class="ml-1">↑</span>
            <span v-else-if="header.column.getIsSorted() === 'desc'" class="ml-1">↓</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-b border-border/60 hover:bg-surface-2/60"
          :class="rowClass?.(row.original)"
        >
          <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-3 py-2 align-middle">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="px-3 py-8 text-center text-muted">No rows</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
