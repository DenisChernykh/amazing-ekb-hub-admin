import { useCreateContentSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import { ApiClientError } from '@/shared/api/client/api-error'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateContentSourceDrawer } from './create-content-source-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/content-source/model/content-source-mutations', () => ({
  useCreateContentSourceMutation: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  const { forwardRef } = await vi.importActual<typeof import('react')>('react')

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

  const Select = forwardRef<
    HTMLSelectElement,
    {
      'aria-label'?: string
      disabled?: boolean
      onChange?: (value: string) => void
      options?: Array<{ label: string; value: string }>
      value?: string
    }
  >(
    (
      { 'aria-label': ariaLabel, disabled, onChange, options = [], value },
      ref,
    ) => (
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(event) => {
          onChange?.(event.target.value)
        }}
        ref={ref}
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
  )

  return {
    ...actual,
    App,
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
    Select,
  }
})

const mockedUseCreateContentSourceMutation = vi.mocked(
  useCreateContentSourceMutation,
)

const renderCreateDrawer = () => {
  const onClose = vi.fn()
  const onCreated = vi.fn()

  render(
    <AntdApp>
      <CreateContentSourceDrawer onClose={onClose} onCreated={onCreated} open />
    </AntdApp>,
  )

  return { onClose, onCreated }
}

describe('CreateContentSourceDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseCreateContentSourceMutation.mockReset()
  })

  it('shows exact required errors and skips mutation for an empty submit', async () => {
    const mutate = vi.fn()
    mockedUseCreateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreateContentSourceMutation>)

    renderCreateDrawer()

    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Выберите платформу')).toBeInTheDocument()
    expect(screen.getByText('Введите название')).toBeInTheDocument()
    expect(screen.getByText('Введите ссылку')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('focuses the invalid platform Select after submit', async () => {
    mockedUseCreateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreateContentSourceMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Amazing EKB Telegram' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'https://t.me/amazing_ekb' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Выберите платформу')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Платформа' })).toHaveFocus()
  })

  it('submits normalized create content source payload', async () => {
    const mutate = vi.fn()
    mockedUseCreateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreateContentSourceMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: '  Amazing EKB Telegram  ' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: ' https://t.me/amazing_ekb ' },
    })
    fireEvent.change(screen.getByLabelText('External ID'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Handle'), {
      target: { value: ' amazing_ekb ' },
    })
    fireEvent.change(screen.getByLabelText('Channel ID'), {
      target: { value: ' -100123 ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        channelId: '-100123',
        displayName: 'Amazing EKB Telegram',
        handle: 'amazing_ekb',
        platform: 'telegram',
        url: 'https://t.me/amazing_ekb',
      })
    })
  })

  it('keeps drawer open and renders normalized API errors', async () => {
    mockedUseCreateContentSourceMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onError?.(
              new ApiClientError({
                kind: 'validation',
                message: 'displayName must be unique',
                messages: ['displayName must be unique'],
                status: 400,
              }),
            )
          },
        }) as unknown as ReturnType<typeof useCreateContentSourceMutation>,
    )

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Amazing EKB Telegram' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'https://t.me/amazing_ekb' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(
      await screen.findByText('displayName must be unique'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Новый источник' })).toBeVisible()
  })

  it('blocks unsafe source URL before create mutation', async () => {
    const mutate = vi.fn()
    mockedUseCreateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreateContentSourceMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('combobox', { name: 'Платформа' }), {
      target: { value: 'telegram' },
    })
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Unsafe source' },
    })
    fireEvent.change(screen.getByLabelText('Ссылка'), {
      target: { value: 'javascript://example.com/%0Aalert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText(/http или https/)).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('asks before closing a source with unsaved changes', async () => {
    mockedUseCreateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreateContentSourceMutation>)

    renderCreateDrawer()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Название'), 'Amazing EKB Telegram')
    await user.click(screen.getByRole('button', { name: 'Закрыть drawer' }))

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Несохраненный источник будет потерян.',
        okText: 'Закрыть',
        title: 'Закрыть без сохранения?',
      }),
    )
  })
})
