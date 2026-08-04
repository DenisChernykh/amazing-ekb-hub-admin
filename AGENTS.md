# AGENTS.md

## Purpose

This admin project is a real Amazing EKB Hub codebase used to practice a Vite SPA + Ant Design + pragmatic FSD approach. The assistant must keep explanations practical and preserve production-grade architecture expectations.

## Architecture Rules

1. Keep `src/app` as the root composition/router/provider layer.
2. Keep `src/pages` thin: page files should compose widgets and avoid business logic, data fetching, mutation handling, and layout-heavy UI.
3. Put large screen composition into `src/widgets`.
4. Put user actions and interactive scenarios into `src/features`.
5. Put domain/session contracts, model hooks, cache helpers, and reusable domain UI into `src/entities`.
6. Keep generated API code inside `src/shared/api/generated` and `src/shared/api/generated-zod`; application UI must not import generated hooks directly.

## Ant Design Rules

1. Prefer native Ant Design components for UI structure and controls.
2. Use `Layout`, `Flex`, `Space`, `Card`, `Typography`, `Form`, `Result`, `Spin`, and related AntD primitives before custom markup.
3. Use CSS Modules for local responsive/layout styles.
4. Source colors, borders, backgrounds, and radii from AntD tokens through `theme.useToken()` or `ConfigProvider` tokens.
5. Do not use global BEM-style CSS for page/widget layout.

## React Rules

1. For conditional JSX without an `else` branch, prefer boolean `&&` rendering: `{isAuth && <Admin />}`.
2. Use a ternary only when both branches are meaningful UI states: `{isLoading ? <Spin /> : <Content />}`.
3. Guard non-boolean values before `&&` rendering, for example `Boolean(count) && <Counter />`, so React never renders accidental `0` or empty values.
4. Treat `useEffect` as an escape hatch. Before adding it, prefer derived values, event handlers, React Query options, router state, component keys, or moving logic to model/entity hooks.
5. If `useEffect` is still required, explain in the code review/update what external system is being synchronized and why the alternatives do not fit.
6. Before changing React code, check `docs/architecture/react-guidelines.md`.

## Helper Reuse Rules

1. Before creating any helper, open `docs/architecture/helper-registry.md` and check whether an existing helper already covers the contract.
2. If a helper already exists, reuse it instead of creating a local duplicate.
3. If a helper is local/private but the same behavior is needed elsewhere, promote it to the nearest valid shared layer and update the registry.
4. If a new helper is necessary, add it to `docs/architecture/helper-registry.md` in the same change.
5. Do not create generic helper dumps. Keep helpers close to the smallest layer that owns their contract.

## TSDoc Rules

1. Do not add or update TSDoc by default. It is a separate task that requires an explicit user request.
2. For that task, use `docs/architecture/tsdoc-guidelines.md` and run `pnpm run lint:tsdoc`.
3. Its findings are warnings and do not run as part of `pnpm run lint`, `pnpm run lint:strict`, or `pnpm run check`.
4. Generated files must not be documented manually.

## Task Completion Ritual

Use this ritual after a feature branch is merged or when the user asks to finish/close a completed slice. This is an AI-agent workflow, not end-user documentation.

1. Check local state with `git status -sb` and confirm the expected branch, usually `main`, is clean.
2. Check the merged PR status and record the PR number/link in any changed tracking docs.
3. Update `docs/product/project-feature-gap.md`: move the completed slice from branch/PR status to done in `main`, add the merged PR link, and keep remaining gaps/blockers explicit.
4. Update the Notion roadmap with the same status, merged PR link, and current follow-up blockers.
5. Check relevant GitHub issues: close/update issues for completed work, leave real follow-ups open, and create/update backend/admin blocker issues when needed.
6. Run the full final verification set from the Verification section on `main`.
7. If docs or status files changed after merge, commit and push that small docs/status update separately.
8. Before proposing the next slice, inspect open blockers and avoid choosing work that would require temporary architecture unless the user explicitly accepts that tradeoff.

If the user asks to "repeat the ritual" or asks what the ritual is, explain these steps in chat first. Execute them only when the user asks to perform the post-merge/status update.

## Verification

Run the narrowest meaningful checks while working, and before completion run:

1. `pnpm run typecheck`
2. `pnpm run lint:strict`
3. `pnpm run test`
4. `pnpm run format:check`
5. `pnpm run build`
