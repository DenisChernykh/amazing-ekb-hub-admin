import { useUpdatePlaceStatusMutation } from '@/entities/place/model/place-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceSummary } from '@/shared/api/generated/model'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  id: 'category_spa',
  slug: 'spa',
  title: 'SPA',
}

const updatedPlace: PlaceSummary = {
  category: spaCategory,
  coverImageUrl: null,
  id: 'place-2',
  slug: 'active-spa',
  status: 'active',
  summary: 'SPA вернулся в каталог',
  tags: ['spa'],
  title: 'Скрытый SPA',
}

const renderPlaceStatusPanel = (status: PlaceSummary['status'] = 'hidden') => {
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
            options?.onError?.(
              new ApiClientError({
                kind: 'server',
                message: 'Status unavailable',
                status: 500,
              }),
            )
          },
        }) as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>,
    )

    renderPlaceStatusPanel('hidden')

    fireEvent.click(screen.getByText('Опубликовано'))
    fireEvent.click(screen.getByRole('button', { name: /Опубликовать/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Status unavailable',
    )
    expect(messageError).toHaveBeenCalledWith('Status unavailable')
    expect(
      screen.getByRole('button', { name: /Опубликовать/ }),
    ).not.toBeDisabled()
  })
})
