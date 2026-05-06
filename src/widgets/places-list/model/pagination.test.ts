import { describe, expect, it } from 'vitest'
import {
  buildPlacesListPaginationSearch,
  buildPlacesListStatusSearch,
  getPlacesListPaginationFromSearch,
  getPlacesListStatusFromSearch,
  getPlacesListStatusFromValue,
} from './pagination'

describe('places list pagination', () => {
  it('reads valid URL pagination values', () => {
    const params = new URLSearchParams('page=3&pageSize=20')

    expect(getPlacesListPaginationFromSearch(params)).toEqual({
      page: 3,
      pageSize: 20,
    })
  })

  it('falls back to defaults for invalid URL pagination values', () => {
    const params = new URLSearchParams('page=0&pageSize=abc')

    expect(getPlacesListPaginationFromSearch(params)).toEqual({
      page: 1,
      pageSize: 10,
    })
  })

  it('keeps default pagination values out of URL', () => {
    const params = buildPlacesListPaginationSearch(
      new URLSearchParams('page=2&pageSize=20'),
      {
        page: 1,
        pageSize: 10,
      },
    )

    expect(params.toString()).toBe('')
  })

  it('reads valid status filter from URL', () => {
    expect(
      getPlacesListStatusFromSearch(new URLSearchParams('status=hidden')),
    ).toBe('hidden')
  })

  it('normalizes raw status filter values from UI or URL', () => {
    expect(getPlacesListStatusFromValue('active')).toBe('active')
    expect(getPlacesListStatusFromValue('hidden')).toBe('hidden')
    expect(getPlacesListStatusFromValue('all')).toBe(null)
    expect(getPlacesListStatusFromValue(1)).toBe(null)
  })

  it('falls back to all places for missing or invalid status filter', () => {
    expect(getPlacesListStatusFromSearch(new URLSearchParams())).toBe(null)
    expect(
      getPlacesListStatusFromSearch(new URLSearchParams('status=draft')),
    ).toBe(null)
  })

  it('writes status filter to URL and resets pagination page', () => {
    const params = buildPlacesListStatusSearch(
      new URLSearchParams('page=3&pageSize=20'),
      'active',
    )

    expect(params.toString()).toBe('pageSize=20&status=active')
  })

  it('keeps all status filter out of URL', () => {
    const params = buildPlacesListStatusSearch(
      new URLSearchParams('page=3&pageSize=20&status=hidden'),
      null,
    )

    expect(params.toString()).toBe('pageSize=20')
  })
})
