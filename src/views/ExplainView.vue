<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'
import * as allocationApi from '@/api/es/allocation'
import ExplainResult from '@/components/ui/ExplainResult.vue'

const connection = useConnectionStore()
const route = useRoute()

const index = ref(connection.esIndex)
const shard = ref(0)
const primary = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<unknown>(null)

const presets = [
  { label: 'misc shard 3', index: 'products_v3_misc', shard: 3, primary: false },
  { label: 'kids_toys (unassigned)', index: 'products_v3_kids_toys', shard: 0, primary: false },
  { label: 'kitchen_appliances (unassigned)', index: 'products_v3_kitchen_appliances', shard: 0, primary: false },
]

watch(
  () => route.query,
  (q) => {
    if (typeof q.index === 'string') index.value = q.index
    if (typeof q.shard === 'string') shard.value = Number(q.shard) || 0
    if (typeof q.primary === 'string') primary.value = q.primary === 'true'
    if (typeof q.index === 'string') void run()
  },
  { immediate: true },
)

function applyPreset(p: (typeof presets)[number]) {
  index.value = p.index
  shard.value = p.shard
  primary.value = p.primary
  void run()
}

async function run() {
  loading.value = true
  error.value = null
  try {
    result.value = await allocationApi.allocationExplain({
      index: index.value,
      shard: shard.value,
      primary: primary.value,
    })
  } catch (e) {
    result.value = null
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold">Allocation Explain</h1>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="p in presets"
        :key="p.label"
        type="button"
        class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
      <button
        type="button"
        class="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
        @click="index = connection.esIndex; shard = 0; primary = false; run()"
      >
        template ({{ connection.esIndex }})
      </button>
    </div>

    <form
      class="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-3"
      @submit.prevent="run"
    >
      <label class="text-xs text-muted">
        index
        <input
          v-model="index"
          class="mt-1 block rounded border border-border bg-bg px-2 py-1 font-mono text-sm"
        />
      </label>
      <label class="text-xs text-muted">
        shard
        <input
          v-model.number="shard"
          type="number"
          class="mt-1 block w-20 rounded border border-border bg-bg px-2 py-1 font-mono text-sm"
        />
      </label>
      <label class="flex items-center gap-2 pb-1 text-xs text-muted">
        <input v-model="primary" type="checkbox" />
        primary
      </label>
      <button
        type="submit"
        class="rounded bg-blue px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? 'Explaining…' : 'Explain' }}
      </button>
    </form>

    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-muted">Loading allocation explain…</p>
    <ExplainResult v-else-if="result" :data="result" />
  </div>
</template>
