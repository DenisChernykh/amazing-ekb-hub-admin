#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { format } from 'prettier'
import { resolvePairedBackendSource } from './openapi-source.mjs'

const requiredOperations = [
  ['/v1/auth/login', 'post', 'authLogin'],
  ['/v1/admin/categories', 'post', 'adminCategoriesCreate'],
  ['/v1/admin/categories/{categoryId}', 'patch', 'adminCategoriesUpdate'],
  ['/v1/admin/content-sources', 'post', 'adminContentSourcesCreate'],
  [
    '/v1/admin/content-sources/{sourceId}',
    'patch',
    'adminContentSourcesUpdate',
  ],
  ['/v1/admin/materials/{materialId}', 'patch', 'adminMaterialsUpdate'],
  ['/v1/admin/places', 'post', 'adminPlacesCreate'],
  ['/v1/admin/places/{placeId}', 'patch', 'adminPlacesUpdate'],
  ['/v1/admin/places/{placeId}/materials', 'post', 'adminPlaceMaterialsCreate'],
  ['/v1/admin/place-imports/yandex-maps', 'post', 'adminPlaceImportsStart'],
]

const readWorktreeList = () => {
  try {
    return execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    })
  } catch {
    return undefined
  }
}

/**
 * Проверяет, что документ является OpenAPI 3 и содержит операции,
 * необходимые admin SPA.
 */
export function validateOpenApiDocument(value) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.openapi !== 'string' ||
    !value.openapi.startsWith('3.') ||
    value.paths === null ||
    typeof value.paths !== 'object' ||
    Array.isArray(value.paths)
  ) {
    throw new Error('Expected a non-empty OpenAPI 3 JSON document')
  }

  for (const [path, method, operationId] of requiredOperations) {
    const operation = value.paths[path]?.[method]

    if (operation === undefined) {
      throw new Error(
        `OpenAPI document is missing ${method.toUpperCase()} ${path}`,
      )
    }

    if (operation.operationId !== operationId) {
      throw new Error(
        `OpenAPI document has an unexpected operation ID for ${method.toUpperCase()} ${path}`,
      )
    }
  }

  return value
}

/**
 * Читает OpenAPI из локального пути, `file:` URL или HTTP(S).
 */
export async function readOpenApiSource(source) {
  if (/^https?:\/\//u.test(source)) {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error(`OpenAPI download failed with HTTP ${response.status}`)
    }

    return response.text()
  }

  const filePath = source.startsWith('file:')
    ? fileURLToPath(source)
    : resolve(process.cwd(), source)

  return readFile(filePath, 'utf8')
}

/**
 * Валидирует и сохраняет локальный OpenAPI snapshot в формате проекта.
 */
export async function syncOpenApi({ source, destination }) {
  const raw = await readOpenApiSource(source)

  if (raw.trim() === '') {
    throw new Error('OpenAPI source is empty')
  }

  validateOpenApiDocument(JSON.parse(raw))
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, await format(raw, { parser: 'json' }))
}

async function main() {
  const source =
    process.env.OPENAPI_SPEC_SOURCE ??
    resolvePairedBackendSource({
      cwd: process.cwd(),
      worktreeList: readWorktreeList(),
    })
  const destination = resolve(process.cwd(), 'openapi/openapi.json')

  await syncOpenApi({ source, destination })
  process.stdout.write(`OpenAPI snapshot updated from ${source}\n`)
}

if (process.argv[1] !== undefined) {
  const invokedUrl = pathToFileURL(resolve(process.argv[1])).href

  if (import.meta.url === invokedUrl) {
    await main()
  }
}
