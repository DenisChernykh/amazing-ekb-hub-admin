import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CategoriesPage } from './categories-page'

vi.mock('@/widgets/categories/ui/categories-screen', () => ({
  CategoriesScreen: () => <div>Categories screen widget</div>,
}))

describe('CategoriesPage', () => {
  it('renders categories screen widget', () => {
    render(<CategoriesPage />)

    expect(screen.getByText('Categories screen widget')).toBeInTheDocument()
  })
})
