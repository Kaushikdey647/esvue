import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as allocationApi from '@/api/es/allocation'
import type { CatAllocation, CatRecovery, CatSegment } from '@/types/es'

export const useAllocationStore = defineStore('allocation', () => {
  const allocation = ref<CatAllocation[]>([])
  const recovery = ref<CatRecovery[]>([])
  const segments = ref<CatSegment[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function refresh(index?: string) {
    loading.value = true
    error.value = null
    try {
      const [a, r, s] = await Promise.all([
        allocationApi.catAllocation(),
        allocationApi.catRecovery(index),
        allocationApi.catSegments(index),
      ])
      allocation.value = a
      recovery.value = r
      segments.value = s
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { allocation, recovery, segments, error, loading, refresh }
})
