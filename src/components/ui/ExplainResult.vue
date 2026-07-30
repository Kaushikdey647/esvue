<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from '@/components/tables/DataTable.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import JsonPanel from '@/components/ui/JsonPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { AllocationExplainResult, NodeAllocationDecision } from '@/utils/esFormat'
import { decisionTone } from '@/utils/esFormat'
import { matchesSearch } from '@/utils/search'

const props = defineProps<{ data: unknown }>()

const showRaw = ref(false)
const nodeFilter = ref<'all' | 'no' | 'yes' | 'throttle'>('all')
const nodeSearch = ref('')
const expanded = ref<string | null>(null)

const explain = computed(() => props.data as AllocationExplainResult | null)

const stateTone = computed(() => {
  const s = explain.value?.current_state
  if (s === 'started') return 'green' as const
  if (s === 'unassigned') return 'red' as const
  if (s === 'relocating' || s === 'initializing') return 'yellow' as const
  return 'unknown' as const
})

const primaryDecision = computed(() => {
  const e = explain.value
  if (!e) return null
  if (e.can_allocate != null) return { label: 'can_allocate', value: e.can_allocate }
  if (e.can_remain_on_current_node != null)
    return { label: 'can_remain', value: e.can_remain_on_current_node }
  return null
})

const explanationText = computed(
  () => explain.value?.allocate_explanation ?? explain.value?.rebalance_explanation ?? '',
)

const decisionScoped = computed(() => {
  const rows = explain.value?.node_allocation_decisions ?? []
  if (nodeFilter.value === 'all') return rows
  return rows.filter((r) => r.node_decision?.toLowerCase() === nodeFilter.value)
})

const nodeRows = computed(() =>
  decisionScoped.value.filter((r) =>
    matchesSearch(
      nodeSearch.value,
      r.node_name,
      r.node_decision,
      r.node_attributes?.group,
      r.transport_address,
      ...(r.deciders ?? []).flatMap((d) => [d.decider, d.decision, d.explanation]),
    ),
  ),
)

const decisionCounts = computed(() => {
  const rows = explain.value?.node_allocation_decisions ?? []
  const counts = { yes: 0, no: 0, throttle: 0, other: 0 }
  for (const r of rows) {
    const d = r.node_decision?.toLowerCase()
    if (d === 'yes') counts.yes++
    else if (d === 'no') counts.no++
    else if (d === 'throttle') counts.throttle++
    else counts.other++
  }
  return counts
})

function primaryReason(row: NodeAllocationDecision): string {
  const nos = (row.deciders ?? []).filter((d) => d.decision?.toUpperCase() === 'NO')
  const first = nos[0] ?? row.deciders?.[0]
  if (!first) return '—'
  return `${first.decider}: ${first.explanation}`
}

const columns: ColumnDef<NodeAllocationDecision>[] = [
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
  {
    id: 'group',
    header: 'rack',
    accessorFn: (r) => r.node_attributes?.group ?? '',
    cell: ({ getValue }) => h('span', { class: 'font-mono text-xs' }, String(getValue() || '—')),
  },
  {
    accessorKey: 'node_decision',
    header: 'decision',
    cell: ({ row }) => {
      const d = row.original.node_decision
      const tone = decisionTone(d)
      return h(
        'span',
        {
          class: [
            'rounded px-1.5 py-0.5 font-mono text-xs uppercase',
            tone === 'green' && 'bg-green/15 text-green',
            tone === 'red' && 'bg-red/15 text-red',
            tone === 'yellow' && 'bg-yellow/15 text-yellow',
            tone === 'muted' && 'bg-surface-2 text-muted',
          ],
        },
        d,
      )
    },
  },
  {
    id: 'reason',
    header: 'primary reason',
    cell: ({ row }) =>
      h(
        'button',
        {
          type: 'button',
          class: 'max-w-xl truncate text-left font-mono text-xs text-muted hover:text-text',
          title: primaryReason(row.original),
          onClick: () => {
            const id = row.original.node_id
            expanded.value = expanded.value === id ? null : id
          },
        },
        primaryReason(row.original),
      ),
  },
]
</script>

<template>
  <div v-if="explain" class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded border border-border bg-surface p-3">
        <div class="text-[10px] uppercase tracking-wide text-muted">Shard</div>
        <div class="mt-1 font-mono text-sm">
          {{ explain.index }}
          <span class="text-muted">[{{ explain.shard }}]</span>
          <span class="ml-1 text-xs text-muted">{{ explain.primary ? 'primary' : 'replica' }}</span>
        </div>
      </div>
      <div class="rounded border border-border bg-surface p-3">
        <div class="text-[10px] uppercase tracking-wide text-muted">State</div>
        <div class="mt-1">
          <StatusBadge :status="stateTone" :label="explain.current_state" />
        </div>
      </div>
      <div class="rounded border border-border bg-surface p-3">
        <div class="text-[10px] uppercase tracking-wide text-muted">
          {{ primaryDecision?.label ?? 'decision' }}
        </div>
        <div
          class="mt-1 font-mono text-lg uppercase"
          :class="{
            'text-green': decisionTone(primaryDecision?.value) === 'green',
            'text-red': decisionTone(primaryDecision?.value) === 'red',
            'text-yellow': decisionTone(primaryDecision?.value) === 'yellow',
          }"
        >
          {{ primaryDecision?.value ?? '—' }}
        </div>
      </div>
      <div class="rounded border border-border bg-surface p-3">
        <div class="text-[10px] uppercase tracking-wide text-muted">Current node</div>
        <div class="mt-1 truncate font-mono text-sm">
          <EntityChip
            v-if="explain.current_node?.name"
            kind="node"
            :label="explain.current_node.name"
            :payload="{ name: explain.current_node.name, node: explain.current_node.name }"
          />
          <span v-else class="text-muted">none</span>
          <span v-if="explain.current_node?.attributes?.group" class="ml-2 text-xs text-muted">
            {{ explain.current_node.attributes.group }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="explain.unassigned_info"
      class="rounded border border-red/40 bg-red/10 p-3 text-sm"
    >
      <div class="font-medium text-red">Unassigned</div>
      <div class="mt-1 grid gap-1 font-mono text-xs text-text sm:grid-cols-2">
        <div>reason: {{ explain.unassigned_info.reason }}</div>
        <div>at: {{ explain.unassigned_info.at }}</div>
        <div class="sm:col-span-2">details: {{ explain.unassigned_info.details }}</div>
        <div class="sm:col-span-2">
          last_allocation_status: {{ explain.unassigned_info.last_allocation_status }}
        </div>
      </div>
    </div>

    <p v-if="explanationText" class="rounded border border-border bg-surface p-3 text-sm leading-relaxed text-muted">
      {{ explanationText }}
    </p>

    <div
      v-if="explain.can_rebalance_cluster_decisions?.length"
      class="rounded border border-border bg-surface p-3"
    >
      <div class="mb-2 text-xs uppercase tracking-wide text-muted">
        Cluster rebalance —
        <span
          class="font-mono normal-case"
          :class="decisionTone(explain.can_rebalance_cluster) === 'red' ? 'text-red' : 'text-green'"
        >
          {{ explain.can_rebalance_cluster }}
        </span>
      </div>
      <ul class="space-y-2">
        <li
          v-for="(d, i) in explain.can_rebalance_cluster_decisions"
          :key="i"
          class="font-mono text-xs"
        >
          <span
            class="mr-2 rounded px-1 uppercase"
            :class="d.decision === 'NO' ? 'bg-red/15 text-red' : 'bg-green/15 text-green'"
          >{{ d.decision }}</span>
          <span class="text-blue">{{ d.decider }}</span>
          <span class="text-muted"> — {{ d.explanation }}</span>
        </li>
      </ul>
    </div>

    <section class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-sm font-medium">Node decisions</h3>
        <SearchInput
          v-model="nodeSearch"
          placeholder="Search node, rack, reason…"
          :count="nodeRows.length"
          :total="decisionScoped.length"
        />
        <div class="ml-auto flex flex-wrap gap-1 text-xs">
          <button
            type="button"
            class="rounded border border-border px-2 py-0.5"
            :class="nodeFilter === 'all' ? 'border-blue text-blue' : ''"
            @click="nodeFilter = 'all'"
          >
            all {{ (explain.node_allocation_decisions ?? []).length }}
          </button>
          <button
            type="button"
            class="rounded border border-border px-2 py-0.5 text-red"
            :class="nodeFilter === 'no' ? 'border-red' : ''"
            @click="nodeFilter = 'no'"
          >
            no {{ decisionCounts.no }}
          </button>
          <button
            type="button"
            class="rounded border border-border px-2 py-0.5 text-green"
            :class="nodeFilter === 'yes' ? 'border-green' : ''"
            @click="nodeFilter = 'yes'"
          >
            yes {{ decisionCounts.yes }}
          </button>
          <button
            v-if="decisionCounts.throttle"
            type="button"
            class="rounded border border-border px-2 py-0.5 text-yellow"
            :class="nodeFilter === 'throttle' ? 'border-yellow' : ''"
            @click="nodeFilter = 'throttle'"
          >
            throttle {{ decisionCounts.throttle }}
          </button>
        </div>
      </div>

      <DataTable :columns="columns" :data="nodeRows" />

      <div
        v-if="expanded"
        class="rounded border border-border bg-bg p-3"
      >
        <div class="mb-2 text-xs uppercase text-muted">All deciders</div>
        <ul
          v-for="row in nodeRows.filter((r) => r.node_id === expanded)"
          :key="row.node_id"
          class="space-y-2"
        >
          <li
            v-for="(d, i) in row.deciders ?? []"
            :key="i"
            class="font-mono text-xs"
          >
            <span
              class="mr-2 rounded px-1 uppercase"
              :class="d.decision === 'NO' ? 'bg-red/15 text-red' : 'bg-green/15 text-green'"
            >{{ d.decision }}</span>
            <span class="text-blue">{{ d.decider }}</span>
            <span class="text-muted"> — {{ d.explanation }}</span>
          </li>
        </ul>
      </div>
    </section>

    <div>
      <button
        type="button"
        class="text-xs text-muted hover:text-text"
        @click="showRaw = !showRaw"
      >
        {{ showRaw ? 'Hide' : 'Show' }} raw JSON
      </button>
      <JsonPanel v-if="showRaw" class="mt-2" :data="explain" />
    </div>
  </div>
</template>
