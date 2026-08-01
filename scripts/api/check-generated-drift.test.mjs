import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const checkScript = resolve(
  process.cwd(),
  'scripts/api/check-generated-drift.mjs',
)
const temporaryRepositories = []

const runGit = (cwd, args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

async function createCleanRepository() {
  const repository = await mkdtemp(resolve(tmpdir(), 'admin-generated-drift-'))
  temporaryRepositories.push(repository)
  const trackedFiles = {
    'openapi/openapi.json': '{"openapi":"3.0.3"}\n',
    'src/shared/api/generated/client.ts': 'export const generated = true\n',
    'src/shared/api/generated-zod/schema.ts':
      'export const generatedSchema = true\n',
  }

  for (const [relativePath, content] of Object.entries(trackedFiles)) {
    const filePath = resolve(repository, relativePath)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content)
  }

  runGit(repository, ['init', '--quiet'])
  runGit(repository, ['add', ...Object.keys(trackedFiles)])
  runGit(repository, [
    '-c',
    'user.name=Generated Drift Test',
    '-c',
    'user.email=generated-drift@example.test',
    'commit',
    '--quiet',
    '-m',
    'test baseline',
  ])

  return repository
}

const runCheck = (cwd) =>
  spawnSync(process.execPath, [checkScript], {
    cwd,
    encoding: 'utf8',
  })

afterEach(async () => {
  await Promise.all(
    temporaryRepositories
      .splice(0)
      .map((repository) => rm(repository, { recursive: true })),
  )
})

describe('generated API drift check', () => {
  it('accepts a clean generated snapshot', async () => {
    const repository = await createCleanRepository()

    expect(runCheck(repository)).toMatchObject({
      status: 0,
      stderr: '',
    })
  })

  it.each([
    [
      'staged snapshot change',
      async (repository) => {
        await writeFile(
          resolve(repository, 'openapi/openapi.json'),
          '{"openapi":"3.1.0"}\n',
        )
        runGit(repository, ['add', 'openapi/openapi.json'])
      },
    ],
    [
      'unstaged generated TypeScript change',
      async (repository) => {
        await writeFile(
          resolve(repository, 'src/shared/api/generated/client.ts'),
          'export const generated = false\n',
        )
      },
    ],
    [
      'untracked generated Zod file',
      async (repository) => {
        await writeFile(
          resolve(
            repository,
            'src/shared/api/generated-zod/untracked-schema.ts',
          ),
          'export const untrackedSchema = true\n',
        )
      },
    ],
  ])('rejects a %s', async (_label, mutateRepository) => {
    const repository = await createCleanRepository()
    await mutateRepository(repository)

    const result = runCheck(repository)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Generated API drift detected')
  })
})
