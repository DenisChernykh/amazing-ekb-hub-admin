import {
  CONTENT_SOURCE_PLATFORM_VALUES,
  CONTENT_SOURCE_STATUS_VALUES,
} from '@/entities/content-source/ui/content-source-meta'
import type {
  ContentSourcePlatform,
  ContentSourceStatus,
} from '@/shared/api/generated/model'
import type { ListContentSourcesParams } from '@/shared/api/generated/operation/listContentSourcesParams'

/**
 * URL-состояние фильтров content sources.
 *
 * @remarks `null` означает отсутствие соответствующего query param и backend-режим без фильтра.
 */
export type ContentSourceFiltersState = {
  platform: ContentSourcePlatform | null
  status: ContentSourceStatus | null
}

const getContentSourcePlatformFromValue = (
  value: string | number | null,
): ContentSourcePlatform | null => {
  if (typeof value !== 'string') {
    return null
  }

  return CONTENT_SOURCE_PLATFORM_VALUES.includes(value as ContentSourcePlatform)
    ? (value as ContentSourcePlatform)
    : null
}

const getContentSourceStatusFromValue = (
  value: string | number | null,
): ContentSourceStatus | null => {
  if (typeof value !== 'string') {
    return null
  }

  return CONTENT_SOURCE_STATUS_VALUES.includes(value as ContentSourceStatus)
    ? (value as ContentSourceStatus)
    : null
}

/**
 * Читает фильтры content sources из URL search params.
 */
export const getContentSourceFiltersFromSearch = (
  searchParams: URLSearchParams,
): ContentSourceFiltersState => ({
  platform: getContentSourcePlatformFromValue(searchParams.get('platform')),
  status: getContentSourceStatusFromValue(searchParams.get('status')),
})

/**
 * Преобразует URL-state фильтры в query params backend endpoint.
 */
export const getContentSourceQueryParams = (
  filters: ContentSourceFiltersState,
): ListContentSourcesParams => ({
  ...(filters.platform ? { platform: filters.platform } : {}),
  ...(filters.status ? { status: filters.status } : {}),
})

/**
 * Создает следующие search params для смены фильтров content sources.
 */
export const buildContentSourceFiltersSearch = (
  currentParams: URLSearchParams,
  filters: ContentSourceFiltersState,
) => {
  const nextParams = new URLSearchParams(currentParams)

  if (filters.platform) {
    nextParams.set('platform', filters.platform)
  } else {
    nextParams.delete('platform')
  }

  if (filters.status) {
    nextParams.set('status', filters.status)
  } else {
    nextParams.delete('status')
  }

  return nextParams
}
