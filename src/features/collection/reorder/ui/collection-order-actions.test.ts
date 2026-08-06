import { describe, expect, it } from 'vitest'
import { moveCollection } from '../model/collection-order'

describe('moveCollection', () => {
  it('moves an item while preserving all IDs', () => {
    expect(moveCollection(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })
})
