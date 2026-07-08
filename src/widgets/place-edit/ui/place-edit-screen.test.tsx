import { useAdminPlaceDetailQuery } from '@/entities/place/model/place-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import type { PlaceDetail } from '@/shared/api/generated/model'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
  type To,
} from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceEditScreen } from './place-edit-screen'

vi.mock('@/entities/place/model/place-hooks', () => ({
  useAdminPlaceDetailQuery: vi.fn(),
}))

vi.mock('@/features/place/edit/ui/edit-place-form', () => ({
  EditPlaceForm: ({
    onCancel,
    onDirtyChange,
    onUpdated,
    place,
  }: {
    onCancel: () => void
    onDirtyChange?: (isDirty: boolean) => void
    onUpdated: (place: { id: string }) => void
    place: { id: string; title: string }
  }) => (
    <div>
      <div>Edit form: {place.title}</div>
      <button onClick={() => onDirtyChange?.(true)}>Make dirty</button>
      <button onClick={() => onDirtyChange?.(false)}>Make clean</button>
      <button onClick={onCancel}>Cancel edit</button>
      <button onClick={() => onUpdated({ id: place.id })}>Save edit</button>
    </div>
  ),
}))

function NavigationProbe({ to }: { to: To }) {
  const navigate = useNavigate()

  return <button onClick={() => navigate(to)}>Leave edit</button>
}

const mockedUseAdminPlaceDetailQuery = vi.mocked(useAdminPlaceDetailQuery)

const place: PlaceDetail = {
  category: {
    badgeBackgroundColor: '#faf0ed',
    id: 'category_spa',
    slug: 'spa',
    title: 'SPA',
  },
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

const renderPlaceEditScreen = (children?: ReactNode) => {
  const router = createMemoryRouter(
    [
      {
        path: '/places/:placeId/edit',
        element: (
          <>
            <PlaceEditScreen placeId="place-2" />
            {children}
          </>
        ),
      },
      {
        path: '/places/:placeId',
        element: <div>Detail route</div>,
      },
      {
        path: '/places',
        element: <div>Places list route</div>,
      },
    ],
    { initialEntries: ['/places/place-2/edit'] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('PlaceEditScreen', () => {
  beforeEach(() => {
    mockedUseAdminPlaceDetailQuery.mockReset()
  })

  it('loads admin detail and renders edit form', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: place,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceEditScreen()

    expect(document.title).toBe(
      'Редактирование: Скрытый SPA | Amazing EKB Admin',
    )
    expect(mockedUseAdminPlaceDetailQuery).toHaveBeenCalledWith('place-2')
    expect(
      screen.getByRole('heading', { name: 'Редактирование места' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Edit form: Скрытый SPA')).toBeInTheDocument()
  })

  it('navigates back to detail after clean cancel', async () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: place,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)
    const router = renderPlaceEditScreen()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel edit' }))

    expect(await screen.findByText('Detail route')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places/place-2')
  })

  it('blocks dirty navigation until user confirms leaving', async () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: place,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)
    const router = renderPlaceEditScreen(<NavigationProbe to="/places" />)

    fireEvent.click(screen.getByRole('button', { name: 'Make dirty' }))
    fireEvent.click(screen.getByRole('button', { name: 'Leave edit' }))

    expect(
      await screen.findByText('Есть несохраненные изменения'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places/place-2/edit')

    fireEvent.click(screen.getByRole('button', { name: 'Уйти без сохранения' }))

    expect(await screen.findByText('Places list route')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places')
  })

  it('navigates back to detail after successful update without dirty blocker', async () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: place,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)
    const router = renderPlaceEditScreen()

    fireEvent.click(screen.getByRole('button', { name: 'Make dirty' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save edit' }))

    expect(await screen.findByText('Detail route')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/places/place-2')
  })

  it('renders loading state while detail is pending', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceEditScreen()

    expect(document.title).toBe('Редактирование места | Amazing EKB Admin')
    expect(screen.getByText('Загружаем место')).toBeInTheDocument()
  })

  it('renders forbidden state for permission errors', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'permission',
        message: 'Forbidden',
        status: 403,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceEditScreen()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
  })

  it('renders not-found state for missing places', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'not-found',
        message: 'Place not found',
        status: 404,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceEditScreen()

    expect(screen.getByText('Место не найдено')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К списку мест' })).toHaveAttribute(
      'href',
      '/places',
    )
  })

  it('renders generic screen error for server failures', () => {
    mockedUseAdminPlaceDetailQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Place unavailable',
        status: 500,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof useAdminPlaceDetailQuery>)

    renderPlaceEditScreen()

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(screen.getByText('Place unavailable')).toBeInTheDocument()
  })
})
