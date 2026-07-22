import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { CreateCategoryDrawer } from '@/features/category/create/ui/create-category-drawer'
import { DeleteCategoryButton } from '@/features/category/delete/ui/delete-category-button'
import { EditCategoryDrawer } from '@/features/category/edit/ui/edit-category-drawer'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { AdminPlaceCategory } from '@/shared/api/generated/model'
import type { AdminPlaceCategoryListResponse } from '@/shared/api/generated/operation'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoriesScreen } from './categories-screen'

vi.mock('@/entities/category/model/category-hooks', () => ({
  usePlaceCategoriesQuery: vi.fn(),
}))

vi.mock('@/features/category/create/ui/create-category-drawer', () => ({
  CreateCategoryDrawer: vi.fn(({ open }: { open: boolean }) =>
    open ? <div role="dialog">create category drawer</div> : null,
  ),
}))

vi.mock('@/features/category/edit/ui/edit-category-drawer', () => ({
  EditCategoryDrawer: vi.fn(({ open }: { open: boolean }) =>
    open ? <div role="dialog">edit category drawer</div> : null,
  ),
}))

vi.mock('@/features/category/delete/ui/delete-category-button', () => ({
  DeleteCategoryButton: vi.fn(
    ({ category }: { category: AdminPlaceCategory }) => (
      <button>delete {category.id}</button>
    ),
  ),
}))

const mockedUsePlaceCategoriesQuery = vi.mocked(usePlaceCategoriesQuery)
const mockedCreateCategoryDrawer = vi.mocked(CreateCategoryDrawer)
const mockedEditCategoryDrawer = vi.mocked(EditCategoryDrawer)
const mockedDeleteCategoryButton = vi.mocked(DeleteCategoryButton)

const spaCategory: AdminPlaceCategory = {
  createdAt: '2026-07-03T10:00:00.000Z',
  coverImageUrl: null,
  id: 'category_spa',
  slug: 'spa',
  status: 'active',
  title: 'SPA',
  updatedAt: '2026-07-03T10:00:00.000Z',
}

const poolsCategory: AdminPlaceCategory = {
  createdAt: '2026-07-03T11:00:00.000Z',
  coverImageUrl: null,
  id: 'category_pools',
  slug: 'pools',
  status: 'draft',
  title: 'Бассейны',
  updatedAt: '2026-07-03T11:00:00.000Z',
}

const categoriesResponse: AdminPlaceCategoryListResponse = {
  items: [spaCategory, poolsCategory],
}

const renderScreen = () => {
  render(
    <MemoryRouter initialEntries={['/categories']}>
      <CategoriesScreen />
    </MemoryRouter>,
  )
}

describe('CategoriesScreen', () => {
  beforeEach(() => {
    mockedUsePlaceCategoriesQuery.mockReset()
    mockedCreateCategoryDrawer.mockClear()
    mockedEditCategoryDrawer.mockClear()
    mockedDeleteCategoryButton.mockClear()
    mockedUsePlaceCategoriesQuery.mockReturnValue({
      data: categoriesResponse,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)
  })

  it('renders category table without the retired color field and with row actions', () => {
    renderScreen()

    expect(document.title).toBe('Категории | Amazing EKB Admin')
    expect(screen.getByText('Категории')).toBeInTheDocument()
    expect(screen.getByText('Всего: 2')).toBeInTheDocument()
    expect(screen.getByText('SPA')).toBeInTheDocument()
    expect(screen.getByText('spa')).toBeInTheDocument()
    expect(screen.queryByText('Цвет бейджа')).not.toBeInTheDocument()
    expect(screen.getByText('Бассейны')).toBeInTheDocument()
    expect(screen.getByText('delete category_spa')).toBeInTheDocument()
  })

  it('opens create and edit drawers from screen actions', () => {
    renderScreen()

    fireEvent.click(screen.getByRole('button', { name: 'Создать категорию' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'create category drawer',
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Редактировать' })[0])
    expect(screen.getAllByRole('dialog')[1]).toHaveTextContent(
      'edit category drawer',
    )
  })

  it('renders loading, error, and empty states', () => {
    mockedUsePlaceCategoriesQuery.mockReturnValueOnce({
      data: undefined,
      error: null,
      isError: false,
      isFetching: true,
      isPending: true,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)

    renderScreen()

    expect(screen.getByText('Загружаем категории')).toBeInTheDocument()

    mockedUsePlaceCategoriesQuery.mockReturnValueOnce({
      data: undefined,
      error: new ApiClientError({
        kind: 'permission',
        message: 'Forbidden',
        status: 403,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)

    renderScreen()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()

    mockedUsePlaceCategoriesQuery.mockReturnValueOnce({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)

    renderScreen()

    expect(screen.getByText('Категорий пока нет')).toBeInTheDocument()
  })
})
