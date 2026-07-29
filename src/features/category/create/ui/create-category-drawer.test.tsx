import { useCreateCategoryMutation } from '@/entities/category/model/category-mutations'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateCategoryDrawer } from './create-category-drawer'

const modalConfirm = vi.fn()

vi.mock('@/entities/category/model/category-mutations', () => ({
  useCreateCategoryMutation: vi.fn(),
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

const mockedUseCreateCategoryMutation = vi.mocked(useCreateCategoryMutation)

const category: AdminPlaceCategory = {
  coverImageUrl: null,
  createdAt: '2026-07-03T10:00:00.000Z',
  id: 'category_spa',
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
}

const renderCreateDrawer = () => {
  const onClose = vi.fn()
  const onCreated = vi.fn()

  render(
    <AntdApp>
      <CreateCategoryDrawer onClose={onClose} onCreated={onCreated} open />
    </AntdApp>,
  )

  return { onClose, onCreated }
}

describe('CreateCategoryDrawer', () => {
  beforeEach(() => {
    modalConfirm.mockReset()
    mockedUseCreateCategoryMutation.mockReset()
  })

  it('shows the exact title error and skips mutation for an empty submit', async () => {
    const mutate = vi.fn()
    mockedUseCreateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreateCategoryMutation>)

    renderCreateDrawer()

    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Введите название')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits a trimmed title without a generated slug', async () => {
    const mutate = vi.fn()
    mockedUseCreateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate,
    } as unknown as ReturnType<typeof useCreateCategoryMutation>)

    renderCreateDrawer()

    fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), {
      target: { value: '  SPA  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ title: 'SPA' })
    })
  })

  it('asks before closing a category with unsaved changes', async () => {
    mockedUseCreateCategoryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreateCategoryMutation>)

    renderCreateDrawer()
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Название' }), 'SPA')
    await user.click(screen.getByRole('button', { name: 'Закрыть drawer' }))

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Несохраненная категория будет потеряна.',
        okText: 'Закрыть',
        title: 'Закрыть без сохранения?',
      }),
    )
  })

  it('resets the form and closes the drawer after a successful mutation', async () => {
    mockedUseCreateCategoryMutation.mockImplementation(
      (options) =>
        ({
          isPending: false,
          mutate: () => {
            options?.onSuccess?.(category)
          },
        }) as unknown as ReturnType<typeof useCreateCategoryMutation>,
    )
    const { onClose } = renderCreateDrawer()

    fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), {
      target: { value: 'SPA' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(screen.getByRole('textbox', { name: 'Название' })).toHaveValue('')
    })
  })
})
