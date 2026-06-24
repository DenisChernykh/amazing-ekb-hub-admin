import { useListContentSources } from '@/shared/api/generated/admin/admin'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContentSourcesQuery } from './content-source-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useListContentSources: vi.fn(),
}))

const mockedUseListContentSources = vi.mocked(useListContentSources)

describe('content source hooks', () => {
  beforeEach(() => {
    mockedUseListContentSources.mockReset()
  })

  it('loads content sources through entity bridge', () => {
    mockedUseListContentSources.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListContentSources>)

    renderHook(() =>
      useContentSourcesQuery(
        {
          platform: 'telegram',
          status: 'active',
        },
        { enabled: true },
      ),
    )

    expect(mockedUseListContentSources).toHaveBeenCalledWith(
      {
        platform: 'telegram',
        status: 'active',
      },
      { query: { enabled: true } },
    )
  })
})
