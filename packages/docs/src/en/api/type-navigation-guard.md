# NavigationGuard

Navigation guard function type, used to perform validation, redirection, analytics, and other logic before/after navigation occurs.

## Type Definition

```ts
type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void | boolean | RouteLocationRaw>
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `to` | `RouteLocationNormalized` | The target route being navigated to |
| `from` | `RouteLocationNormalized` | The current route being navigated away from |
| `next` | `NavigationGuardNext` | Callback function that controls the navigation flow |

### Return Value

Guards support two writing styles:

1. **Callback style**: Control via `next()`
2. **Promise style**: Return a value directly, the router handles it automatically

```ts
// Callback style
router.beforeEach((to, from, next) => {
  if (isLoggedIn()) next()
  else next({ name: 'login' })
})

// Promise style (recommended)
router.beforeEach(async (to, from) => {
  if (isLoggedIn()) return true
  return { name: 'login' }
})
```

::: tip Recommended to use Promise style
- Better fits async/await style, cleaner code
- Avoids forgetting to call `next()` causing navigation to hang
- Exceptions automatically convert to `next(false)`, no try-catch needed
:::

## NavigationGuardNext

Callback function that controls the navigation flow, supporting multiple call forms:

```ts
type NavigationGuardNext = {
  (): void                                              // Allow
  (valid: boolean): void                                // true=allow, false=abort
  (location: RouteLocationRaw): void                    // Redirect
  (location: RouteLocationRaw, options: NavigationGuardNextOptions): void  // Redirect + options
  (error: Error): void                                  // Throw error
  (cb: (vm: ComponentPublicInstance) => void): void     // Access component instance
}
```

### Allow

```ts
next()        // Callback style
return true   // Promise style
```

### Abort

Abort navigation, stay on the current page:

```ts
next(false)        // Callback style
return false       // Promise style
```

### Redirect

Redirect to another route:

```ts
// Basic redirect (uses push mode by default)
next({ name: 'login' })
next('/pages/login/login')
next({ path: '/pages/login/login', query: { redirect: to.fullPath } })

// Promise style
return { name: 'login' }
```

### Redirect + Options (v1.7.0+)

Control the redirect mode via `NavigationGuardNextOptions`:

```ts
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode  // 'push' | 'replace' | 'relaunch'
}

type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

```ts
// Replace mode: don't keep current page in stack after redirect
next({ name: 'login' }, { mode: 'replace' })

// Relaunch mode: clear page stack
next({ name: 'home' }, { mode: 'relaunch' })

// Promise style (via return object)
return {
  location: { name: 'login' },
  mode: 'replace'
}
```

::: tip mode use cases
- **`push` (default)**: Regular redirect, keeps current page in stack
- **`replace`**: Login redirect (avoids returning to protected page), jump after form submission
- **`relaunch`**: Logout, switch user, return to home

See [Guard Redirect Mode](../guide/guards#redirect-mode-control).
:::

### Throw Error

```ts
next(new Error('Insufficient permissions'))
// Promise style
throw new Error('Insufficient permissions')
```

The error will be caught by `router.onError` and navigation will be aborted.

### Access Component Instance

```ts
next((vm) => {
  // vm is the target page component instance
  vm.fetchData()
})
```

::: warning Limitation
This form is only supported by the `beforeRouteEnter` guard (rarely used in uni-app because pages are independent components). `beforeEach` / `beforeResolve` / `afterEach` do not support it.
:::

## Guard Type Classification

### Global Before Guard

```ts
const removeGuard = router.beforeEach((to, from, next) => {
  // Permission validation, login check, analytics, etc.
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
  } else {
    next()
  }
})

// Remove guard
removeGuard()
```

### Global Resolve Guard

Executes after `beforeEach` and `beforeEnter`, commonly used to wait for async data loading to complete:

```ts
router.beforeResolve(async (to) => {
  if (to.meta.preload) {
    await store.preloadData(to.meta.preload)
  }
  return true
})
```

### Global After Hook

Executes after navigation completes, **does not accept `next` parameter**, cannot change navigation flow:

```ts
router.afterEach((to, from) => {
  // Set title
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
  // Page analytics
  trackPageView(to.path)
})
```

### Route Exclusive Guard

Configured via `RouteConfig.beforeEnter`, only takes effect for that route:

```ts
const routes = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    beforeEnter: (to, from, next) => {
      if (hasRole('admin')) next()
      else next({ name: '403' })
    }
  }
]
```

See [RouteConfig.beforeEnter](./type-route-config#beforeenter).

## Execution Order

The guard execution order for a complete navigation:

```
1. beforeEach (global before guard, in registration order)
   ↓
2. beforeEnter (route exclusive guard, in array order)
   ↓
3. beforeResolve (global resolve guard, in registration order)
   ↓
4. Navigation confirmed, execute uni native jump
   ↓
5. afterEach (global after hook, in registration order)
```

::: warning Behavior after guard abort
- Any guard returns `false` or throws an error: navigation aborts, subsequent guards don't execute
- Any guard returns a redirect: restarts the full flow (from `beforeEach`)
- `afterEach` is unaffected: only executes after navigation is confirmed, cannot abort
:::

## Promise Style Return Value

```ts
type GuardResult = void | boolean | RouteLocationRaw | {
  location: RouteLocationRaw
  mode?: NavigationRedirectMode
}
```

| Return Value | Equivalent to next() | Description |
| --- | --- | --- |
| `undefined` / `void` | `next()` | Allow |
| `true` | `next()` | Allow |
| `false` | `next(false)` | Abort |
| `RouteLocationRaw` | `next(RouteLocationRaw)` | Redirect (push) |
| `{ location, mode }` | `next(location, { mode })` | Redirect + mode control |

```ts
// Allow
router.beforeEach(() => {})

// Abort
router.beforeEach(() => false)

// Redirect (push)
router.beforeEach(() => ({ name: 'login' }))

// Redirect (replace)
router.beforeEach(() => ({
  location: { name: 'login' },
  mode: 'replace'
}))
```

## Practical Examples

### Login Validation

```ts
router.beforeEach((to, from) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // Redirect to login page, use replace to avoid returning to protected page
    return {
      location: { name: 'login', query: { redirect: to.fullPath } },
      mode: 'replace'
    }
  }

  return true
})
```

### Permission Validation

```ts
// Type augmentation
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

router.beforeEach((to) => {
  if (to.meta.roles) {
    const userRoles = getUserRoles()
    if (!to.meta.roles.some(r => userRoles.includes(r))) {
      uni.showToast({ title: 'No permission', icon: 'none' })
      return false
    }
  }
  return true
})
```

### Async Data Preloading

```ts
router.beforeResolve(async (to) => {
  if (to.name === 'detail') {
    try {
      await store.fetchDetail(to.query.id)
    } catch (err) {
      uni.showToast({ title: 'Load failed', icon: 'none' })
      return false
    }
  }
  return true
})
```

### Page Analytics

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    trackName?: string
  }
}

router.afterEach((to, from) => {
  if (to.meta.trackName) {
    trackPageView(to.meta.trackName, {
      from: from.path,
      to: to.path,
      duration: Date.now() - pageStartTime
    })
  }
  pageStartTime = Date.now()
})
```

### Dynamic Title

```ts
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  uni.setNavigationBarTitle({ title: title || 'Default Title' })
})
```

### Prevent Duplicate Navigation

```ts
let isNavigating = false

router.beforeEach((to, from, next) => {
  if (isNavigating) {
    next(false)
    return
  }
  isNavigating = true
  next()
})

router.afterEach(() => {
  isNavigating = false
})
```

## FAQ

### What happens if I forget to call next()?

After the guard times out (default 10 seconds, configurable via `guardTimeout`), it automatically aborts navigation and outputs a warning:

```
[uni-router] Guard timeout after 10000ms, navigation aborted
```

::: tip Solutions
- Use Promise style to avoid forgetting to call `next()`
- Adjust `guardTimeout` for async operations
- Check that all branches in the guard call `next()`
:::

### Can I access the component instance in a guard?

- `beforeEach` / `beforeResolve`: **No**, the target component hasn't been created yet
- `afterEach`: **No**, but you can get the page instance via `getCurrentPages()`
- `beforeRouteEnter`: Can access via `next((vm) => {...})`

### What happens if an exception is thrown in a guard?

The exception will be caught by `router.onError` and the current navigation will be aborted:

```ts
router.onError((err, to, from) => {
  console.error('Navigation error:', err)
  uni.showToast({ title: 'Page load failed', icon: 'none' })
})

router.beforeEach(async (to) => {
  if (to.meta.requireAuth) {
    const user = await fetchUser()  // May throw network error
    if (!user) return { name: 'login' }
  }
  return true
})
```

## Next Steps

- [Route Guards Guide](../guide/guards) — In-depth explanation of guards
- [Router Instance](./router-instance) — Methods for registering guards
- [RouterError Type](./type-router-error) — Error handling
