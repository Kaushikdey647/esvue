<script setup lang="ts">
import { computed } from 'vue'
import { parseIndexAllocationSettings } from '@/utils/indexSettings'
import MetricCard from '@/components/ui/MetricCard.vue'

const props = defineProps<{
  data: unknown
  indexName?: string
}>()

const parsed = computed(() => parseIndexAllocationSettings(props.data, props.indexName))

const filterGroups = computed(() => {
  if (!parsed.value) return []
  return (
    [
      { key: 'include', label: 'include', hint: 'shard may only land on matching nodes', entries: parsed.value.routing.include },
      { key: 'require', label: 'require', hint: 'must match all', entries: parsed.value.routing.require },
      { key: 'exclude', label: 'exclude', hint: 'must not match', entries: parsed.value.routing.exclude },
    ] as const
  ).filter((g) => Object.keys(g.entries).length > 0)
})

const replicaTone = computed(() => {
  const n = Number(parsed.value?.numberOfReplicas)
  if (!Number.isFinite(n)) return 'default' as const
  if (n >= 3) return 'yellow' as const
  return 'default' as const
})
</script>

<template>
  <div v-if="parsed" class="space-y-4 rounded border border-border bg-surface p-4">
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="text-xs uppercase tracking-wide text-muted">Replica / allocation settings</h3>
      <span class="font-mono text-[11px] text-muted">{{ parsed.indexName }}</span>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <MetricCard label="number_of_shards" :value="parsed.numberOfShards ?? '—'" />
      <MetricCard
        label="number_of_replicas"
        :value="parsed.numberOfReplicas ?? '—'"
        :tone="replicaTone"
        :hint="
          Number(parsed.numberOfReplicas) > 0
            ? 'replicas need enough matching nodes in the allocation filter'
            : undefined
        "
      />
    </div>

    <div v-if="filterGroups.length" class="space-y-3">
      <div
        v-for="group in filterGroups"
        :key="group.key"
        class="rounded border border-border/80 bg-bg p-3"
      >
        <div class="mb-2 flex items-baseline gap-2">
          <span class="font-mono text-xs text-blue">index.routing.allocation.{{ group.label }}</span>
          <span class="text-[11px] text-muted">{{ group.hint }}</span>
        </div>
        <dl class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="(value, key) in group.entries"
            :key="`${group.key}-${key}`"
            class="flex items-center justify-between gap-3 rounded border border-border px-3 py-2"
          >
            <dt class="font-mono text-xs text-muted">{{ key }}</dt>
            <dd
              class="font-mono text-sm font-medium"
              :class="key === 'group' ? 'text-yellow' : 'text-text'"
            >
              {{ value }}
            </dd>
          </div>
        </dl>
        <p v-if="group.entries.group" class="mt-2 text-xs text-muted">
          Rack pin <span class="font-mono text-yellow">{{ group.entries.group }}</span>
          — unassigned replicas usually mean fewer live nodes in this group than
          <span class="font-mono">1 + replicas</span>.
        </p>
      </div>
    </div>

    <p v-else class="text-sm text-muted">No routing.allocation include/require/exclude filters.</p>
  </div>
  <div v-else class="rounded border border-border bg-surface p-4 text-sm text-muted">
    No allocation settings returned.
  </div>
</template>
