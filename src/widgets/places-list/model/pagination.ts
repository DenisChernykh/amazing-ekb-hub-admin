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
