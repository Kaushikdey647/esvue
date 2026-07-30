import { catJson } from './cat'
import { esGetJson } from './client'
import type { CatShard } from '@/types/es'

export async function catShards(index?: string): Promise<CatShard[]> {
  const path = index
    ? `/_cat/shards/${encodeURIComponent(index)}?h=index,shard,prirep,state,unassigned.reason,docs,store,node&bytes=gb`
    : '/_cat/shards?h=index,shard,prirep,state,unassigned.reason,docs,store,node'
  return (await catJson(path)) as unknown as CatShard[]
}

export function routingTable(index: string): Promise<unknown> {
  return esGetJson(`/_cluster/state/routing_table/${encodeURIComponent(index)}?pretty=true`)
}

export function indexReplicaSettings(index: string): Promise<unknown> {
  return esGetJson(
    `/${encodeURIComponent(index)}/_settings?filter_path=*.settings.index.number_of_shards,*.settings.index.number_of_replicas,*.settings.index.routing.allocation`,
  )
}
