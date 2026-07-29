import { useUpdateCategoryMutation } from '@/entities/category/model/category-mutations'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditCategoryDrawer } from './edit-category-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/category/model/category-mutations', () => ({
  useUpdateCategoryMutation: vi.fn(),
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
  }
})

const mockedUseUpdateCategoryMutation = vi.mocked(useUpdateCategoryMutation)

const category: AdminPlaceCategory = {
  coverImageUrl: null,
  createdAt: '2026-07-03T10:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
}

const renderEditDrawer = () => {
  const onClose = vi.fn()
  const onUpdated = vi.fn()

  render(
    <AntdApp>
      <EditCategoryDrawer
        category={category}
        onClose={onClose}
        onUpdated={onUpdated}
        open
      />
    </AntdApp>,
  )

  return { onClose, onUpdated }
}

describe('EditCategoryDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseUpdateCategoryMutation.mockReset()
  })

  it('renders initial title and slug with disabled save action', () => {
    mockedUseUpdateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateCategoryMutation>)

    renderEditDrawer()

    expect(screen.getByRole('textbox', { name: 'Название' })).toHaveValue('SPA')
    expect(screen.getByRole('textbox', { name: 'Ярлык' })).toHaveValue('spa')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('does not enable save or show a changed chip for whitespace-only title changes', async () => {
    mockedUseUpdateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateCategoryMutation>)

    renderEditDrawer()
    const user = userEvent.setup()

    await user.clear(screen.getByRole('textbox', { name: 'Название' }))
    await user.type(screen.getByRole('textbox', { name: 'Название' }), ' SPA ')

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(screen.getAllByText('Название')).toHaveLength(1)
  })

  it('shows the exact required slug error and blocks mutation when slug is cleared', async () => {
    const mutate = vi.fn()
    mockedUseUpdateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateCategoryMutation>)

    renderEditDrawer()
    const user = userEvent.setup()

    await user.clear(screen.getByRole('textbox', { name: 'Ярлык' }))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Введите ярлык')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('renders exact changed chips and submits only normalized changed fields', async () => {
    const mutate = vi.fn()
    mockedUseUpdateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useUpdateCategoryMutation>)

    renderEditDrawer()
    const user = userEvent.setup()

    await user.clear(screen.getByRole('textbox', { name: 'Название' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Название' }),
      '  Новый SPA  ',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Ярлык' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Ярлык' }),
      '  new-spa  ',
    )

    expect(screen.getAllByText('Название')).toHaveLength(2)
    expect(screen.getAllByText('Ярлык')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        categoryId: 'category_spa',
        data: {
          slug: 'new-spa',
          title: 'Новый SPA',
        },
      })
    })
  })

  it('keeps the existing confirmation copy when closing a dirty drawer', async () => {
    mockedUseUpdateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateCategoryMutation>)

    renderEditDrawer()
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', { name: 'Название' }),
      ' updated',
    )
    await user.click(screen.getByRole('button', { name: 'Закрыть drawer' }))

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Несохраненные изменения категории будут потеряны.',
        okText: 'Закрыть',
        title: 'Закрыть без сохранения?',
      }),
    )
  })
})
