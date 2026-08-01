import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'

import {
  getCaptchaViewerError,
  getClearPinnedMaterialError,
  getCreatePlaceError,
  getEditPlaceError,
  getPlaceCoverUploadApiError,
  getPlaceImportActionError,
  getPlaceImportStartError,
  getPlaceStatusError,
  getSetPinnedMaterialError,
} from './place-errors'

describe('place error presentation', () => {
  it.each([
    [
      getCreatePlaceError,
      'PLACE_SLUG_CONFLICT' as const,
      409,
      'Место с таким ярлыком уже существует.',
    ],
    [
      getEditPlaceError,
      'PLACE_SLUG_CONFLICT' as const,
      409,
      'Место с таким ярлыком уже существует.',
    ],
    [getEditPlaceError, 'PLACE_NOT_FOUND' as const, 404, 'Место не найдено.'],
    [getPlaceStatusError, 'PLACE_NOT_FOUND' as const, 404, 'Место не найдено.'],
    [
      getPlaceCoverUploadApiError,
      'PLACE_NOT_FOUND' as const,
      404,
      'Место не найдено.',
    ],
    [
      getSetPinnedMaterialError,
      'PINNED_MATERIAL_NOT_LINKED' as const,
      409,
      'Материал не связан с этим местом.',
    ],
    [
      getSetPinnedMaterialError,
      'PINNED_MATERIAL_NOT_FOUND' as const,
      404,
      'Закрепленный материал не найден.',
    ],
    [
      getSetPinnedMaterialError,
      'PLACE_NOT_FOUND' as const,
      404,
      'Место не найдено.',
    ],
    [
      getClearPinnedMaterialError,
      'PINNED_MATERIAL_NOT_FOUND' as const,
      404,
      'Закрепленный материал не найден.',
    ],
    [
      getClearPinnedMaterialError,
      'PLACE_NOT_FOUND' as const,
      404,
      'Место не найдено.',
    ],
    [
      getPlaceImportStartError,
      'PLACE_IMPORT_INPUT_INVALID' as const,
      422,
      'Проверьте ссылку для импорта.',
    ],
    [
      getPlaceImportStartError,
      'PLACE_IMPORTS_UNAVAILABLE' as const,
      503,
      'Сервис импорта временно недоступен.',
    ],
    [
      getPlaceImportActionError,
      'PLACE_IMPORT_PREVIEW_EXPIRED' as const,
      409,
      'Срок действия preview истёк. Запустите импорт заново.',
    ],
    [
      getPlaceImportActionError,
      'PLACE_IMPORT_PREVIEW_NOT_READY' as const,
      409,
      'Preview ещё не готов. Дождитесь завершения обработки.',
    ],
    [
      getCaptchaViewerError,
      'PLACE_IMPORT_VIEWER_UNAVAILABLE' as const,
      503,
      'Просмотр CAPTCHA временно недоступен.',
    ],
  ])(
    'maps supported domain errors outside UI',
    (present, code, status, want) => {
      expect(present(createApiProblemError(code, status))).toBe(want)
    },
  )

  it('uses the shared safe fallback for an unsupported place error', () => {
    expect(
      getCreatePlaceError(createApiProblemError('INTERNAL_ERROR', 500)),
    ).toBe('Не удалось выполнить запрос.')
  })
})
