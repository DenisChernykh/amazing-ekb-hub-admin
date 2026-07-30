import {
  ApiNetworkError,
  ApiProtocolError,
} from '@/shared/api/client/api-errors'
import { createApiProblemError } from '@/test/api-problem'
import type { LoaderFunctionArgs } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import {
  createRedirectAuthenticatedLoader,
  createRequireSessionLoader,
} from './loaders'

const requestArgs = (
  url: string,
  signal = new AbortController().signal,
): LoaderFunctionArgs =>
  ({
    request: new Request(url, { signal }),
  }) as LoaderFunctionArgs

async function expectRedirect(
  action: Promise<unknown>,
  expectedLocation: string,
) {
  await expect(action).rejects.toMatchObject({
    status: 302,
  })

  try {
    await action
  } catch (error) {
    expect(error).toBeInstanceOf(Response)
    expect((error as Response).headers.get('Location')).toBe(expectedLocation)
  }
}

describe('createRequireSessionLoader', () => {
  it('loads a fresh session with the navigation abort signal', async () => {
    const controller = new AbortController()
    const load = vi.fn().mockResolvedValue({ userId: 'admin-1' })
    const loader = createRequireSessionLoader({
      load,
      clear: vi.fn(),
    })
    const args = requestArgs('http://admin.test/places', controller.signal)

    await expect(loader(args)).resolves.toBeNull()
    expect(load).toHaveBeenCalledWith(args.request.signal)
  })

  it('clears local auth state and redirects an anonymous request with its full return path', async () => {
    const clear = vi.fn()
    const loader = createRequireSessionLoader({
      load: vi
        .fn()
        .mockRejectedValue(
          createApiProblemError('AUTHENTICATION_REQUIRED', 401),
        ),
      clear,
    })

    await expectRedirect(
      loader(
        requestArgs('http://admin.test/places?status=hidden#row-1'),
      ) as Promise<unknown>,
      '/login?returnTo=%2Fplaces%3Fstatus%3Dhidden%23row-1',
    )
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it.each([
    createApiProblemError('AUTHORIZATION_DENIED', 403),
    new ApiNetworkError(),
    new ApiProtocolError(),
  ])('rethrows a non-authentication error %#', async (error) => {
    const clear = vi.fn()
    const loader = createRequireSessionLoader({
      load: vi.fn().mockRejectedValue(error),
      clear,
    })

    await expect(loader(requestArgs('http://admin.test/places'))).rejects.toBe(
      error,
    )
    expect(clear).not.toHaveBeenCalled()
  })

  it('rethrows an aborted authentication error without clearing or redirecting', async () => {
    const authenticationError = createApiProblemError(
      'AUTHENTICATION_REQUIRED',
      401,
    )
    const controller = new AbortController()
    const clear = vi.fn()
    const loader = createRequireSessionLoader({
      load: vi.fn().mockRejectedValue(authenticationError),
      clear,
    })
    controller.abort()

    await expect(
      loader(requestArgs('http://admin.test/places', controller.signal)),
    ).rejects.toBe(authenticationError)
    expect(clear).not.toHaveBeenCalled()
  })
})

describe('createRedirectAuthenticatedLoader', () => {
  it('redirects an authenticated user to the sanitized return path', async () => {
    const controller = new AbortController()
    const load = vi.fn().mockResolvedValue({ userId: 'admin-1' })
    const loader = createRedirectAuthenticatedLoader({
      load,
      clear: vi.fn(),
    })
    const args = requestArgs(
      'http://admin.test/login?returnTo=%2Fplaces%3Fstatus%3Dhidden%23row-1',
      controller.signal,
    )

    await expectRedirect(
      loader(args) as Promise<unknown>,
      '/places?status=hidden#row-1',
    )
    expect(load).toHaveBeenCalledWith(args.request.signal)
  })

  it.each([
    'http://admin.test/login',
    'http://admin.test/login?returnTo=https%3A%2F%2Fevil.example%2Fpath',
    'http://admin.test/login?returnTo=%2Flogin%3FreturnTo%3D%2Fplaces',
  ])(
    'redirects an authenticated user from %s to the safe fallback',
    async (url) => {
      const loader = createRedirectAuthenticatedLoader({
        load: vi.fn().mockResolvedValue({ userId: 'admin-1' }),
        clear: vi.fn(),
      })

      await expectRedirect(loader(requestArgs(url)) as Promise<unknown>, '/')
    },
  )

  it('keeps an unauthenticated user on the login route without clearing state', async () => {
    const clear = vi.fn()
    const loader = createRedirectAuthenticatedLoader({
      load: vi
        .fn()
        .mockRejectedValue(
          createApiProblemError('AUTHENTICATION_REQUIRED', 401),
        ),
      clear,
    })

    await expect(
      loader(requestArgs('http://admin.test/login')),
    ).resolves.toBeNull()
    expect(clear).not.toHaveBeenCalled()
  })

  it.each([
    createApiProblemError('AUTHORIZATION_DENIED', 403),
    new ApiNetworkError(),
    new ApiProtocolError(),
  ])('rethrows a non-authentication login error %#', async (error) => {
    const loader = createRedirectAuthenticatedLoader({
      load: vi.fn().mockRejectedValue(error),
      clear: vi.fn(),
    })

    await expect(loader(requestArgs('http://admin.test/login'))).rejects.toBe(
      error,
    )
  })
})
