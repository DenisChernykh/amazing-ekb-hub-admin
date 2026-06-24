#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SPEC_SOURCE = 'https://api.strelchukgo.ru/docs/openapi.yaml'
const DEFAULT_SPEC_OUTPUT = 'openapi.yaml'

const source = process.env.OPENAPI_SPEC_SOURCE ?? DEFAULT_SPEC_SOURCE
const output = process.env.OPENAPI_SPEC_OUTPUT ?? DEFAULT_SPEC_OUTPUT
const outputPath = resolve(process.cwd(), output)

const isHttpSource =
  source.startsWith('http://') || source.startsWith('https://')

const readOpenApiSource = async () => {
  if (isHttpSource) {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error(
        `OpenAPI request failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.text()
  }

  const filePath = source.startsWith('file:')
    ? fileURLToPath(source)
    : resolve(process.cwd(), source)

  return readFile(filePath, 'utf8')
}

const openApiSpec = await readOpenApiSource()

if (!openApiSpec.trim()) {
  throw new Error('OpenAPI source is empty')
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(
  outputPath,
  openApiSpec.endsWith('\n') ? openApiSpec : `${openApiSpec}\n`,
)

console.log(`Synced OpenAPI spec: ${source} -> ${output}`)
