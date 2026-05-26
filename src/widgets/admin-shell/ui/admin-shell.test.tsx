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
            email: 'admin@amazing-ekb.ru',
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
    expect(screen.queryByText('admin@amazing-ekb.ru')).not.toBeInTheDocument()
    expect(screen.getAllByText('Администратор')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })
})
