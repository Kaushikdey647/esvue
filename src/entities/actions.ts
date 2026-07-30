import type { EntityAction, EntityKind } from './types'

const nodeActions: EntityAction[] = [
  { id: 'entity.detail', label: 'Open dashboard', type: 'navigate' },
  { id: 'node.shards', label: 'View shards on node', type: 'navigate' },
  { id: 'node.threads', label: 'View thread pools', type: 'navigate' },
  { id: 'node.disk', label: 'View disk allocation', type: 'navigate' },
  { id: 'node.breakers', label: 'Circuit breakers', type: 'inspect' },
  { id: 'node.contexts', label: 'Open search contexts', type: 'inspect' },
  { id: 'node.osjvm', label: 'OS / JVM / FS', type: 'inspect' },
  { id: 'node.searchStats', label: 'Search index stats', type: 'inspect' },
  { id: 'node.fielddata', label: 'Fielddata', type: 'inspect' },
  { id: 'node.hotThreads', label: 'Hot threads', type: 'inspect' },
  { id: 'node.rack', label: 'Filter by rack group', type: 'context' },
]

const shardActions: EntityAction[] = [
  { id: 'entity.detail', label: 'Open dashboard', type: 'navigate' },
  { id: 'shard.openIndex', label: 'Open index dashboard', type: 'navigate' },
  { id: 'shard.indexShards', label: 'Shards for index', type: 'navigate' },
  { id: 'shard.openNode', label: 'Open node dashboard', type: 'navigate' },
  { id: 'shard.explain', label: 'Allocation explain page', type: 'navigate' },
  { id: 'shard.routing', label: 'Routing table', type: 'inspect' },
  { id: 'shard.settings', label: 'Replica / allocation settings', type: 'inspect' },
  { id: 'shard.recovery', label: 'Recovery for index', type: 'navigate' },
  { id: 'shard.segments', label: 'Segments for index', type: 'navigate' },
]

const indexActions: EntityAction[] = [
  { id: 'entity.detail', label: 'Open dashboard', type: 'navigate' },
  { id: 'index.setContext', label: 'Set as context index', type: 'context' },
  { id: 'index.shards', label: 'View shards table', type: 'navigate' },
  { id: 'index.unassigned', label: 'View unassigned shards', type: 'navigate' },
  { id: 'index.disk', label: 'Disk recovery / segments', type: 'navigate' },
  { id: 'index.explain', label: 'Explain template', type: 'navigate' },
  { id: 'index.count', label: 'Doc count', type: 'inspect' },
  { id: 'index.stats', label: 'Search + indexing stats', type: 'inspect' },
  { id: 'index.store', label: 'Store size', type: 'inspect' },
  { id: 'index.mapping', label: 'Mapping summary', type: 'inspect' },
  { id: 'index.settings', label: 'Replica settings', type: 'inspect' },
  { id: 'index.aliases', label: 'Find aliases', type: 'navigate' },
  { id: 'index.tasks', label: 'Active reindex tasks', type: 'navigate' },
]

const aliasActions: EntityAction[] = [
  { id: 'entity.detail', label: 'Open dashboard', type: 'navigate' },
  { id: 'alias.resolve', label: 'Resolve → backing index shards', type: 'navigate' },
  { id: 'alias.productsLive', label: 'View products_live_* aliases', type: 'navigate' },
]

export function actionsFor(kind: EntityKind): EntityAction[] {
  switch (kind) {
    case 'node':
      return nodeActions
    case 'shard':
      return shardActions
    case 'index':
      return indexActions
    case 'alias':
      return aliasActions
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
