import { AxiosError } from 'axios'

/**
 * Тело стандартной ошибки NestJS, которое frontend считает единственным целевым error contract.
 */
export type NestErrorBody = {
  statusCode?: number
  message?: string | string[]
  error?: string
  [key: string]: unknown
}

/**
 * Каноническая классификация ошибок API для UI-сценариев админки.
 */
export type ApiErrorKind =
  | 'auth'
  | 'permission'
  | 'validation'
  | 'conflict'
  | 'not-found'
  | 'network'
  | 'server'
  | 'unknown'

/**
 * Нормализованная ошибка API с NestJS body, HTTP status и списком сообщений для UI.
 */
export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly body?: NestErrorBody
  readonly messages: string[]

  constructor(params: {
    kind: ApiErrorKind
    message: string
    messages?: string[]
    status?: number
    body?: NestErrorBody
    cause?: unknown
  }) {
    super(params.message, { cause: params.cause })
    this.name = 'ApiClientError'
    this.kind = params.kind
    this.status = params.status
    this.body = params.body
    this.messages = params.messages ?? [params.message]
  }
}

/**
 * Проверяет, была ли ошибка уже нормализована API-клиентом.
 */
export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError

/**
 * Возвращает HTTP status из нормализованной API-ошибки.
 */
export const getApiErrorStatus = (error: unknown) =>
  isApiClientError(error) ? error.status : undefined

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toNestErrorBody = (value: unknown): NestErrorBody | undefined =>
  isRecord(value) ? (value as NestErrorBody) : undefined

const getMessages = (body: NestErrorBody | undefined, fallback: string) => {
  const message = body?.message

  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string')
  }

  if (typeof message === 'string' && message.length > 0) {
    return [message]
  }

  return [fallback]
}

const getErrorTitle = (body: NestErrorBody | undefined) =>
  typeof body?.error === 'string' ? body.error : undefined

const classifyStatus = (status: number | undefined): ApiErrorKind => {
  if (status === 400 || status === 422) {
    return 'validation'
  }

  if (status === 401) {
    return 'auth'
  }

  if (status === 403) {
    return 'permission'
  }

  if (status === 404) {
    return 'not-found'
  }

  if (status === 409) {
    return 'conflict'
  }

  if (status && status >= 500) {
    return 'server'
  }

  return 'unknown'
}

/**
 * Приводит Axios, network и неизвестные ошибки к единой форме `ApiClientError`.
 */
export const normalizeApiError = (error: unknown): ApiClientError => {
  if (isApiClientError(error)) {
    return error
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return new ApiClientError({
        kind: 'network',
        message: 'Network error',
        cause: error,
      })
    }

    const body = toNestErrorBody(error.response.data)
    const fallbackMessage =
      getErrorTitle(body) ?? error.response.statusText ?? 'Request failed'
    const messages = getMessages(body, fallbackMessage)

    return new ApiClientError({
      kind: classifyStatus(error.response.status),
      status: error.response.status,
      body,
      message: messages[0] ?? fallbackMessage,
      messages,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new ApiClientError({
      kind: 'unknown',
      message: error.message,
      cause: error,
    })
  }

  return new ApiClientError({
    kind: 'unknown',
    message: 'Unknown error',
    cause: error,
  })
}
