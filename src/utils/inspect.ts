export type InspectKind =
  | 'count'
  | 'settings'
  | 'store'
  | 'stats'
  | 'mapping'
  | 'breakers'
  | 'contexts'
  | 'osjvm'
  | 'searchStats'
  | 'fielddata'
  | 'hotThreads'
  | 'routing'
  | 'json'

export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatBytes(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export function parseCountResponse(data: unknown): {
  count: number
  shards: { total: number; successful: number; skipped: number; failed: number }
} | null {
  if (!data || typeof data !== 'object') return null
  const d = data as { count?: number; _shards?: Record<string, number> }
  if (typeof d.count !== 'number') return null
  return {
    count: d.count,
    shards: {
      total: d._shards?.total ?? 0,
      successful: d._shards?.successful ?? 0,
      skipped: d._shards?.skipped ?? 0,
      failed: d._shards?.failed ?? 0,
    },
  }
}
