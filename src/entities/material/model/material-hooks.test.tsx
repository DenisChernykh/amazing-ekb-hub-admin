import { useListPlaceMaterials } from '@/shared/api/generated/places/places'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceMaterialsListQuery } from './material-hooks'

vi.mock('@/shared/api/generated/places/places', () => ({
  useListPlaceMaterials: vi.fn(),
}))

const mockedUseListPlaceMaterials = vi.mocked(useListPlaceMaterials)

describe('material hooks', () => {
  beforeEach(() => {
    mockedUseListPlaceMaterials.mockReset()
  })

  it('loads place materials through entity bridge with retry disabled', () => {
    mockedUseListPlaceMaterials.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListPlaceMaterials>)

    renderHook(() =>
      usePlaceMaterialsListQuery(
        'place-1',
        { page: 1, pageSize: 5, platform: 'telegram' },
        { enabled: true },
      ),
    )

    expect(mockedUseListPlaceMaterials).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      { page: 1, pageSize: 5, platform: 'telegram' },
      { query: { retry: false, enabled: true } },
    )
  })
})
