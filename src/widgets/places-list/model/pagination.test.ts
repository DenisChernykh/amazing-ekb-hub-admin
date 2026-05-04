import { describe, expect, it } from 'vitest'
import {
  buildPlacesListPaginationSearch,
  getPlacesListPaginationFromSearch,
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
})
