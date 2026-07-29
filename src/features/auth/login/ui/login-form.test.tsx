import { useLoginSession } from '@/entities/session/model/session-hooks'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import type { AuthMeResponse, PlaceSummary } from '@/shared/api/generated/model'
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

const admin: AuthMeResponse = {
  email: 'admin@example.test',
  id: 'admin-1',
  role: 'admin',
}

const poolsCategory = {
  coverImageUrl: null,
  id: 'category_pools',
  slug: 'pools',
  title: 'Бассейны',
}

const activePlace: PlaceSummary = {
  category: poolsCategory,
  coverImageUrl: null,
  id: 'place-1',
  slug: 'aquacenter',
  status: 'active',
  summary: 'Теплый бассейн',
  tags: ['pool'],
  title: 'Аквацентр',
}

describe('LoginForm', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockedUseLoginSession.mockReset()
  })

  afterEach(() => {
    window.sessionStorage.clear()
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

    await userEvent.type(
      screen.getByLabelText('Email'),
      ' admin@example.test ',
    )
    await userEvent.type(screen.getByLabelText('Пароль'), 'unit-test-password')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(mutate).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.test',
        password: 'unit-test-password',
      },
    })
  })

  it('clears bulk moderation draft before successful login redirect', () => {
    const onLoggedIn = vi.fn()
    mockedUseLoginSession.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useLoginSession>)
    saveBulkModerationDraftSelection([activePlace])

    render(
      <AntdApp>
        <LoginForm onLoggedIn={onLoggedIn} />
      </AntdApp>,
    )

    const loginOptions = mockedUseLoginSession.mock.calls[0]?.[0]
    loginOptions?.onSuccess?.(admin)

    expect(onLoggedIn).toHaveBeenCalledTimes(1)
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
  })

  it('shows exact local validation messages and blocks an invalid login', async () => {
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

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Введите корректный email'),
    ).toBeInTheDocument()
    expect(screen.getByText('Введите пароль')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })
})
