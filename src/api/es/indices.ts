import { catJson } from './cat'
import { esGetJson } from './client'
import type { CatAlias, CatIndex } from '@/types/es'

export async function catIndices(
  pattern?: string,
  opts?: { health?: string; sort?: string },
): Promise<CatIndex[]> {
  let path = pattern
    ? `/_cat/indices/${pattern}?h=index,health,status,pri,rep,docs.count,store.size,creation.date.string`
    : '/_cat/indices?h=index,health,status,pri,rep,docs.count,store.size'
  if (opts?.health) path += `&health=${encodeURIComponent(opts.health)}`
  if (opts?.sort) path += `&s=${encodeURIComponent(opts.sort)}&bytes=gb`
  return (await catJson(path)) as unknown as CatIndex[]
}

export async function catAliases(pattern?: string): Promise<CatAlias[]> {
  const path = pattern ? `/_cat/aliases/${pattern}` : '/_cat/aliases'
  return (await catJson(path)) as unknown as CatAlias[]
}

export function indexCount(index: string): Promise<unknown> {
  return esGetJson(`/${encodeURIComponent(index)}/_count?pretty=true`)
}

export function indexStatsSearchIndexing(index: string): Promise<unknown> {
  return esGetJson(`/${encodeURIComponent(index)}/_stats/search,indexing?pretty=true`)
}

export function indexStatsStore(index: string): Promise<unknown> {
  return esGetJson(
    `/${encodeURIComponent(index)}/_stats/store?filter_path=indices.*.total.store,indices.*.primaries.store`,
  )
}

export function indexMapping(index: string): Promise<unknown> {
  return esGetJson(`/${encodeURIComponent(index)}/_mapping?filter_path=**.properties`)
}
