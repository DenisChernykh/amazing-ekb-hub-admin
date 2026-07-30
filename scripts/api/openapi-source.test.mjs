import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'
import { resolvePairedBackendSource } from './openapi-source.mjs'
import { syncOpenApi, validateOpenApiDocument } from './sync-openapi.mjs'

const validOpenApiDocument = {
  openapi: '3.0.3',
  components: {
    schemas: {
      ProblemResponseDto: {
        properties: {
          code: {
            enum: [
              'AUTHENTICATION_REQUIRED',
              'AUTHORIZATION_DENIED',
              'NOT_FOUND',
              'VALIDATION_FAILED',
              'DEPENDENCY_UNAVAILABLE',
              'INTERNAL_ERROR',
            ],
          },
        },
      },
    },
  },
  paths: {
    '/v1/auth/login': {
      post: { operationId: 'authLogin', tags: ['auth'] },
    },
    '/v1/auth/csrf': {
      get: { operationId: 'authGetCsrfToken', tags: ['auth'] },
    },
    '/v1/auth/me': {
      get: { operationId: 'authGetMe', tags: ['auth'] },
    },
    '/v1/auth/logout': {
      post: { operationId: 'authLogout', tags: ['auth'] },
    },
    '/v1/admin/categories': {
      post: { operationId: 'adminCategoriesCreate' },
    },
    '/v1/admin/categories/{categoryId}': {
      patch: { operationId: 'adminCategoriesUpdate' },
    },
    '/v1/admin/content-sources': {
      post: { operationId: 'adminContentSourcesCreate' },
    },
    '/v1/admin/content-sources/{sourceId}': {
      patch: { operationId: 'adminContentSourcesUpdate' },
    },
    '/v1/admin/materials/{materialId}': {
      patch: { operationId: 'adminMaterialsUpdate' },
    },
    '/v1/admin/places': {
      post: { operationId: 'adminPlacesCreate' },
    },
    '/v1/admin/places/{placeId}': {
      patch: { operationId: 'adminPlacesUpdate' },
    },
    '/v1/admin/places/{placeId}/materials': {
      post: { operationId: 'adminPlaceMaterialsCreate' },
    },
    '/v1/admin/place-imports/yandex-maps': {
      post: { operationId: 'adminPlaceImportsStart' },
    },
  },
}

describe('OpenAPI source resolution', () => {
  it('resolves the sibling local backend from the primary admin worktree', () => {
    expect(
      resolvePairedBackendSource({
        cwd: '/private/tmp/admin-codex-rhf-zod-forms',
        worktreeList: [
          'worktree /Users/developer/projects/amazing-ekb-hub/admin-codex',
          'HEAD 1111111111111111111111111111111111111111',
          'branch refs/heads/stage',
          '',
          'worktree /private/tmp/admin-codex-rhf-zod-forms',
          'HEAD 2222222222222222222222222222222222222222',
          'branch refs/heads/refactor/rhf-zod-forms',
          '',
        ].join('\n'),
      }),
    ).toBe(
      '/Users/developer/projects/amazing-ekb-hub/backend-codex/docs/api/openapi.json',
    )
  })

  it('falls back to a sibling of the current checkout without worktree metadata', () => {
    expect(
      resolvePairedBackendSource({
        cwd: '/workspace/admin-codex',
      }),
    ).toBe(resolve('/workspace/backend-codex/docs/api/openapi.json'))
  })
})

describe('OpenAPI document validation', () => {
  it('accepts the generated backend contract with required admin operations', () => {
    expect(validateOpenApiDocument(validOpenApiDocument)).toBeDefined()
  })

  it('rejects a contract without a required admin operation', () => {
    expect(() =>
      validateOpenApiDocument({
        openapi: '3.0.3',
        paths: {},
      }),
    ).toThrow('POST /v1/auth/login')
  })

  it.each([
    ['post', '/v1/auth/login'],
    ['get', '/v1/auth/csrf'],
    ['get', '/v1/auth/me'],
    ['post', '/v1/auth/logout'],
  ])('rejects a contract without %s %s', (method, path) => {
    const document = structuredClone(validOpenApiDocument)
    delete document.paths[path][method]

    expect(() => validateOpenApiDocument(document)).toThrow(
      `${method.toUpperCase()} ${path}`,
    )
  })

  it('rejects a foundation contract without VALIDATION_FAILED problem code', () => {
    const document = structuredClone(validOpenApiDocument)
    document.components.schemas.ProblemResponseDto.properties.code.enum =
      document.components.schemas.ProblemResponseDto.properties.code.enum.filter(
        (code) => code !== 'VALIDATION_FAILED',
      )

    expect(() => validateOpenApiDocument(document)).toThrow('VALIDATION_FAILED')
  })

  it('writes a snapshot accepted by the project formatter', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'admin-openapi-sync-'))
    const source = resolve(directory, 'source.json')
    const destination = resolve(directory, 'snapshot.json')
    const raw = JSON.stringify(validOpenApiDocument, null, 2)

    try {
      await writeFile(source, raw)
      await syncOpenApi({ source, destination })

      expect(await readFile(destination, 'utf8')).toBe(
        await format(raw, { parser: 'json' }),
      )
    } finally {
      await rm(directory, { recursive: true })
    }
  })
})
