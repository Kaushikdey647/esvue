import { esGetJson } from './client'
import { normalizeCatJson } from '@/parsers/cat'
import type { CatRow } from '@/types/es'

export async function catJson(path: string): Promise<CatRow[]> {
  const sep = path.includes('?') ? '&' : '?'
  const data = await esGetJson<unknown>(`${path}${sep}format=json`)
  return normalizeCatJson(data)
}
