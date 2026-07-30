import {
  CONTENT_SOURCE_PLATFORM_VALUES,
  CONTENT_SOURCE_STATUS_VALUES,
} from '@/entities/content-source/ui/content-source-meta'
import type {
  AdminContentSourcesListParams,
  ContentSourceResponseDtoPlatform,
  ContentSourceResponseDtoStatus,
} from '@/shared/api'
import { isOneOf } from '@/shared/lib/type/is-one-of'

/**
 * URL-состояние фильтров content sources.
 *
 * @remarks `null` означает отсутствие соответствующего query param и backend-режим без фильтра.
 */
export type ContentSourceFiltersState = {
  platform: ContentSourceResponseDtoPlatform | null
  status: ContentSourceResponseDtoStatus | null
}

const getContentSourcePlatformFromValue = (
  value: string | number | null,
): ContentSourceResponseDtoPlatform | null => {
  return isOneOf(CONTENT_SOURCE_PLATFORM_VALUES, value) ? value : null
}

const getContentSourceStatusFromValue = (
  value: string | number | null,
): ContentSourceResponseDtoStatus | null => {
  return isOneOf(CONTENT_SOURCE_STATUS_VALUES, value) ? value : null
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
): AdminContentSourcesListParams => ({
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
