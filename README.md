# Amazing EKB Hub Admin

Отдельная Vite SPA админка для Amazing EKB Hub.

## Stack

- React
- TypeScript
- Vite
- Ant Design
- React Router
- TanStack Query
- Axios
- Orval
- Vitest

## Local Development

```bash
pnpm install
pnpm run dev
```

API base URL по умолчанию: `/v1`.

Для локальной разработки Vite proxy отправляет `/v1` в backend.

## Scripts

```bash
pnpm run dev
pnpm run typecheck
pnpm run lint:strict
pnpm run test
pnpm run format:check
pnpm run build
pnpm run api:sync
pnpm run api:generate
pnpm run api:update
pnpm run api:check
```

Validation-схемы синхронизируются из сгенерированного code-first OpenAPI
artifact соседнего локального backend checkout:
`../backend-codex/docs/api/openapi.json`. Из временного admin worktree путь
вычисляется относительно primary admin worktree. Пока backend-ветка находится
в отдельном worktree, её artifact можно передать явно:

```bash
OPENAPI_SPEC_SOURCE=/absolute/path/to/backend-worktree/docs/api/openapi.json \
  pnpm run api:update
```

Сам artifact собирается в backend командой `pnpm run openapi:generate`; admin
только валидирует, сохраняет локальный snapshot в `openapi/openapi.json` и
запускает Orval для согласованных TypeScript-клиента и generated Zod-схем.
Рукописный код импортирует курируемый контракт только через `@/shared/api`.

## Documentation

- [Project Feature Gap](docs/product/project-feature-gap.md): что умеет backend, что покрыто public frontend/admin SPA, каких фич не хватает.
- [React Guidelines](docs/architecture/react-guidelines.md): conditional rendering и политика `useEffect`.
- [Helper Registry](docs/architecture/helper-registry.md): реестр helper'ов перед добавлением новых.
- [TSDoc Guidelines](docs/architecture/tsdoc-guidelines.md): правила документирования exported API.
- [Agent Rules](AGENTS.md): рабочие правила для Codex/агента в этом репозитории.
