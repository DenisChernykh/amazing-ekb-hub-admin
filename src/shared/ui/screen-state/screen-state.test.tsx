import { ApiClientError } from '@/shared/api/client/api-error'
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
        error={
          new ApiClientError({
            kind: 'permission',
            message: 'Forbidden',
            status: 403,
          })
        }
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
        error={
          new ApiClientError({
            kind: 'not-found',
            message: 'Place not found',
            status: 404,
          })
        }
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
        error={
          new ApiClientError({
            kind: 'server',
            message: 'Backend unavailable',
            status: 500,
          })
        }
        retryAction={{ label: 'Повторить', onClick: retry }}
      />,
    )

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(screen.getByText('Backend unavailable')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(retry).toHaveBeenCalledTimes(1)
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
