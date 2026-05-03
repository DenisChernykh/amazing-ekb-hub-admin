# TSDoc Guidelines

This document defines the TSDoc standard for `admin-codex`.

## Goal

- Make exported contracts understandable without reading full implementations.
- Document side effects, provider requirements, fallback behavior, and cache/session invariants.
- Keep comments useful and avoid restating obvious implementation details.

## Scope

Write TSDoc for exported hand-written TypeScript/TSX APIs:

- `export function`;
- exported React components;
- exported hooks;
- `export type`;
- `export interface`;
- `export enum`;
- exported `const` values that are public module API, helpers, config, mappings, or cache keys.

Generated files are excluded:

- `src/shared/api/generated/**`;
- `src/shared/api/generated-zod/**`;
- other explicitly generated artifacts.

## Style

- TSDoc text is written in Russian.
- Identifiers and inline code keep their source spelling and use backticks.
- The summary is required and should be short.
- Use `@remarks` when there are side effects, provider requirements, cache effects, routing effects, fallback behavior, or non-obvious invariants.
- Use `@param` only for parameters whose contract is not obvious from the type/name.
- Use `@returns` when the return value has a meaningful contract, especially for hooks, cache helpers, nullable values, or branch-specific behavior.
- Use `@example` only when an example prevents ambiguity.

## React Components

Document exported React components with a short summary.

Add `@remarks` when a component:

- requires React Router, React Query, AntD `App`, or session context;
- triggers navigation, mutations, notifications, or cache changes;
- renders an important `loading`, `error`, `forbidden`, or fallback state.

Do not document trivial pass-through props such as `children` or `className` unless they affect behavior.

## Tests

- `describe`, `it`, and `test` do not need TSDoc.
- Exported or non-obvious test helpers should be documented.
- Prefer clear test names over comments for simple scenarios.

## Bad Patterns

Avoid:

- empty comments;
- comments that repeat the function name;
- line-by-line implementation retelling;
- misleading stale comments;
- manually editing generated files.
