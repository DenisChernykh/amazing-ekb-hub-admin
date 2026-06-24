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
            email: 'admin@example.test',
            id: 'admin-1',
            role: 'admin',
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
    expect(screen.getByRole('link', { name: 'Материалы' })).toHaveAttribute(
      'href',
      '/materials',
    )
    expect(screen.getByRole('link', { name: 'Источники' })).toHaveAttribute(
      'href',
      '/content-sources',
    )
    expect(screen.queryByText('admin@example.test')).not.toBeInTheDocument()
    expect(screen.getAllByText('Администратор')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })
})
