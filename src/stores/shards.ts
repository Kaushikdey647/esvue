import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as shardsApi from '@/api/es/shards'
import type { CatShard } from '@/types/es'

export const useShardsStore = defineStore('shards', () => {
  const shards = ref<CatShard[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  const unassigned = computed(() => shards.value.filter((s) => s.state === 'UNASSIGNED'))

  async function refresh(index?: string) {
    loading.value = true
    error.value = null
    try {
      shards.value = await shardsApi.catShards(index)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { shards, unassigned, error, loading, refresh }
})
