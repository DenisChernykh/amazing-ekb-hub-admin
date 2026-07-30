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

const httpMonths: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const httpShortWeekdays: readonly string[] = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
]
const httpLongWeekdays: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/**
 * Строго разбирает три формы HTTP-date из RFC 9110 без неявных форматов
 * `Date.parse`.
 *
 * @remarks Для устаревшего RFC850-формата применяет правило двухзначного года:
 * дата более чем на 50 лет в будущем относится к предыдущему столетию.
 */
function parseHttpDate(value: string, now: number): number | null {
  const imfFixdate =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/u.exec(
      value,
    )
  const rfc850Date =
    /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{2}):(\d{2}):(\d{2}) GMT$/u.exec(
      value,
    )
  const asctimeDate =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}| \d) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/u.exec(
      value,
    )

  let dateParts: {
    weekdayIndex: number
    year: number
    monthIndex: number
    day: number
    hour: number
    minute: number
    second: number
    isRfc850: boolean
  }

  if (imfFixdate !== null) {
    dateParts = {
      weekdayIndex: httpShortWeekdays.indexOf(imfFixdate[1] ?? ''),
      day: Number(imfFixdate[2]),
      monthIndex: httpMonths.indexOf(imfFixdate[3] ?? ''),
      year: Number(imfFixdate[4]),
      hour: Number(imfFixdate[5]),
      minute: Number(imfFixdate[6]),
      second: Number(imfFixdate[7]),
      isRfc850: false,
    }
  } else if (rfc850Date !== null) {
    const currentYear = new Date(now).getUTCFullYear()
    dateParts = {
      weekdayIndex: httpLongWeekdays.indexOf(rfc850Date[1] ?? ''),
      day: Number(rfc850Date[2]),
      monthIndex: httpMonths.indexOf(rfc850Date[3] ?? ''),
      year: currentYear - (currentYear % 100) + Number(rfc850Date[4]),
      hour: Number(rfc850Date[5]),
      minute: Number(rfc850Date[6]),
      second: Number(rfc850Date[7]),
      isRfc850: true,
    }
  } else if (asctimeDate !== null) {
    dateParts = {
      weekdayIndex: httpShortWeekdays.indexOf(asctimeDate[1] ?? ''),
      monthIndex: httpMonths.indexOf(asctimeDate[2] ?? ''),
      day: Number(asctimeDate[3]),
      hour: Number(asctimeDate[4]),
      minute: Number(asctimeDate[5]),
      second: Number(asctimeDate[6]),
      year: Number(asctimeDate[7]),
      isRfc850: false,
    }
  } else {
    return null
  }

  const { weekdayIndex, monthIndex, day, hour, minute, second, isRfc850 } =
    dateParts
  let { year } = dateParts

  if (
    weekdayIndex < 0 ||
    monthIndex < 0 ||
    !Number.isInteger(year) ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31 ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59 ||
    !Number.isInteger(second) ||
    second < 0 ||
    second > 60
  ) {
    return null
  }

  const normalizedSecond = Math.min(second, 59)
  let timestamp = Date.UTC(
    year,
    monthIndex,
    day,
    hour,
    minute,
    normalizedSecond,
  )

  const leapSecondMs = second === 60 ? 1_000 : 0
  if (isRfc850) {
    const fiftyYearBoundary = new Date(now)
    fiftyYearBoundary.setUTCFullYear(fiftyYearBoundary.getUTCFullYear() + 50)
    if (timestamp + leapSecondMs > fiftyYearBoundary.getTime()) {
      year -= 100
      timestamp = Date.UTC(
        year,
        monthIndex,
        day,
        hour,
        minute,
        normalizedSecond,
      )
    }
  }

  const parsedDate = new Date(timestamp)
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== monthIndex ||
    parsedDate.getUTCDate() !== day ||
    parsedDate.getUTCHours() !== hour ||
    parsedDate.getUTCMinutes() !== minute ||
    parsedDate.getUTCSeconds() !== normalizedSecond ||
    parsedDate.getUTCDay() !== weekdayIndex
  ) {
    return null
  }

  return timestamp + leapSecondMs
}

function parseRetryAfter(value: unknown, now: number): number | null {
  if (typeof value !== 'string') {
    return null
  }

  const retryAfter = value.trim()
  if (/^\d+$/u.test(retryAfter)) {
    const milliseconds = Number(retryAfter) * 1_000
    return Number.isSafeInteger(milliseconds) ? milliseconds : null
  }

  const retryAt = parseHttpDate(retryAfter, now)
  if (retryAt === null || retryAt <= now) {
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
