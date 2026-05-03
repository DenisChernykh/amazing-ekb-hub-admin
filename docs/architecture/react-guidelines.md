# React Guidelines

This document defines React-specific conventions for `admin-codex`.

## Conditional Rendering

Use boolean `&&` rendering when JSX has no meaningful `else` branch:

```tsx
{
  isAuth && <AdminPanel />
}
```

Avoid ternaries that only return `null`:

```tsx
{
  isAuth ? <AdminPanel /> : null
}
```

Use a ternary when both branches are real UI states:

```tsx
{
  isLoading ? <Spin /> : <AdminPanel />
}
```

Guard non-boolean values before `&&` rendering:

```tsx
{
  Boolean(items.length) && <ItemsList />
}
```

This prevents React from rendering accidental values like `0`.

## useEffect Policy

`useEffect` is an escape hatch, not the default way to run application logic.

Before adding `useEffect`, prefer:

- derived values during render;
- event handlers for user-triggered work;
- React Query `query` and `mutation` options for server state and side effects;
- router redirects, route guards, and route state for navigation flows;
- controlled props or component `key` for reset behavior;
- model/entity hooks when the behavior belongs to a domain abstraction.

Valid `useEffect` cases are usually synchronization with an external system:

- browser APIs that are not represented by React state;
- subscriptions and explicit cleanup;
- timers;
- imperative third-party widgets;
- analytics or telemetry hooks when no router/query callback is a better fit.

When `useEffect` is used, the agent must be able to explain:

- what external system is being synchronized;
- why render-time derivation, event handlers, React Query, router state, or a model hook do not fit;
- what cleanup or dependency invariant keeps the effect safe.

## Preferred Rewrites

Avoid derived state effects:

```tsx
const fullName = `${firstName} ${lastName}`.trim()
```

Instead of:

```tsx
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`.trim())
}, [firstName, lastName])
```

Prefer mutation callbacks:

```tsx
const loginMutation = useLoginSession({
  onSuccess: () => navigate('/'),
})
```

Instead of watching mutation state in an effect.

Prefer route guards or redirects in render when the branch is already known:

```tsx
if (!user) {
  return <Navigate replace to="/login" />
}
```

Instead of navigating from an effect after rendering a temporary state.
