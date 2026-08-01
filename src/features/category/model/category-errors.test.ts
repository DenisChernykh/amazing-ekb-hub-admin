import { createApiProblemError } from '@/test/api-problem'
import { describe, expect, it } from 'vitest'

import {
  getCreateCategoryError,
  getDeleteCategoryError,
  getEditCategoryError,
} from './category-errors'

describe('category error presentation', () => {
  it.each([
    [
      getCreateCategoryError,
      'CATEGORY_SLUG_CONFLICT' as const,
      409,
      'Категория с таким ярлыком уже существует.',
    ],
    [
      getEditCategoryError,
      'CATEGORY_SLUG_CONFLICT' as const,
      409,
      'Категория с таким ярлыком уже существует.',
    ],
    [
      getEditCategoryError,
      'CATEGORY_NOT_FOUND' as const,
      404,
      'Категория не найдена.',
    ],
    [
      getDeleteCategoryError,
      'CATEGORY_IN_USE' as const,
      409,
      'Категория используется местами и не может быть удалена.',
    ],
    [
      getDeleteCategoryError,
      'CATEGORY_NOT_FOUND' as const,
      404,
      'Категория не найдена.',
    ],
  ])(
    'maps supported domain errors outside UI',
    (present, code, status, want) => {
      expect(present(createApiProblemError(code, status))).toBe(want)
    },
  )

  it('uses the shared safe fallback for an unsupported category error', () => {
    expect(
      getCreateCategoryError(createApiProblemError('INTERNAL_ERROR', 500)),
    ).toBe('Не удалось выполнить запрос.')
  })
})
