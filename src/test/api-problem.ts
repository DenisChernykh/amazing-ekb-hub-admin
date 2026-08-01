import {
  ApiProblemError,
  type ProblemCode,
  type ProblemDocumentLike,
} from '@/shared/api'

/**
 * Создаёт Problem Details error для focused UI/model тестов.
 *
 * @remarks По умолчанию использует намеренно сырые backend strings, чтобы тесты
 * могли доказать отсутствие их утечки в пользовательский интерфейс.
 */
export function createApiProblemError(
  code: ProblemCode,
  status: number,
  overrides: Partial<ProblemDocumentLike> = {},
) {
  return new ApiProblemError(
    {
      type: 'https://api.example.test/problems/test',
      title: 'Raw backend title',
      status,
      detail: 'Raw backend detail',
      instance: 'urn:request:test-problem',
      code,
      requestId: 'request-test-problem',
      errors: [
        {
          pointer: '/secret',
          code: 'FIELD_INVALID',
          detail: 'Raw backend field detail',
        },
      ],
      ...overrides,
    },
    null,
  )
}
