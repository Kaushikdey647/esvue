import type { CatRow } from '@/types/es'

/** Parse Elasticsearch `_cat` TSV with header row (`?v`). Prefer `format=json` in API calls. */
export function parseCatTable(raw: string): CatRow[] {
  const text = raw.replace(/^\uFEFF/, '').trim()
  if (!text) return []

  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length < 2) return []

  const headers = splitCatLine(lines[0]!)
  if (headers.length === 0) return []

  const rows: CatRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCatLine(lines[i]!)
    if (cols.length === 0) continue
    const row: CatRow = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = cols[j] ?? ''
    }
    rows.push(row)
  }
  return rows
}

function splitCatLine(line: string): string[] {
  return line.trim().split(/\s+/)
}

/** Normalize cat JSON rows (ES may omit empty keys; coerce all values to string). */
export function normalizeCatJson(rows: unknown): CatRow[] {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const out: CatRow = {}
    if (row && typeof row === 'object') {
      for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
        out[k] = v == null ? '' : String(v)
      }
    }
    return out
  })
}
