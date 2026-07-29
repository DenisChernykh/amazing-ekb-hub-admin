# `useZodForm` Candidate for `react-starter`

## Status

Proposal for a separate starter task. This admin branch does not modify
`react-starter`.

## Proven Contract

- `useZodForm<TSchema>(schema, options)` preserves `z.input<TSchema>` for RHF
  controls.
- Successful submit handlers receive `z.output<TSchema>`.
- The caller owns `defaultValues`, `mode`, `reValidateMode`, reset and server
  errors.
- Generated OpenAPI Zod fields can be composed into feature schemas without
  editing generated files.

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

- Propose only `useZodForm`.
- Do not propose `RhfFormItem`: it is AntD-specific while `react-starter` uses
  a different UI foundation.
- Configure `z.config(ru())` in the starter's application and test entrypoints
  as a separate explicit decision.

## Adoption Checks

- Verify current RHF, Zod and resolver versions in the starter.
- Add focused hook tests for transformed output and generated-schema
  composition.
- Keep generated OpenAPI schemas transport-owned.
- Do not couple the hook to validation mode or server error mapping.
