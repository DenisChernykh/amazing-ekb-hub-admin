import { useLogoutSession } from '@/entities/session/model/session-hooks'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LogoutButton } from './logout-button'

vi.mock('@/entities/session/model/session-hooks', () => ({
  useLogoutSession: vi.fn(),
}))

const mockedUseLogoutSession = vi.mocked(useLogoutSession)

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
    mockedUseLogoutSession.mockReset()
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
})
