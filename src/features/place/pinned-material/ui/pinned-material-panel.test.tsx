import { useSetPinnedMaterialMutation } from '@/entities/place/model/place-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { Material, PlaceDetail } from '@/shared/api/generated/model'
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
import { PinnedMaterialPanel } from './pinned-material-panel'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useSetPinnedMaterialMutation: vi.fn(),
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
    Select: ({
      'aria-label': ariaLabel,
      disabled,
      onChange,
      options = [],
      value,
    }: {
      'aria-label'?: string
      disabled?: boolean
      onChange?: (value: string) => void
      options?: Array<{ label: ReactNode; value: string }>
      value?: string
    }) => (
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(event) => {
          onChange?.(event.target.value)
        }}
        value={value ?? ''}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  }
})

const mockedUseSetPinnedMaterialMutation = vi.mocked(
  useSetPinnedMaterialMutation,
)

const materials: Material[] = [
  {
    durationSec: null,
    id: 'material-1',
    placeId: 'place-1',
    platform: 'telegram',
    publishedAt: '2026-03-20T10:30:00+05:00',
    title: 'Обзор комплекса',
    type: 'post',
    url: 'https://t.me/amazing_ekb/321',
  },
  {
    durationSec: 90,
    id: 'material-2',
    placeId: 'place-1',
    platform: 'dzen',
    publishedAt: '2026-03-21T10:30:00+05:00',
    title: 'С чего начать',
    type: 'video',
    url: 'https://dzen.ru/video/123',
  },
]

const updatedPlace: PlaceDetail = {
  category: 'spa',
  counters: {
    dzen: 1,
    instagram: 0,
    telegram: 1,
  },
  coverImageUrl: null,
  id: 'place-1',
  pinnedMaterial: materials[1] ?? null,
  popularityWeight: 8,
  status: 'hidden',
  summary: 'SPA',
  tags: ['spa'],
  title: 'SPA',
}

const renderPinnedMaterialPanel = ({
  isPending = false,
  pinnedMaterial = materials[0] ?? null,
  placeId = 'place-1',
}: {
  isPending?: boolean
  pinnedMaterial?: Material | null
  placeId?: string
} = {}) => {
  const mutate = vi.fn()
  mockedUseSetPinnedMaterialMutation.mockReturnValue({
    isPending,
    mutate,
  } as unknown as ReturnType<typeof useSetPinnedMaterialMutation>)

  render(
    <AntdApp>
      <PinnedMaterialPanel
        materials={materials}
        pinnedMaterial={pinnedMaterial}
        placeId={placeId}
      />
    </AntdApp>,
  )

  return { mutate }
}

describe('PinnedMaterialPanel', () => {
  beforeEach(() => {
    messageError.mockReset()
    messageSuccess.mockReset()
    mockedUseSetPinnedMaterialMutation.mockReset()
  })

  it('renders current pinned material and keeps unchanged submit disabled', () => {
    renderPinnedMaterialPanel()

    expect(screen.getByText('Закрепленный материал')).toBeInTheDocument()
    expect(screen.getByText('Обзор комплекса')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Закрепить' })).toBeDisabled()
  })

  it('enables submit after selecting another material', () => {
    renderPinnedMaterialPanel()

    fireEvent.change(screen.getByRole('combobox', { name: 'Материал' }), {
      target: { value: 'material-2' },
    })

    expect(screen.getByRole('button', { name: 'Закрепить' })).toBeEnabled()
  })

  it('submits selected material through entity mutation', async () => {
    const { mutate } = renderPinnedMaterialPanel()

    fireEvent.change(screen.getByRole('combobox', { name: 'Материал' }), {
      target: { value: 'material-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { materialId: 'material-2' },
        pathParams: { placeId: 'place-1' },
      })
    })
  })

  it('keeps hidden place id in mutation variables', async () => {
    const { mutate } = renderPinnedMaterialPanel({ placeId: 'hidden-place' })

    fireEvent.change(screen.getByRole('combobox', { name: 'Материал' }), {
      target: { value: 'material-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { materialId: 'material-2' },
        pathParams: { placeId: 'hidden-place' },
      })
    })
  })

  it('blocks repeat submit while mutation is pending', () => {
    renderPinnedMaterialPanel({ isPending: true })

    expect(screen.getByRole('combobox', { name: 'Материал' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Закрепить/ })).toHaveClass(
      'ant-btn-loading',
    )
  })

  it('shows success message after mutation success', async () => {
    mockedUseSetPinnedMaterialMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onSuccess?.(updatedPlace)
          },
        }) as unknown as ReturnType<typeof useSetPinnedMaterialMutation>,
    )

    render(
      <AntdApp>
        <PinnedMaterialPanel
          materials={materials}
          pinnedMaterial={materials[0] ?? null}
          placeId="place-1"
        />
      </AntdApp>,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Материал' }), {
      target: { value: 'material-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить' }))

    await waitFor(() => {
      expect(messageSuccess).toHaveBeenCalledWith('Материал закреплен')
    })
  })

  it('renders normalized backend error in panel', async () => {
    mockedUseSetPinnedMaterialMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(
              new ApiClientError({
                kind: 'validation',
                message: 'Pinned material must belong to the same place',
                messages: ['Pinned material must belong to the same place'],
                status: 400,
              }),
            )
          },
        }) as unknown as ReturnType<typeof useSetPinnedMaterialMutation>,
    )

    render(
      <AntdApp>
        <PinnedMaterialPanel
          materials={materials}
          pinnedMaterial={materials[0] ?? null}
          placeId="place-1"
        />
      </AntdApp>,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Материал' }), {
      target: { value: 'material-2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('Pinned material must belong to the same place'),
    ).toBeInTheDocument()
    expect(messageError).toHaveBeenCalledWith(
      'Pinned material must belong to the same place',
    )
  })
})
