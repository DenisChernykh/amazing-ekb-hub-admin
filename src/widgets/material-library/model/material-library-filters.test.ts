import { describe, expect, it } from 'vitest'
import {
  buildMaterialLibraryFiltersSearch,
  buildMaterialLibraryPaginationSearch,
  getMaterialLibraryFiltersFromSearch,
  getMaterialLibraryLinkedFilterFromValue,
  getMaterialLibraryPaginationFromSearch,
  getMaterialLibraryQueryParams,
} from './material-library-filters'

describe('material library filters', () => {
  it('reads valid material library filters from URL', () => {
    const filters = getMaterialLibraryFiltersFromSearch(
      new URLSearchParams(
        'platform=telegram&adminStatus=pending&linked=false&page=3&pageSize=50',
      ),
    )
    const pagination = getMaterialLibraryPaginationFromSearch(
      new URLSearchParams(
        'platform=telegram&adminStatus=pending&linked=false&page=3&pageSize=50',
      ),
    )

    expect(filters).toEqual({
      adminStatus: 'pending',
      linked: false,
      platform: 'telegram',
    })
    expect(pagination).toEqual({
      page: 3,
      pageSize: 50,
    })
    expect(getMaterialLibraryQueryParams(filters, pagination)).toEqual({
      adminStatus: 'pending',
      linked: false,
      page: 3,
      pageSize: 50,
      platform: 'telegram',
    })
  })

  it('falls back to all filters and default pagination for missing or invalid URL values', () => {
    expect(
      getMaterialLibraryFiltersFromSearch(
        new URLSearchParams(
          'platform=youtube&adminStatus=done&linked=maybe&page=0&pageSize=abc',
        ),
      ),
    ).toEqual({
      adminStatus: null,
      linked: null,
      platform: null,
    })
    expect(
      getMaterialLibraryPaginationFromSearch(
        new URLSearchParams(
          'platform=youtube&adminStatus=done&linked=maybe&page=0&pageSize=abc',
        ),
      ),
    ).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('clamps material library page size from URL to the backend max', () => {
    expect(
      getMaterialLibraryPaginationFromSearch(
        new URLSearchParams('page=2&pageSize=101'),
      ),
    ).toEqual({
      page: 2,
      pageSize: 100,
    })
  })

  it('normalizes raw linked filter values from UI or URL', () => {
    expect(getMaterialLibraryLinkedFilterFromValue('true')).toBe(true)
    expect(getMaterialLibraryLinkedFilterFromValue('false')).toBe(false)
    expect(getMaterialLibraryLinkedFilterFromValue('all')).toBe(null)
    expect(getMaterialLibraryLinkedFilterFromValue(1)).toBe(null)
  })

  it('writes non-default filters to URL', () => {
    const params = buildMaterialLibraryFiltersSearch(
      new URLSearchParams(
        'platform=dzen&adminStatus=approved&linked=true&page=4&pageSize=50',
      ),
      {
        adminStatus: 'rejected',
        linked: false,
        platform: 'telegram',
      },
    )

    expect(params.toString()).toBe(
      'platform=telegram&adminStatus=rejected&linked=false&pageSize=50',
    )
  })

  it('writes non-default pagination to URL', () => {
    const params = buildMaterialLibraryPaginationSearch(
      new URLSearchParams('platform=telegram&page=4&pageSize=50'),
      {
        page: 1,
        pageSize: 20,
      },
    )

    expect(params.toString()).toBe('platform=telegram')
  })

  it('keeps all filter values out of URL and query params', () => {
    const filters = {
      adminStatus: null,
      linked: null,
      platform: null,
    }
    const params = buildMaterialLibraryFiltersSearch(
      new URLSearchParams('platform=dzen&adminStatus=approved&linked=true'),
      filters,
    )

    expect(params.toString()).toBe('')
    expect(
      getMaterialLibraryQueryParams(filters, { page: 1, pageSize: 20 }),
    ).toEqual({
      page: 1,
      pageSize: 20,
    })
  })
})
