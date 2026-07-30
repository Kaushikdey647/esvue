<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as indicesApi from '@/api/es/indices'
import { useConnectionStore } from '@/stores/connection'
import { useEntityActions } from '@/entities/useEntityActions'
import MetricCard from '@/components/ui/MetricCard.vue'
import RelatedLinks from '@/components/ui/RelatedLinks.vue'
import EntityChip from '@/components/ui/EntityChip.vue'
import type { CatAlias, CatIndex } from '@/types/es'

const route = useRoute()
const connection = useConnectionStore()
const { openDetail } = useEntityActions()

const alias = computed(() => decodeURIComponent(String(route.params.alias ?? '')))

const loading = ref(false)
const error = ref<string | null>(null)
const rows = ref<CatAlias[]>([])
const backingIndices = ref<CatIndex[]>([])

const primaryIndex = computed(() => rows.value[0]?.index ?? '')

const links = computed(() => {
  const idx = primaryIndex.value
  return [
    ...(idx
      ? [
          { to: { name: 'entity-index', params: { index: idx } }, label: `Index dashboard · ${idx}` },
          { to: { path: '/shards', query: { index: idx } }, label: 'Shards for backing index' },
          { to: { path: '/disk', query: { index: idx } }, label: 'Disk / recovery' },
          { to: { path: '/explain', query: { index: idx, shard: '0', primary: 'false' } }, label: 'Explain template' },
        ]
      : []),
    { to: { path: '/indices', query: { tab: 'aliases', pattern: 'products_live_*' } }, label: 'products_live_* aliases' },
    { to: { path: '/indices', query: { tab: 'aliases' } }, label: 'Aliases table' },
  ]
})

async function load() {
  if (!alias.value) return
  loading.value = true
  error.value = null
  connection.setAlias(alias.value)
  try {
    const resolved = await indicesApi.catAliases(alias.value)
    rows.value = resolved
    const names = [...new Set(resolved.map((r) => r.index).filter(Boolean))]
    if (names[0]) connection.setIndex(names[0])
    const all = await indicesApi.catIndices()
    backingIndices.value = all.filter((i) => names.includes(i.index))
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(alias, () => void load(), { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start gap-3">
      <div>
        <div class="text-xs uppercase tracking-wide text-muted">Alias</div>
        <h1 class="font-mono text-xl font-semibold">{{ alias }}</h1>
        <p class="mt-1 text-sm text-muted">
          Resolves via <span class="font-mono">_cat/aliases/{{ alias }}</span>
        </p>
      </div>
      <button type="button" class="ml-auto rounded border border-border px-2 py-1 text-xs" :disabled="loading" @click="load">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <p v-else-if="loading && rows.length === 0" class="text-sm text-muted">Resolving alias…</p>

    <div v-if="primaryIndex" class="grid gap-3 sm:grid-cols-2">
      <MetricCard label="Backing index" :value="primaryIndex" tone="blue" clickable @click="openDetail('index', { index: primaryIndex })" />
      <MetricCard label="Targets" :value="rows.length" />
    </div>

    <section class="space-y-3">
      <h2 class="text-sm font-medium">Backing indices</h2>
      <div
        v-for="idx in backingIndices"
        :key="idx.index"
        class="rounded border border-border bg-surface p-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <EntityChip kind="index" :label="idx.index" :payload="{ index: idx.index }" />
          <span class="font-mono text-xs" :class="{
            'text-green': idx.health === 'green',
            'text-yellow': idx.health === 'yellow',
            'text-red': idx.health === 'red',
          }">{{ idx.health }}</span>
          <span class="font-mono text-xs text-muted">docs {{ idx['docs.count'] }}</span>
          <span class="font-mono text-xs text-muted">store {{ idx['store.size'] }}</span>
          <span class="font-mono text-xs text-muted">pri/rep {{ idx.pri }}/{{ idx.rep }}</span>
        </div>
      </div>
      <p v-if="!loading && backingIndices.length === 0" class="text-sm text-muted">
        No backing index found for this alias.
      </p>
    </section>

    <div v-if="rows.length" class="rounded border border-border bg-surface p-4">
      <div class="text-xs uppercase text-muted">Alias rows</div>
      <ul class="mt-2 space-y-1 font-mono text-xs text-muted">
        <li v-for="(r, i) in rows" :key="i">
          {{ r.alias }} → {{ r.index }}
          <span v-if="r.is_write_index"> (write={{ r.is_write_index }})</span>
        </li>
      </ul>
    </div>

    <RelatedLinks :links="links" />
  </div>
</template>
