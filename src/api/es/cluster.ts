import { catJson } from './cat'
import { esGetJson } from './client'
import type { CatMaster, ClusterHealth, ClusterPing, DiskWatermarks } from '@/types/es'

export function ping(): Promise<ClusterPing> {
  return esGetJson<ClusterPing>('/')
}

export function clusterHealth(level?: 'cluster' | 'indices' | 'shards', index?: string): Promise<ClusterHealth> {
  const base = index ? `/_cluster/health/${encodeURIComponent(index)}` : '/_cluster/health'
  const params = new URLSearchParams({ pretty: 'true' })
  if (level) params.set('level', level)
  return esGetJson<ClusterHealth>(`${base}?${params}`)
}

export async function catMaster(): Promise<CatMaster | null> {
  const rows = await catJson('/_cat/master?h=id,host,ip,node')
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id ?? '',
    host: row.host ?? '',
    ip: row.ip ?? '',
    node: row.node ?? '',
  }
}

export function pendingTasks(): Promise<unknown> {
  return esGetJson('/_cluster/pending_tasks?pretty=true')
}

export function clusterStateMaster(): Promise<unknown> {
  return esGetJson('/_cluster/state?filter_path=cluster_name,master_node,version')
}

export function clusterStateBlocks(): Promise<unknown> {
  return esGetJson('/_cluster/state?filter_path=blocks')
}

export function clusterStats(): Promise<unknown> {
  return esGetJson(
    '/_cluster/stats?filter_path=_nodes,cluster_name,status,indices.shards,indices.docs,indices.store',
  )
}

export async function diskWatermarks(): Promise<DiskWatermarks> {
  const data = await esGetJson<{
    defaults?: {
      cluster?: {
        routing?: {
          allocation?: {
            disk?: {
              watermark?: DiskWatermarks
            }
          }
        }
      }
    }
    persistent?: { cluster?: { routing?: { allocation?: { disk?: { watermark?: DiskWatermarks } } } } }
    transient?: { cluster?: { routing?: { allocation?: { disk?: { watermark?: DiskWatermarks } } } } }
  }>(
    '/_cluster/settings?include_defaults=true&filter_path=persistent,transient,defaults.cluster.routing.allocation.disk',
  )

  return (
    data.transient?.cluster?.routing?.allocation?.disk?.watermark ??
    data.persistent?.cluster?.routing?.allocation?.disk?.watermark ??
    data.defaults?.cluster?.routing?.allocation?.disk?.watermark ??
    { low: '85%', high: '90%', flood_stage: '95%' }
  )
}

export function votingConfigExclusions(): Promise<unknown> {
  return esGetJson(
    '/_cluster/state?filter_path=metadata.cluster_coordination.voting_config_exclusions,metadata.cluster_coordination.last_committed_config',
  )
}
