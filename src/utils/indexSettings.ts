export interface IndexRoutingFilters {
  include: Record<string, string>
  exclude: Record<string, string>
  require: Record<string, string>
}

export interface ParsedIndexAllocationSettings {
  indexName: string
  numberOfShards: string | null
  numberOfReplicas: string | null
  routing: IndexRoutingFilters
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function stringMap(v: unknown): Record<string, string> {
  const r = asRecord(v)
  if (!r) return {}
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(r)) {
    if (val == null) continue
    out[k] = String(val)
  }
  return out
}

/** Normalize `GET /{index}/_settings` (possibly multi-index) into a flat view model. */
export function parseIndexAllocationSettings(
  data: unknown,
  preferIndex?: string,
): ParsedIndexAllocationSettings | null {
  const root = asRecord(data)
  if (!root) return null

  const entries = Object.entries(root)
  if (entries.length === 0) return null

  const picked =
    (preferIndex ? entries.find(([name]) => name === preferIndex) : undefined) ?? entries[0]!
  const [indexName, body] = picked
  const settings = asRecord(asRecord(body)?.settings)
  const index = asRecord(settings?.index) ?? asRecord(body)

  if (!index) {
    return {
      indexName,
      numberOfShards: null,
      numberOfReplicas: null,
      routing: { include: {}, exclude: {}, require: {} },
    }
  }

  const allocation = asRecord(asRecord(asRecord(index.routing)?.allocation))

  return {
    indexName,
    numberOfShards:
      index.number_of_shards != null ? String(index.number_of_shards) : null,
    numberOfReplicas:
      index.number_of_replicas != null ? String(index.number_of_replicas) : null,
    routing: {
      include: stringMap(allocation?.include),
      exclude: stringMap(allocation?.exclude),
      require: stringMap(allocation?.require),
    },
  }
}
