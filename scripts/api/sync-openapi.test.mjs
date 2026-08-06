import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateOpenApiDocument } from './sync-openapi.mjs'

const snapshot = JSON.parse(
  await readFile(resolve(process.cwd(), 'openapi/openapi.json'), 'utf8'),
)

const collectionOperations = [
  ['/v1/admin/collections', 'get'],
  ['/v1/admin/collections', 'post'],
  ['/v1/admin/collections/{collectionId}', 'get'],
  ['/v1/admin/collections/{collectionId}', 'patch'],
  ['/v1/admin/collections/{collectionId}', 'delete'],
  ['/v1/admin/collections/{collectionId}/status', 'patch'],
  ['/v1/admin/collections/{collectionId}/photo', 'post'],
  ['/v1/admin/collections/{collectionId}/photo', 'get'],
  ['/v1/admin/collections/{collectionId}/photo', 'delete'],
  ['/v1/admin/collections/{collectionId}/places', 'post'],
  ['/v1/admin/collections/{collectionId}/places/{placeId}', 'delete'],
  ['/v1/admin/collections/order', 'put'],
  ['/v1/admin/collections/{collectionId}/places/order', 'put'],
  ['/v1/admin/places/{placeId}/collections', 'put'],
]

describe('collection OpenAPI contract validation', () => {
  it.each(collectionOperations)(
    'rejects a document without %s %s',
    (path, method) => {
      const document = structuredClone(snapshot)
      delete document.paths[path][method]

      expect(() => validateOpenApiDocument(document)).toThrow(
        `${method.toUpperCase()} ${path}`,
      )
    },
  )

  it.each([
    'COLLECTION_NOT_FOUND',
    'COLLECTION_SLUG_CONFLICT',
    'COLLECTION_PUBLISH_REQUIRES_ACTIVE_PLACE',
    'COLLECTION_MEMBERSHIP_CONFLICT',
    'COLLECTION_REORDER_CONFLICT',
    'COLLECTION_HAS_ACTIVE_IMPORT',
  ])('rejects a document without problem code %s', (problemCode) => {
    const document = structuredClone(snapshot)
    document.components.schemas.ProblemResponseDto.properties.code.enum =
      document.components.schemas.ProblemResponseDto.properties.code.enum.filter(
        (code) => code !== problemCode,
      )

    expect(() => validateOpenApiDocument(document)).toThrow(problemCode)
  })

  it('rejects a document without admin place collection memberships', () => {
    const document = structuredClone(snapshot)
    delete document.components.schemas.AdminPlaceSummaryResponseDto.properties
      .collections

    expect(() => validateOpenApiDocument(document)).toThrow(
      'AdminPlaceSummaryResponseDto.collections',
    )
  })

  it('rejects a document without the durable import target', () => {
    const document = structuredClone(snapshot)
    delete document.components.schemas.PlaceImportOperationResponseDto
      .properties.targetCollection

    expect(() => validateOpenApiDocument(document)).toThrow(
      'PlaceImportOperationResponseDto.targetCollection',
    )
  })
})
