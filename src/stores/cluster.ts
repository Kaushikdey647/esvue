import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as clusterApi from '@/api/es/cluster'
import type { CatMaster, ClusterHealth } from '@/types/es'

export const useClusterStore = defineStore('cluster', () => {
  const health = ref<ClusterHealth | null>(null)
  const healthIndices = ref<ClusterHealth | null>(null)
  const master = ref<CatMaster | null>(null)
  const pending = ref<unknown>(null)
  const blocks = ref<unknown>(null)
  const stats = ref<unknown>(null)
  const watermarks = ref<{ low?: string; high?: string; flood_stage?: string } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const unhealthyIndices = computed(() => {
    const indices = healthIndices.value?.indices ?? {}
    return Object.entries(indices)
      .filter(([, v]) => v.status === 'yellow' || v.status === 'red')
      .map(([name, v]) => ({ name, status: v.status, unassigned: v.unassigned_shards }))
  })

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const [h, hi, m, p, b, s, w] = await Promise.all([
        clusterApi.clusterHealth(),
        clusterApi.clusterHealth('indices'),
        clusterApi.catMaster(),
        clusterApi.pendingTasks(),
        clusterApi.clusterStateBlocks().catch(() => null),
        clusterApi.clusterStats().catch(() => null),
        clusterApi.diskWatermarks().catch(() => null),
      ])
      health.value = h
      healthIndices.value = hi
      master.value = m
      pending.value = p
      blocks.value = b
      stats.value = s
      watermarks.value = w
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return {
    health,
    healthIndices,
    master,
    pending,
    blocks,
    stats,
    watermarks,
    error,
    loading,
    unhealthyIndices,
    refresh,
  }
})
