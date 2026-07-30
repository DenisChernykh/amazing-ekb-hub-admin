import { CurrentUserContext } from '@/entities/session/model/current-user'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AdminShell } from './admin-shell'

vi.mock('@/features/auth/logout/ui/logout-button', () => ({
  LogoutButton: () => <button>Выйти</button>,
}))

describe('AdminShell', () => {
  it('renders protected navigation and neutral user summary', () => {
    render(
      <MemoryRouter initialEntries={['/places']}>
        <CurrentUserContext.Provider
          value={{
            normalizedEmail: 'admin@example.test',
            permissions: ['admin.dashboard.read'],
            roleKeys: ['admin'],
            userId: 'admin-1',
          }}
        >
          <AdminShell />
        </CurrentUserContext.Provider>
      </MemoryRouter>,
    )

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
    expect(screen.getByText('admin@example.test')).toBeInTheDocument()
    expect(screen.getByText('Администратор')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })
})
