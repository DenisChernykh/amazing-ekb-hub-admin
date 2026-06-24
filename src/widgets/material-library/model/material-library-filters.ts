import type {
  MaterialAdminStatus,
  Platform,
} from '@/shared/api/generated/model'
import type { ListAdminMaterialLibraryParams } from '@/shared/api/generated/operation/listAdminMaterialLibraryParams'

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
 * Преобразует URL-state фильтры в query params backend endpoint.
 */
export const getMaterialLibraryQueryParams = (
  filters: MaterialLibraryFiltersState,
): ListAdminMaterialLibraryParams => ({
  ...(filters.adminStatus ? { adminStatus: filters.adminStatus } : {}),
  ...(filters.linked !== null ? { linked: filters.linked } : {}),
  ...(filters.platform ? { platform: filters.platform } : {}),
})

/**
 * Создает следующие search params для смены фильтров material library inbox.
 */
export const buildMaterialLibraryFiltersSearch = (
  currentParams: URLSearchParams,
  filters: MaterialLibraryFiltersState,
) => {
  const nextParams = new URLSearchParams(currentParams)

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
