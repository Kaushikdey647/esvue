export type CatRow = Record<string, string>

export interface ClusterHealth {
  cluster_name: string
  status: 'green' | 'yellow' | 'red'
  timed_out: boolean
  number_of_nodes: number
  number_of_data_nodes: number
  active_primary_shards: number
  active_shards: number
  relocating_shards: number
  initializing_shards: number
  unassigned_shards: number
  delayed_unassigned_shards: number
  number_of_pending_tasks: number
  number_of_in_flight_fetch: number
  task_max_waiting_in_queue_millis: number
  active_shards_percent_as_number: number
  indices?: Record<
    string,
    {
      status: string
      number_of_shards: number
      number_of_replicas: number
      active_primary_shards: number
      active_shards: number
      relocating_shards: number
      initializing_shards: number
      unassigned_shards: number
    }
  >
}

export interface ClusterPing {
  name: string
  cluster_name: string
  cluster_uuid: string
  version: {
    number: string
    build_flavor?: string
    lucene_version?: string
  }
  tagline: string
}

export interface CatNode {
  name: string
  'node.role': string
  master: string
  'heap.percent': string
  'ram.percent'?: string
  cpu: string
  load_1m: string
  'disk.used_percent': string
  'disk.avail': string
  uptime: string
  group?: string
}

export interface CatShard {
  index: string
  shard: string
  prirep: string
  state: string
  'unassigned.reason'?: string
  docs?: string
  store?: string
  node?: string
}

export interface CatAllocation {
  node: string
  shards: string
  'disk.indices': string
  'disk.used': string
  'disk.avail': string
  'disk.percent': string
  'disk.total'?: string
}

export interface CatThreadPool {
  node_name: string
  name?: string
  active: string
  queue: string
  rejected: string
  completed?: string
}

export interface CatIndex {
  index: string
  health: string
  status?: string
  pri: string
  rep: string
  'docs.count': string
  'store.size': string
  'creation.date.string'?: string
}

export interface CatAlias {
  alias: string
  index: string
  filter?: string
  'routing.index'?: string
  'routing.search'?: string
  is_write_index?: string
}

export interface CatMaster {
  id: string
  host: string
  ip: string
  node: string
}

export interface CatRecovery {
  index: string
  shard: string
  time: string
  type: string
  stage: string
  source_host: string
  target_host: string
  files_percent: string
  bytes_percent: string
}

export interface CatSegment {
  index: string
  shard: string
  segment: string
  size: string
  'docs.count': string
}

export interface AllocationExplainRequest {
  index: string
  shard: number
  primary: boolean
}

export interface DiskWatermarks {
  low?: string
  high?: string
  flood_stage?: string
}
