import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from './login-page'

vi.mock('@/widgets/auth-login/ui/auth-login-screen', () => {
  return {
    AuthLoginScreen: () => <div>Auth login screen</div>,
  }
})

describe('LoginPage', () => {
  it('renders auth login screen widget', () => {
    render(<LoginPage />)

    expect(screen.getByText('Auth login screen')).toBeInTheDocument()
  })
})
