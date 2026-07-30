import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AdminDashboard } from './admin-dashboard'

describe('AdminDashboard', () => {
  it('renders a product welcome screen without technical session details', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )

    expect(document.title).toBe('Обзор | Amazing EKB Admin')
    expect(screen.getByText('Обзор')).toBeInTheDocument()
    expect(
      screen.getByText('Добро пожаловать в панель управления гидом'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Перейти к местам' }),
    ).toHaveAttribute('href', '/places')

    expect(screen.queryByText('admin@example.test')).not.toBeInTheDocument()
    expect(screen.queryByText('admin-1')).not.toBeInTheDocument()
    expect(screen.queryByText('ID')).not.toBeInTheDocument()
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
    expect(screen.queryByText('Роль')).not.toBeInTheDocument()
  })
})
