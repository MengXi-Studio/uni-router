# Interceptor Mechanism

Uni Router provides an optional `interceptUniApi` option to intercept native navigation APIs like `uni.navigateTo`, redirecting external direct calls to be handled by the router. This chapter explains the interceptor's working principle, applicable scenarios, and considerations.

## Why Need an Interceptor

### Problem Scenario

Without the interceptor enabled, directly calling uni native APIs **bypasses route guards**:

```ts
// Router configured with auth guard
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// ✅ Via router → guard takes effect
await router.push({ name: 'protected' })

// ❌ Direct uni API call → guard bypassed, jumps directly
uni.navigateTo({ url: '/pages/protected/protected' })
```

This is a hidden risk in team collaboration: a developer might habitually use `uni.navigateTo`, causing guards to be bypassed.

### Solution

After enabling `interceptUniApi`, all native navigation API calls are intercepted and redirected to the router:

```ts
const router = createRouter({
  routes,
  interceptUniApi: true // Enable interception
})

// Now both approaches are equivalent, guards take effect for both
await router.push({ name: 'protected' })
uni.navigateTo({ url: '/pages/protected/protected' }) // → forwarded to router.push
```

## Enabling and Configuration

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true  // default false
})
```

::: warning Disabled by Default
`interceptUniApi` defaults to `false`. This is for gradual adoption — you can first integrate the router without enabling the interceptor, gradually migrate `uni.navigateTo` to `router.push`, and then enable the interceptor as a "safety net" once confirmed.
:::

## Intercepted APIs

The interceptor covers 5 uni navigation APIs:

| uni API | Forwards To | Description |
| --- | --- | --- |
| `uni.navigateTo` | `router.push` | Stack navigation |
| `uni.redirectTo` | `router.replace` | Replace navigation |
| `uni.switchTab` | `router.push` | TabBar switch (router auto-detects) |
| `uni.reLaunch` | `router.relaunch` | Reset navigation |
| `uni.navigateBack` | `router.back` | Back navigation |

### Parameter Conversion

The interceptor parses uni API parameters and converts them to router-accepted format:

```ts
// uni.navigateTo({ url: '/pages/about/about?id=1', animationType: 'fade-in' })
// → router.push({ path: 'pages/about/about', query: { id: '1' }, animation: { type: 'fade-in' } })

// uni.navigateBack({ delta: 2, animationType: 'slide-out-right' })
// → router.back(2, { type: 'slide-out-right' })

// uni.navigateTo({ url: '/pages/detail/detail', events: { update: fn } })
// → router.push({ path: 'pages/detail/detail', events: { update: fn } })
```

## Working Principle

### uni.addInterceptor Mechanism

uni-app provides `uni.addInterceptor(api, interceptor)` API to insert interception logic before calling the target API:

```ts
uni.addInterceptor('navigateTo', {
  invoke(args) {
    // args is the call parameter
    // return args → allow original call
    // return false → block original call
    // modify args → allow with modifications
  }
})
```

Uni Router uses this mechanism to determine the call source in `invoke` and decide whether to allow it.

### Call Source Distinction

Core problem: The router itself also calls `uni.navigateTo` (in the `executeNavigation` phase). How to distinguish "router-initiated calls" from "external direct calls"?

**Solution: Counter Marker**

```ts
class InterceptorManager {
  private routerCallCount = 0

  // Mark before router calls uni API
  markRouterCall(): void {
    this.routerCallCount++
  }

  // Check in interceptor
  isRouterCall(): boolean {
    if (this.routerCallCount > 0) {
      this.routerCallCount--
      return true // Router initiated, allow
    }
    return false // External initiated, intercept
  }
}
```

**Flow Comparison**

```
Router-initiated call:
  router.push() → executeNavigation → navigateTo()
    → markRouterCall() (count: 0 → 1)
    → uni.navigateTo()
      → interceptor invoke
        → isRouterCall() → true (count: 1 → 0)
        → return args, allow
    → actually execute uni.navigateTo

External direct call:
  uni.navigateTo()
    → interceptor invoke
      → isRouterCall() → false (count: 0)
      → handleInterceptedNavigation() forward to router.push
      → return false, block
```

::: tip Why Counter Instead of Boolean
During concurrent navigation, `markRouterCall()` may be called multiple times consecutively. A counter correctly matches each call, avoiding markers being consumed incorrectly.
:::

### Double Insurance: Clear URL

```ts
invoke(args) {
  if (activeManager?.isRouterCall()) {
    return args // Router call, allow
  }
  // External call, forward to router
  const result = handleInterceptedNavigation(api, args)
  // Double insurance: clear URL
  if ('url' in args) args.url = ''
  return result // return false to block
}
```

Some low-version mini-program base libraries may **ignore the `false` returned by `invoke`** and continue executing the original API. Clearing `args.url` serves as double insurance — even if the base library ignores the return value, an empty URL will cause the original call to fail (won't navigate to a wrong page).

## Considerations

### 1. success / fail Callbacks Not Triggered

::: warning Callbacks Lost
After enabling the interceptor, the `success` / `fail` / `complete` callbacks of direct `uni.navigateTo()` calls **will not be triggered**.

Because the original call is blocked (returns `false`) and forwarded to the router. The router returns a Promise instead of callbacks.
:::

```ts
// ❌ success won't trigger
uni.navigateTo({
  url: '/pages/about/about',
  success: () => {
    console.log('Will not execute')
  }
})

// ✅ Use router's Promise
await router.push({ name: 'about' })
console.log('Navigation complete')
```

### 2. Single Instance Only

```ts
// ⚠️ Warning: Another router instance has already installed interceptors.
const router1 = createRouter({ routes: routes1, interceptUniApi: true })
const router2 = createRouter({ routes: routes2, interceptUniApi: true })
// router2 will replace router1's interceptors
```

Interceptors are global (`uni.addInterceptor` affects globally); only one router instance can have interceptors enabled at a time. Typically an application needs only one router instance, so this isn't an issue.

### 3. Platform Support

```ts
if (typeof uni.addInterceptor !== 'function') {
  console.warn('[uni-router] uni.addInterceptor is not available, interceptUniApi option will be ignored')
  return
}
```

`uni.addInterceptor` is available on mainstream platforms (App, H5, WeChat/Alipay/ByteDance/Baidu/QQ mini-programs). Very few platforms may not support it; in such cases the interceptor option is silently ignored.

### 4. Does Not Affect Router Internal Calls

After enabling the interceptor, the router's own `push` / `replace` / `relaunch` / `back` still work normally and won't be repeatedly intercepted (distinguished via `markRouterCall` marker).

### 5. Special Handling for switchTab

```ts
case 'switchTab': {
  const { path } = parseUniUrl(args.url || '')
  if (path) {
    router.push(path) // Forward to push, router auto-selects switchTab based on meta.isTab
  }
  break
}
```

External `uni.switchTab` calls are forwarded to `router.push`. The router will auto-select `switchTab` based on the target route's `meta.isTab`.

::: warning switchTab Query Loss
`uni.switchTab` itself doesn't support query. The interceptor parses the URL and extracts query, but since it ultimately still goes through `uni.switchTab`, the query is ignored. This is a uni-app limitation, not an interceptor issue.
:::

#### Differentiated Strategy for the H5 Platform

::: danger Key Difference
The "block + forward" logic above **only applies to mini-program platforms and the App platform**. On the H5 platform, `switchTab` cannot be synchronously blocked, or it will cause the TabBar component state to freeze.
:::

**Symptom**

On the H5 platform, if the interceptor returns `false` (synchronous block) for `uni.switchTab`, the TabBar component's internal "switching" state cannot be cleared. The behavior is:

- After clicking a TabBar menu item, **that item stays highlighted** and other menu items **can no longer be clicked**
- Subsequent click events are directly ignored by the runtime, leaving the app in a "frozen" state

**Root Cause**

On the H5 platform, TabBar is a runtime-managed component whose switching flow depends on the complete execution of the `uni.switchTab` call. Synchronously blocking the call interrupts the component's internal state machine, preventing the "switching" state from transitioning to the "completed" state.

> **About the App platform**: The App platform (both App-vue and App-nvue) runs its business code in the jscore/v8 logic layer, **not in a webview**, and does not have `window`/`document` objects. Its TabBar is a native component, behaving the same as mini-programs — it goes through the full "block + forward" flow with guards working normally.

**Solution: Allow + Sync State**

For the H5 platform, the interceptor adopts a differentiated strategy — instead of blocking the original call, it syncs the route state in the `success` callback:

```ts
function handleWebSwitchTab(args: Record<string, any>): Record<string, any> {
  const router = activeManager?.getRouter()
  if (!router) return args

  // Wrap success callback to sync route state after switchTab completes
  const originalSuccess = args.success
  args.success = function (res: any) {
    router.syncRoute() // Sync route state so reactive APIs like useRoute work properly
    if (typeof originalSuccess === 'function') {
      originalSuccess(res)
    }
  }

  return args // Allow the original call
}
```

Platform detection identifies the H5 platform via the existence of `window` / `document` objects:

```ts
function isWebPlatform(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
```

::: warning Guard Limitations on the H5 Platform
Since `switchTab` calls are allowed on the H5 platform, **external `uni.switchTab` does not go through the beforeEach guard**. This means:

- TabBar pages navigated via `uni.switchTab` will not trigger the guard's permission checks
- If TabBar pages require permission control, handle it in the page's `onShow` lifecycle

```ts
// TabBar page permission control example
onShow(() => {
  if (!isLoggedIn()) {
    router.replace({ name: 'login' })
  }
})
```

Other APIs (`navigateTo` / `redirectTo` / `reLaunch` / `navigateBack`) go through the complete interception + guard flow on all platforms and are not affected by this difference.
:::

## When to Enable

### Recommended Scenarios

- **Team collaboration**: Multi-person development, concerned someone might use `uni.navigateTo` to bypass guards
- **Legacy project migration**: Existing large amounts of `uni.navigateTo` calls that can't be migrated to `router.push` all at once
- **Third-party library calls**: UI libraries you use internally call `uni.navigateTo`

### Scenarios Where Not Needed

- **New projects**: Using `router.push` consistently from the start
- **Fully controllable**: Confirmed all navigation goes through the router
- **Avoid callback loss**: Lots of legacy code depending on `uni.navigateTo` callbacks

## Legacy Project Migration Strategy

### Phase 1: Integrate Router, Don't Enable Interceptor

```ts
const router = createRouter({
  routes: [...]
  // interceptUniApi: false (default)
})
```

Gradually migrate `uni.navigateTo` to `router.push`:

```ts
// Old code
uni.navigateTo({ url: '/pages/about/about?id=1' })

// After migration
await router.push({ path: 'pages/about/about', query: { id: '1' } })
```

### Phase 2: Enable Interceptor as Safety Net

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true // Enable, catch missed uni API calls
})
```

Now even missed `uni.navigateTo` calls will be intercepted and forwarded to the router.

### Phase 3: Handle Callback Migration

Migrate callback-dependent legacy code to Promises:

```ts
// Old code
uni.navigateTo({
  url: '/pages/about/about',
  success: () => { /* post-navigation logic */ },
  fail: (err) => { /* error handling */ }
})

// After migration
try {
  await router.push({ name: 'about' })
  // post-navigation logic
} catch (err) {
  // error handling
}
```

## Collaboration with Guards

After enabling the interceptor, all navigation (whether via router or uni API) goes through guards:

```
uni.navigateTo({ url: '/protected' })
  → interceptor intercepts
  → router.push({ path: 'protected' })
  → beforeEach guard
    → not logged in → next({ name: 'login' })
  → redirect to login
```

This ensures guards are **globally enforced**, regardless of navigation source.

## Interceptor Installation and Removal

### Installation

When `interceptUniApi: true`, automatically installed in the router constructor:

```ts
constructor(options: RouterOptions) {
  // ...
  if (this._interceptUniApi) {
    installInterceptors(this)
  }
}
```

### Removal

`removeInterceptors()` clears all interceptors and releases router references. Typically called when the application unloads (like HMR hot reload scenarios):

```ts
// HMR handling in vite.config.ts
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeInterceptors()
  })
}
```

::: tip HMR Scenario
In development, hot reload recreates the router instance. If old interceptors aren't removed, it causes the warning "Another router instance has already installed interceptors". Calling `removeInterceptors()` in `import.meta.hot.dispose` avoids this.
:::

## Complete Example

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
    { path: 'pages/login/login', name: 'login' }
  ],
  interceptUniApi: true // Enable interception
})

// Auth guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!uni.getStorageSync('token')
  if (to.meta.requireAuth && !isLoggedIn) {
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})

// The following three approaches are equivalent, guards take effect for all
// 1. Router API
await router.push({ name: 'about' })

// 2. uni.navigateTo (intercepted)
uni.navigateTo({ url: '/pages/about/about' })

// 3. RouterLink component
// <RouterLink to="pages/about/about">About</RouterLink>
```

## Next Steps

- [Navigation Flow](./navigation-flow) — Where the interceptor fits in the complete flow
- [Platform Compatibility](./compatibility) — Platform limitations
- [Recipes](./recipes) — Complete business solutions
