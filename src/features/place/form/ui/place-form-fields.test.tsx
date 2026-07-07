import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlaceFormFields } from './place-form-fields'

vi.mock('@/entities/category/model/category-hooks', () => ({
  usePlaceCategoriesQuery: vi.fn(),
}))

const mockedUsePlaceCategoriesQuery = vi.mocked(usePlaceCategoriesQuery)

describe('PlaceFormFields', () => {
  beforeEach(() => {
    mockedUsePlaceCategoriesQuery.mockReset()
  })

  it('surfaces category lookup failures next to the disabled category field', () => {
    mockedUsePlaceCategoriesQuery.mockReturnValue({
      data: undefined,
      error: new ApiClientError({
        kind: 'server',
        message: 'Не удалось загрузить категории',
        status: 500,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)

    render(
      <Form>
        <PlaceFormFields />
      </Form>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось загрузить категории',
    )
    expect(screen.getByRole('combobox', { name: 'Категория' })).toBeDisabled()
  })
})
