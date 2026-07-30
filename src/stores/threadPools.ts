import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as tpApi from '@/api/es/threadPools'
import type { CatThreadPool } from '@/types/es'

export const useThreadPoolsStore = defineStore('threadPools', () => {
  const search = ref<CatThreadPool[]>([])
  const write = ref<CatThreadPool[]>([])
  const refreshPool = ref<CatThreadPool[]>([])
  const flushMerge = ref<CatThreadPool[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const [s, w, r, f] = await Promise.all([
        tpApi.catThreadPool('search'),
        tpApi.catThreadPool('write'),
        tpApi.catThreadPool('refresh'),
        tpApi.catThreadPoolMulti('flush,force_merge'),
      ])
      search.value = s
      write.value = w
      refreshPool.value = r
      flushMerge.value = f
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { search, write, refreshPool, flushMerge, error, loading, refresh }
})
