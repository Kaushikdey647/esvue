import { describe, expect, it } from 'vitest'
import { normalizeCatJson, parseCatTable } from './cat'

describe('parseCatTable', () => {
  it('parses header + rows from _cat/nodes style TSV', () => {
    const raw = `name node.role master heap.percent cpu load_1m disk.used_percent disk.avail uptime
shopsy-es-01 dim * 62 11 1.20 71.2 120.3gb 12.3d
shopsy-es-02 dim - 55 8 0.90 68.1 140.1gb 12.2d`

    const rows = parseCatTable(raw)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'shopsy-es-01',
      master: '*',
      'heap.percent': '62',
      uptime: '12.3d',
    })
  })

  it('returns empty for blank input', () => {
    expect(parseCatTable('')).toEqual([])
    expect(parseCatTable('name\n')).toEqual([])
  })
})

describe('normalizeCatJson', () => {
  it('coerces cat json rows to string maps', () => {
    const rows = normalizeCatJson([
      { index: 'products_v3_misc', shard: 3, state: 'UNASSIGNED', node: null },
    ])
    expect(rows[0]).toEqual({
      index: 'products_v3_misc',
      shard: '3',
      state: 'UNASSIGNED',
      node: '',
    })
  })
})
