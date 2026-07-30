/** Pull the single node object from an ES `_nodes/...` response. */
export function firstNodePayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const nodes = (data as { nodes?: Record<string, Record<string, unknown>> }).nodes
  if (!nodes) return null
  const first = Object.values(nodes)[0]
  return first ?? null
}

export function breakerPct(node: Record<string, unknown> | null, name: 'parent' | 'request'): number | null {
  const breakers = node?.breakers as Record<string, { limit_size_in_bytes?: number; estimated_size_in_bytes?: number }> | undefined
  const b = breakers?.[name]
  if (!b?.limit_size_in_bytes) return null
  return (100 * (b.estimated_size_in_bytes ?? 0)) / b.limit_size_in_bytes
}
