import { describe, expect, it } from 'vitest'
import {
  createCollectionFormSchema,
  editCollectionFormSchema,
  toCreateCollectionRequest,
  toUpdateCollectionRequest,
} from './collection-form-schema'

describe('collection form schema', () => {
  it('requires trimmed title and limits description to backend maxLength', () => {
    expect(
      createCollectionFormSchema.safeParse({
        description: '',
        slug: '',
        title: '  ',
      }).success,
    ).toBe(false)
    expect(
      createCollectionFormSchema.safeParse({
        description: 'x'.repeat(10_001),
        slug: '',
        title: 'SPA',
      }).success,
    ).toBe(false)
  })

  it('omits an empty optional slug only when creating a collection', () => {
    expect(
      toCreateCollectionRequest({
        description: '  ',
        slug: '  ',
        title: ' SPA ',
      }),
    ).toEqual({
      description: null,
      title: ' SPA ',
    })
  })

  it('rejects an empty edit slug and always sends a validated slug on update', () => {
    expect(
      editCollectionFormSchema.safeParse({
        description: '',
        slug: '  ',
        title: 'SPA',
      }).success,
    ).toBe(false)
    expect(
      toUpdateCollectionRequest({
        description: '  ',
        slug: ' new-spa ',
        title: 'SPA',
      }),
    ).toEqual({ description: null, slug: 'new-spa', title: 'SPA' })
  })
})
