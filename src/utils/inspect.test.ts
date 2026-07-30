import { describe, expect, it } from 'vitest'
import { formatBytes, formatCount, parseCountResponse } from './inspect'

describe('inspect helpers', () => {
  it('parses count response', () => {
    expect(
      parseCountResponse({
        count: 1701437,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      }),
    ).toEqual({
      count: 1701437,
      shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    })
  })

  it('formats count and bytes', () => {
    expect(formatCount(1701437)).toMatch(/17/)
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
