#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const generatedPaths = [
  'openapi/openapi.json',
  'src/shared/api/generated',
  'src/shared/api/generated-zod',
]

const drift = execFileSync(
  'git',
  [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--',
    ...generatedPaths,
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  },
).trim()

if (drift !== '') {
  process.stderr.write(`Generated API drift detected:\n${drift}\n`)
  process.exitCode = 1
}
