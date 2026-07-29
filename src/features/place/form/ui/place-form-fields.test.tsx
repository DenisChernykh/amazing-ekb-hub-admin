import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import { ApiClientError } from '@/shared/api/client/api-error'
import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { fireEvent, render, screen } from '@testing-library/react'
import { FormProvider } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlaceFormSchema } from '../model/place-form-schema'
import { PlaceFormFields } from './place-form-fields'

vi.mock('@/entities/category/model/category-hooks', () => ({
  usePlaceCategoriesQuery: vi.fn(),
}))

const mockedUsePlaceCategoriesQuery = vi.mocked(usePlaceCategoriesQuery)

const PlaceFormFieldsHarness = () => {
  const form = useZodForm(createPlaceFormSchema, {
    defaultValues: {
      categoryId: null,
      slug: '',
      summary: '',
      tags: [],
      title: '',
    },
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <PlaceFormFields control={form.control} showSlug />
        <button type="submit">Отправить</button>
      </form>
    </FormProvider>
  )
}

describe('PlaceFormFields', () => {
  beforeEach(() => {
    mockedUsePlaceCategoriesQuery.mockReset()
    mockedUsePlaceCategoriesQuery.mockReturnValue({
      data: { items: [] },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    } as unknown as ReturnType<typeof usePlaceCategoriesQuery>)
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
      <PlaceFormFieldsHarness />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Не удалось загрузить категории',
    )
    expect(screen.getByRole('combobox', { name: 'Категория' })).toBeDisabled()
  })

  it('shows exact required title and category errors after empty submit', async () => {
    render(<PlaceFormFieldsHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(await screen.findByText('Введите название')).toBeInTheDocument()
    expect(await screen.findByText('Выберите категорию')).toBeInTheDocument()
  })

  it('shows exact slug guidance from the create schema', async () => {
    render(<PlaceFormFieldsHarness />)

    fireEvent.change(screen.getByLabelText('Ярлык'), {
      target: { value: 'Тихий SPA' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(
      await screen.findByText(
        'Используйте маленькие латинские буквы, цифры и дефисы, например quiet-spa',
      ),
    ).toBeInTheDocument()
  })
})
