import { describe, expect, it } from 'vitest'
import { protectedRouteChildren } from './index'

describe('protectedRouteChildren', () => {
  it('contains dashboard and places routes', () => {
    expect(protectedRouteChildren.map((route) => route.path)).toEqual([
      '/',
      '/places',
      '/places/:placeId',
      '/places/new',
    ])
  })
})
