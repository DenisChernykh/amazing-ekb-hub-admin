import { useCreatePlaceMaterialMutation } from '@/entities/material/model/material-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateMaterialDrawer } from './create-material-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/material/model/material-mutations', () => ({
  useCreatePlaceMaterialMutation: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  const dayjs = (await import('dayjs')).default

  const App = ({ children }: { children: ReactNode }) => <div>{children}</div>
  App.useApp = () => ({
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
    modal: {
      confirm: modalConfirm,
    },
  })

  return {
    ...actual,
    App,
    DatePicker: ({
      'aria-label': ariaLabel,
      onChange,
      showTime,
      value,
    }: {
      'aria-label'?: string
      onChange?: (value: ReturnType<typeof dayjs> | null) => void
      showTime?: boolean | object
      value?: ReturnType<typeof dayjs> | null
    }) => (
      <input
        aria-label={ariaLabel}
        data-show-time={showTime ? 'true' : 'false'}
        onChange={(event) => {
          onChange?.(event.target.value ? dayjs(event.target.value) : null)
        }}
        value={
          value?.format(showTime ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD') ?? ''
        }
      />
    ),
    Drawer: ({
      children,
      onClose,
      open,
      title,
    }: {
      children: ReactNode
      onClose?: () => void
      open?: boolean
      title?: ReactNode
    }) =>
      open ? (
        <section aria-label={String(title)} role="dialog">
          <button onClick={onClose} type="button">
            Закрыть drawer
          </button>
          {children}
        </section>
      ) : null,
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
          onChange?.(event.target.value ? Number(event.target.value) : null)
        }}
        type="number"
        value={value ?? ''}
      />
    ),
    Select: ({
      'aria-label': ariaLabel,
      onChange,
      options = [],
      value,
    }: {
      'aria-label'?: string
      onChange?: (value: string) => void
      options?: Array<{ label: string; value: string }>
      value?: string
    }) => (
      <select
        aria-label={ariaLabel}
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

const mockedUseCreatePlaceMaterialMutation = vi.mocked(
  useCreatePlaceMaterialMutation,
)

const renderCreateDrawer = () => {
  const onClose = vi.fn()
  const onCreated = vi.fn()

  render(
    <AntdApp>
      <CreateMaterialDrawer
        onClose={onClose}
        onCreated={onCreated}
        open
        placeId="place-1"
      />
    </AntdApp>,
  )

  return { onClose, onCreated }
}

describe('CreateMaterialDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseCreatePlaceMaterialMutation.mockReset()
  })

  it('shows every exact required message after submitting an empty form', async () => {
    mockedUseCreatePlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>)

    renderCreateDrawer()

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => {
      for (const message of [
        'Выберите платформу',
        'Выберите тип материала',
        'Введите заголовок',
        'Выберите дату публикации',
        'Введите ссылку',
      ]) {
        expect(screen.getByText(message)).toBeInTheDocument()
      }
    })
  })

  it('submits normalized create material payload', async () => {
    const mutate = vi.fn()
    mockedUseCreatePlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'video' },
    })
    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: '  Новый обзор  ' },
    })
    fireEvent.change(screen.getByLabelText('Дата публикации'), {
      target: { value: '2026-03-20' },
    })
    fireEvent.change(screen.getByLabelText('Длительность, сек'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'https://example.com/material/322' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          durationSec: null,
          platform: 'telegram',
          title: 'Новый обзор',
          type: 'video',
          url: 'https://example.com/material/322',
        }),
        pathParams: { placeId: 'place-1' },
      })
    })
  })

  it('keeps date-only publication input for every material type', () => {
    mockedUseCreatePlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'video' },
    })

    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.getByLabelText('Длительность, сек')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'post' },
    })

    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.queryByLabelText('Длительность, сек')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'reel' },
    })

    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.getByLabelText('Длительность, сек')).toBeInTheDocument()
  })

  it('keeps drawer open and renders normalized API errors', async () => {
    mockedUseCreatePlaceMaterialMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(
              new ApiClientError({
                kind: 'validation',
                message: 'publishedAt must be date',
                messages: ['publishedAt must be date'],
                status: 400,
              }),
            )
          },
        }) as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>,
    )

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'post' },
    })
    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: 'Новый обзор' },
    })
    fireEvent.change(screen.getByLabelText('Дата публикации'), {
      target: { value: '2026-03-20' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'https://example.com/material/322' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(
      await screen.findByText('publishedAt must be date'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Новый материал' })).toBeVisible()
  })

  it('blocks unsafe material URL before create mutation', async () => {
    const mutate = vi.fn()
    mockedUseCreatePlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'post' },
    })
    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: 'Новый обзор' },
    })
    fireEvent.change(screen.getByLabelText('Дата публикации'), {
      target: { value: '2026-03-20' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'javascript://example.com/%0Aalert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(await screen.findByText(/http или https/)).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('asks confirmation before closing a dirty create drawer', () => {
    mockedUseCreatePlaceMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreatePlaceMaterialMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: 'Черновик' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть drawer' }))

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        okText: 'Закрыть',
        title: 'Закрыть без сохранения?',
      }),
    )
  })
})
