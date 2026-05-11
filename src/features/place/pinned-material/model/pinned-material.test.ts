import { describe, expect, it } from 'vitest'
import { toSetPinnedMaterialRequest } from './pinned-material'

describe('pinned material model', () => {
  it('builds backend payload for selected material', () => {
    expect(toSetPinnedMaterialRequest('material-1')).toEqual({
      materialId: 'material-1',
    })
  })

  it('returns null for unsupported clear request', () => {
    expect(toSetPinnedMaterialRequest(null)).toBeNull()
  })
})
