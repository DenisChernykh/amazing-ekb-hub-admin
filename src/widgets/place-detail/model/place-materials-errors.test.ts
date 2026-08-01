import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'

import {
  getHidePlaceMaterialLinkError,
  getPlaceMaterialsQueryError,
} from './place-materials-errors'

describe('place materials error presentation', () => {
  it.each([
    [
      getHidePlaceMaterialLinkError,
      'PLACE_MATERIAL_LINK_NOT_FOUND' as const,
      'Связь материала с местом не найдена.',
    ],
    [
      getHidePlaceMaterialLinkError,
      'MATERIAL_PLACE_NOT_FOUND' as const,
      'Материал места не найден.',
    ],
    [
      getPlaceMaterialsQueryError,
      'MATERIAL_PLACE_NOT_FOUND' as const,
      'Материал места не найден.',
    ],
  ])('maps supported domain errors outside UI', (present, code, want) => {
    expect(present(createApiProblemError(code, 404))).toBe(want)
  })

  it('uses the shared safe fallback for an unsupported materials error', () => {
    expect(
      getPlaceMaterialsQueryError(createApiProblemError('INTERNAL_ERROR', 500)),
    ).toBe('Не удалось выполнить запрос.')
  })
})
