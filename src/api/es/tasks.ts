import { esGetJson } from './client'

export function tasks(actions?: string): Promise<unknown> {
  const params = new URLSearchParams({ pretty: 'true' })
  if (actions) {
    params.set('actions', actions)
    params.set('detailed', 'true')
  }
  return esGetJson(`/_tasks?${params}`)
}

export function reindexTasks(): Promise<unknown> {
  return tasks('*reindex*')
}

export function bulkWriteTasks(): Promise<unknown> {
  return tasks('indices:data/write/bulk*')
}

export function recoveryTasks(): Promise<unknown> {
  return tasks('*recovery*')
}
