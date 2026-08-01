import { useUpdatePlaceStatusMutation } from '@/entities/place/model/place-mutations'
import type {
  AdminPlaceSummaryResponseDto,
  PlaceCategoryResponseDto,
} from '@/shared/api'
import { createApiProblemError } from '@/test/api-problem'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceStatusPanel } from './place-status-panel'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useUpdatePlaceStatusMutation: vi.fn(),
}))

const messageError = vi.fn()
const messageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: messageError,
      success: messageSuccess,
    },
  })

  return {
    ...actual,
    App,
  }
})

const mockedUseUpdatePlaceStatusMutation = vi.mocked(
  useUpdatePlaceStatusMutation,
)

const spaCategory = {
  coverImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
} satisfies PlaceCategoryResponseDto

const updatedPlace: AdminPlaceSummaryResponseDto = {
  category: spaCategory,
  coverImageUrl: null,
  mapsUrl: null,
  id: 'place-2',
  slug: 'active-spa',
  status: 'active',
  summary: 'SPA вернулся в каталог',
  tags: ['spa'],
  title: 'Скрытый SPA',
}

const renderPlaceStatusPanel = (
  status: AdminPlaceSummaryResponseDto['status'] = 'hidden',
) => {
  render(
    <AntdApp>
      <PlaceStatusPanel placeId="place-2" status={status} />
    </AntdApp>,
  )
}

describe('PlaceStatusPanel', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseUpdatePlaceStatusMutation.mockReset()
  })

  it('renders current status controls and disables unchanged submit', () => {
    mockedUseUpdatePlaceStatusMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>)

    renderPlaceStatusPanel('hidden')

    expect(screen.getAllByText('Скрыто')).toHaveLength(2)
    expect(screen.getByText('Опубликовано')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Место скрыто из публичного каталога, но доступно в админке.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Скрыть/ })).toBeDisabled()
  })

  it('submits selected status through entity mutation', async () => {
    const mutate = vi.fn()
    mockedUseUpdatePlaceStatusMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>)

    renderPlaceStatusPanel('hidden')

    fireEvent.click(screen.getByText('Опубликовано'))
    fireEvent.click(screen.getByRole('button', { name: /Опубликовать/ }))
    expect(screen.getByText('Опубликовать место?')).toBeInTheDocument()
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Опубликовать',
      }),
    )

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { status: 'active' },
        pathParams: { placeId: 'place-2' },
      })
    })
  })

  it('shows pending state while status mutation is running', () => {
    mockedUseUpdatePlaceStatusMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>)

    renderPlaceStatusPanel('hidden')

    expect(screen.getByRole('button', { name: /Скрыть/ })).toHaveClass(
      'ant-btn-loading',
    )
  })

  it('shows success message after status update', async () => {
    mockedUseUpdatePlaceStatusMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onSuccess?.(updatedPlace)
          },
        }) as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>,
    )

    renderPlaceStatusPanel('hidden')

    fireEvent.click(screen.getByText('Опубликовано'))
    fireEvent.click(screen.getByRole('button', { name: /Опубликовать/ }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Опубликовать',
      }),
    )

    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Место опубликовано')
    })
  })

  it('renders normalized error and keeps selected status available for retry', async () => {
    mockedUseUpdatePlaceStatusMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(createApiProblemError('INTERNAL_ERROR', 500))
          },
        }) as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>,
    )

    renderPlaceStatusPanel('hidden')

    fireEvent.click(screen.getByText('Опубликовано'))
    fireEvent.click(screen.getByRole('button', { name: /Опубликовать/ }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Опубликовать',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось выполнить запрос.',
    )
    expect(messageError).toHaveBeenCalledWith('Не удалось выполнить запрос.')
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Опубликовать',
      }),
    ).not.toBeDisabled()
  })
})
