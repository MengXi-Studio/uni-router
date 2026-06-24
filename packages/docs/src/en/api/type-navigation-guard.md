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
type NavigationGuardNext = (
  to?: RouteLocationRaw | false,
  options?: NavigationGuardNextOptions
) => void
```

### Parameters

- **to**: Pass `false` to abort navigation, pass a route location to redirect, or omit to allow
- **options**: Redirect options, only effective when `to` (a route location) is passed for redirection

### Usage

| Call | Effect |
|------|--------|
| `next()` | Allow navigation |
| `next(false)` | Abort navigation |
| `next(location)` | Redirect to a new location (uses the original navigation mode) |
| `next(location, { mode })` | Redirect to a new location with a specified navigation mode |

::: warning
Each guard must call `next()` exactly once.
:::

## NavigationGuardNextOptions

The optional parameters type for the `next()` callback, used to control redirect behavior.

```ts
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode
}
```

### Properties

- **mode**: The navigation mode to use for redirection. When not specified, the original navigation mode that triggered the guard is used (`push` / `replace` / `relaunch`); when the original navigation is `back`, it falls back to `relaunch`.

## NavigationRedirectMode

The redirect mode type, corresponding to the router's navigation methods.

```ts
type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

### Values

| Value | Method | uni API | Description |
|-------|--------|---------|-------------|
| `'push'` | `router.push()` | `uni.navigateTo` | Keep current page, navigate to a new page |
| `'replace'` | `router.replace()` | `uni.redirectTo` | Close current page, navigate to a new page |
| `'relaunch'` | `router.relaunch()` | `uni.reLaunch` | Close all pages, open a new page |

### Example

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Force replace redirect to login page regardless of original push/replace mode
    // Avoids extra history pages after the login page
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

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
