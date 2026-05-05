import { useCreatePlaceMutation } from '@/entities/place/model/place-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
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
import { CreatePlaceForm } from './create-place-form'

vi.mock('@/entities/place/model/place-mutations', () => ({
  useCreatePlaceMutation: vi.fn(),
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

const mockedUseCreatePlaceMutation = vi.mocked(useCreatePlaceMutation)

const renderCreatePlaceForm = () => {
  const onCancel = vi.fn()
  const onCreated = vi.fn()

  render(
    <AntdApp>
      <CreatePlaceForm onCancel={onCancel} onCreated={onCreated} />
    </AntdApp>,
  )

  return { onCancel, onCreated }
}

describe('CreatePlaceForm', () => {
  beforeEach(() => {
    mockedUseCreatePlaceMutation.mockReset()
  })

  it('submits create place payload to entity mutation', async () => {
    const mutate = vi.fn()
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)

    renderCreatePlaceForm()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Тихий SPA' },
    })
    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Новый SPA в центре' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Категория' }), {
      target: { value: 'spa' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Теги' }), {
      target: { value: 'spa' },
    })
    fireEvent.change(screen.getByLabelText('Вес популярности'), {
      target: { value: '7' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: {
          category: 'spa',
          popularityWeight: 7,
          summary: 'Новый SPA в центре',
          tags: ['spa'],
          title: 'Тихий SPA',
        },
      })
    })
  })

  it('renders validation error messages from API response', async () => {
    mockedUseCreatePlaceMutation.mockImplementation(
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
        }) as unknown as ReturnType<typeof useCreatePlaceMutation>,
    )

    renderCreatePlaceForm()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Тихий SPA' },
    })
    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Новый SPA в центре' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Категория' }), {
      target: { value: 'spa' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Теги' }), {
      target: { value: 'spa' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    const alert = await screen.findByRole('alert')

    expect(
      within(alert).getByText('title must be a string'),
    ).toBeInTheDocument()
    expect(
      within(alert).getByText('category must be valid'),
    ).toBeInTheDocument()
  })

  it('calls cancel callback from secondary action', async () => {
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)
    const { onCancel } = renderCreatePlaceForm()

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('shows pending state on submit button', () => {
    mockedUseCreatePlaceMutation.mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMutation>)

    renderCreatePlaceForm()

    expect(screen.getByRole('button', { name: 'Создать' })).toHaveClass(
      'ant-btn-loading',
    )
  })
})
