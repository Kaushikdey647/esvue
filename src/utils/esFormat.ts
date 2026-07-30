export interface AllocationDecider {
  decider: string
  decision: string
  explanation: string
}

export interface NodeAllocationDecision {
  node_id: string
  node_name: string
  transport_address?: string
  node_attributes?: Record<string, string>
  roles?: string[]
  node_decision: string
  weight_ranking?: number
  deciders?: AllocationDecider[]
}

export interface AllocationExplainResult {
  index: string
  shard: number
  primary: boolean
  current_state: string
  current_node?: {
    id: string
    name: string
    transport_address?: string
    attributes?: Record<string, string>
    roles?: string[]
    weight_ranking?: number
  }
  unassigned_info?: {
    reason?: string
    at?: string
    details?: string
    last_allocation_status?: string
  }
  can_allocate?: string
  allocate_explanation?: string
  can_remain_on_current_node?: string
  can_rebalance_cluster?: string
  can_rebalance_cluster_decisions?: AllocationDecider[]
  can_rebalance_to_other_node?: string
  rebalance_explanation?: string
  node_allocation_decisions?: NodeAllocationDecision[]
  [key: string]: unknown
}

export interface FlatTask {
  taskId: string
  nodeId: string
  nodeName: string
  host: string
  group: string
  id: number
  type: string
  action: string
  actionFamily: string
  startTimeMs: number
  runningNanos: number
  cancellable: boolean
  cancelled: boolean
  parentTaskId: string
}

export function actionFamily(action: string): string {
  const base = action.split('[')[0] ?? action
  return base
}

export function formatDuration(nanos: number): string {
  if (!Number.isFinite(nanos) || nanos < 0) return '—'
  const ms = nanos / 1e6
  if (ms < 1) return `${(nanos / 1e3).toFixed(0)}µs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = s / 60
  if (m < 60) return `${m.toFixed(1)}m`
  const h = m / 60
  if (h < 48) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function flattenTasksResponse(data: unknown): FlatTask[] {
  if (!data || typeof data !== 'object') return []
  const nodes = (data as { nodes?: Record<string, unknown> }).nodes
  if (!nodes || typeof nodes !== 'object') return []

  const rows: FlatTask[] = []
  for (const [nodeId, nodeVal] of Object.entries(nodes)) {
    if (!nodeVal || typeof nodeVal !== 'object') continue
    const node = nodeVal as {
      name?: string
      host?: string
      attributes?: Record<string, string>
      tasks?: Record<string, unknown>
    }
    const tasks = node.tasks ?? {}
    for (const [taskId, taskVal] of Object.entries(tasks)) {
      if (!taskVal || typeof taskVal !== 'object') continue
      const t = taskVal as {
        id?: number
        type?: string
        action?: string
        start_time_in_millis?: number
        running_time_in_nanos?: number
        cancellable?: boolean
        cancelled?: boolean
        parent_task_id?: string
      }
      const action = t.action ?? ''
      rows.push({
        taskId,
        nodeId,
        nodeName: node.name ?? nodeId,
        host: node.host ?? '',
        group: node.attributes?.group ?? '',
        id: t.id ?? 0,
        type: t.type ?? '',
        action,
        actionFamily: actionFamily(action),
        startTimeMs: t.start_time_in_millis ?? 0,
        runningNanos: t.running_time_in_nanos ?? 0,
        cancellable: Boolean(t.cancellable),
        cancelled: Boolean(t.cancelled),
        parentTaskId: t.parent_task_id ?? '',
      })
    }
  }
  rows.sort((a, b) => b.runningNanos - a.runningNanos)
  return rows
}

export function decisionTone(decision: string | undefined): 'green' | 'yellow' | 'red' | 'muted' {
  const d = (decision ?? '').toLowerCase()
  if (d === 'yes' || d === 'started') return 'green'
  if (d === 'no' || d === 'unassigned') return 'red'
  if (d === 'throttle' || d === 'almost') return 'yellow'
  return 'muted'
}
