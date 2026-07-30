import { useConnectionStore } from '@/stores/connection'
import { useClusterStore } from '@/stores/cluster'
import { useNodesStore } from '@/stores/nodes'
import { useShardsStore } from '@/stores/shards'
import { useAllocationStore } from '@/stores/allocation'
import { useThreadPoolsStore } from '@/stores/threadPools'
import { useIndicesStore } from '@/stores/indices'

export function useClusterRefresh() {
  const connection = useConnectionStore()
  const cluster = useClusterStore()
  const nodes = useNodesStore()
  const shards = useShardsStore()
  const allocation = useAllocationStore()
  const threadPools = useThreadPoolsStore()
  const indices = useIndicesStore()

  async function refreshAll() {
    await Promise.allSettled([
      cluster.refresh(),
      nodes.refresh(),
      shards.refresh(),
      allocation.refresh(connection.esIndex),
      threadPools.refresh(),
      indices.refresh('products'),
    ])
    connection.markRefreshed()
  }

  return { refreshAll }
}
