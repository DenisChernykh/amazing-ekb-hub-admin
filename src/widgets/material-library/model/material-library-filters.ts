import type {
  MaterialAdminStatus,
  Platform,
} from '@/shared/api/generated/model'
import type { ListAdminMaterialLibraryParams } from '@/shared/api/generated/operation/listAdminMaterialLibraryParams'
import { parsePositiveInteger } from '@/shared/lib/number/parse-positive-integer'

/**
 * Страница библиотеки материалов по умолчанию.
 */
export const MATERIAL_LIBRARY_DEFAULT_PAGE = 1

/**
 * Размер страницы библиотеки материалов по умолчанию.
 */
export const MATERIAL_LIBRARY_DEFAULT_PAGE_SIZE = 20

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

const platformValues = ['telegram', 'dzen', 'instagram'] satisfies Platform[]

const adminStatusValues = [
  'pending',
  'approved',
  'rejected',
  'archived',
] satisfies MaterialAdminStatus[]

const getMaterialLibraryPlatformFromValue = (
  value: string | number | null,
): Platform | null => {
  if (typeof value !== 'string') {
    return null
  }

  return platformValues.includes(value as Platform) ? (value as Platform) : null
}

const getMaterialLibraryAdminStatusFromValue = (
  value: string | number | null,
): MaterialAdminStatus | null => {
  if (typeof value !== 'string') {
    return null
  }

  return adminStatusValues.includes(value as MaterialAdminStatus)
    ? (value as MaterialAdminStatus)
    : null
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
): MaterialLibraryPaginationState => ({
  page: parsePositiveInteger(
    searchParams.get('page'),
    MATERIAL_LIBRARY_DEFAULT_PAGE,
  ),
  pageSize: parsePositiveInteger(
    searchParams.get('pageSize'),
    MATERIAL_LIBRARY_DEFAULT_PAGE_SIZE,
  ),
})

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
