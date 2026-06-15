import { useListAdminMaterialLibrary } from '@/shared/api/generated/admin/admin'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMaterialLibraryQuery } from './material-library-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useListAdminMaterialLibrary: vi.fn(),
}))

const mockedUseListAdminMaterialLibrary = vi.mocked(useListAdminMaterialLibrary)

describe('material library hooks', () => {
  beforeEach(() => {
    mockedUseListAdminMaterialLibrary.mockReset()
  })

  it('loads admin material library through entity bridge', () => {
    mockedUseListAdminMaterialLibrary.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListAdminMaterialLibrary>)

    renderHook(() =>
      useMaterialLibraryQuery(
        {
          adminStatus: 'pending',
          linked: false,
          platform: 'telegram',
        },
        { enabled: true },
      ),
    )

    expect(mockedUseListAdminMaterialLibrary).toHaveBeenCalledWith(
      {
        adminStatus: 'pending',
        linked: false,
        platform: 'telegram',
      },
      { query: { enabled: true } },
    )
  })
})
