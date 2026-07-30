import { catJson } from './cat'
import { esGetJson, esGetText } from './client'
import type { CatNode } from '@/types/es'

export async function catNodes(): Promise<CatNode[]> {
  const rows = await catJson(
    '/_cat/nodes?h=name,node.role,master,heap.percent,ram.percent,cpu,load_1m,disk.used_percent,disk.avail,uptime',
  )
  return rows as unknown as CatNode[]
}

export async function catNodeAttrs(): Promise<Array<{ node: string; attr: string; value: string }>> {
  const rows = await catJson('/_cat/nodeattrs?h=node,attr,value')
  return rows.map((r) => ({
    node: r.node ?? '',
    attr: r.attr ?? '',
    value: r.value ?? '',
  }))
}

export function nodesBreakers(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}/stats/breaker?filter_path=nodes.*.name,nodes.*.breakers.parent,nodes.*.breakers.request`,
  )
}

export function nodesSearchStats(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}/stats/indices/search?filter_path=nodes.*.name,nodes.*.indices.search.query_total,nodes.*.indices.search.query_time_in_millis,nodes.*.indices.search.fetch_total,nodes.*.indices.search.fetch_time_in_millis`,
  )
}

export function nodesOpenContexts(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}/stats/indices?filter_path=nodes.*.name,nodes.*.indices.search.open_contexts`,
  )
}

export function nodesStatsOsJvmFs(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}/stats/os,jvm,fs?filter_path=nodes.*.name,nodes.*.os.cpu,nodes.*.jvm.mem.heap_used_percent,nodes.*.fs.total`,
  )
}

export function nodesInfo(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}?filter_path=nodes.*.name,nodes.*.host,nodes.*.ip,nodes.*.version,nodes.*.roles,nodes.*.attributes`,
  )
}

export function nodesThreadPoolStats(node?: string): Promise<unknown> {
  const target = node ? encodeURIComponent(node) : '_all'
  return esGetJson(
    `/_nodes/${target}/stats/thread_pool?filter_path=nodes.*.name,nodes.*.thread_pool.search,nodes.*.thread_pool.write,nodes.*.thread_pool.refresh`,
  )
}

export function hotThreads(node?: string): Promise<string> {
  const target = node ? encodeURIComponent(node) : ''
  const path = target
    ? `/_nodes/${target}/hot_threads?threads=3&type=cpu&ignore_idle_threads=true`
    : '/_nodes/hot_threads?threads=3&type=cpu&ignore_idle_threads=true'
  return esGetText(path)
}

export async function catFielddata(): Promise<Array<Record<string, string>>> {
  return catJson('/_cat/fielddata?h=id,host,ip,node,field,size')
}

