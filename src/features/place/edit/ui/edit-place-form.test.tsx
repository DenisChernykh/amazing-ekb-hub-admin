import { useUpdatePlaceMutation } from '@/entities/place/model/place-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceDetail } from '@/shared/api/generated/model'
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
import { EditPlaceForm } from './edit-place-form'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useUpdatePlaceMutation: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  })

  return {
    ...actual,
    App,
    Select: ({
      'aria-label': ariaLabel,
      mode,
      onChange,
      options = [],
      value,
    }: {
      'aria-label'?: string
      mode?: 'tags'
      onChange?: (value: string | string[]) => void
      options?: Array<{ label: string; value: string }>
      value?: string | string[]
    }) => {
      if (mode === 'tags') {
        return (
          <input
            aria-label={ariaLabel}
            onChange={(event) => {
              onChange?.(
                event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }}
            role="combobox"
            value={Array.isArray(value) ? value.join(',') : ''}
          />
        )
      }

      return (
        <select
          aria-label={ariaLabel}
          onChange={(event) => {
            onChange?.(event.target.value)
          }}
          value={typeof value === 'string' ? value : ''}
        >
          <option value="" />
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    },
    InputNumber: ({
      id,
      onChange,
      value,
    }: {
      id?: string
      onChange?: (value: number | null) => void
      value?: number | null
    }) => (
      <input
        id={id}
        onChange={(event) => {
          const nextValue = event.target.value
          onChange?.(nextValue ? Number(nextValue) : null)
        }}
        type="number"
        value={value ?? ''}
      />
    ),
  }
})

const mockedUseUpdatePlaceMutation = vi.mocked(useUpdatePlaceMutation)

const place: PlaceDetail = {
  category: 'spa',
  counters: {
    dzen: 1,
    instagram: 0,
    telegram: 2,
  },
  coverImageUrl: null,
  id: 'place-2',
  pinnedMaterial: null,
  popularityWeight: 5,
  status: 'hidden',
  summary: 'Скрытый SPA для проверки admin detail',
  tags: ['spa', 'hidden'],
  title: 'Скрытый SPA',
}

const renderEditPlaceForm = () => {
  const onCancel = vi.fn()
  const onDirtyChange = vi.fn()
  const onUpdated = vi.fn()

  render(
    <AntdApp>
      <EditPlaceForm
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
        onUpdated={onUpdated}
        place={place}
      />
    </AntdApp>,
  )

  return { onCancel, onDirtyChange, onUpdated }
}

describe('EditPlaceForm', () => {
  beforeEach(() => {
    mockedUseUpdatePlaceMutation.mockReset()
  })

  it('renders initial place values with disabled save action', () => {
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)

    renderEditPlaceForm()

    expect(screen.getByLabelText('Название')).toHaveValue('Скрытый SPA')
    expect(screen.getByLabelText('Описание')).toHaveValue(
      'Скрытый SPA для проверки admin detail',
    )
    expect(screen.getByRole('combobox', { name: 'Категория' })).toHaveValue(
      'spa',
    )
    expect(screen.getByRole('combobox', { name: 'Теги' })).toHaveValue(
      'spa,hidden',
    )
    expect(screen.getByLabelText('Вес популярности')).toHaveValue(5)
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('sends only changed normalized fields to update mutation', async () => {
    const mutate = vi.fn()
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)
    const { onDirtyChange } = renderEditPlaceForm()

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: '  Новое описание  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { summary: 'Новое описание' },
        pathParams: { placeId: 'place-2' },
      })
    })
    expect(onDirtyChange).toHaveBeenCalledWith(true)
  })

  it('sends cleared optional summary and tags to update mutation', async () => {
    const mutate = vi.fn()
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)

    renderEditPlaceForm()

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Теги' }), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: {
          summary: '',
          tags: [],
        },
        pathParams: { placeId: 'place-2' },
      })
    })
  })

  it('resets values back to loaded server state', () => {
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)
    const { onDirtyChange } = renderEditPlaceForm()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Другое название' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Вернуть исходные' }))

    expect(screen.getByLabelText('Название')).toHaveValue('Скрытый SPA')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })

  it('calls success callback after successful update', async () => {
    mockedUseUpdatePlaceMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onSuccess?.({
              category: 'spa',
              coverImageUrl: null,
              id: 'place-2',
              popularityWeight: 5,
              status: 'hidden',
              summary: 'Новое описание',
              tags: ['spa', 'hidden'],
              title: 'Скрытый SPA',
            })
          },
        }) as unknown as ReturnType<typeof useUpdatePlaceMutation>,
    )
    const { onUpdated } = renderEditPlaceForm()

    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Новое описание' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'place-2', summary: 'Новое описание' }),
      )
    })
  })

  it('renders normalized API error messages', async () => {
    mockedUseUpdatePlaceMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(
              new ApiClientError({
                kind: 'validation',
                message: 'title must be a string',
                messages: ['title must be a string', 'category must be valid'],
                status: 400,
              }),
            )
          },
        }) as unknown as ReturnType<typeof useUpdatePlaceMutation>,
    )

    renderEditPlaceForm()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Новое название' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('title must be a string'),
    ).toBeInTheDocument()
    expect(
      within(alert).getByText('category must be valid'),
    ).toBeInTheDocument()
  })

  it('shows pending state on save action', () => {
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)

    renderEditPlaceForm()

    expect(screen.getByRole('button', { name: 'Сохранить' })).toHaveClass(
      'ant-btn-loading',
    )
  })

  it('calls cancel callback from secondary action', () => {
    mockedUseUpdatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdatePlaceMutation>)
    const { onCancel } = renderEditPlaceForm()

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
