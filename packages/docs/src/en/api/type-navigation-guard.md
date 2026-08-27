# NavigationGuard

Navigation guard function type, used to perform validation, redirection, analytics, and other logic before/after navigation occurs.

## Type Definition

```ts
type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | NavigationRedirect | Error | null

interface NavigationRedirect {
  location: RouteLocationRaw
  mode?: 'push' | 'replace' | 'relaunch'
}

type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => NavigationGuardReturn | Promise<NavigationGuardReturn>
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `to` | `RouteLocationNormalized` | The target route being navigated to |
| `from` | `RouteLocationNormalized` | The current route being navigated away from |

### Return Value

```ts
// Return a value directly, the router handles it automatically
router.beforeEach(async (to, from) => {
  if (isLoggedIn()) return true
  return { name: 'login' }
})
```

## Guard Type Classification

### Global Before Guard

```ts
const removeGuard = router.beforeEach((to, from) => {
  // Permission validation, login check, analytics, etc.
  if (to.meta.requireAuth && !isLoggedIn()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
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

Executes after navigation completes, **cannot change navigation flow**:

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
    beforeEnter: (to, from) => {
      if (hasRole('admin')) return true
      return { name: '403' }
    }
  }
]
```

See [RouteConfig.beforeEnter](./type-route-config#beforeenter).

### Component-level Leave Guard

```ts
type RouteLeaveGuard = (
  to: RouteLocation,
  from: RouteLocation,
) => NavigationGuardReturn | Promise<NavigationGuardReturn>
```

Registered via `onBeforeRouteLeave(fn)` in `<script setup>`, automatically removed when the component is unmounted:

```ts
import { onBeforeRouteLeave } from '@meng-xi/uni-router'

// In <script setup>
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges()) {
    uni.showModal({
      title: 'Confirm',
      content: 'You have unsaved changes. Leave?',
      success: (res) => {
        if (res.confirm) return true
      }
    })
    return false
  }
  return true
})
```

### Back Guard

Registered via `router.onBeforeBack`, executed when a **back operation** is triggered (App physical back / navigation-bar back / `uni.navigateBack`, H5 browser back / back gesture, `router.back()`):

```ts
type BackGuardReturn = boolean | void | Promise<boolean | void>

type BackGuard = (to: RouteLocation, from: RouteLocation) => BackGuardReturn
```

- Return `false` to block back; `true` / `undefined` to allow
- Supports async (Promise)
- After the back guard passes, the `beforeEach → beforeResolve` chain is reused

```ts
router.onBeforeBack((to, from) => {
  if (hasUnsavedChanges()) return false // Block back
  // return undefined or true to allow
})

// Remove the guard
const remove = router.onBeforeBack(guard)
remove()
```

::: tip Platform Support
App wires the back guard via `onBackPress`, H5 via the `popstate` event; mini-program native back (capsule/physical key/swipe) cannot be intercepted. For iOS swipe, pair with `app.setSideSlipGesture('none')` to disable the gesture. See [Guards - Back Guard](../guide/guards#back-guard-onbeforeback).
:::

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

For back operations (physical back / browser back / `router.back()`), the order is `onBeforeBack → beforeEach → beforeResolve → uni.navigateBack → afterEach`, i.e. the back guard runs before the global before guards.

::: warning Behavior after guard abort
- Any guard returns `false` or throws an error: navigation aborts, subsequent guards don't execute
- Any guard returns a redirect: restarts the full flow (from `beforeEach`)
- `afterEach` is unaffected: only executes after navigation is confirmed, cannot abort
:::

## Controllable Redirect

By returning a `{ location, mode }` object, you can simultaneously specify the redirect target and the navigation method used for the redirect:

```ts
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Use replace to go to login page, avoiding the login page staying in the page stack
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  }
})
```

### mode Options

| mode | uni API | Use Case |
| --- | --- | --- |
| `'push'` | `uni.navigateTo` | Need to return to original page after login, keep target page in stack |
| `'replace'` | `uni.redirectTo` | Replace current page, no history (e.g. login page) |
| `'relaunch'` | `uni.reLaunch` | Clear stack (e.g. return home on insufficient permissions) |

### Behavior Rules

- Explicit `mode` takes priority over the original navigation method
- When `mode` is not specified, the original navigation method is used (`back` falls back to `relaunch`)
- `location` supports path strings, path objects, or named objects

## Promise Style Return Value

```ts
type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | NavigationRedirect | Error | null
```

| Return Value | Description |
| --- | --- |
| `undefined` / `void` | Allow |
| `null` | Allow |
| `true` | Allow |
| `false` | Abort |
| `RouteLocationRaw` | Redirect (uses original navigation method) |
| `NavigationRedirect` | Redirect and specify navigation method |
| `Error` | Throw error, abort navigation |

```ts
// Allow
router.beforeEach(() => {})

// Abort
router.beforeEach(() => false)

// Redirect (uses original navigation method)
router.beforeEach(() => ({ name: 'login' }))

// Redirect (replace method)
router.beforeEach(() => ({ location: { name: 'login' }, mode: 'replace' }))

// Throw error
router.beforeEach(() => {
  return new Error('Insufficient permissions')
})
```

## Practical Examples

### Login Validation

```ts
router.beforeEach((to, from) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // Redirect to login page, use replace to avoid returning to protected page
    return { name: 'login', query: { redirect: to.fullPath } }
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

router.beforeEach((to, from) => {
  if (isNavigating) {
    return false
  }
  isNavigating = true
  return true
})

router.afterEach(() => {
  isNavigating = false
})
```

## FAQ

### Can I access the component instance in a guard?

- `beforeEach` / `beforeResolve`: **No**, the target component hasn't been created yet
- `afterEach`: **No**, but you can get the page instance via `getCurrentPages()`
- Component-level `onBeforeRouteLeave`: **No**, the component instance is still active but the guard is called before the navigation completes

> **Note**: `beforeRouteEnter` is not supported. Use `onBeforeRouteLeave` for component-level leave guard, or use global guards for enter logic.

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