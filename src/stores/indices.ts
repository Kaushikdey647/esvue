import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as indicesApi from '@/api/es/indices'
import type { CatAlias, CatIndex } from '@/types/es'

export const useIndicesStore = defineStore('indices', () => {
  const indices = ref<CatIndex[]>([])
  const aliases = ref<CatAlias[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function refresh(mode: 'products' | 'unhealthy' | 'all' = 'products') {
    loading.value = true
    error.value = null
    try {
      const [idx, als] = await Promise.all([
        mode === 'unhealthy'
          ? indicesApi.catIndices(undefined, { health: 'yellow,red' })
          : mode === 'all'
            ? indicesApi.catIndices(undefined, { sort: 'store.size:desc' })
            : indicesApi.catIndices('products*'),
        indicesApi.catAliases('products_live_*'),
      ])
      indices.value = idx
      aliases.value = als
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function resolveAlias(alias: string) {
    return indicesApi.catAliases(alias)
  }

  return { indices, aliases, error, loading, refresh, resolveAlias }
})
