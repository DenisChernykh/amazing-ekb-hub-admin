import { describe, expect, it } from 'vitest'
import {
  getPlaceCoverUploadError,
  PLACE_COVER_UPLOAD_MAX_SIZE_BYTES,
} from './place-cover-upload'

describe('place cover upload helpers', () => {
  it('accepts supported image files under size limit', () => {
    const file = new File(['cover'], 'cover.webp', { type: 'image/webp' })

    expect(getPlaceCoverUploadError(file)).toBeNull()
  })

  it('rejects unsupported file types', () => {
    const file = new File(['cover'], 'cover.gif', { type: 'image/gif' })

    expect(getPlaceCoverUploadError(file)).toBe(
      'Загрузите JPEG, PNG или WebP файл.',
    )
  })

  it('rejects image files over size limit', () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', {
      configurable: true,
      value: PLACE_COVER_UPLOAD_MAX_SIZE_BYTES + 1,
    })

    expect(getPlaceCoverUploadError(file)).toBe(
      'Файл должен быть не больше 5 MB.',
    )
  })
})
