# Route Guards

Route guards are Uni Router's core capability, allowing you to insert custom logic during navigation: authentication, logging, data preloading, leave confirmation, etc. This chapter dives deep into the guard execution mechanism, all behaviors of `next()`, and the controllable redirect introduced in v1.7.0.

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
| `afterEach` | `router.afterEach(fn)` | Set title, analytics, cleanup state |

::: tip beforeResolve's Purpose
`beforeResolve` executes after `beforeEnter`, when all pre-validation has passed. Suitable for "after all guards agree" final logic, like confirming data is fully loaded. Its difference from `beforeEach` is only in execution timing.
:::

## Registering Guards

### Global Guards

```ts
const router = createRouter({ routes })

// Pre guard
const removeBefore = router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// Resolve guard
router.beforeResolve(async (to, from, next) => {
  // After all pre guards pass, preload data
  if (to.name === 'detail') {
    await store.fetchDetail(to.query.id)
  }
  next()
})

// Post hook
router.afterEach((to, from) => {
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
    beforeEnter: (to, from, next) => {
      if (user.role === 'admin') next()
      else next({ name: '403' })
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

## All Behaviors of next()

`next` is the third parameter of the guard function and **must be called** to resolve the guard. It has three behaviors:

### 1. Pass: `next()` or `next(undefined)`

```ts
router.beforeEach((to, from, next) => {
  next() // Pass, continue to next guard
})
```

### 2. Abort: `next(false)`

```ts
router.beforeEach((to, from, next) => {
  if (isOffline()) {
    uni.showToast({ title: 'Network unavailable', icon: 'none' })
    next(false) // Abort navigation, stay on current page
  } else {
    next()
  }
})
```

Abort throws `NavigationFailure` (`NAVIGATION_ABORTED`).

### 3. Redirect: `next(location)`

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Redirect to login page, carry original target for post-login return
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

Redirects **re-trigger the complete guard chain** (starting from `beforeEach`) and increment the redirect depth counter.

## Controllable Redirect (v1.7.0+)

::: tip v1.7.0 New
This feature was introduced in v1.7.0. In previous versions, the redirect method was fixed to the original navigation method that triggered the guard.
:::

### Default Redirect Method

When `mode` is not specified, the redirect uses the original navigation method:

```ts
// Original navigation is push
await router.push({ name: 'protected' })
// In beforeEach: next({ name: 'login' })
// → Redirect uses push method (navigateTo)

// Original navigation is replace
await router.replace({ name: 'protected' })
// In beforeEach: next({ name: 'login' })
// → Redirect uses replace method (redirectTo)
```

::: warning back's Special Case
When the original navigation is `back`, the redirect cannot use `back` (target is not in the page stack), so it automatically falls back to `relaunch`.
:::

### Specifying Redirect Method

Explicitly specify via the second parameter `options.mode`:

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Use replace for login page, avoiding users returning to the protected page's intermediate state
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
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
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    if (from.name === 'login') {
      // Already on login page without permissions, use replace to avoid stack buildup
      next(false)
    } else {
      // Use replace to go to login page, then replace back to target after login success
      // This way users won't return to the "unauthenticated intermediate state"
      next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
    }
  } else {
    next()
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
router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    // Insufficient permissions, clear stack and return home
    next({ name: 'home' }, { mode: 'relaunch' })
  } else {
    next()
  }
})
```

## Async Guards

Guards support `async` functions and returning Promises:

```ts
router.beforeEach(async (to, from, next) => {
  // Async validate token validity
  const valid = await checkToken()
  if (!valid) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

### Promise Resolve Auto-Pass

If the guard is an async function and the Promise resolves **without calling next**, it auto-passes:

```ts
router.beforeEach(async (to, from, next) => {
  await preloadData(to)
  // Didn't call next, but Promise resolved → auto next()
})
```

::: warning Recommend Explicit next Call
While auto-pass is convenient, explicitly calling `next()` is more readable and avoids ambiguity in complex logic.
:::

### Promise Reject Aborts Navigation

```ts
router.beforeEach(async (to, from, next) => {
  try {
    await fetchUserProfile()
    next()
  } catch (err) {
    // reject will abort navigation (NAVIGATION_CANCELLED)
    throw err
  }
})
```

::: warning reject vs next(false)
- `next(false)` → `NAVIGATION_ABORTED` (user actively aborts)
- `throw` / `reject` → `NAVIGATION_CANCELLED` (exception causes cancellation)

Recommend using `next(false)` for "active abort" and exceptions for "unexpected errors".
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
  → Doesn't call next() or resolve/reject within 10 seconds
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
router.beforeEach((to, from, next) => {
  next(false) // Abort
})

router.beforeEach((to, from, next) => {
  console.log('Will not execute')
  next()
})
```

### Redirect Re-triggers Guard Chain

```ts
router.beforeEach((to, from, next) => {
  if (to.name === 'a') {
    next({ name: 'b' }) // Redirect to b
    return
  }
  next()
})

router.beforeEach((to, from, next) => {
  // When redirecting to b, this guard executes again
  console.log(to.name) // 'b'
  next()
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

`afterEach` executes after navigation completes and **cannot change the navigation result** (doesn't accept `next` parameter):

```ts
router.afterEach((to, from) => {
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
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // Not logged in → go to login page, replace to avoid returning to protected page
    next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
  } else if (to.name === 'login' && isLoggedIn) {
    // Already logged in accessing login page → go to home
    next({ name: 'home' }, { mode: 'replace' })
  } else {
    next()
  }
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

router.beforeEach((to, from, next) => {
  const userRoles = getUserRoles()

  if (to.meta.roles && !to.meta.roles.some(r => userRoles.includes(r))) {
    // Insufficient permissions → clear stack and return home
    next({ name: 'home' }, { mode: 'relaunch' })
  } else {
    next()
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

router.beforeEach((to, from, next) => {
  if (from.meta.dirty) {
    uni.showModal({
      title: 'Notice',
      content: 'You have unsaved changes. Leave anyway?',
      success: (res) => {
        if (res.confirm) {
          from.meta.dirty = false // Reset
          next()
        } else {
          next(false)
        }
      }
    })
  } else {
    next()
  }
})
```

### Pattern 4: Data Preloading

```ts
// Preload in beforeResolve (all pre-validation has passed)
router.beforeResolve(async (to, from, next) => {
  try {
    switch (to.name) {
      case 'detail':
        await store.fetchDetail(to.query.id)
        break
      case 'list':
        await store.fetchList(to.queryInt('page', 1))
        break
    }
    next()
  } catch (err) {
    uni.showToast({ title: 'Load failed', icon: 'none' })
    next(false) // Data load failed, abort navigation
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
      (to, from, next) => {
        if (!store.selectedAddress) {
          uni.showToast({ title: 'Please select an address first', icon: 'none' })
          next(false)
        } else {
          next()
        }
      },
      // Must have products
      (to, from, next) => {
        if (store.cart.length === 0) {
          next({ name: 'cart' })
        } else {
          next()
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

**Solution 2: Sync State in onShow**

```ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onShow(() => {
  router.syncRoute() // Sync currentRoute to real page
})
```

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

## Guard Type Definitions

```ts
// Pre guard
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  next: NavigationGuardNext
) => void | Promise<void>

// next callback
type NavigationGuardNext = (
  to?: RouteLocationRaw | false,
  options?: NavigationGuardNextOptions
) => void

// next options
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode // 'push' | 'replace' | 'relaunch'
}

// Post hook
type PostNavigationGuard = (
  to: RouteLocation,
  from: RouteLocation
) => void
```

## Best Practices

### 1. Single Responsibility Guards

```ts
// ✅ Each guard does one thing
router.beforeEach(checkAuth)
router.beforeEach(checkPermission)
router.beforeEach(checkMaintenance)

// ❌ One guard does everything
router.beforeEach((to, from, next) => {
  // 100 lines of mixed logic...
})
```

### 2. Explicitly Call next

```ts
// ✅ Clear
router.beforeEach(async (to, from, next) => {
  const ok = await check()
  next(ok ? undefined : { name: 'login' })
})

// ⚠️ Relies on auto-pass, poor readability
router.beforeEach(async (to, from) => {
  await check()
})
```

### 3. Add Termination Conditions for Redirects

```ts
// ✅ Avoid loops
router.beforeEach((to, from, next) => {
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }) // Already logged in accessing login → go home
  } else if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }) // Not logged in accessing protected → go to login
  } else {
    next()
  }
})
```

### 4. Put Data Preloading in beforeResolve

```ts
// ✅ Preload after pre-validation passes
router.beforeResolve(async (to, from, next) => {
  await preloadData(to)
  next()
})

// ❌ Putting in beforeEach blocks other guards
```

## Next Steps

- [Navigation Flow](./navigation-flow) — Where guards fit in the complete flow
- [Recipes](./recipes) — Complete business solutions
- [Interceptor Mechanism](./interceptor) — Principle of intercepting native APIs
