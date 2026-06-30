import {
  MATERIAL_ADMIN_STATUS_VALUES,
  MATERIAL_PLATFORM_VALUES,
} from '@/entities/material/ui/material-meta'
import type {
  MaterialAdminStatus,
  Platform,
} from '@/shared/api/generated/model'
import type { ListAdminMaterialLibraryParams } from '@/shared/api/generated/operation/listAdminMaterialLibraryParams'
import { parsePositiveInteger } from '@/shared/lib/number/parse-positive-integer'
import { isOneOf } from '@/shared/lib/type/is-one-of'

/**
 * Страница библиотеки материалов по умолчанию.
 */
export const MATERIAL_LIBRARY_DEFAULT_PAGE = 1

/**
 * Размер страницы библиотеки материалов по умолчанию.
 */
export const MATERIAL_LIBRARY_DEFAULT_PAGE_SIZE = 20

/**
 * Максимальный размер страницы библиотеки материалов по backend-контракту.
 */
export const MATERIAL_LIBRARY_MAX_PAGE_SIZE = 100

/**
 * URL-состояние фильтров material library inbox.
 *
 * @remarks `null` означает отсутствие соответствующего query param и backend-режим без фильтра.
 */
export type MaterialLibraryFiltersState = {
  adminStatus: MaterialAdminStatus | null
  linked: boolean | null
  platform: Platform | null
}

/**
 * URL-состояние пагинации material library inbox.
 */
export type MaterialLibraryPaginationState = {
  page: number
  pageSize: number
}

const getMaterialLibraryPlatformFromValue = (
  value: string | number | null,
): Platform | null => {
  return isOneOf(MATERIAL_PLATFORM_VALUES, value) ? value : null
}

const getMaterialLibraryAdminStatusFromValue = (
  value: string | number | null,
): MaterialAdminStatus | null => {
  return isOneOf(MATERIAL_ADMIN_STATUS_VALUES, value) ? value : null
}

/**
 * Нормализует сырое значение linked-фильтра из UI или URL.
 */
export const getMaterialLibraryLinkedFilterFromValue = (
  value: string | number | null,
): boolean | null => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return null
}

/**
 * Читает фильтры material library inbox из URL search params.
 */
export const getMaterialLibraryFiltersFromSearch = (
  searchParams: URLSearchParams,
): MaterialLibraryFiltersState => ({
  adminStatus: getMaterialLibraryAdminStatusFromValue(
    searchParams.get('adminStatus'),
  ),
  linked: getMaterialLibraryLinkedFilterFromValue(searchParams.get('linked')),
  platform: getMaterialLibraryPlatformFromValue(searchParams.get('platform')),
})

/**
 * Читает page/pageSize material library inbox из URL search params.
 */
export const getMaterialLibraryPaginationFromSearch = (
  searchParams: URLSearchParams,
): MaterialLibraryPaginationState => {
  const pageSize = parsePositiveInteger(
    searchParams.get('pageSize'),
    MATERIAL_LIBRARY_DEFAULT_PAGE_SIZE,
  )

  return {
    page: parsePositiveInteger(
      searchParams.get('page'),
      MATERIAL_LIBRARY_DEFAULT_PAGE,
    ),
    pageSize: Math.min(pageSize, MATERIAL_LIBRARY_MAX_PAGE_SIZE),
  }
}

/**
 * Преобразует URL-state фильтры и пагинацию в query params backend endpoint.
 */
export const getMaterialLibraryQueryParams = (
  filters: MaterialLibraryFiltersState,
  pagination: MaterialLibraryPaginationState,
): ListAdminMaterialLibraryParams => ({
  ...(filters.adminStatus ? { adminStatus: filters.adminStatus } : {}),
  ...(filters.linked !== null ? { linked: filters.linked } : {}),
  page: pagination.page,
  pageSize: pagination.pageSize,
  ...(filters.platform ? { platform: filters.platform } : {}),
})

/**
 * Создает следующие search params для смены фильтров material library inbox.
 *
 * @remarks Смена фильтра возвращает список на первую страницу и сохраняет выбранный размер страницы.
 */
export const buildMaterialLibraryFiltersSearch = (
  currentParams: URLSearchParams,
  filters: MaterialLibraryFiltersState,
) => {
  const nextParams = new URLSearchParams(currentParams)

  nextParams.delete('page')

  if (filters.platform) {
    nextParams.set('platform', filters.platform)
  } else {
    nextParams.delete('platform')
  }

  if (filters.adminStatus) {
    nextParams.set('adminStatus', filters.adminStatus)
  } else {
    nextParams.delete('adminStatus')
  }

  if (filters.linked !== null) {
    nextParams.set('linked', String(filters.linked))
  } else {
    nextParams.delete('linked')
  }

  return nextParams
}

/**
 * Создает следующие search params для смены страницы или размера страницы.
 */
export const buildMaterialLibraryPaginationSearch = (
  currentParams: URLSearchParams,
  pagination: MaterialLibraryPaginationState,
) => {
  const nextParams = new URLSearchParams(currentParams)

  if (pagination.page === MATERIAL_LIBRARY_DEFAULT_PAGE) {
    nextParams.delete('page')
  } else {
    nextParams.set('page', String(pagination.page))
  }

  if (pagination.pageSize === MATERIAL_LIBRARY_DEFAULT_PAGE_SIZE) {
    nextParams.delete('pageSize')
  } else {
    nextParams.set('pageSize', String(pagination.pageSize))
  }

  return nextParams
}
