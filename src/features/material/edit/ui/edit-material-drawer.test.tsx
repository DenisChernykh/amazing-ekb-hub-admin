import { useUpdateMaterialMutation } from '@/entities/material/model/material-mutations'
import type { EditableMaterial } from '@/features/material/form/model/material-form'
import type { Material } from '@/shared/api/generated/model'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditMaterialDrawer } from './edit-material-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/material/model/material-mutations', () => ({
  useUpdateMaterialMutation: vi.fn(),
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

const mockedUseUpdateMaterialMutation = vi.mocked(useUpdateMaterialMutation)

const material: Material = {
  durationSec: 125,
  id: 'material-1',
  placeId: 'place-1',
  platform: 'telegram',
  publishedAt: '2026-03-20T10:30:00+05:00',
  title: 'Обзор комплекса',
  type: 'post',
  url: 'https://example.com/material/321',
}

const renderEditDrawer = (editableMaterial: EditableMaterial = material) => {
  const onClose = vi.fn()
  const onUpdated = vi.fn()

  render(
    <AntdApp>
      <EditMaterialDrawer
        material={editableMaterial}
        onClose={onClose}
        onUpdated={onUpdated}
        open
        placeId="place-1"
      />
    </AntdApp>,
  )

  return { onClose, onUpdated }
}

describe('EditMaterialDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseUpdateMaterialMutation.mockReset()
  })

  it('renders initial values with disabled save action', () => {
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer()

    expect(screen.getByRole('combobox', { name: 'Платформа' })).toHaveValue(
      'telegram',
    )
    expect(screen.getByRole('combobox', { name: 'Тип' })).toHaveValue('post')
    expect(screen.getByLabelText('Заголовок')).toHaveValue('Обзор комплекса')
    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.queryByLabelText('Длительность, сек')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('shows duration with date-only controls for video materials', () => {
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer({ ...material, type: 'video' })

    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.getByLabelText('Длительность, сек')).toHaveValue(125)
  })

  it('hides duration after changing material type to post', () => {
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer({ ...material, type: 'video' })

    expect(screen.getByLabelText('Длительность, сек')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Тип' }), {
      target: { value: 'post' },
    })

    expect(screen.getByLabelText('Дата публикации')).toHaveAttribute(
      'data-show-time',
      'false',
    )
    expect(screen.queryByLabelText('Длительность, сек')).not.toBeInTheDocument()
  })

  it('shows changed field chips and sends partial update payload', async () => {
    const mutate = vi.fn()
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer()

    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: '  Обновленный обзор  ' },
    })

    expect(screen.getAllByText('Заголовок')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { title: 'Обновленный обзор' },
        materialId: 'material-1',
        placeId: 'place-1',
      })
    })
  })

  it('edits non-url fields when list material does not include original url', async () => {
    const mutate = vi.fn()
    const materialWithoutUrl: EditableMaterial = {
      durationSec: material.durationSec,
      id: material.id,
      placeId: material.placeId,
      platform: material.platform,
      publishedAt: material.publishedAt,
      title: material.title,
      type: material.type,
    }
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer(materialWithoutUrl)

    expect(screen.queryByLabelText('Ссылка')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: '  Обновленный обзор  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: { title: 'Обновленный обзор' },
        materialId: 'material-1',
        placeId: 'place-1',
      })
    })
  })

  it('asks confirmation before closing dirty drawer', () => {
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)

    renderEditDrawer()

    fireEvent.change(screen.getByLabelText('Заголовок'), {
      target: { value: 'Обновленный обзор' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть drawer' }))

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        okText: 'Закрыть',
        title: 'Закрыть без сохранения?',
      }),
    )
  })

  it('closes clean drawer without confirmation', () => {
    mockedUseUpdateMaterialMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateMaterialMutation>)
    const { onClose } = renderEditDrawer()

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(modalConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
