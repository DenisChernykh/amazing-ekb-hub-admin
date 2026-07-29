import { resolve } from 'node:path'

/**
 * Возвращает локальный OpenAPI-файл соседнего backend checkout.
 *
 * @remarks Для временного frontend worktree путь строится относительно primary
 * worktree, чтобы не искать backend внутри `/private/tmp`.
 */
export function resolvePairedBackendSource({ cwd, worktreeList }) {
  const fallback = resolve(cwd, '../backend-codex/docs/api/openapi.json')
  const primaryWorktree = worktreeList
    ?.split('\n')
    .find((line) => line.startsWith('worktree '))
    ?.slice('worktree '.length)

  return primaryWorktree === undefined
    ? fallback
    : resolve(primaryWorktree, '../backend-codex/docs/api/openapi.json')
}
