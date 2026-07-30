import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { currentSessionQueryKey } from '@/entities/session'
import type { CurrentUserResponseDto } from '@/shared/api'

import { AdminShell } from './admin-shell'

vi.mock('@/features/auth/logout/ui/logout-button', () => ({
  LogoutButton: () => <button>Выйти</button>,
}))

vi.mock('@/shared/config', () => ({
  publicEnv: { VITE_API_BASE_URL: 'http://api.test' },
}))

const currentUser: CurrentUserResponseDto = {
  normalizedEmail: 'admin@example.test',
  permissions: ['admin.dashboard.read'],
  roleKeys: ['admin', 'content_editor'],
  userId: 'admin-1',
}

function renderAdminShell() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  })
  queryClient.setQueryData(currentSessionQueryKey(), currentUser)

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/places']}>
        <AdminShell />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminShell', () => {
  it('renders protected navigation with neutral header and every backend role', () => {
    renderAdminShell()

    expect(screen.getByRole('link', { name: 'Дашборд' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Места' })).toHaveAttribute(
      'href',
      '/places',
    )
    expect(screen.getByRole('link', { name: 'Категории' })).toHaveAttribute(
      'href',
      '/categories',
    )
    expect(screen.getByRole('link', { name: 'Материалы' })).toHaveAttribute(
      'href',
      '/materials',
    )
    expect(screen.getByRole('link', { name: 'Источники' })).toHaveAttribute(
      'href',
      '/content-sources',
    )
    expect(screen.getAllByText('Администратор').length).toBeGreaterThanOrEqual(
      1,
    )
    expect(screen.getByText('content_editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('does not expose session identity or permission diagnostics', () => {
    renderAdminShell()

    expect(
      screen.queryByText(currentUser.normalizedEmail),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(currentUser.userId)).not.toBeInTheDocument()
    expect(
      screen.queryByText(currentUser.permissions[0] ?? ''),
    ).not.toBeInTheDocument()
  })
})
