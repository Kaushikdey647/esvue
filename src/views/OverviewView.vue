<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { useClusterStore } from '@/stores/cluster'
import { useShardsStore } from '@/stores/shards'
import { useEntityActions } from '@/entities/useEntityActions'
import MetricCard from '@/components/ui/MetricCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import type { CatShard } from '@/types/es'

const cluster = useClusterStore()
const shards = useShardsStore()
const router = useRouter()
const { openDetail } = useEntityActions()

const health = computed(() => cluster.health)
const unassignedTop = computed(() => shards.unassigned.slice(0, 10))

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
  { accessorKey: 'state', header: 'state' },
  { accessorKey: 'unassigned.reason', header: 'reason' },
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

function goUnassigned() {
  void router.push({ path: '/shards', query: { state: 'UNASSIGNED' } })
}
function goRelocating() {
  void router.push({ path: '/shards', query: { state: 'RELOCATING' } })
}
function goMaster() {
  if (cluster.master?.node) {
    void openDetail('node', { name: cluster.master.node, node: cluster.master.node })
  }
}
function goIndex(name: string) {
  void openDetail('index', { index: name })
}
function goTasks() {
  void router.push({ path: '/tasks' })
}
function goDisk() {
  void router.push({ path: '/disk' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Overview</h1>
      <StatusBadge
        v-if="health"
        :status="health.status"
        :label="health.status"
      />
    </div>

    <p v-if="cluster.error" class="text-sm text-red">{{ cluster.error }}</p>
    <p v-else-if="cluster.loading && !health" class="text-sm text-muted">Loading cluster…</p>

    <div v-if="health" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Active shards %"
        :value="`${health.active_shards_percent_as_number.toFixed(1)}%`"
        :tone="health.status === 'green' ? 'green' : health.status === 'yellow' ? 'yellow' : 'red'"
      />
      <MetricCard
        label="Unassigned"
        :value="health.unassigned_shards"
        :tone="health.unassigned_shards > 0 ? 'red' : 'green'"
        clickable
        @click="goUnassigned"
      />
      <MetricCard
        label="Relocating"
        :value="health.relocating_shards"
        :tone="health.relocating_shards > 0 ? 'blue' : 'default'"
        clickable
        @click="goRelocating"
      />
      <MetricCard
        label="Pending tasks"
        :value="health.number_of_pending_tasks"
        :tone="health.number_of_pending_tasks > 0 ? 'yellow' : 'default'"
        clickable
        @click="goTasks"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded border border-border bg-surface p-4">
        <div class="text-xs uppercase text-muted">Elected master</div>
        <button
          v-if="cluster.master"
          type="button"
          class="mt-2 font-mono text-sm text-blue hover:underline"
          @click="goMaster"
        >
          {{ cluster.master.node }}
          <span class="text-muted">({{ cluster.master.ip }})</span>
        </button>
        <p v-else class="mt-2 text-sm text-muted">—</p>
      </div>
      <div class="rounded border border-border bg-surface p-4">
        <div class="flex items-center justify-between">
          <div class="text-xs uppercase text-muted">Yellow / red indices</div>
          <button type="button" class="text-xs text-blue" @click="goDisk">Disk</button>
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="idx in cluster.unhealthyIndices"
            :key="idx.name"
            type="button"
            class="rounded border border-border px-2 py-1 font-mono text-xs"
            :class="idx.status === 'red' ? 'text-red' : 'text-yellow'"
            @click="goIndex(idx.name)"
          >
            {{ idx.name }}
          </button>
          <span v-if="cluster.unhealthyIndices.length === 0" class="text-sm text-muted">None</span>
        </div>
      </div>
    </div>

    <section>
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-medium">Unassigned shards</h2>
        <button type="button" class="text-xs text-blue" @click="goUnassigned">View all</button>
      </div>
      <DataTable :columns="columns" :data="unassignedTop" />
    </section>
  </div>
</template>
