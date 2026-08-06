import { describe, expect, it } from 'vitest'
import { getCollectionCoverUploadError } from './collection-cover-upload'

describe('getCollectionCoverUploadError', () => {
  it('accepts supported images up to 5 MB', () => {
    expect(
      getCollectionCoverUploadError({
        size: 5 * 1024 * 1024,
        type: 'image/webp',
      }),
    ).toBeNull()
  })

  it('rejects unsupported MIME and oversized files', () => {
    expect(
      getCollectionCoverUploadError({ size: 1, type: 'image/svg+xml' }),
    ).toContain('JPG')
    expect(
      getCollectionCoverUploadError({
        size: 5 * 1024 * 1024 + 1,
        type: 'image/png',
      }),
    ).toContain('5 МБ')
  })
})
