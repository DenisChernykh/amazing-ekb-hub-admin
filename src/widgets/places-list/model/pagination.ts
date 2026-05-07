import { getPlaceStatusFromValue } from '@/entities/place/model/place-status'
import type { PlaceStatus } from '@/shared/api/generated/model'
import { parsePositiveInteger } from '@/shared/lib/number/parse-positive-integer'

/**
 * Страница списка мест по умолчанию.
 */
export const PLACES_LIST_DEFAULT_PAGE = 1

/**
 * Размер страницы списка мест по умолчанию.
 */
export const PLACES_LIST_DEFAULT_PAGE_SIZE = 10

/**
 * URL-состояние пагинации списка мест.
 */
export type PlacesListPaginationState = {
  page: number
  pageSize: number
}

/**
 * URL-состояние фильтра статуса списка мест.
 *
 * @remarks `null` означает отсутствие query param и backend-режим all statuses.
 */
export type PlacesListStatusFilter = PlaceStatus | null

const setDefaultAwareParam = (
  params: URLSearchParams,
  key: string,
  value: number,
  defaultValue: number,
) => {
  if (value === defaultValue) {
    params.delete(key)
    return
  }

  params.set(key, String(value))
}

/**
 * Читает page/pageSize из URL search params с fallback на значения по умолчанию.
 */
export const getPlacesListPaginationFromSearch = (
  searchParams: URLSearchParams,
): PlacesListPaginationState => ({
  page: parsePositiveInteger(
    searchParams.get('page'),
    PLACES_LIST_DEFAULT_PAGE,
  ),
  pageSize: parsePositiveInteger(
    searchParams.get('pageSize'),
    PLACES_LIST_DEFAULT_PAGE_SIZE,
  ),
})

/**
 * Нормализует сырое значение status-фильтра из UI или URL.
 *
 * @remarks `active` и `hidden` проходят как backend-фильтр, остальные значения означают all statuses.
 */
export const getPlacesListStatusFromValue = (
  value: string | number | null,
): PlacesListStatusFilter => getPlaceStatusFromValue(value)

/**
 * Читает status из URL search params с fallback на all statuses.
 */
export const getPlacesListStatusFromSearch = (
  searchParams: URLSearchParams,
): PlacesListStatusFilter =>
  getPlacesListStatusFromValue(searchParams.get('status'))

/**
 * Создает следующие search params для смены страницы или размера страницы.
 */
export const buildPlacesListPaginationSearch = (
  currentParams: URLSearchParams,
  pagination: PlacesListPaginationState,
) => {
  const nextParams = new URLSearchParams(currentParams)

  setDefaultAwareParam(
    nextParams,
    'page',
    pagination.page,
    PLACES_LIST_DEFAULT_PAGE,
  )
  setDefaultAwareParam(
    nextParams,
    'pageSize',
    pagination.pageSize,
    PLACES_LIST_DEFAULT_PAGE_SIZE,
  )

  return nextParams
}

/**
 * Создает следующие search params для смены status-фильтра с возвратом на первую страницу.
 */
export const buildPlacesListStatusSearch = (
  currentParams: URLSearchParams,
  status: PlacesListStatusFilter,
) => {
  const nextParams = new URLSearchParams(currentParams)

  nextParams.delete('page')

  if (status === null) {
    nextParams.delete('status')
    return nextParams
  }

  nextParams.set('status', status)

  return nextParams
}
