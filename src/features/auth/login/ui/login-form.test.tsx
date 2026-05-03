import { useLoginSession } from '@/entities/session/model/session-hooks'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

vi.mock('@/entities/session/model/session-hooks', () => {
  return {
    useLoginSession: vi.fn(),
  }
})

const mockedUseLoginSession = vi.mocked(useLoginSession)

describe('LoginForm', () => {
  beforeEach(() => {
    mockedUseLoginSession.mockReset()
  })

  it('submits credentials to session login mutation', async () => {
    const mutate = vi.fn()
    mockedUseLoginSession.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useLoginSession>)

    render(
      <AntdApp>
        <LoginForm onLoggedIn={vi.fn()} />
      </AntdApp>,
    )

    await userEvent.type(screen.getByLabelText('Email'), 'admin@amazing-ekb.ru')
    await userEvent.type(screen.getByLabelText('Пароль'), 'supersecret123')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(mutate).toHaveBeenCalledWith({
      data: {
        email: 'admin@amazing-ekb.ru',
        password: 'supersecret123',
      },
    })
  })
})
