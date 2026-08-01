import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'

import {
  getCreateMaterialError,
  getEditMaterialError,
  getLinkExistingMaterialError,
  getMaterialAdminStatusError,
} from './material-errors'

describe('material error presentation', () => {
  it.each([
    [
      getCreateMaterialError,
      'PLACE_NOT_FOUND' as const,
      404,
      'Место не найдено.',
    ],
    [
      getEditMaterialError,
      'MATERIAL_NOT_FOUND' as const,
      404,
      'Материал не найден.',
    ],
    [
      getMaterialAdminStatusError,
      'MATERIAL_NOT_FOUND' as const,
      404,
      'Материал не найден.',
    ],
    [
      getLinkExistingMaterialError,
      'MATERIAL_PLACE_NOT_FOUND' as const,
      404,
      'Материал места не найден.',
    ],
    [
      getLinkExistingMaterialError,
      'MATERIAL_NOT_FOUND' as const,
      404,
      'Материал не найден.',
    ],
    [
      getLinkExistingMaterialError,
      'PLACE_NOT_FOUND' as const,
      404,
      'Место не найдено.',
    ],
  ])(
    'maps supported domain errors outside UI',
    (present, code, status, want) => {
      expect(present(createApiProblemError(code, status))).toBe(want)
    },
  )

  it('uses the shared safe fallback for an unsupported material error', () => {
    expect(
      getEditMaterialError(createApiProblemError('INTERNAL_ERROR', 500)),
    ).toBe('Не удалось выполнить запрос.')
  })
})
