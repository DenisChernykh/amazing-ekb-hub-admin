import {
  useGetAdminPlaceDetail,
  useListAdminPlaces,
} from '@/shared/api/generated/admin/admin'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminPlaceDetailQuery, usePlacesListQuery } from './place-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useGetAdminPlaceDetail: vi.fn(),
  useListAdminPlaces: vi.fn(),
}))

const mockedUseListAdminPlaces = vi.mocked(useListAdminPlaces)
const mockedUseGetAdminPlaceDetail = vi.mocked(useGetAdminPlaceDetail)

describe('place hooks', () => {
  beforeEach(() => {
    mockedUseListAdminPlaces.mockReset()
    mockedUseGetAdminPlaceDetail.mockReset()
  })

  it('loads admin places through admin read endpoint without overriding retry policy', () => {
    mockedUseListAdminPlaces.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListAdminPlaces>)

    renderHook(() =>
      usePlacesListQuery({ page: 1, pageSize: 10, status: 'hidden' }),
    )

    expect(mockedUseListAdminPlaces).toHaveBeenCalledWith(
      { page: 1, pageSize: 10, status: 'hidden' },
      { query: undefined },
    )
  })

  it('loads admin place detail through admin read endpoint without overriding retry policy', () => {
    mockedUseGetAdminPlaceDetail.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useGetAdminPlaceDetail>)

    renderHook(() => useAdminPlaceDetailQuery('place-1'))

    expect(mockedUseGetAdminPlaceDetail).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      { query: undefined },
    )
  })
})
