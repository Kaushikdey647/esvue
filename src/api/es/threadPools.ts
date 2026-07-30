import { catJson } from './cat'
import type { CatThreadPool } from '@/types/es'

export async function catThreadPool(name: string): Promise<CatThreadPool[]> {
  return (await catJson(
    `/_cat/thread_pool/${encodeURIComponent(name)}?h=node_name,active,queue,rejected,completed`,
  )) as unknown as CatThreadPool[]
}

export async function catThreadPoolMulti(names: string): Promise<CatThreadPool[]> {
  return (await catJson(
    `/_cat/thread_pool/${names}?h=node_name,name,active,queue,rejected`,
  )) as unknown as CatThreadPool[]
}
