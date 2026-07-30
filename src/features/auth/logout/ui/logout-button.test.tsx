import { useLogoutSession } from '@/entities/session/model/session-hooks'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import type {
  AdminPlaceSummaryResponseDto,
  PlaceCategoryResponseDto,
} from '@/shared/api'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LogoutButton } from './logout-button'

vi.mock('@/entities/session/model/session-hooks', () => ({
  useLogoutSession: vi.fn(),
}))

const mockedUseLogoutSession = vi.mocked(useLogoutSession)

const poolsCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_pools',
  slug: 'pools',
  title: 'Бассейны',
} satisfies PlaceCategoryResponseDto

const activePlace: AdminPlaceSummaryResponseDto = {
  category: poolsCategory,
  coverImageUrl: null,
  mapsUrl: null,
  id: 'place-1',
  slug: 'aquacenter',
  status: 'active',
  summary: 'Теплый бассейн',
  tags: ['pool'],
  title: 'Аквацентр',
}

const renderLogoutButton = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <LogoutButton />,
      },
      {
        path: '/login',
        element: <div>Login route</div>,
      },
    ],
    {
      initialEntries: ['/'],
    },
  )

  render(
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>,
  )
}

describe('LogoutButton', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockedUseLogoutSession.mockReset()
  })

  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('calls session logout mutation', async () => {
    const mutate = vi.fn()
    mockedUseLogoutSession.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useLogoutSession>)

    renderLogoutButton()

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(mutate).toHaveBeenCalledWith()
  })

  it('clears bulk moderation draft after successful logout', async () => {
    let onSuccess: (() => Promise<void> | void) | undefined
    mockedUseLogoutSession.mockImplementation((options) => {
      onSuccess = options?.onSuccess

      return {
        isPending: false,
        mutate: vi.fn(),
      } as unknown as ReturnType<typeof useLogoutSession>
    })
    saveBulkModerationDraftSelection([activePlace])

    renderLogoutButton()

    await act(async () => {
      await onSuccess?.()
    })

    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(screen.getByText('Login route')).toBeInTheDocument()
  })
})
