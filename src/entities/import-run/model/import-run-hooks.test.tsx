import { useListImportRuns } from '@/shared/api/generated/admin/admin'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useImportRunsQuery } from './import-run-hooks'

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useListImportRuns: vi.fn(),
}))

const mockedUseListImportRuns = vi.mocked(useListImportRuns)

describe('import run hooks', () => {
  beforeEach(() => {
    mockedUseListImportRuns.mockReset()
  })

  it('loads import runs through entity bridge', () => {
    mockedUseListImportRuns.mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useListImportRuns>)

    renderHook(() =>
      useImportRunsQuery(
        {
          sourceId: 'source-1',
          status: 'failed',
        },
        { enabled: true },
      ),
    )

    expect(mockedUseListImportRuns).toHaveBeenCalledWith(
      {
        sourceId: 'source-1',
        status: 'failed',
      },
      { query: { enabled: true } },
    )
  })
})
