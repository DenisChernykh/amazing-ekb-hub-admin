import { createAppStore } from '@/app/store'
import { usePlacesListQuery } from '@/entities/place/model/place-hooks'
import { useUpdatePlaceStatusMutation } from '@/entities/place/model/place-mutations'
import {
  BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
  saveBulkModerationDraftSelection,
} from '@/features/place/bulk-moderation/model/bulk-moderation-draft-storage'
import { ApiClientError } from '@/shared/api/client/api-error'
import type {
  PlaceListResponse,
  PlaceSummary,
} from '@/shared/api/generated/model'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlacesList } from './places-list'

vi.mock('@/entities/place/model/place-hooks', () => ({
  usePlacesListQuery: vi.fn(),
}))

vi.mock('@/entities/place/model/place-mutations', () => ({
  useUpdatePlaceStatusMutation: vi.fn(),
}))

const mockedUsePlacesListQuery = vi.mocked(usePlacesListQuery)
const mockedUseUpdatePlaceStatusMutation = vi.mocked(
  useUpdatePlaceStatusMutation,
)
const mutateAsyncMock = vi.fn()

const activePlace: PlaceSummary = {
  category: 'pools',
  coverImageUrl: null,
  id: 'place-1',
  popularityWeight: 10,
  status: 'active',
  summary: 'Теплый бассейн в центре Екатеринбурга',
  tags: ['pool', 'family'],
  title: 'Аквацентр',
}

const hiddenPlace: PlaceSummary = {
  category: 'spa',
  coverImageUrl: null,
  id: 'place-2',
  popularityWeight: 5,
  status: 'hidden',
  summary: 'Скрытый SPA для проверки admin list',
  tags: ['spa'],
  title: 'Скрытый SPA',
}

const places: PlaceListResponse = {
  items: [activePlace, hiddenPlace],
  page: 2,
  pageSize: 20,
  total: 21,
}

const pageOnePlaces: PlaceListResponse = {
  items: [activePlace],
  page: 1,
  pageSize: 1,
  total: 2,
}

const pageTwoPlaces: PlaceListResponse = {
  items: [hiddenPlace],
  page: 2,
  pageSize: 1,
  total: 2,
}

const emptyPlaces: PlaceListResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
}

const renderPlacesList = (route = '/places') => {
  const store = createAppStore()

  render(
    <Provider store={store}>
      <AntdApp>
        <MemoryRouter initialEntries={[route]}>
          <PlacesList />
        </MemoryRouter>
      </AntdApp>
    </Provider>,
  )

  return store
}

describe('PlacesList', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockedUsePlacesListQuery.mockReset()
    mockedUseUpdatePlaceStatusMutation.mockReset()
    mutateAsyncMock.mockReset()
    mutateAsyncMock.mockResolvedValue({ ...activePlace, status: 'hidden' })
    mockedUseUpdatePlaceStatusMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
      mutateAsync: mutateAsyncMock,
    } as unknown as ReturnType<typeof useUpdatePlaceStatusMutation>)
  })

  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('uses URL pagination params for places query', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList('/places?page=2&pageSize=20')

    expect(mockedUsePlacesListQuery).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
    })
  })

  it('uses URL status param for places query', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList('/places?status=hidden&page=2&pageSize=20')

    expect(mockedUsePlacesListQuery).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      status: 'hidden',
    })
  })

  it('changes status filter through URL state and resets page', async () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList('/places?page=3&pageSize=20')

    fireEvent.click(screen.getByText('Скрытые'))

    await waitFor(() => {
      expect(mockedUsePlacesListQuery).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        status: 'hidden',
      })
    })
  })

  it('renders places table rows with localized metadata', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    expect(document.title).toBe('Места | Amazing EKB Admin')
    expect(screen.getByText('Аквацентр')).toBeInTheDocument()
    expect(screen.getByText('Скрытый SPA')).toBeInTheDocument()
    expect(screen.getByText('Бассейны')).toBeInTheDocument()
    expect(screen.getByText('Опубликовано')).toBeInTheDocument()
    expect(screen.getByText('Скрыто')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Скрытый SPA' })).toHaveAttribute(
      'href',
      '/places/place-2',
    )
    expect(screen.getByText('Всего: 21')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Создать место' })).toHaveAttribute(
      'href',
      '/places/new',
    )
  })

  it('renders forbidden state for permission errors', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'permission',
        message: 'Forbidden',
        status: 403,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument()
  })

  it('renders generic screen error for server failures', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Places unavailable',
        status: 500,
      }),
      isError: true,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument()
    expect(screen.getByText('Places unavailable')).toBeInTheDocument()
  })

  it('renders create action for an empty unfiltered list', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: emptyPlaces,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    const createLinks = screen
      .getAllByText('Создать место')
      .map((element) => element.closest('a'))

    expect(screen.getByText('Места пока не созданы')).toBeInTheDocument()
    expect(createLinks).toHaveLength(2)
    expect(createLinks.every(Boolean)).toBe(true)
  })

  it('renders reset action for a filtered empty list', async () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: emptyPlaces,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList('/places?status=hidden')

    expect(
      screen.getByText('По выбранному статусу мест не найдено'),
    ).toBeInTheDocument()

    const resetButton = screen.getByText('Сбросить фильтр').closest('button')

    expect(resetButton).not.toBeNull()
    fireEvent.click(resetButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedUsePlacesListQuery).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
      })
    })
  })

  it('updates bulk toolbar count after selecting rows', () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    fireEvent.click(screen.getAllByRole('checkbox')[1])

    expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
  })

  it('keeps selected places across pagination changes', async () => {
    mockedUsePlacesListQuery.mockImplementation((params) => {
      const data = params.page === 2 ? pageTwoPlaces : pageOnePlaces

      return {
        data,
        error: null,
        isError: false,
        isPending: false,
      } as ReturnType<typeof usePlacesListQuery>
    })

    renderPlacesList('/places?page=1&pageSize=1')

    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fireEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(mockedUsePlacesListQuery).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 1,
      })
    })
    expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
  })

  it('shows a restore prompt and restores only draft places from the loaded page', async () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: pageOnePlaces,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)
    saveBulkModerationDraftSelection([activePlace, hiddenPlace])

    renderPlacesList('/places?page=1&pageSize=1')

    expect(
      screen.getByText('Есть сохраненный черновик выбора'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Восстановить' }))

    expect(screen.getByText('Выбрано: 1')).toBeInTheDocument()
    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
        ) ?? '{}',
      ),
    ).toMatchObject({
      places: [
        {
          id: 'place-1',
          status: 'active',
          title: 'Аквацентр',
        },
      ],
      version: 1,
    })
  })

  it('runs bulk status change for selected places', async () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)

    renderPlacesList()

    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fireEvent.click(screen.getAllByRole('checkbox')[2])
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(2)
    })
    expect(
      window.sessionStorage.getItem(
        BULK_MODERATION_DRAFT_SELECTION_STORAGE_KEY,
      ),
    ).toBeNull()
    expect(mutateAsyncMock).toHaveBeenNthCalledWith(1, {
      data: { status: 'hidden' },
      pathParams: { placeId: 'place-1' },
    })
    expect(mutateAsyncMock).toHaveBeenNthCalledWith(2, {
      data: { status: 'hidden' },
      pathParams: { placeId: 'place-2' },
    })
    expect(screen.getByText('Успешно: 2')).toBeInTheDocument()
  })

  it('shows partial failures, retries failed items, and undoes succeeded items', async () => {
    mockedUsePlacesListQuery.mockReturnValue({
      data: places,
      error: null,
      isError: false,
      isPending: false,
    } as ReturnType<typeof usePlacesListQuery>)
    mutateAsyncMock.mockImplementation(({ pathParams }) => {
      if (pathParams.placeId === 'place-2') {
        return Promise.reject(
          new ApiClientError({
            kind: 'server',
            message: 'Ошибка place-2',
            status: 500,
          }),
        )
      }

      return Promise.resolve({ ...activePlace, status: 'hidden' })
    })

    renderPlacesList()

    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fireEvent.click(screen.getAllByRole('checkbox')[2])
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка place-2')).toBeInTheDocument()
    })

    mutateAsyncMock.mockResolvedValue({ ...hiddenPlace, status: 'hidden' })
    fireEvent.click(screen.getByRole('button', { name: 'Повторить ошибки' }))

    await waitFor(() => {
      expect(screen.getByText('Успешно: 2')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Откатить успешные' }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        data: { status: 'active' },
        pathParams: { placeId: 'place-1' },
      })
    })
  }, 15_000)
})
