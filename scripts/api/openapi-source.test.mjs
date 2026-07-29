import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePairedBackendSource } from './openapi-source.mjs'

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
      '/Users/developer/projects/amazing-ekb-hub/backend-codex/docs/api/specification.yaml',
    )
  })

  it('falls back to a sibling of the current checkout without worktree metadata', () => {
    expect(
      resolvePairedBackendSource({
        cwd: '/workspace/admin-codex',
      }),
    ).toBe(resolve('/workspace/backend-codex/docs/api/specification.yaml'))
  })
})
