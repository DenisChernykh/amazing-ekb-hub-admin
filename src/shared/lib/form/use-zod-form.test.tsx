import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useZodForm } from './use-zod-form'

const schema = z.strictObject({
  title: z.string().trim().min(1, 'Введите название'),
})

function TestForm({
  onSubmit,
}: {
  onSubmit: (value: { title: string }) => void
}) {
  const form = useZodForm(schema, {
    defaultValues: { title: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <input aria-label="Название" {...form.register('title')} />
      <button type="submit">Сохранить</button>
    </form>
  )
}

function TestFormWithoutOptions({
  onSubmit,
}: {
  onSubmit: (value: { title: string }) => void
}) {
  const form = useZodForm(schema)

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <input aria-label="Название без параметров" {...form.register('title')} />
      <button type="submit">Сохранить без параметров</button>
    </form>
  )
}

describe('useZodForm', () => {
  it('submits transformed Zod output', async () => {
    const onSubmit = vi.fn()

    render(<TestForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Название'), '  SPA  ')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalled()
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ title: 'SPA' })
  })

  it('submits valid Zod output without options', async () => {
    const onSubmit = vi.fn()

    render(<TestFormWithoutOptions onSubmit={onSubmit} />)

    await userEvent.type(
      screen.getByLabelText('Название без параметров'),
      '  EKB  ',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Сохранить без параметров' }),
    )

    expect(onSubmit).toHaveBeenCalled()
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ title: 'EKB' })
  })
})
