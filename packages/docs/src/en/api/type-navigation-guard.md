# NavigationGuard

Navigation guard related type definitions.

## NavigationGuard

Before navigation guard function type.

```ts
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  next: NavigationGuardNext
) => void | Promise<void>
```

### Parameters

- **to**: The target route being navigated to
- **from**: The current route being navigated away from
- **next**: Must be called to resolve this guard

### Example

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## NavigationGuardNext

The `next` callback function type for guards.

```ts
type NavigationGuardNext = (to?: RouteLocationRaw | false) => void
```

### Usage

| Call | Effect |
|------|--------|
| `next()` | Allow navigation |
| `next(false)` | Abort navigation |
| `next(location)` | Redirect to a new location |

::: warning
Each guard must call `next()` exactly once.
:::

## PostNavigationGuard

After navigation hook function type.

```ts
type PostNavigationGuard = (
  to: RouteLocation,
  from: RouteLocation
) => void
```

### Parameters

- **to**: The target route that was navigated to
- **from**: The route that was navigated away from

### Example

```ts
router.afterEach((to, from) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```
