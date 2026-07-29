#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePairedBackendSource } from './openapi-source.mjs'

const DEFAULT_SPEC_OUTPUT = 'openapi.yaml'

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

const source =
  process.env.OPENAPI_SPEC_SOURCE ??
  resolvePairedBackendSource({
    cwd: process.cwd(),
    worktreeList: readWorktreeList(),
  })
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
