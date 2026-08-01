# `useZodForm` Starter Alignment

## Status

Adopted alignment in this admin branch: `useZodForm` matches the pinned
`react-starter` contract without changing the AntD form policy of this project.

## Proven Contract

- `useZodForm<TSchema>(schema, options?)` preserves `z.input<TSchema>` for RHF
  controls.
- Successful submit handlers receive `z.output<TSchema>`.
- The caller owns `defaultValues`, `mode`, `reValidateMode`, reset and server
  errors.
- Generated OpenAPI Zod fields can be composed into feature schemas without
  editing generated files.
- `z` is imported type-only, so the hook does not add a runtime Zod import.

## Evidence from Admin Flows

| Flow           | Evidence                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Login          | Generated email contract plus exact Russian required and email messages.                |
| Category       | Optional create slug, required edit slug and normalized partial PATCH.                  |
| Content source | Nullable select default, HTTP URL validation and explicit `null` clears.                |
| Material       | `Dayjs` UI value, conditional duration and edit models without URL.                     |
| Place          | Nullable category, tag normalization, cover partial success and external dirty blocker. |
| Yandex import  | Trimmed HTTP URL plus structured active-operation `409` recovery.                       |

## Starter Boundary

- `useZodForm` is the reusable alignment point.
- `RhfFormItem` remains intentionally AntD-specific: it is not a starter
  candidate because `react-starter` has a different UI foundation.
- `z.config(ru())` remains an application/test-entrypoint decision rather than
  a responsibility of the hook.

## Adoption Checks

- The admin test proves transformed output both with caller options and with no
  options.
- Generated OpenAPI schemas remain transport-owned.
- The hook does not choose validation mode or map server errors.
