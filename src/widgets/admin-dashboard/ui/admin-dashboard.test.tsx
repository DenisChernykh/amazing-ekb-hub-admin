import { CurrentUserContext } from '@/entities/session/model/current-user'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdminDashboard } from './admin-dashboard'

describe('AdminDashboard', () => {
  it('renders current user profile with localized role', () => {
    render(
      <CurrentUserContext.Provider
        value={{
          email: 'admin@amazing-ekb.ru',
          id: 'admin-1',
          role: 'admin',
        }}
      >
        <AdminDashboard />
      </CurrentUserContext.Provider>,
    )

    expect(document.title).toBe('Обзор | Amazing EKB Admin')
    expect(screen.getByText('Обзор')).toBeInTheDocument()
    expect(screen.getAllByText('admin@amazing-ekb.ru')).toHaveLength(2)
    expect(screen.getAllByText('Администратор')).toHaveLength(2)
  })
})
