<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import TasksTable from '@/components/ui/TasksTable.vue'

const tasks = useTasksStore()
const route = useRoute()
const kind = ref<'all' | 'reindex' | 'bulk' | 'recovery'>('all')

watch(
  () => route.query.action,
  (a) => {
    if (a === 'reindex' || a === 'bulk' || a === 'recovery') kind.value = a
    void tasks.refresh(kind.value)
  },
  { immediate: true },
)

function setKind(k: typeof kind.value) {
  kind.value = k
  void tasks.refresh(k)
}

const kindHints: Record<typeof kind.value, string> = {
  all: 'All in-flight cluster tasks (noisy — hide tasks/lists by default)',
  reindex: 'Active reindex jobs (Minivet sync shows here when running)',
  bulk: 'Active bulk write tasks',
  recovery: 'Active shard recovery tasks',
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold">Tasks & Background Jobs</h1>
      <p class="mt-1 text-sm text-muted">{{ kindHints[kind] }}</p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="k in (['all', 'reindex', 'bulk', 'recovery'] as const)"
        :key="k"
        type="button"
        class="rounded border border-border px-2.5 py-1 text-xs"
        :class="kind === k ? 'border-blue text-blue' : ''"
        @click="setKind(k)"
      >
        {{ k }}
      </button>
      <button
        type="button"
        class="ml-auto rounded border border-border px-2.5 py-1 text-xs hover:bg-surface-2"
        :disabled="tasks.loading"
        @click="tasks.refresh(kind)"
      >
        {{ tasks.loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="tasks.error" class="text-sm text-red">{{ tasks.error }}</p>
    <p v-else-if="tasks.loading && !tasks.data" class="text-sm text-muted">Loading tasks…</p>
    <TasksTable v-else-if="tasks.data" :data="tasks.data" />
  </div>
</template>
