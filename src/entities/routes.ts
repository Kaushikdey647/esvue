import type { EntityKind } from './types'
import type { RouteLocationRaw } from 'vue-router'

/** Build the entity description dashboard route. */
export function entityDetailRoute(
  kind: EntityKind,
  payload: Record<string, string>,
): RouteLocationRaw {
  switch (kind) {
    case 'node': {
      const name = payload.name ?? payload.node ?? ''
      return { name: 'entity-node', params: { name } }
    }
    case 'index': {
      const index = payload.index ?? ''
      return { name: 'entity-index', params: { index } }
    }
    case 'alias': {
      const alias = payload.alias ?? ''
      return { name: 'entity-alias', params: { alias } }
    }
    case 'shard': {
      const index = payload.index ?? ''
      const shard = payload.shard ?? '0'
      return {
        name: 'entity-shard',
        params: { index, shard },
        query: {
          prirep: payload.prirep ?? 'r',
          node: payload.node || undefined,
          state: payload.state || undefined,
        },
      }
    }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}
