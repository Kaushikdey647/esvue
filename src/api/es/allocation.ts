import { catJson } from './cat'
import { esPostJson } from './client'
import type {
  AllocationExplainRequest,
  CatAllocation,
  CatRecovery,
  CatSegment,
} from '@/types/es'

export async function catAllocation(): Promise<CatAllocation[]> {
  return (await catJson(
    '/_cat/allocation?h=node,shards,disk.indices,disk.used,disk.avail,disk.percent&s=disk.avail:asc',
  )) as unknown as CatAllocation[]
}

export async function catRecovery(index?: string): Promise<CatRecovery[]> {
  const path = index
    ? `/_cat/recovery/${encodeURIComponent(index)}?h=index,shard,time,type,stage,source_host,target_host,files_percent,bytes_percent`
    : '/_cat/recovery?h=index,shard,time,type,stage,source_host,target_host,files_percent,bytes_percent'
  return (await catJson(path)) as unknown as CatRecovery[]
}

export async function catSegments(index?: string): Promise<CatSegment[]> {
  const path = index
    ? `/_cat/segments/${encodeURIComponent(index)}?h=index,shard,segment,size,docs.count&s=size:desc`
    : '/_cat/segments?h=index,shard,segment,size,docs.count&s=size:desc&bytes=gb'
  return (await catJson(path)) as unknown as CatSegment[]
}

export function allocationExplain(body: AllocationExplainRequest): Promise<unknown> {
  return esPostJson('/_cluster/allocation/explain?pretty=true', body)
}
