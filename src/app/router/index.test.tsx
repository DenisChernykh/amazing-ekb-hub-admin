import { render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { protectedRouteChildren } from './index'

describe('protectedRouteChildren', () => {
  it('contains dashboard, places, content sources, and not-found routes', () => {
    expect(protectedRouteChildren.map((route) => route.path)).toEqual([
      '/',
      '/places',
      '/materials',
      '/content-sources',
      '/places/:placeId',
      '/places/:placeId/edit',
      '/places/new',
      '*',
    ])
  })

  it('renders protected not-found state for unknown admin routes', () => {
    const router = createMemoryRouter(
      [
        {
          element: <Outlet />,
          children: protectedRouteChildren,
        },
      ],
      { initialEntries: ['/unknown-admin-route'] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByText('Раздел не найден')).toBeInTheDocument()
    expect(document.title).toBe('Раздел не найден | Amazing EKB Admin')
  })
})
