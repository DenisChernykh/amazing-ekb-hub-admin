import { useUpdateContentSourceMutation } from '@/entities/content-source/model/content-source-mutations'
import type { ContentSource } from '@/shared/api/generated/model'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditContentSourceDrawer } from './edit-content-source-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/content-source/model/content-source-mutations', () => ({
  useUpdateContentSourceMutation: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

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
      options?: Array<{ label: string; value: string }>
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

const mockedUseUpdateContentSourceMutation = vi.mocked(
  useUpdateContentSourceMutation,
)

const contentSource: ContentSource = {
  channelId: '-100123',
  createdAt: '2026-06-15T10:00:00.000Z',
  displayName: 'Amazing EKB Telegram',
  externalId: 'amazing_ekb',
  handle: 'amazing_ekb',
  id: 'source-1',
  lastCursor: null,
  lastImportedAt: null,
  platform: 'telegram',
  status: 'active',
  updatedAt: '2026-06-15T10:00:00.000Z',
  url: 'https://t.me/amazing_ekb',
}

const renderEditDrawer = () => {
  const onClose = vi.fn()
  const onUpdated = vi.fn()

  render(
    <AntdApp>
      <EditContentSourceDrawer
        contentSource={contentSource}
        onClose={onClose}
        onUpdated={onUpdated}
        open
      />
    </AntdApp>,
  )

  return { onClose, onUpdated }
}

describe('EditContentSourceDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseUpdateContentSourceMutation.mockReset()
  })

  it('renders initial values with read-only platform and disabled save action', () => {
    mockedUseUpdateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateContentSourceMutation>)

    renderEditDrawer()

    expect(screen.getByRole('combobox', { name: 'Платформа' })).toHaveValue(
      'telegram',
    )
    expect(screen.getByRole('combobox', { name: 'Платформа' })).toBeDisabled()
    expect(screen.getByLabelText('Название')).toHaveValue(
      'Amazing EKB Telegram',
    )
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('shows changed field chips and sends partial update payload with null clears', async () => {
    const mutate = vi.fn()
    mockedUseUpdateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateContentSourceMutation>)

    renderEditDrawer()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: '  Amazing EKB  ' },
    })
    fireEvent.change(screen.getByLabelText('External ID'), {
      target: { value: '' },
    })

    expect(screen.getAllByText('Название')).toHaveLength(2)
    expect(screen.getAllByText('External ID')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: {
          displayName: 'Amazing EKB',
          externalId: null,
        },
        sourceId: 'source-1',
      })
    })
  })

  it('asks confirmation before closing dirty drawer', () => {
    mockedUseUpdateContentSourceMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateContentSourceMutation>)

    renderEditDrawer()

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Updated source' },
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
