import { describe, expect, it } from 'vitest'
import { flattenTasksResponse, formatDuration, actionFamily } from './esFormat'

describe('formatDuration', () => {
  it('formats nanos to human units', () => {
    expect(formatDuration(500)).toContain('µs')
    expect(formatDuration(2_500_000)).toContain('ms')
    expect(formatDuration(2_500_000_000)).toContain('s')
  })
})

describe('flattenTasksResponse', () => {
  it('flattens nodes.tasks into sortable rows', () => {
    const rows = flattenTasksResponse({
      nodes: {
        abc: {
          name: 'node-a',
          host: '10.0.0.1',
          attributes: { group: 'g12' },
          tasks: {
            'abc:1': {
              id: 1,
              type: 'transport',
              action: 'indices:data/read/search[phase/query]',
              running_time_in_nanos: 5e9,
              cancellable: true,
              cancelled: false,
              parent_task_id: 'x:2',
            },
          },
        },
      },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.nodeName).toBe('node-a')
    expect(rows[0]?.group).toBe('g12')
    expect(rows[0]?.actionFamily).toBe('indices:data/read/search')
  })

  it('returns empty for empty nodes', () => {
    expect(flattenTasksResponse({ nodes: {} })).toEqual([])
  })
})

describe('actionFamily', () => {
  it('strips bracket suffix', () => {
    expect(actionFamily('cluster:monitor/tasks/lists[n]')).toBe('cluster:monitor/tasks/lists')
  })
})
