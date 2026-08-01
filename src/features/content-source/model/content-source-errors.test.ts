import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'

import {
  getContentSourceStatusError,
  getCreateContentSourceError,
  getEditContentSourceError,
  getImportTelegramSourceError,
} from './content-source-errors'

describe('content source error presentation', () => {
  it.each([
    [
      getCreateContentSourceError,
      'CONTENT_SOURCE_ALREADY_EXISTS' as const,
      409,
      'Такой источник уже существует.',
    ],
    [
      getEditContentSourceError,
      'CONTENT_SOURCE_IDENTITY_LOCKED' as const,
      409,
      'Идентификаторы источника нельзя изменить после создания.',
    ],
    [
      getContentSourceStatusError,
      'CONTENT_SOURCE_NOT_FOUND' as const,
      404,
      'Источник не найден.',
    ],
    [
      getImportTelegramSourceError,
      'ACTIVE_IMPORT_EXISTS' as const,
      409,
      'Импорт уже выполняется. Обновляем статус.',
    ],
    [
      getImportTelegramSourceError,
      'TELEGRAM_IMPORT_SOURCE_INVALID' as const,
      422,
      'Источник не подходит для импорта Telegram.',
    ],
    [
      getImportTelegramSourceError,
      'TELEGRAM_IMPORT_UNAVAILABLE' as const,
      503,
      'Импорт Telegram временно недоступен.',
    ],
    [
      getEditContentSourceError,
      'CONTENT_SOURCE_NOT_FOUND' as const,
      404,
      'Источник не найден.',
    ],
    [
      getImportTelegramSourceError,
      'CONTENT_SOURCE_NOT_FOUND' as const,
      404,
      'Источник не найден.',
    ],
  ])(
    'maps supported domain errors outside UI',
    (present, code, status, want) => {
      expect(present(createApiProblemError(code, status))).toBe(want)
    },
  )

  it('uses the shared safe fallback for an unsupported source error', () => {
    expect(
      getCreateContentSourceError(createApiProblemError('INTERNAL_ERROR', 500)),
    ).toBe('Не удалось выполнить запрос.')
  })
})
