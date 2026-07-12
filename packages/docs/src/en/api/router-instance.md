# Router Instance

The router instance returned by `createRouter()`, providing route navigation, guard registration, and state query capabilities. This chapter lists all available properties and methods.

## Properties

### currentRoute

- **Type**: `Readonly<RouteLocation>`
- **Description**: Current route location (read-only). Reflects the route state the router is currently in

```ts
router.currentRoute.path       // '/pages/about/about'
router.currentRoute.query      // { id: '1' }
router.currentRoute.params     // { info: {...} }
router.currentRoute.meta       // { title: 'About', requireAuth: true }
router.currentRoute.fullPath   // '/pages/about/about?id=1'
router.currentRoute.name       // 'about'
```

::: tip Auto Sync
The router registers a global mixin in `install()` that automatically calls `syncRoute()` in each page's `onShow` to sync state. `currentRoute` is automatically updated on physical back button, browser back, etc., **no manual call needed**. You only need to manually call `syncRoute()` if you need to access route info in lifecycles earlier than `onShow` (e.g., `onLoad`). See [syncRoute()](#syncroute).
:::

## Navigation Methods

### push()

Navigate to a new page, pushing a new page onto the page stack.

```ts
push(location: RouteLocationRaw): Promise<NavigationResult>
```

- Regular page → `uni.navigateTo`
- TabBar page (`meta.isTab: true`) → `uni.switchTab`
- Duplicate navigation (same path, name, and query) throws `NAVIGATION_DUPLICATED`
- Returns `NavigationResult` (extends `RouteLocation`), includes optional `eventChannel` for page communication

```ts
// Path string
await router.push('pages/about/about')

// Path object + query params
await router.push({ path: 'pages/about/about', query: { id: '1' } })

// Named route (recommended)
await router.push({ name: 'about', query: { id: '1' } })

// Use params to pass complex data
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123, info: { name: 'Tom' } }
})

// Use EventChannel for page communication
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: {
    update(data) { console.log('Received update:', data) }
  }
})
eventChannel.emit('init', { message: 'Init data' })
```

::: info NavigationResult backward compatibility
`NavigationResult` extends `RouteLocation`, so existing code like `const route = await router.push(...)` works without modification. `eventChannel` is available by default in `push` mode; `replace` / `relaunch` also return `NavigationResult`, but `eventChannel` is `undefined` by default—it requires `useUniEventChannel: true` to enable built-in channel communication.
:::

::: warning TabBar page limitations
When the target route has `meta.isTab: true`, `push` uses `uni.switchTab`, and `query` / `animation` / `events` are all ignored. To pass parameters to a TabBar page, use `params`.
:::

See [Route Navigation](../guide/navigation#push-stack-navigation).

### replace()

Replace the current page without increasing stack depth. Commonly used to replace the login page after login, or replace a form page after form submission.

```ts
replace(location: RouteLocationRaw): Promise<NavigationResult>
```

- Regular page → `uni.redirectTo`
- TabBar page → `uni.switchTab`
- **No duplicate navigation detection** (can replace to the current page, useful for refresh)
- Returns `NavigationResult`, but `eventChannel` is `undefined` by default (`redirectTo` doesn't support native communication); with `useUniEventChannel: true`, bidirectional communication via the built-in channel is available

```ts
// Replace login page after successful login
await router.replace({ name: 'home' })

// Replace with detail page after form submission
await router.replace({ path: 'pages/detail/detail', query: { id: result.id } })

// With useUniEventChannel enabled, replace can also communicate with the target page
const { eventChannel } = await router.replace({
  name: 'detail',
  params: { id: 123 },
  events: { ready(data) { console.log('Ready:', data) } }
})
eventChannel.emit('init', { source: 'replace' })
```

::: tip When to use replace instead of push
- After successful login: avoid leaving the login page in the stack
- After form submission: avoid users going back to the form and resubmitting
- Redirect scenarios: `next(location, { mode: 'replace' })` in guards
:::

### relaunch()

Close all pages and open the target page, resetting the entire page stack.

```ts
relaunch(location: RouteLocationRaw): Promise<NavigationResult>
```

- Regular page → `uni.reLaunch`
- TabBar page → `uni.switchTab`
- **No duplicate navigation detection** (in stack-clearing scenarios the target page may be the current page)
- `uni.reLaunch` does not support animation parameters; a warning is output when provided
- Returns `NavigationResult`, with `eventChannel` `undefined` by default; with `useUniEventChannel: true`, bidirectional communication via the built-in channel is available

```ts
// Logout
await router.relaunch({ name: 'login' })

// Return to home from a deep page
await router.relaunch({ name: 'home' })

// With redirect parameter
await router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: tip When to use relaunch
- Logout: clear all pages, users cannot go back to protected pages
- Return to home from deep pages: better UX than multiple `back()` calls
- Insufficient permissions: clear stack back to home, preventing users from going back to unauthorized pages
:::

### back()

Go back to the previous page or multiple pages. This is the only "back" operation that executes the full guard chain.

```ts
back(delta?: number, animation?: NavigationAnimation): Promise<RouteLocation>
```

- **delta**: Number of pages to go back, defaults to `1`
- **animation**: Navigation animation (App only), overrides `meta.animation`. Falls back to the target page's `meta.animation` when not specified
- Executes `beforeEach` → `beforeResolve` guard chain; guards can abort or redirect the back operation
- Throws `NavigationFailure` (`NAVIGATION_CANCELLED`) when page stack is insufficient
- Throws `NavigationFailure` when guards abort the navigation
- Returns the synchronized current route location, allowing the caller to get the target page info

```ts
// Go back one page
await router.back()

// Go back two pages
await router.back(2)

// Custom animation
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

::: warning Physical back button cannot be intercepted
`back()` only intercepts **programmatic** calls. Physical back button (Android), browser back (H5), and mini-program top-left back **directly trigger native `navigateBack`**, bypassing the router, so guards cannot intercept them.

Mitigation:
1. The router registers a global mixin in `install()` that automatically calls `router.syncRoute()` in each page's `onShow` to sync state (no manual call needed)
2. Do post-processing in `onRouteChange`
3. On App, listen to `onBackPress` to intercept the physical back button
:::

## Guard Registration Methods

### beforeEach()

Register a global before guard, executed before each navigation.

```ts
beforeEach(guard: NavigationGuard): () => void
```

- **Returns**: A function to remove this guard

```ts
const remove = router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// Remove when no longer needed
remove()
```

::: tip Guard execution order
Multiple guards of the same type execute in **registration order**. If any guard aborts or redirects, subsequent guards do not execute.
:::

See [Route Guards](../guide/guards).

### beforeResolve()

Register a global resolve guard, executed after all before guards and route-specific guards complete.

```ts
beforeResolve(guard: NavigationGuard): () => void
```

```ts
router.beforeResolve(async (to, from, next) => {
  // All before checks have passed, safe to prefetch data
  if (to.name === 'detail') {
    await store.fetchDetail(to.query.id)
  }
  next()
})
```

::: tip beforeResolve vs beforeEach
`beforeResolve` runs after `beforeEach` and `beforeEnter`, suitable for "all guards agreed" final logic like data prefetching. The only difference from `beforeEach` is execution timing.
:::

### afterEach()

Register a global after hook, executed after navigation completes.

```ts
afterEach(guard: PostNavigationGuard): () => void
```

```ts
router.afterEach((to, from) => {
  // Set page title
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
  // Analytics tracking
  trackPageView(to.path, from.path)
})
```

::: warning Scenarios where afterEach is not triggered
`afterEach` is only triggered after a **complete navigation** (through before guards). The following scenarios **do not trigger** `afterEach`:

1. State sync via `syncRoute()` / `syncCurrentRoute()`
2. Physical back button, browser back (bypass the router)

To listen to all route changes (including state sync), use [`onRouteChange()`](#onroutechange).
:::

## Route Query Methods

### getRoutes()

Get all registered route configurations.

```ts
getRoutes(): RouteConfig[]
```

- **Returns**: Shallow copy of the route config array

```ts
const routes = router.getRoutes()
console.log(routes.map(r => r.name))
// ['home', 'about', 'user', 'login']
```

### hasRoute()

Check if a route with the given name exists.

```ts
hasRoute(name: string): boolean
```

```ts
if (router.hasRoute('admin')) {
  await router.push({ name: 'admin' })
} else {
  uni.showToast({ title: 'Page does not exist', icon: 'none' })
}
```

### resolve()

Resolve a route location to a full `RouteLocation` object **without executing navigation**.

```ts
resolve(location: RouteLocationRaw): RouteLocation
```

```ts
// Resolve named route
const location = router.resolve({ name: 'about', query: { id: '1' } })
console.log(location.fullPath) // '/pages/about/about?id=1'
console.log(location.path)     // '/pages/about/about'
console.log(location.meta)     // { requireAuth: true }

// Resolve path string
const loc = router.resolve('pages/about/about?id=1&tab=info')
console.log(loc.query) // { id: '1', tab: 'info' }
```

::: tip Use cases
- Generate navigation URLs (for `<navigator>` component or share links)
- Check if a route exists without navigating
- Get a route's meta info
:::

## State and Lifecycle

### isReady()

Wait for the router to finish initializing.

```ts
isReady(): Promise<void>
```

```ts
// In scenarios that require the router to be ready
await router.isReady()
console.log(router.currentRoute.path)
```

::: tip Ready timing
The router is marked as ready during `app.use(router)` installation, so `isReady()` callbacks execute after all plugins are installed, making it safe to use installed plugins (e.g., Pinia).
:::

::: warning Timeout protection
When `readyTimeout` is configured (non-zero), if the router fails to initialize within the timeout, this Promise will be rejected, preventing permanent hanging.
:::

### onRouteChange()

Register a route change listener to subscribe to route state changes.

```ts
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void
```

- **Returns**: A function to remove this listener

The listener is called when the route state changes (including navigation completion and state sync). Unlike `afterEach`, this method subscribes to route state changes and **does not participate in navigation flow control**.

```ts
const remove = router.onRouteChange((to, from) => {
  console.log('Route changed:', from.path, '→', to.path)

  // Distinguish complete navigation from state sync via to._synced
  if (to._synced) {
    console.log('State sync (not a complete navigation, possibly physical back)')
    handleBackNavigation(to, from)
  } else {
    console.log('Complete navigation')
    trackPageView(to.path)
  }
})

// Remove when no longer needed
remove()
```

::: tip onRouteChange vs afterEach
| Scenario | `afterEach` | `onRouteChange` |
| --- | --- | --- |
| Complete navigation (`push` / `replace`, etc.) | ✅ Triggered | ✅ Triggered |
| `syncRoute()` state sync | ❌ Not triggered | ✅ Triggered |
| `syncRoute()` in `onShow` after physical back | ❌ Not triggered | ✅ Triggered |
| Participates in navigation control (can abort) | ✅ | ❌ |

Use `onRouteChange` to listen to **all** route changes (including physical back).
:::

### onError()

Register a route error handler callback.

```ts
onError(handler: RouterOnError): () => void
```

```ts
router.onError((error, to, from) => {
  console.error(error.code, error.message)

  // Handle by error code
  switch (error.code) {
    case 'NAVIGATION_ABORTED':
      // Guard aborted, usually no action needed
      break
    case 'NAVIGATION_DUPLICATED':
      // Duplicate navigation, ignore
      break
    case 'NAVIGATION_API_ERROR':
      uni.showToast({ title: 'Navigation failed', icon: 'none' })
      console.error('Original error:', error.cause)
      break
  }
})
```

::: tip Global error handling
`onError` catches all errors during navigation, including guard exceptions and API call failures. It's recommended to register a global error handler in production for log reporting.
:::

### syncRoute()

Synchronize route state with the actual page stack.

```ts
syncRoute(): void
```

When a page is switched via browser back, physical back button, or other non-router methods, the router's `currentRoute` may be out of sync with the actual page. Calling this method reads the current page info from the uni-app page stack and updates the route state.

```ts
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// onLoad runs before onShow; if you need route info at this stage, sync manually
onLoad(() => {
  router.syncRoute()
  console.log(router.currentRoute.params)
})
```

::: tip Auto Synced by Default
The router registers `app.mixin({ onShow() { router.syncRoute() } })` in `install()`, which **automatically** calls `syncRoute()` in each page's `onShow`. The mixin hook runs before the component's own hooks, and `syncRoute` has built-in deduplication (skips if path + query match), so no redundant updates occur.

You usually **don't need** to call it manually in `onShow`. Manual sync is only needed in:

1. **Lifecycles earlier than `onShow`** (e.g., `onLoad`) where you need route info immediately
2. Scenarios where URL query was modified via non-router methods and needs syncing

Physical back button, browser back, direct `uni.navigateBack` calls (when `interceptUniApi` is not enabled), etc., are already covered by the global mixin.
:::

### guardRoute()

Runs the guard chain against the specified route (without performing actual navigation). Designed for **cold start** scenarios.

```ts
guardRoute(location?: RouteLocationRaw, options?: GuardRouteOptions): Promise<RouteLocation>
```

- **location**: Target route location; defaults to checking the current route if not provided
- **options**: Options, can pass `onAbort` callback to handle guard abort
- **Returns**: Resolves with the target route when guards pass; resolves after redirect when guards redirect; rejects on abort

### Cold Start Problem

When a user **directly enters** a page via H5 URL / mini-program scene value / App deeplink, the page is loaded directly by the uni-app framework, **bypassing router navigation**, and guards (`beforeEach` etc.) are not executed:

```
User accesses https://example.com/#/pages/about/about
  → uni-app directly loads the about page
  → Router guards are not executed (no router.push was called)
  → Unauthenticated user directly enters a requireAuth page
```

`guardRoute()` is used to run the guard chain for such already-loaded pages:

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
When `onLaunch` fires, the page stack is empty and `router.currentRoute` is still `START_LOCATION` (path `/`). If you call `guardRoute(undefined)` directly, guards will check `/` instead of the real entry page (e.g., `/pages/index/index`), causing guard logic based on `to.path` / `to.name` / `to.meta` to fail.

`options.path` is the real entry path provided by the uni-app framework (without leading `/`, needs manual prepending). It's available in `onLaunch` on H5 / mini-program / App platforms.
:::

### Guard Result Handling

| Guard Result | Behavior |
| --- | --- |
| Pass (`next()`) | No navigation, resolves with the target route |
| Redirect (`next(location)`) | Navigates to the redirect target using the guard-specified mode (default `relaunch`) |
| Abort (`next(false)`) | Calls the `onAbort` callback and rejects with `NavigationFailure` |

::: warning Cold start cannot truly "block entry"
In cold start scenarios the page is already loaded, so `guardRoute()` cannot truly prevent the page from displaying. When a guard aborts, using the `onAbort` callback to execute `router.relaunch()` to navigate to a safe page is the recommended approach.
:::

::: tip Difference from syncRoute
- `syncRoute()`: Only syncs `currentRoute` state, **does not run guards**
- `guardRoute()`: **Runs the guard chain** against the current route, for cold start re-checking

Both can be used together: `syncRoute` for state sync after physical back, `guardRoute` for guard re-execution during cold start.
:::

### hasPlugin()

Check if a specified plugin is registered.

**Type**

```ts
hasPlugin(name: string): boolean
```

**Parameters**

- `name` — Plugin name (corresponding to `RouterPlugin.name`). Built-in plugin names: `'params'`, `'animation'`, `'channel'`, `'interceptor'`

**Return Value**

- `true` — Plugin is registered
- `false` — Plugin is not registered

**Example**

```ts
if (router.hasPlugin('params')) {
  await router.push({ path: '/detail', params: { id: 123 } })
}

if (router.hasPlugin('animation')) {
  await router.back(1, { animation: { type: 'slide-out-right' } })
}
```

**Notes**

- Using a plugin's feature without registering it will throw a `PLUGIN_REQUIRED` error
- Can be called in components via `useRouter().hasPlugin()`
- See [Plugin System](../guide/plugins) for details

## Installation Method

### install()

Install the router to a Vue app instance (called internally by `app.use(router)`, usually no need to call manually).

```ts
install(app: App): void
```

The installation registers the following:

- **`$router`** — Global property, accessible via `this.$router`
- **`$route`** — Global property (computed), accessible via `this.$route` for current route location
- **provide** — Injects the router instance via `provide(ROUTER_SYMBOL, router)`, enabling `useRouter()` / `useRoute()`
- **Global mixin** — Injects an `onShow` hook that automatically calls `router.syncRoute()` in each page's `onShow` to sync route state (mixin hook runs before the component's own hooks, `syncRoute` has built-in deduplication)
- **markReady** — Marks the router as ready, resolving all pending `isReady()` Promises

## Method Overview

| Method | Purpose | Return Value |
| --- | --- | --- |
| `push()` | Stack navigation | `Promise<NavigationResult>` |
| `replace()` | Replace current page | `Promise<NavigationResult>` |
| `relaunch()` | Clear stack then push | `Promise<NavigationResult>` |
| `back()` | Go back | `Promise<RouteLocation>` |
| `beforeEach()` | Register before guard | Remove function |
| `beforeResolve()` | Register resolve guard | Remove function |
| `afterEach()` | Register after hook | Remove function |
| `getRoutes()` | Get all routes | `RouteConfig[]` |
| `hasRoute()` | Check route exists | `boolean` |
| `resolve()` | Resolve route location | `RouteLocation` |
| `isReady()` | Wait for ready | `Promise<void>` |
| `onRouteChange()` | Listen to route changes | Remove function |
| `onError()` | Register error handler | Remove function |
| `syncRoute()` | Sync state | `void` |
| `guardRoute()` | Cold start guard check | `Promise<RouteLocation>` |
| `hasPlugin()` | Check plugin registered | `boolean` |
| `install()` | Install to Vue | `void` |

## Next Steps

- [useRouter()](./use-router) — Get the router instance in components
- [Route Navigation](../guide/navigation) — Deep dive into the four navigation modes
- [Route Guards](../guide/guards) — Guard mechanism and practical patterns
