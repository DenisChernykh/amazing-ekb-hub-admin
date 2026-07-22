import {
  GetPlaceImportOperation200Response,
  StartYandexMapsPlaceImportBody,
} from '@/shared/api/generated-zod/admin/admin.zod'
import { describe, expect, it } from 'vitest'

describe('generated place import contract', () => {
  it('accepts a full preview snapshot from merged backend OpenAPI', () => {
    expect(
      GetPlaceImportOperation200Response.parse({
        attempt: 1,
        captchaExpiresAt: null,
        category: {
          id: null,
          resolution: 'will_create',
          status: 'draft',
          title: 'SPA',
        },
        createdAt: '2026-07-22T10:00:00.000Z',
        error: null,
        id: 'operation-1',
        mapsUrl: 'https://yandex.ru/maps/org/spa/1',
        organizationId: '1',
        outcome: null,
        possibleDuplicate: { placeId: 'place-2', title: 'Похожий SPA' },
        previewExpiresAt: '2026-07-22T11:00:00.000Z',
        resultPlaceId: null,
        sourceUrl: 'https://yandex.ru/maps/org/spa/1',
        status: 'preview_ready',
        title: 'Новый SPA',
        updatedAt: '2026-07-22T10:01:00.000Z',
        version: 3,
      }).status,
    ).toBe('preview_ready')
  })

  it('rejects unsafe start payload fields and non-URL input', () => {
    expect(() =>
      StartYandexMapsPlaceImportBody.parse({
        cookie: 'secret',
        url: 'not-a-url',
      }),
    ).toThrow()
  })
})
