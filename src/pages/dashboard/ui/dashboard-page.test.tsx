import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './dashboard-page'

vi.mock('@/widgets/admin-dashboard/ui/admin-dashboard', () => ({
  AdminDashboard: () => <div>Admin dashboard widget</div>,
}))

describe('DashboardPage', () => {
  it('renders admin dashboard widget', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Admin dashboard widget')).toBeInTheDocument()
  })
})
