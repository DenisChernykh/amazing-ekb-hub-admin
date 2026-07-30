import { AuthGetCsrfToken401Response } from '@/shared/api/generated-zod/auth/auth.zod'
import type { ProblemResponseDto } from '@/shared/api/generated/model'
import axios from 'axios'
import { z } from 'zod'

const problemDocumentSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int().min(400).max(599),
    detail: z.string(),
    instance: z.string(),
    code: AuthGetCsrfToken401Response.shape.code,
    requestId: z.string(),
    errors: z
      .array(
        z.object({
          pointer: z.string(),
          code: z.string(),
          detail: z.string(),
        }),
      )
      .optional(),
  })
  .superRefine((problem, context) => {
    if (problem.code === 'VALIDATION_FAILED' && problem.status !== 422) {
      context.addIssue({
        code: 'custom',
        message: 'VALIDATION_FAILED requires status 422',
        path: ['status'],
      })
    }
  })

/**
 * Структурированное тело ошибки API в формате Problem Details.
 *
 * @remarks Повторяет проверенный runtime schema и не доверяет произвольному
 * телу HTTP-ответа только из-за его статуса.
 */
export type ProblemDocumentLike = z.infer<typeof problemDocumentSchema>

/** Допустимый стабильный код ошибки из backend-generated контракта. */
export type ProblemCode = ProblemResponseDto['code']

/**
 * Ошибка API с проверенным телом Problem Details.
 *
 * @remarks Сохраняет problem, `requestId` и вычисленный `retryAfterMs`, чтобы
 * приложение классифицировало ошибку без чтения Axios response.
 */
export class ApiProblemError<
  TProblem extends ProblemDocumentLike = ProblemDocumentLike,
> extends Error {
  public readonly name = 'ApiProblemError'
  public readonly problem: TProblem
  public readonly retryAfterMs: number | null

  public constructor(problem: TProblem, retryAfterMs: number | null) {
    super(problem.title)
    this.problem = problem
    this.retryAfterMs = retryAfterMs
  }

  public get status() {
    return this.problem.status
  }

  public get code() {
    return this.problem.code
  }

  public get requestId() {
    return this.problem.requestId
  }
}

/** Ошибка отсутствия сетевого соединения с API без HTTP-ответа. */
export class ApiNetworkError extends Error {
  public readonly name = 'ApiNetworkError'

  public constructor() {
    super('The API could not be reached')
  }
}

/** Ошибка ответа API, не соответствующего Problem Details контракту. */
export class ApiProtocolError extends Error {
  public readonly name = 'ApiProtocolError'

  public constructor() {
    super('The API returned an invalid error response')
  }
}

/** Объединение нормализованных ошибок клиентского API для UI-сценариев. */
export type ApiClientError<
  TProblem extends ProblemDocumentLike = ProblemDocumentLike,
> = ApiProblemError<TProblem> | ApiNetworkError | ApiProtocolError

function parseRetryAfter(value: unknown, now: number): number | null {
  if (typeof value !== 'string') {
    return null
  }

  const retryAfter = value.trim()
  if (/^\d+$/u.test(retryAfter)) {
    const milliseconds = Number(retryAfter) * 1_000
    return Number.isSafeInteger(milliseconds) ? milliseconds : null
  }

  if (
    !/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/u.test(
      retryAfter,
    )
  ) {
    return null
  }

  const retryAt = Date.parse(retryAfter)
  if (
    Number.isNaN(retryAt) ||
    new Date(retryAt).toUTCString() !== retryAfter ||
    retryAt <= now
  ) {
    return null
  }

  return retryAt - now
}

/**
 * Преобразует неизвестную ошибку Axios в нормализованную ошибку клиентского API.
 *
 * @remarks Сетевой сбой без response становится `ApiNetworkError`. HTTP-ответ
 * принимается только с `application/problem+json`, валидным runtime schema и
 * совпадающим HTTP/body status; остальные варианты становятся
 * `ApiProtocolError`.
 *
 * @returns Ошибку, безопасную для единообразной классификации в приложении.
 */
export function normalizeApiError(
  error: unknown,
  now = Date.now(),
): ApiClientError {
  if (!axios.isAxiosError(error)) {
    return new ApiProtocolError()
  }

  if (error.response === undefined) {
    return new ApiNetworkError()
  }

  const contentType = String(error.response.headers['content-type'] ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  if (contentType !== 'application/problem+json') {
    return new ApiProtocolError()
  }

  const parsed = problemDocumentSchema.safeParse(error.response.data)
  if (!parsed.success || parsed.data.status !== error.response.status) {
    return new ApiProtocolError()
  }

  return new ApiProblemError(
    parsed.data,
    parseRetryAfter(error.response.headers['retry-after'], now),
  )
}

/** Проверяет, имеет ли нормализованная API-ошибка указанный backend code. */
export function isProblemCode<TCode extends ProblemCode>(
  error: unknown,
  code: TCode,
): error is ApiProblemError<ProblemDocumentLike & { code: TCode }> {
  return error instanceof ApiProblemError && error.code === code
}
