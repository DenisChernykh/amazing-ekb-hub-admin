import { describe, expect, it } from 'vitest'
import {
  buildMaterialLibraryFiltersSearch,
  getMaterialLibraryFiltersFromSearch,
  getMaterialLibraryLinkedFilterFromValue,
  getMaterialLibraryQueryParams,
} from './material-library-filters'

describe('material library filters', () => {
  it('reads valid material library filters from URL', () => {
    const filters = getMaterialLibraryFiltersFromSearch(
      new URLSearchParams('platform=telegram&adminStatus=pending&linked=false'),
    )

    expect(filters).toEqual({
      adminStatus: 'pending',
      linked: false,
      platform: 'telegram',
    })
    expect(getMaterialLibraryQueryParams(filters)).toEqual({
      adminStatus: 'pending',
      linked: false,
      platform: 'telegram',
    })
  })

  it('falls back to all filters for missing or invalid URL values', () => {
    expect(
      getMaterialLibraryFiltersFromSearch(
        new URLSearchParams('platform=youtube&adminStatus=done&linked=maybe'),
      ),
    ).toEqual({
      adminStatus: null,
      linked: null,
      platform: null,
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
      new URLSearchParams('platform=dzen&adminStatus=approved&linked=true'),
      {
        adminStatus: 'rejected',
        linked: false,
        platform: 'telegram',
      },
    )

    expect(params.toString()).toBe(
      'platform=telegram&adminStatus=rejected&linked=false',
    )
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
    expect(getMaterialLibraryQueryParams(filters)).toEqual({})
  })
})
