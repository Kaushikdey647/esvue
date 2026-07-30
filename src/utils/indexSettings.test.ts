import { describe, expect, it } from 'vitest'
import { parseIndexAllocationSettings } from './indexSettings'

describe('parseIndexAllocationSettings', () => {
  it('parses shards, replicas, and include group', () => {
    const parsed = parseIndexAllocationSettings({
      products_v3_kitchen_appliances: {
        settings: {
          index: {
            routing: {
              allocation: {
                include: {
                  _tier_preference: 'data_content',
                  group: 'g7',
                },
              },
            },
            number_of_shards: '1',
            number_of_replicas: '3',
          },
        },
      },
    })

    expect(parsed).toEqual({
      indexName: 'products_v3_kitchen_appliances',
      numberOfShards: '1',
      numberOfReplicas: '3',
      routing: {
        include: { _tier_preference: 'data_content', group: 'g7' },
        exclude: {},
        require: {},
      },
    })
  })
})
