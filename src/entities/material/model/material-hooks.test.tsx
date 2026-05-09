import { useListAdminPlaceMaterials } from '@/shared/api/generated/admin/admin'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaceMaterialsListQuery } from './material-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useListAdminPlaceMaterials: vi.fn(),
}))

const mockedUseListAdminPlaceMaterials = vi.mocked(useListAdminPlaceMaterials)

describe('material hooks', () => {
  beforeEach(() => {
    mockedUseListAdminPlaceMaterials.mockReset()
  })

  it('loads place materials through entity bridge with retry disabled', () => {
    mockedUseListAdminPlaceMaterials.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListAdminPlaceMaterials>)

    renderHook(() =>
      usePlaceMaterialsListQuery(
        'place-1',
        { platform: 'telegram' },
        { enabled: true },
      ),
    )

    expect(mockedUseListAdminPlaceMaterials).toHaveBeenCalledWith(
      { placeId: 'place-1' },
      { platform: 'telegram' },
      { query: { retry: false, enabled: true } },
    )
  })
})
