import { describe, expect, it } from 'vitest'
import {
  buildContentSourceFiltersSearch,
  getContentSourceFiltersFromSearch,
  getContentSourceQueryParams,
} from './content-source-filters'

describe('content source filters', () => {
  it('reads valid filters from URL search params', () => {
    expect(
      getContentSourceFiltersFromSearch(
        new URLSearchParams('platform=telegram&status=active'),
      ),
    ).toEqual({
      platform: 'telegram',
      status: 'active',
    })
  })

  it('drops invalid filter values', () => {
    expect(
      getContentSourceFiltersFromSearch(
        new URLSearchParams('platform=youtube&status=archived'),
      ),
    ).toEqual({
      platform: null,
      status: null,
    })
  })

  it('converts URL state to backend query params', () => {
    expect(
      getContentSourceQueryParams({
        platform: 'vk',
        status: 'disabled',
      }),
    ).toEqual({
      platform: 'vk',
      status: 'disabled',
    })
    expect(
      getContentSourceQueryParams({
        platform: null,
        status: null,
      }),
    ).toEqual({})
  })

  it('builds next filter search and preserves unrelated params', () => {
    const search = buildContentSourceFiltersSearch(
      new URLSearchParams('page=2&platform=telegram&status=active'),
      {
        platform: 'dzen',
        status: null,
      },
    )

    expect(search.toString()).toBe('page=2&platform=dzen')
  })
})
