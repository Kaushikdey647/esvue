/** Case-insensitive substring match across stringifiable fields. */
export function matchesSearch(query: string, ...fields: unknown[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => {
    if (f == null) return false
    return String(f).toLowerCase().includes(q)
  })
}
