import { useZodForm } from '@/shared/lib/form/use-zod-form'
import { fireEvent, render, screen } from '@testing-library/react'
import { FormProvider } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { editCategoryFormSchema } from '../model/category-form-schema'
import { CategoryFormFields } from './category-form-fields'

const renderCategoryFormFields = (showSlug = false) => {
  const onSubmit = vi.fn()

  function CategoryFormFieldsHarness() {
    const form = useZodForm(editCategoryFormSchema, {
      defaultValues: { slug: '', title: '' },
      mode: 'onChange',
      reValidateMode: 'onChange',
    })

    return (
      <FormProvider {...form}>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <CategoryFormFields control={form.control} showSlug={showSlug} />
          <button type="submit">Отправить</button>
        </form>
      </FormProvider>
    )
  }

  const renderResult = render(<CategoryFormFieldsHarness />)

  return { ...renderResult, onSubmit }
}

describe('CategoryFormFields', () => {
  it('hides the slug field by default for category creation', () => {
    renderCategoryFormFields()

    expect(screen.queryByRole('textbox', { name: 'Ярлык' })).toBeNull()
    expect(
      screen.queryByText(
        'Часть адреса в ссылке. Обычно заполняется автоматически.',
      ),
    ).toBeNull()
  })

  it('renders the slug field as a user-facing label when enabled', () => {
    renderCategoryFormFields(true)

    expect(screen.getByRole('textbox', { name: 'Ярлык' })).toHaveAttribute(
      'placeholder',
      'Например: family-cafe',
    )
    expect(
      screen.getByText(
        'Часть адреса в ссылке. Обычно заполняется автоматически.',
      ),
    ).toBeInTheDocument()
  })

  it('does not render the removed badge color control', () => {
    const { container } = renderCategoryFormFields()

    expect(
      screen.queryByRole('textbox', { name: 'Цвет бейджа' }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('.ant-color-picker-trigger')).toBeNull()
  })

  it('renders the exact slug error when the submitted slug violates the API contract', async () => {
    const { onSubmit } = renderCategoryFormFields(true)

    fireEvent.change(screen.getByRole('textbox', { name: 'Название' }), {
      target: { value: 'SPA' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Ярлык' }), {
      target: { value: 'Семейное кафе' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))

    expect(
      await screen.findByText(
        'Используйте маленькие латинские буквы, цифры и дефисы, например family-cafe',
      ),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
