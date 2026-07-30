import { useRouter } from 'vue-router'
import { actionsFor } from './actions'
import { entityDetailRoute } from './routes'
import type { EntityAction, EntityKind } from './types'
import type { InspectKind } from '@/utils/inspect'
import { useConnectionStore } from '@/stores/connection'
import { useUiStore } from '@/stores/ui'
import * as nodesApi from '@/api/es/nodes'
import * as shardsApi from '@/api/es/shards'
import * as indicesApi from '@/api/es/indices'

export function useEntityActions() {
  const router = useRouter()
  const connection = useConnectionStore()
  const ui = useUiStore()

  function menuActions(kind: EntityKind) {
    return actionsFor(kind)
  }

  async function openDetail(kind: EntityKind, payload: Record<string, string>) {
    ui.closeContextMenu()
    await router.push(entityDetailRoute(kind, payload))
  }

  async function runAction(kind: EntityKind, action: EntityAction, payload: Record<string, string>) {
    ui.closeContextMenu()
    const name = payload.name ?? payload.node ?? ''
    const index = payload.index ?? ''
    const alias = payload.alias ?? ''
    const shard = payload.shard ?? '0'
    const primary = payload.prirep === 'p'

    switch (action.id) {
      case 'entity.detail':
        await openDetail(kind, payload)
        return
      case 'node.shards':
        await router.push({ path: '/shards', query: { node: name } })
        return
      case 'node.threads':
        await router.push({ path: '/threads', query: { node: name } })
        return
      case 'node.disk':
        await router.push({ path: '/disk', query: { highlight: name } })
        return
      case 'node.breakers':
        await inspect('Circuit breakers', 'breakers', () => nodesApi.nodesBreakers(name))
        return
      case 'node.contexts':
        await inspect('Open search contexts', 'contexts', () => nodesApi.nodesOpenContexts(name))
        return
      case 'node.osjvm':
        await inspect('OS / JVM / FS', 'osjvm', () => nodesApi.nodesStatsOsJvmFs(name))
        return
      case 'node.searchStats':
        await inspect('Search stats', 'searchStats', () => nodesApi.nodesSearchStats(name))
        return
      case 'node.fielddata':
        await inspect('Fielddata', 'fielddata', async () => {
          const rows = await nodesApi.catFielddata()
          return rows.filter((r) => r.node === name)
        })
        return
      case 'node.hotThreads':
        await inspect('Hot threads', 'hotThreads', () => nodesApi.hotThreads(name))
        return
      case 'node.rack': {
        const attrs = await nodesApi.catNodeAttrs()
        const group = attrs.find((a) => a.node === name && a.attr === 'group')?.value
        if (group) connection.setRackGroup(group)
        await router.push({ path: '/nodes', query: { rack: group ?? connection.esRackGroup } })
        return
      }
      case 'shard.openIndex':
        connection.setIndex(index)
        await openDetail('index', { index })
        return
      case 'shard.indexShards':
        connection.setIndex(index)
        await router.push({ path: '/shards', query: { index } })
        return
      case 'shard.openNode':
        if (payload.node) await openDetail('node', { name: payload.node, node: payload.node })
        return
      case 'shard.explain':
        await router.push({
          path: '/explain',
          query: { index, shard, primary: primary ? 'true' : 'false' },
        })
        return
      case 'shard.routing':
        await inspect(`Routing — ${index}`, 'routing', () => shardsApi.routingTable(index), index)
        return
      case 'shard.settings':
        await inspect(`Settings — ${index}`, 'settings', () => shardsApi.indexReplicaSettings(index), index)
        return
      case 'shard.recovery':
        connection.setIndex(index)
        await router.push({ path: '/disk', query: { index, panel: 'recovery' } })
        return
      case 'shard.segments':
        connection.setIndex(index)
        await router.push({ path: '/disk', query: { index, panel: 'segments' } })
        return
      case 'index.setContext':
        connection.setIndex(index)
        return
      case 'index.shards':
        connection.setIndex(index)
        await router.push({ path: '/shards', query: { index } })
        return
      case 'index.unassigned':
        connection.setIndex(index)
        await router.push({ path: '/shards', query: { index, state: 'UNASSIGNED' } })
        return
      case 'index.disk':
        connection.setIndex(index)
        await router.push({ path: '/disk', query: { index } })
        return
      case 'index.explain':
        await router.push({
          path: '/explain',
          query: { index, shard: '0', primary: 'false' },
        })
        return
      case 'index.count':
        await inspect(`Count — ${index}`, 'count', () => indicesApi.indexCount(index), index)
        return
      case 'index.stats':
        await inspect(`Stats — ${index}`, 'stats', () => indicesApi.indexStatsSearchIndexing(index), index)
        return
      case 'index.store':
        await inspect(`Store — ${index}`, 'store', () => indicesApi.indexStatsStore(index), index)
        return
      case 'index.mapping':
        await inspect(`Mapping — ${index}`, 'mapping', () => indicesApi.indexMapping(index), index)
        return
      case 'index.settings':
        await inspect(`Settings — ${index}`, 'settings', () => shardsApi.indexReplicaSettings(index), index)
        return
      case 'index.aliases':
        await router.push({ path: '/indices', query: { tab: 'aliases', index } })
        return
      case 'index.tasks':
        await router.push({ path: '/tasks', query: { action: 'reindex' } })
        return
      case 'alias.resolve': {
        const rows = await indicesApi.catAliases(alias)
        const backing = rows[0]?.index
        if (backing) {
          connection.setAlias(alias)
          connection.setIndex(backing)
          await openDetail('index', { index: backing })
        }
        return
      }
      case 'alias.productsLive':
        await router.push({ path: '/indices', query: { tab: 'aliases', pattern: 'products_live_*' } })
        return
      default:
        return
    }
  }

  async function inspect(
    title: string,
    inspectKind: InspectKind,
    loader: () => Promise<unknown>,
    indexName?: string,
  ) {
    ui.openDrawer(title, { inspectKind, indexName })
    try {
      const data = await loader()
      ui.setDrawerData(data)
    } catch (e) {
      ui.setDrawerError(e instanceof Error ? e.message : String(e))
    }
  }

  return { menuActions, runAction, openDetail, inspect }
}
