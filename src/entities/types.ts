export type EntityKind = 'node' | 'shard' | 'index' | 'alias'

export type ActionType = 'navigate' | 'inspect' | 'context'

export interface EntityAction {
  id: string
  label: string
  type: ActionType
}
