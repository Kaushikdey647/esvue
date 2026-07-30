import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as nodesApi from '@/api/es/nodes'
import type { CatNode } from '@/types/es'

export const useNodesStore = defineStore('nodes', () => {
  const nodes = ref<CatNode[]>([])
  const attrs = ref<Array<{ node: string; attr: string; value: string }>>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  const nodesWithGroup = computed(() => {
    const groupByNode = new Map(
      attrs.value.filter((a) => a.attr === 'group').map((a) => [a.node, a.value]),
    )
    return nodes.value.map((n) => ({
      ...n,
      group: groupByNode.get(n.name) ?? '',
    }))
  })

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const [n, a] = await Promise.all([nodesApi.catNodes(), nodesApi.catNodeAttrs()])
      nodes.value = n
      attrs.value = a
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { nodes, attrs, nodesWithGroup, error, loading, refresh }
})
