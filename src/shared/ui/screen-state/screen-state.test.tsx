import { createApiProblemError } from '@/test/api-problem'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import {
  ScreenApiErrorState,
  ScreenEmptyState,
  ScreenLoadingState,
} from './screen-state'

const renderWithRouter = (ui: ReactNode) => {
  render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ScreenLoadingState', () => {
  it('renders a full-screen loading message', () => {
    render(<ScreenLoadingState title="Загружаем места" />)

    expect(screen.getByText('Загружаем места')).toBeInTheDocument()
  })
})

describe('ScreenApiErrorState', () => {
  it('maps permission errors to a forbidden state', () => {
    renderWithRouter(
      <ScreenApiErrorState
        error={createApiProblemError('AUTHORIZATION_DENIED', 403, {
          requestId: 'request-forbidden',
        })}
        forbiddenAction={{ label: 'На главную', to: '/' }}
      />,
    )

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('maps not-found errors to a not-found state', () => {
    renderWithRouter(
      <ScreenApiErrorState
        error={createApiProblemError('PLACE_NOT_FOUND', 404, {
          requestId: 'request-not-found',
        })}
        notFoundAction={{ label: 'К списку мест', to: '/places' }}
      />,
    )

    expect(screen.getByText('Не найдено')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К списку мест' })).toHaveAttribute(
      'href',
      '/places',
    )
  })

  it('maps network and server errors to a generic screen error', () => {
    const retry = vi.fn()

    renderWithRouter(
      <ScreenApiErrorState
        error={createApiProblemError('INTERNAL_ERROR', 500, {
          requestId: 'request-screen-error',
        })}
        retryAction={{ label: 'Повторить', onClick: retry }}
      />,
    )

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(screen.getByText('Не удалось выполнить запрос.')).toBeInTheDocument()
    expect(screen.getByText('ID запроса: request-screen-error')).toBeVisible()
    expect(screen.queryByText('Raw backend title')).not.toBeInTheDocument()
    expect(screen.queryByText('Raw backend detail')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Raw backend field detail'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('does not treat authentication errors as authorization failures', () => {
    renderWithRouter(
      <ScreenApiErrorState
        error={createApiProblemError('AUTHENTICATION_REQUIRED', 401)}
      />,
    )

    expect(screen.queryByText('Доступ запрещен')).not.toBeInTheDocument()
    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
  })
})

describe('ScreenEmptyState', () => {
  it('renders primary and secondary actions', () => {
    const reset = vi.fn()

    renderWithRouter(
      <ScreenEmptyState
        description="По выбранному статусу мест не найдено"
        primaryAction={{ label: 'Создать место', to: '/places/new' }}
        secondaryAction={{ label: 'Сбросить фильтр', onClick: reset }}
      />,
    )

    expect(
      screen.getByText('По выбранному статусу мест не найдено'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Создать место' })).toHaveAttribute(
      'href',
      '/places/new',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтр' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
