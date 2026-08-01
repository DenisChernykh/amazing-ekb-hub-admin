import { http, HttpResponse } from 'msw'

import { handlers } from './handlers'
import { server } from './server'

describe('MSW test server', () => {
  it('starts with no product handlers and accepts a test-local handler', async () => {
    expect(handlers).toEqual([])
    server.use(
      http.get('http://api.test/v1/health', () =>
        HttpResponse.json({ status: 'ok' }),
      ),
    )

    const response = await fetch('http://api.test/v1/health')

    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })
})
