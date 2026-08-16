# Route Guards

Route guards are Uni Router's core capability, allowing you to insert custom logic during navigation: authentication, logging, data preloading, leave confirmation, etc. This chapter dives deep into the guard execution mechanism, the return-value pattern (recommended), and the legacy `next()` callback pattern (deprecated).

::: tip v2.1.0 Changes
Since v2.1.0, guards fully support the **return-value pattern** (consistent with Vue Router 4.x), controlling navigation behavior through return values. The legacy `next()` callback pattern remains compatible but is marked as deprecated. New code should use the return-value pattern.
:::

## Guard Overview

Uni Router provides four guards, in execution order:

```
Navigation triggered
  │
  ├─ 1. beforeEach        Global pre guard (multiple allowed)
  │     └─ Can abort / redirect / pass
  │
  ├─ 2. beforeEnter       Route-specific guard (configured in RouteConfig)
  │     └─ Can abort / redirect / pass
  │
  ├─ 3. beforeResolve     Global resolve guard (multiple allowed)
  │     └─ Can abort / redirect / pass
  │
  ├─ 4. uni navigation API call  navigateTo / redirectTo / ...
  │
  └─ 5. afterEach         Global post hook (multiple allowed)
        └─ Observation only, cannot change navigation result
```

### Guard Purposes

| Guard | Registration | Typical Scenarios |
| --- | --- | --- |
| `beforeEach` | `router.beforeEach(fn)` | Auth check, permission check, global logging |
| `beforeEnter` | `RouteConfig.beforeEnter` | Route-specific validation (like reading specific data) |
| `beforeResolve` | `router.beforeResolve(fn)` | Final confirmation after data preload completes |
| `afterEach` | `router.afterEach(fn)` | Set title, analytics, cleanup state, receive failure info |

::: tip beforeResolve's Purpose
`beforeResolve` executes after `beforeEnter`, when all pre-validation has passed. Suitable for "after all guards agree" final logic, like confirming data is fully loaded. Its difference from `beforeEach` is only in execution timing.
:::

## Registering Guards

### Global Guards

```ts
const router = createRouter({ routes })

// Pre guard (return-value pattern, recommended)
const removeBefore = router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    return { name: 'login' }  // redirect
  }
  // Return undefined or true to proceed
})

// Resolve guard (return-value pattern)
router.beforeResolve(async (to) => {
  // After all pre guards pass, preload data
  if (to.name === 'detail') {
    await store.fetchDetail(to.query.id)
  }
  // No return value = proceed
})

// Post hook (receives failure parameter)
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('Navigation failed:', failure.message)
    return
  }
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})

// Remove guard
removeBefore()
```

### Route-Specific Guards

```ts
const routes = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: { requireAdmin: true },
    beforeEnter: (to, from) => {
      if (user.role === 'admin') return true  // proceed
      return { name: '403' }  // redirect
    }
  },
  {
    path: 'pages/edit/edit',
    name: 'edit',
    // Supports array form
    beforeEnter: [
      checkAuth,
      checkPermission,
      checkLockStatus
    ]
  }
]
```

::: tip Guard Arrays
`beforeEnter` supports passing an array, executing in order. If any guard aborts or redirects, subsequent guards won't execute.
:::

## Guard Return Values

The return-value pattern is the recommended guard style since v2.1.0. Guards control navigation behavior through return values, no need to call `next()` callback.

### 1. Pass: `return undefined` / `return true`

```ts
router.beforeEach((to, from) => {
  return true // Pass, continue to next guard
})

// No return also means pass
router.beforeEach((to, from) => {
  // Default: pass
})
```

### 2. Abort: `return false`

```ts
router.beforeEach((to, from) => {
  if (isOffline()) {
    uni.showToast({ title: 'Network unavailable', icon: 'none' })
    return false // Abort navigation, stay on current page
  }
})
```

Abort throws `NavigationFailure` (`NAVIGATION_ABORTED`).

### 3. Redirect: `return RouteLocationRaw`

```ts
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Redirect to login page, carry original target for post-login return
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

Redirects **re-trigger the complete guard chain** (starting from `beforeEach`) and increment the redirect depth counter.

### 4. Throw Error to Abort

```ts
router.beforeEach((to, from) => {
  if (to.meta.requireAuth) {
    throw new Error('Permission denied')  // Cancel navigation (NAVIGATION_CANCELLED)
  }
})

// Or return an Error object
router.beforeEach((to, from) => {
  if (to.meta.requireAuth) {
    return new Error('Permission denied')  // Cancel navigation (NAVIGATION_CANCELLED)
  }
})
```

### Return Value Summary

| Return Value | Behavior |
| --- | --- |
| `undefined` / `void` / `true` | Pass, continue to next guard |
| `false` | Abort navigation (`NAVIGATION_ABORTED`) |
| `string` (e.g. `'/login'`) | Redirect to path |
| `RouteLocationRaw` (e.g. `{ name: 'login' }`) | Redirect to route location |
| `Error` object | Cancel navigation (`NAVIGATION_CANCELLED`) |
| Thrown exception | Cancel navigation (`NAVIGATION_CANCELLED`) |

## Controllable Redirect (v1.7.0+)

::: tip v1.7.0 New
This feature was introduced in v1.7.0. In previous versions, the redirect method was fixed to the original navigation method that triggered the guard.

In the return-value pattern, the redirect method is controlled via the `mode` field in the returned object.
:::

### Default Redirect Method

When `mode` is not specified, the redirect uses the original navigation method:

```ts
// Original navigation is push
await router.push({ name: 'protected' })
// In beforeEach: return { name: 'login' }
// → Redirect uses push method (navigateTo)

// Original navigation is replace
await router.replace({ name: 'protected' })
// In beforeEach: return { name: 'login' }
// → Redirect uses replace method (redirectTo)
```

::: warning back's Special Case
When the original navigation is `back`, the redirect cannot use `back` (target is not in the page stack), so it automatically falls back to `relaunch`.
:::

### Specifying Redirect Method

Explicitly specify via the `mode` field in the returned object:

```ts
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Use replace for login page, avoiding users returning to the protected page's intermediate state
    return { location: { name: 'login' }, mode: 'replace' }
  }
})
```

### mode Options

```ts
type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

| mode | uni API | Use Case |
| --- | --- | --- |
| `'push'` | `navigateTo` | Need to return to original page after login |
| `'replace'` | `redirectTo` | Replace current page, no history |
| `'relaunch'` | `reLaunch` | Clear stack (like returning home on insufficient permissions) |

### Practice: Choosing Login Redirect Method

```ts
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    if (from.name === 'login') {
      // Already on login page without permissions, use replace to avoid stack buildup
      return false
    }
    // Use replace to go to login page, then replace back to target after login success
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  }
})

// After login success
async function onLoginSuccess(redirect: string) {
  // Use replace to return to original page, avoiding login page staying in stack
  await router.replace(redirect)
}
```

### Practice: Clear Stack on Insufficient Permissions

```ts
router.beforeEach((to, from) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    // Insufficient permissions, clear stack and return home
    return { location: { name: 'home' }, mode: 'relaunch' }
  }
})
```

## Async Guards

Guards support `async` functions and returning Promises:

```ts
router.beforeEach(async (to, from) => {
  // Async validate token validity
  const valid = await checkToken()
  if (!valid) {
    return { name: 'login' }  // Redirect to login page
  }
  // Pass
})
```

### Promise Reject Aborts Navigation

```ts
router.beforeEach(async (to, from) => {
  try {
    await fetchUserProfile()
    // Pass
  } catch (err) {
    // reject will abort navigation (NAVIGATION_CANCELLED)
    throw err
  }
})
```

::: warning Return Value vs Exception
- `return false` → `NAVIGATION_ABORTED` (user actively aborts)
- `throw` / `reject` → `NAVIGATION_CANCELLED` (exception causes cancellation)

Recommend using `return false` for "active abort" and exceptions for "unexpected errors".
:::

## Timeout Protection

Guards may get stuck due to async operations (like network requests not responding). Uni Router provides timeout protection:

```ts
const router = createRouter({
  routes,
  guardTimeout: 10000 // Default 10 seconds
})
```

```
Guard execution
  → Doesn't return a result or throw within 10 seconds
  → Outputs warning: "Navigation guard did not resolve within 10s"
  → Auto-aborts navigation (NAVIGATION_CANCELLED)
```

::: tip Adjust Timeout
Increase timeout when guards have time-consuming requests:

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 seconds
})
```

Set to `0` to disable timeout protection (not recommended, may cause navigation to hang permanently).
:::

## Guard Execution Details

### Execution Order

Multiple guards of the same type execute in registration order:

```ts
router.beforeEach(guard1) // Executes first
router.beforeEach(guard2) // Executes second
router.beforeEach(guard3) // Executes last
```

```
guard1 → guard2 → guard3 → beforeEnter → beforeResolve1 → beforeResolve2 → API
```

### Short-Circuit Effect of Abort/Redirect

If any guard aborts or redirects, **subsequent guards won't execute**:

```ts
router.beforeEach((to, from) => {
  return false // Abort
})

router.beforeEach((to, from) => {
  console.log('Will not execute')
})
```

### Redirect Re-triggers Guard Chain

```ts
router.beforeEach((to, from) => {
  if (to.name === 'a') {
    return { name: 'b' } // Redirect to b
  }
})

router.beforeEach((to, from) => {
  // When redirecting to b, this guard executes again
  console.log(to.name) // 'b'
})
```

```
push(a) → beforeEach[1] redirects to b
        → beforeEach[1] executes again (to=b) → pass
        → beforeEach[2] executes (to=b) → pass
        → ... → navigateTo(b)
```

::: warning Avoid Infinite Redirects
Redirect depth limit is 10. A→B→A→B... loop will throw `NAVIGATION_CANCELLED` after the 10th time. Be sure to add termination conditions in redirect logic.
:::

## afterEach Post Hooks

`afterEach` executes after navigation completes and **cannot change the navigation result** (doesn't accept `next` parameter), but receives a third `failure` parameter for navigation failure info:

```ts
router.afterEach((to, from, failure) => {
  if (failure) {
    // Log error on navigation failure
    console.error('Navigation failed:', failure.message)
    return
  }

  // Set page title
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }

  // Analytics
  trackPageView(to.path, from.path)
})
```

### Scenarios Where afterEach Doesn't Trigger

::: warning State Sync Doesn't Trigger afterEach
`afterEach` only triggers after **complete navigation** (through pre guards) completes. The following scenarios **don't trigger** `afterEach`:

1. State sync from `syncRoute()` / `syncCurrentRoute()`
2. Physical back button, browser back (bypass router)

To listen for all route changes (including state sync), use `onRouteChange`.
:::

```ts
router.onRouteChange((to, from) => {
  // Both complete navigation and state sync trigger
  if (to._synced) {
    console.log('State sync (non-complete navigation)')
  }
})
```

## Practice Patterns

### Pattern 1: Auth Check

```ts
// Global pre guard
router.beforeEach((to, from) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // Not logged in → go to login page, replace to avoid returning to protected page
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  }
  if (to.name === 'login' && isLoggedIn) {
    // Already logged in accessing login page → go to home
    return { location: { name: 'home' }, mode: 'replace' }
  }
  // Pass
})
```

### Pattern 2: Permission Control

```ts
// Extend RouteMeta
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

router.beforeEach((to, from) => {
  const userRoles = getUserRoles()

  if (to.meta.roles && !to.meta.roles.some(r => userRoles.includes(r))) {
    // Insufficient permissions → clear stack and return home
    return { location: { name: 'home' }, mode: 'relaunch' }
  }
})
```

### Pattern 3: Leave Confirmation

```ts
// Mark page as "dirty" state
const routes = [
  {
    path: 'pages/edit/edit',
    name: 'edit',
    meta: { dirty: false } // Dynamically modified at runtime
  }
]

router.beforeEach((to, from) => {
  if (from.meta.dirty) {
    // Leave confirmation needs async dialog, wrap with Promise
    return new Promise((resolve) => {
      uni.showModal({
        title: 'Notice',
        content: 'You have unsaved changes. Leave anyway?',
        success: (res) => {
          if (res.confirm) {
            from.meta.dirty = false // Reset
            resolve(true) // Pass
          } else {
            resolve(false) // Abort
          }
        }
      })
    })
  }
})
```

### Pattern 4: Data Preloading

```ts
// Preload in beforeResolve (all pre-validation has passed)
router.beforeResolve(async (to) => {
  try {
    switch (to.name) {
      case 'detail':
        await store.fetchDetail(to.query.id)
        break
      case 'list':
        await store.fetchList(to.queryInt('page', 1))
        break
    }
    // Pass
  } catch (err) {
    uni.showToast({ title: 'Load failed', icon: 'none' })
    return false // Data load failed, abort navigation
  }
})
```

### Pattern 5: Auto Page Title Setting

```ts
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    uni.setNavigationBarTitle({ title })
  } else {
    uni.setNavigationBarTitle({ title: 'Default Title' })
  }
})
```

### Pattern 6: Route-Specific Validation

```ts
const routes = [
  {
    path: 'pages/order/order',
    name: 'order',
    beforeEnter: [
      // Must select address first
      (to, from) => {
        if (!store.selectedAddress) {
          uni.showToast({ title: 'Please select an address first', icon: 'none' })
          return false
        }
      },
      // Must have products
      (to, from) => {
        if (store.cart.length === 0) {
          return { name: 'cart' }
        }
      }
    ]
  }
]
```

## Guards and Physical Back Button

::: warning Core Limitation
Physical back button, browser back, mini-program top-left return **bypass the router**, guards cannot intercept them.

This is an inherent uni-app framework limitation, not a library shortcoming.
:::

### Solutions

**Solution 1: App listens to onBackPress**

```ts
// App only
onBackPress((options) => {
  if (pageState.dirty) {
    showConfirmDialog()
    return true // Block default back
  }
  return false // Allow back
})
```

**Solution 2: Auto Sync State in onShow**

The router registers a global mixin in `install()` that automatically calls `router.syncRoute()` in each page's `onShow` to sync `currentRoute` to the real page, **no manual call needed**:

```ts
// The router internally registers:
// app.mixin({ onShow() { router.syncRoute() } })

// So your pages usually don't need to manually sync; just read in onShow / onRouteChange
import { onShow } from '@dcloudio/uni-app'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

onShow(() => {
  // currentRoute has been auto-synced by the mixin
  console.log(route.value.path, route.value.params)
})
```

If you need route info in `onLoad` (earlier than `onShow`), you can manually call `router.syncRoute()` once.

**Solution 3: After-the-fact Handling in onRouteChange**

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // State sync (may be triggered by physical back)
    handleBackNavigation(to, from)
  }
})
```

See [Platform Compatibility](./compatibility).

## Cold Start Guard Check

### Problem: Cold Start Bypasses Guards

When a user **directly enters** a page via the following methods, the page is loaded directly by the uni-app framework, **bypassing router navigation**, and guards (`beforeEach` etc.) are not executed:

| Scenario | Platform |
| --- | --- |
| Direct URL access | H5 |
| QR code / scene value | Mini-program |
| Deeplink / URL Scheme | App |

```
User accesses https://example.com/#/pages/about/about
  → uni-app directly loads the about page
  → Router guards are not executed (no router.push was called)
  → Unauthenticated user directly enters a requireAuth page
```

### Solution: guardRoute()

`router.guardRoute()` runs the guard chain against the current (or specified) route and decides whether to redirect based on guard results:

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch((options) => {
  router.isReady().then(() => {
    // At onLaunch, the page stack may be empty (Page.onLoad hasn't fired yet),
    // and currentRoute is still START_LOCATION.
    // Pass the real entry path from launch options.path to guardRoute,
    // ensuring guards check the actual page.
    const launchPath = options?.path ? `/${options.path}` : undefined
    router.guardRoute(launchPath, {
      onAbort: (failure) => {
        // Guard aborted (e.g., not logged in), navigate to a safe page
        console.warn('Cold start guard aborted:', failure.code)
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

::: warning Must pass options.path
When `onLaunch` fires, the page stack is empty and `router.currentRoute` is still `START_LOCATION` (path `/`). If you call `guardRoute(undefined)` directly, guards will check `/` instead of the real entry page, causing guard logic based on `to.path` / `to.name` / `to.meta` to fail.

`options.path` is provided by the uni-app framework in `onLaunch` (without leading `/`, needs manual prepending). It's available on all platforms.
:::

### Guard Result Handling

| Guard Result | Behavior |
| --- | --- |
| Pass (`return undefined` / `return true`) | No navigation, resolves with the target route |
| Redirect (`return location`) | Navigates to the redirect target using the guard-specified mode (default `relaunch`) |
| Abort (`return false`) | Calls the `onAbort` callback and rejects with `NavigationFailure` |

::: warning Cold start cannot truly "block entry"
In cold start scenarios the page is already loaded, so `guardRoute()` cannot truly prevent the page from displaying. When a guard aborts, using the `onAbort` callback to execute `router.relaunch()` to navigate to a safe page is the recommended approach.
:::

### Difference from syncRoute

| Method | Purpose | Runs Guards |
| --- | --- | --- |
| `syncRoute()` | Syncs `currentRoute` to the real page stack state | No |
| `guardRoute()` | Runs the guard chain against the current route | Yes |

Both can be used together:

- `syncRoute`: State sync after physical back
- `guardRoute`: Guard re-execution during cold start

See [Router Instance - guardRoute()](../api/router-instance#guardroute) for details.

## Guard Type Definitions

```ts
// Guard return value type
type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | Error | null

// Pre guard (return-value pattern, recommended)
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  next?: NavigationGuardNext  // Deprecated, use return value for new code
) => NavigationGuardReturn | Promise<NavigationGuardReturn>

// next callback (deprecated)
type NavigationGuardNext = (
  to?: RouteLocationRaw | false,
  options?: NavigationGuardNextOptions
) => void

// next options (deprecated)
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode // 'push' | 'replace' | 'relaunch'
}

// Redirect mode
type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'

// Post hook (receives failure parameter)
type PostNavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  failure?: NavigationFailure | null
) => void
```

## Legacy next() Callback Pattern (Deprecated)

::: warning Compatibility Note
The `next()` callback pattern remains compatible in v2.1.0 but is marked as deprecated. New code should use the return-value pattern.

- Guard mode is auto-detected by parameter count: `(to, from, next)` three params → callback mode; `(to, from)` two params → return-value mode
- Mixing both patterns will trigger a warning in the console
:::

```ts
// Callback style (deprecated)
router.beforeEach((to, from, next) => {
  if (condition) {
    next({ name: 'login' })  // redirect
  } else {
    next()  // pass
  }
})

// With redirect options
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

### next() Behaviors

| Call | Behavior | Equivalent Return Value |
| --- | --- | --- |
| `next()` | Pass | `return undefined` / `return true` |
| `next(false)` | Abort (`NAVIGATION_ABORTED`) | `return false` |
| `next(location)` | Redirect | `return location` |
| `next(error)` | Cancel (`NAVIGATION_CANCELLED`) | `throw error` / `return error` |
| `next(location, { mode })` | Redirect + mode | `return { location, mode }` |

## Best Practices

### 1. Single Responsibility Guards

```ts
// ✅ Each guard does one thing
router.beforeEach(checkAuth)
router.beforeEach(checkPermission)
router.beforeEach(checkMaintenance)

// ❌ One guard does everything
router.beforeEach((to, from) => {
  // 100 lines of mixed logic...
})
```

### 2. Use Return-Value Pattern

```ts
// ✅ Recommended: return-value pattern, clean and concise
router.beforeEach(async (to, from) => {
  const ok = await check()
  if (!ok) return { name: 'login' }
})

// ⚠️ Deprecated: next callback pattern
router.beforeEach(async (to, from, next) => {
  const ok = await check()
  next(ok ? undefined : { name: 'login' })
})
```

### 3. Add Termination Conditions for Redirects

```ts
// ✅ Avoid loops
router.beforeEach((to, from) => {
  if (to.name === 'login' && isLoggedIn()) {
    return { name: 'home' } // Already logged in accessing login → go home
  }
  if (to.meta.requireAuth && !isLoggedIn()) {
    return { name: 'login' } // Not logged in accessing protected → go to login
  }
})
```

### 4. Put Data Preloading in beforeResolve

```ts
// ✅ Preload after pre-validation passes
router.beforeResolve(async (to) => {
  await preloadData(to)
})

// ❌ Putting in beforeEach blocks other guards
```

## Next Steps

- [Navigation Flow](./navigation-flow) — Where guards fit in the complete flow
- [Recipes](./recipes) — Complete business solutions
- [Interceptor Mechanism](./interceptor) — Principle of intercepting native APIs