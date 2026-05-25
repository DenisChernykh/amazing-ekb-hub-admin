import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthLoginScreen } from './auth-login-screen'

vi.mock('@/features/auth/login/ui/login-form', () => ({
  LoginForm: () => <div>Login form</div>,
}))

describe('AuthLoginScreen', () => {
  it('sets the login document title', () => {
    render(
      <MemoryRouter>
        <AuthLoginScreen />
      </MemoryRouter>,
    )

    expect(document.title).toBe('Вход | Amazing EKB Admin')
    expect(screen.getByText('Login form')).toBeInTheDocument()
  })
})
