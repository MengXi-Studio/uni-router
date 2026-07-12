# Navigation

Route navigation is Uni Router's core capability. This chapter dives deep into the four navigation methods, their working principles, uni-app's underlying limitations, and how to leverage the library's features for special use cases.

## Four Navigation Methods Overview

| Method | Stack Operation | uni API | Duplicate Check | Animation | events | Return Value |
| --- | --- | --- | --- | --- | --- | --- |
| `push()` | Push +1 | `navigateTo` / `switchTab` | ✅ | ✅ | ✅ | `NavigationResult` |
| `replace()` | Replace top | `redirectTo` / `switchTab` | ❌ | ✅ | ⚠️¹ | `NavigationResult` |
| `relaunch()` | Clear then push | `reLaunch` / `switchTab` | ❌ | ❌ | ⚠️¹ | `NavigationResult` |
| `back()` | Pop -n | `navigateBack` | ❌ | ✅ | ❌ | `RouteLocation` |

> ¹ `events` not supported by default; with `useUniEventChannel: true` enabled, `replace` / `relaunch` also support page communication and the returned `eventChannel` is available.

> Features marked ✅ require registering the corresponding plugin: `animation` requires AnimationPlugin, `events` requires ChannelPlugin, `params` requires ParamsPlugin

::: tip TabBar Page Auto-Detection
When the target route's `meta.isTab` is `true`, `push` / `replace` / `relaunch` all automatically switch to `uni.switchTab`. You don't need to manually check—just declare `isTab` correctly in the route config.
:::

## push — Stack Navigation

`push` is the most common navigation method, pushing a new page onto the page stack.

```ts
router.push(location: RouteLocationRaw): Promise<NavigationResult>
```

### Basic Usage

```ts
// Path string
await router.push('pages/about/about')

// Path object + query params
await router.push({ path: 'pages/about/about', query: { id: '1' } })

// Named route (recommended, refactor-friendly)
await router.push({ name: 'about', query: { id: '1' } })

// String with query
await router.push('pages/about/about?id=1&tab=info')
```

### Return Value NavigationResult

`push` returns `NavigationResult`, which extends `RouteLocation` and additionally includes `eventChannel`:

```ts
const result = await router.push({ name: 'detail', query: { id: '1' } })
console.log(result.path)         // '/pages/detail/detail'
console.log(result.query.id)     // '1'
console.log(result.eventChannel) // EventChannel instance (push only)
```

::: info Backward Compatible
`NavigationResult` extends `RouteLocation`, so existing code `const route = await router.push(...)` works without modification.
:::

### Duplicate Navigation Detection

`push` checks if the target is exactly the same as the current position (path, name, query all match), and throws `NAVIGATION_DUPLICATED` when they match:

```ts
// Currently at /pages/about/about?id=1
await router.push({ name: 'about', query: { id: '1' } })
// → Throws NavigationFailure (NAVIGATION_DUPLICATED)
```

::: warning Only push Checks Duplicates
`replace` / `relaunch` / `back` **don't check duplicates**. This is because `replace` is often used to refresh the current page, `relaunch` to reset to the current page (like returning home after logout), and `back` may return to a page that's the same as current.
:::

### TabBar Page Limitations

When the target is a TabBar page (`meta.isTab: true`), `push` switches to `uni.switchTab`, and these limitations apply:

| Feature | Regular Page | TabBar Page |
| --- | --- | --- |
| `query` | ✅ Appended to URL | ❌ Ignored with warning |
| `animation` | ✅ Works | ❌ Ignored with warning |
| `events` | ✅ Works | ❌ Ignored |
| `eventChannel` | ✅ Returned | ❌ `undefined` |

```ts
// TabBar page, query will be ignored
await router.push({ name: 'user', query: { tab: 'profile' } })
// ⚠️ Warning: uni.switchTab does not support query parameters. They will be ignored.
```

::: warning This is a uni-app hard limitation
`uni.switchTab` is determined by the mini-program spec and doesn't support URL parameters. To pass params to TabBar pages, use `params` (see special usage below).
:::

## replace — Replace Navigation

`replace` replaces the current page without increasing stack depth. Commonly used to replace the login page after login, or replace the form page after form submission.

```ts
router.replace(location: RouteLocationRaw): Promise<RouteLocation>
```

```ts
// Replace login page after successful login
await router.replace({ name: 'home' })

// Replace with detail page after form submission
await router.replace({ path: 'pages/detail/detail', query: { id: result.id } })
```

### Differences from push

- **No duplicate check**: Can replace to current page (for refresh)
- **No eventChannel by default**: `redirectTo` doesn't support native page communication; the returned `NavigationResult.eventChannel` is `undefined` (available with `useUniEventChannel: true` via the built-in channel)
- **events ignored by default**: Passing `events` outputs a warning (takes effect with `useUniEventChannel: true`)
- **Same TabBar limitations**: Switches to `switchTab` when `meta.isTab`

## relaunch — Reset Navigation

`relaunch` closes all pages then opens the target page. Commonly used for logout, returning home, or resetting an entire flow.

```ts
router.relaunch(location: RouteLocationRaw): Promise<RouteLocation>
```

```ts
// Logout
await router.relaunch({ name: 'login' })

// Return home from deep page
await router.relaunch({ name: 'home' })

// With redirect param
await router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

### Special Limitations

::: warning reLaunch Doesn't Support Animation
`uni.reLaunch` doesn't accept animation params. Passing `animation` outputs a warning and is ignored. This is because `reLaunch` closes all pages, making animation semantics unclear.

TabBar pages go through `switchTab`, which also doesn't support animation.
:::

### Why No Duplicate Check

`relaunch` is often used in "reset to current page" scenarios, such as:

- User clicks "return home" button while on home page
- Target page after logout happens to be the current page

So `relaunch` doesn't do duplicate checking to ensure these scenarios work normally.

## back — Back Navigation

`back` returns to the previous page or multiple pages. It's the only "back" operation that executes the full guard chain.

```ts
router.back(delta?: number, animation?: NavigationAnimation): Promise<RouteLocation>
```

```ts
// Return one page
await router.back()

// Return two pages
await router.back(2)

// Custom animation
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### How It Works

`back` reads the page stack via `getCurrentPages()` and calculates the target page:

```
Current stack: [A, B, C, D]  (D is current page)
back(2) → target is B (index = 4-1-2 = 1)
→ calls uni.navigateBack({ delta: 2 })
→ syncs currentRoute to B
```

If the page stack is insufficient (`targetIndex < 0`), throws `NAVIGATION_CANCELLED`.

### Guard Interception

`back` executes the full guard chain (`beforeEach` → `beforeResolve`), guards can:

- `next()` to allow the return
- `next(false)` to block the return (like "unsaved form" prompt)
- `next(location)` to redirect to another page

```ts
router.beforeEach((to, from, next) => {
  if (from.meta.dirty && !confirm('Unsaved changes will be lost. Leave anyway?')) {
    next(false) // Block return
  } else {
    next()
  }
})
```

::: warning Physical Back Button Cannot Be Intercepted
`back()` only intercepts **programmatic** calls. Physical back button (Android), browser back (H5), mini-program top-left return **directly trigger native `navigateBack`**, bypassing the router, so guards cannot intercept them.

Solutions:
1. The router registers a global mixin in `install()` that automatically calls `router.syncRoute()` in each page's `onShow` to sync state (no manual call needed)
2. Do after-the-fact handling in `onRouteChange`
3. App can listen to `onBackPress` to intercept physical back
:::

## RouteLocationRaw

All navigation methods accept the `RouteLocationRaw` type, supporting three forms:

### String Form

```ts
router.push('pages/about/about')
router.push('pages/about/about?id=1&tab=info')
```

Paths are auto-normalized (leading `/` added). Query in the string is parsed.

### Path Object

```ts
router.push({
  path: 'pages/about/about',
  query: { id: '1', tab: 'info' },
  params: { detail: { name: 'Tom' } },
  animation: { type: 'slide-in-right' },
  events: { update(data) { /* ... */ } }
})
```

### Named Object

```ts
router.push({
  name: 'about',
  query: { id: '1' },
  params: { detail: { name: 'Tom' } }
})
```

::: tip Recommend Named Routes
Named routes decouple from paths. When refactoring, just modify `path` in the route config—no need to search and replace strings globally. With `@meng-xi/vite-plugin`'s `dts` feature, you also get type checking and autocompletion.
:::

## Special Usage: params for Complex Data

::: info Requires ParamsPlugin
The `params` and `persistent` features require registering `ParamsPlugin`. Using them without registration throws a `PLUGIN_REQUIRED` error.
:::

uni-app native navigation only supports URL query (strings). Uni Router's `params` breaks this limitation:

### Passing Arbitrary JSON Data

```ts
// Pass object
await router.push({
  path: 'pages/detail/detail',
  params: {
    id: 123,
    info: { name: 'Tom', age: 20 },
    tags: ['a', 'b', 'c']
  }
})

// Target page reads
const route = useRoute()
console.log(route.params.id)      // 123
console.log(route.params.info)    // { name: 'Tom', age: 20 }
console.log(route.params.tags)    // ['a', 'b', 'c']
```

### Implementation Principle

`params` is not exposed in the URL. Instead, it's stored in an internal `Map`, and a random key is injected into the URL query (`__params_key`). The target page reads from the Map using the key.

```
During navigation:
  params: { id: 123, info: {...} }
  → stored in ParamsManager (key: "abc123")
  → URL: /pages/detail/detail?__params_key=abc123

Target page:
  → reads __params_key from query
  → gets params from ParamsManager
  → route.params = { id: 123, info: {...} }
```

::: tip __params_key URL Retention
Although `route.query` **does not contain** `__params_key` (the matcher removes this internal key during resolution to avoid exposing it to users), the **actual navigation URL preserves it**. This way, when `back()` returns to the original page, `syncCurrentRoute` can reconstruct params from the URL, preventing loss. To access user-visible query, use `route.query`.
:::

### Persistence (H5 Refresh Won't Lose)

By default, `params` are stored in memory and lost when the page closes. Set `persistent: true` to persist to storage, so H5 refresh can still read them:

```ts
// Per-navigation persistence
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123 },
  persistent: true
})

// Global default persistence
const router = createRouter({
  routes,
  paramsPersistent: true // All params persisted by default
})
```

::: warning params Limitations
1. **Doesn't support functions, Symbols, or other non-JSON-serializable values**
2. **TabBar pages**: Since `switchTab` doesn't support query, `__params_key` cannot be passed, so TabBar pages cannot receive params
3. **`relaunch` / stack overflow**: Will clear or rebuild the page stack, original page params cannot be retained, use global state to pass data
:::

## Special Usage: Page Communication

Uni Router provides two page communication modes: native EventChannel (default) and the built-in communication manager (`useUniEventChannel: true`).

### Mode 1: Native EventChannel (Default)

In the default mode, `events` works with `push` only and does not require ChannelPlugin.

`push` supports `events` + `eventChannel` bidirectional communication, corresponding to `uni.navigateTo`'s EventChannel mechanism:

```ts
// Initiating page
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: {
    // Listen for events from target page
    update(data) { console.log('Received update:', data) }
  }
})

// Send event to target page
eventChannel.emit('init', { message: 'Init data' })
```

```ts
// Target page
import { getCurrentPages } from 'uni-app'

const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const eventChannel = currentPage.getOpenerEventChannel()

eventChannel.on('init', (data) => {
  console.log('Received init:', data)
})

// Send event to initiating page
eventChannel.emit('update', { status: 'loaded' })
```

::: warning Limitations of Native Mode
- **Only `push` supported**: `replace` / `relaunch` / `back` don't support `events`; passing them will be ignored with a warning (`redirectTo` / `reLaunch` / `navigateBack` don't create EventChannel)
- **Timing issue**: `uni.navigateTo`'s `success` callback may fire before the target page's `setup` runs; `emit` then happens before `on` is registered, causing events to be lost
- **H5 refresh loss**: Native channels aren't persisted; refreshing breaks the channel
:::

### Mode 2: Built-in Communication Manager (useUniEventChannel)

::: info Requires ChannelPlugin
Enabling `useUniEventChannel: true` requires registering `ChannelPlugin`. Using it without registration throws a `PLUGIN_REQUIRED` error.
:::

With `createRouter({ useUniEventChannel: true })` enabled, all navigation methods (`push` / `replace` / `relaunch`) use the built-in communication manager, and the target page obtains the channel via [`usePageChannel()`](../api/use-page-channel):

```ts
// Initiator: replace / relaunch also return eventChannel
const { eventChannel } = await router.replace({
  name: 'detail',
  params: { id: 123 },
  events: {
    ready(data) { console.log('Target page ready:', data) }
  }
})

// Send event to target page
eventChannel.emit('init', { message: 'Init data' })
```

```vue
<!-- Target page: use usePageChannel() instead of getOpenerEventChannel() -->
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// Listen for events from the initiator
channel.on('init', (data) => {
  console.log('Received init:', data)
})

// Send event to the initiator
channel.emit('ready', { status: 'loaded' })
</script>
```

Advantages of the built-in communication manager:

| Feature | Native EventChannel | Built-in Communication Manager |
| --- | --- | --- |
| Applicable navigation methods | Only `push` | `push` / `replace` / `relaunch` |
| Timing issue | Events lost when emit precedes on | Sticky cache, no loss |
| H5 refresh | Channel lost | `__nav_id` persisted, can rebuild |
| Lifecycle cleanup | Manual | Auto-destroyed on page unmount |
| Target page access | `getOpenerEventChannel()` | `usePageChannel()` |

::: tip Sticky Event Caching
The built-in channel implements a sticky event mechanism: `emit` **always** caches the event arguments; when `on` / `once` registers a listener and a cache exists, it **async-triggers** (without deleting the cache). Regardless of the order of `emit` and `on`, all listeners receive the data from the last `emit`, completely solving the timing race.
:::

::: warning Notes on Switching Modes
- When `useUniEventChannel` is enabled, `push` no longer uses the native EventChannel; the target page must use `usePageChannel()`
- The `events` option works in both modes, but is forwarded via `uni.$emit` in built-in mode
- See [`usePageChannel()` API](../api/use-page-channel) and [`useUniEventChannel` option](../api/type-router-options#useunieventchannel)
:::

## Special Usage: Navigation Animation

::: info Requires AnimationPlugin
The navigation animation feature requires registering `AnimationPlugin`. Using `animation` parameters without registration throws a `PLUGIN_REQUIRED` error.
:::

App supports custom navigation animation with three-level priority:

```
Inline animation param > meta.animation > uni default
```

### Route-Level Default Animation

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]
```

### Override at Call Time

```ts
await router.push({ name: 'about', animation: { type: 'slide-in-bottom', duration: 500 } })
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### Animation Types

`type` corresponds to `uni.navigateTo`'s `animationType`. App options:

| Value | Description |
| --- | --- |
| `'auto'` | Auto select |
| `'none'` | No animation |
| `'slide-in-right'` | Slide in from right (default) |
| `'slide-in-left'` | Slide in from left |
| `'slide-in-top'` | Slide in from top |
| `'slide-in-bottom'` | Slide in from bottom |
| `'fade-in'` | Fade in |
| `'zoom-fade-in'` | Zoom fade in |
| `'zoom-out'` | Zoom out |

::: warning Platform Limitation
Animation **only works on App**. Mini-program and H5 navigation animations are system-controlled and cannot be customized. `reLaunch` doesn't support animation even on App.
:::

## Concurrent Navigation Handling

Uni Router has built-in concurrent navigation queueing:

```ts
// Two consecutive navigations
router.push({ name: 'a' })  // Executes immediately
router.push({ name: 'b' })  // Waits for first to complete
```

```
Timeline:
  t0: push(a) starts executing
  t1: push(b) enters waiting (pendingNavigation exists)
  t2: push(a) completes → push(b) starts executing
  t3: push(b) completes
```

::: tip Avoid Navigation Conflicts
Concurrent navigation queueing ensures only one navigation is in progress at a time, avoiding page stack corruption. But avoid triggering new navigation in guards, which may cause deadlock.
:::

## Redirect Depth Protection

`next(location)` in guards triggers a redirect. Uni Router limits max redirect depth to **10**, throwing `NAVIGATION_CANCELLED` when exceeded:

```ts
// Error example: A→B→A→B→... infinite redirect
router.beforeEach((to, from, next) => {
  if (to.name === 'a') next({ name: 'b' })
  else if (to.name === 'b') next({ name: 'a' })
})
```

```
→ push(a) → beforeEach redirects to b
→ push(b) → beforeEach redirects to a
→ ... (after 10 times)
→ Throws NAVIGATION_CANCELLED: Maximum redirect depth (10) exceeded
```

## Navigation Failure Handling

All navigation methods return Promises that reject with `NavigationFailure` on failure:

```ts
import { NavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

try {
  await router.push({ name: 'about' })
} catch (error) {
  if (error instanceof NavigationFailure) {
    switch (error.code) {
      case RouterErrorCode.NAVIGATION_ABORTED:
        console.log('Aborted by guard')
        break
      case RouterErrorCode.NAVIGATION_DUPLICATED:
        console.log('Duplicate navigation, already on this page')
        break
      case RouterErrorCode.NAVIGATION_CANCELLED:
        console.log('Cancelled (redirect limit or stack insufficient)')
        break
      case RouterErrorCode.NAVIGATION_API_ERROR:
        console.error('uni API failed', error.cause)
        break
      case RouterErrorCode.PLUGIN_REQUIRED:
        console.error('Used plugin feature without registering plugin:', error.message)
        break
    }
  }
}
```

You can also catch globally via `onError`:

```ts
router.onError((error, to, from) => {
  // Report error logs
  trackError(error.code, { to: to.path, from: from.path })
})
```

See [Error Handling](./error-handling).

## Best Practices

### 1. Consistently Use Named Routes

```ts
// ✅ Recommended
router.push({ name: 'detail', query: { id: '1' } })

// ❌ Not recommended (hardcoded path)
router.push('pages/detail/detail?id=1')
```

### 2. Use params for TabBar Page Params

```ts
// ✅ TabBar pages use params (query is ignored by switchTab)
router.push({ name: 'user', params: { tab: 'profile' } })

// ❌ query will be ignored
router.push({ name: 'user', query: { tab: 'profile' } })
```

### 3. Use relaunch for Logout

```ts
// ✅ Clear stack, user cannot return to protected pages
await router.relaunch({ name: 'login' })

// ❌ After replace, user can still go back
await router.replace({ name: 'login' })
```

### 4. Use relaunch to Return Home from Deep Pages

```ts
// Current stack: [home, list, detail, comment]
// Return directly to home from comment

// ✅ Clear stack, avoid multiple backs
await router.relaunch({ name: 'home' })

// ❌ Multiple backs, poor UX and may have stack issues
await router.back(3)
```

### 5. Use back Guard for Form Page Interception

```ts
router.beforeEach((to, from, next) => {
  if (from.meta.dirty) {
    uni.showModal({
      title: 'Notice',
      content: 'Unsaved changes will be lost. Leave anyway?',
      success: (res) => res.confirm ? next() : next(false)
    })
  } else {
    next()
  }
})
```

## Next Steps

- [Route Guards](./guards) — Master guard mechanism and controllable redirects
- [Navigation Flow](./navigation-flow) — Understand the complete flow from push to page display
- [Recipes](./recipes) — Complete solutions for auth, permission control, etc.
