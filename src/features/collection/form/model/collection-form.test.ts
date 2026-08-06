import { describe, expect, it } from 'vitest'
import {
  collectionFormSchema,
  toCollectionRequest,
} from './collection-form-schema'

describe('collection form schema', () => {
  it('requires trimmed title and limits description to backend maxLength', () => {
    expect(
      collectionFormSchema.safeParse({ description: '', slug: '', title: '  ' })
        .success,
    ).toBe(false)
    expect(
      collectionFormSchema.safeParse({
        description: 'x'.repeat(10_001),
        slug: '',
        title: 'SPA',
      }).success,
    ).toBe(false)
  })

  it('normalizes optional description and slug without inventing values', () => {
    expect(
      toCollectionRequest({ description: '  ', slug: '  ', title: ' SPA ' }),
    ).toEqual({
      description: null,
      title: ' SPA ',
    })
  })
})
