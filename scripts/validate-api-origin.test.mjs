import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const validatorPath = resolve(process.cwd(), 'scripts/validate-api-origin.mjs')

const validateApiOrigin = (value) => {
  const args = [validatorPath]

  if (value !== undefined) {
    args.push(value)
  }

  return spawnSync(process.execPath, args, { encoding: 'utf8' })
}

describe('validate-api-origin CLI', () => {
  it.each(['/', 'https://api.example.test', 'https://api.example.test/'])(
    'accepts %s',
    (value) => {
      expect(validateApiOrigin(value).status).toBe(0)
    },
  )

  it.each([
    undefined,
    '',
    '/v1',
    'https://api.example.test bad',
    'https://api.example.test:invalid',
    'ftp://api.example.test',
    'https://user:password@api.example.test',
    'https://api.example.test/backend',
    'https://api.example.test?tenant=1',
    'https://api.example.test#section',
  ])('rejects %s', (value) => {
    expect(validateApiOrigin(value).status).toBe(1)
  })
})
