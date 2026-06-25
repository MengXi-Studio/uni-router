# Platform Compatibility

uni-app is a cross-platform framework supporting App, H5, and various mini-program platforms. Each platform has different navigation mechanisms and limitations. This chapter systematically outlines these limitations and explains how Uni Router handles them and how you should write cross-platform code.

## Platform Overview

| Platform | Routing Mode | Page Stack Limit | Animation | Physical Back Interception |
| --- | --- | --- | --- | --- |
| App (iOS/Android) | Native page stack | No hard limit (recommend ≤10) | ✅ Custom | ✅ `onBackPress` |
| H5 | History API | Unlimited | ❌ System controlled | ❌ `popstate` read-only |
| WeChat Mini-Program | Native page stack | **10** | ❌ System controlled | ❌ Top-left return |
| Alipay Mini-Program | Native page stack | **10** | ❌ System controlled | ❌ Top-left return |
| ByteDance Mini-Program | Native page stack | **10** | ❌ System controlled | ❌ Top-left return |
| Baidu Mini-Program | Native page stack | **10** | ❌ System controlled | ❌ Top-left return |
| QQ Mini-Program | Native page stack | **10** | ❌ System controlled | ❌ Top-left return |

::: warning Mini-Program Page Stack Limit
All mini-program platforms have a page stack limit of **10**. `navigateTo` fails and errors when exceeded. This is a hard platform limitation that Uni Router cannot break.
:::

## Limitation 1: Page Stack Depth (Mini-Programs)

### Problem

Mini-program page stack max is 10. After 10 consecutive `push` calls, the 11th will fail:

```
Stack: [A, B, C, D, E, F, G, H, I, J]  (full)
push(K) → uni.navigateTo fails
→ Uni Router throws NavigationFailure (NAVIGATION_API_ERROR)
```

### Solutions

**Solution 1: Use `relaunch` to reset stack**

```ts
// When stack depth approaches limit, use relaunch to reset
const pages = getCurrentPages()
if (pages.length >= 8) {
  // Stack almost full, use relaunch to reset
  await router.relaunch({ name: 'target' })
} else {
  await router.push({ name: 'target' })
}
```

**Solution 2: Use `replace` instead of push**

```ts
// Switch between detail pages with replace, avoid stack growth
await router.replace({ name: 'detail', query: { id: nextId } })
```

**Solution 3: Wrap safe navigation method**

```ts
// utils/safe-navigate.ts
import { useRouter } from '@meng-xi/uni-router'

export function useSafePush() {
  const router = useRouter()

  return async function safePush(location: Parameters<typeof router.push>[0]) {
    const pages = getCurrentPages()
    if (pages.length >= 8) {
      // Stack near limit, use relaunch
      await router.relaunch(location)
    } else {
      await router.push(location)
    }
  }
}
```

## Limitation 2: switchTab Doesn't Support query

### Problem

`uni.switchTab` is determined by the mini-program spec and **doesn't support URL parameters**. Passing query will be ignored:

```ts
await router.push({ name: 'user', query: { tab: 'profile' } })
// meta.isTab: true → goes through uni.switchTab
// ⚠️ Warning: uni.switchTab does not support query parameters. They will be ignored.
// query lost, target page can't read tab param
```

### Solutions

**Solution 1: Use `params` (recommended)**

```ts
// params stored via internal Map, doesn't depend on URL
await router.push({ name: 'user', params: { tab: 'profile' } })

// Target page
const route = useRoute()
console.log(route.params.tab) // 'profile'
```

::: warning params Limitation
`params` depends on `__params_key` injected into URL query. But `switchTab` doesn't support query, so **TabBar pages actually cannot receive params either**.

This is a uni-app hard limitation. Data passing between TabBar pages needs to rely on global state (Pinia/Vuex) or storage.
:::

**Solution 2: Global state management**

```ts
// Use Pinia for cross-page state
const useTabStore = defineStore('tab', () => {
  const activeTab = ref('profile')
  return { activeTab }
})

// Set before navigation
const tabStore = useTabStore()
tabStore.activeTab = 'profile'
await router.push({ name: 'user' })

// TabBar page reads
const route = useRoute()
const tabStore = useTabStore()
console.log(tabStore.activeTab) // 'profile'
```

**Solution 3: storage passing**

```ts
// Store before navigation
uni.setStorageSync('user_tab', 'profile')
await router.push({ name: 'user' })

// TabBar page reads
const tab = uni.getStorageSync('user_tab') || 'default'
```

## Limitation 3: reLaunch Doesn't Support Animation

### Problem

`uni.reLaunch` closes all pages and **doesn't accept animation params**:

```ts
await router.relaunch({ name: 'home', animation: { type: 'fade-in' } })
// ⚠️ Warning: uni.reLaunch does not support animation parameters. The animation option will be ignored.
```

### Cause

`reLaunch` closes all pages then opens a new one. "Where to animate from" semantics are unclear, so the platform doesn't support it.

### Solution

No special handling needed, just be aware. If you need animation, use `replace` instead (only replaces stack top, supports animation).

## Limitation 4: Physical Back Button Cannot Be Intercepted

### Problem

The following back operations **bypass the router**, guards cannot intercept:

| Platform | Back Method |
| --- | --- |
| App (Android) | Physical back button |
| App (iOS) | Edge swipe back |
| H5 | Browser back button |
| Mini-Program | Top-left return arrow, swipe back |

```
User presses back
  → uni-app native navigateBack (bypasses router)
  → router.currentRoute is still old value (out of sync)
  → afterEach doesn't trigger
  → guards don't execute
```

### Solutions

**Solution 1: App `onBackPress` (App only)**

```ts
import { onBackPress } from '@dcloudio/uni-app'

onBackPress((options) => {
  // options.from: 'backbutton' | 'navigateBack'
  if (formDirty.value) {
    showConfirmDialog()
    return true // Block back
  }
  return false // Allow back
})
```

::: warning onBackPress App Only
`onBackPress` only works on App. H5 and mini-programs don't have this lifecycle.
:::

**Solution 2: `onShow` + `syncRoute` (all platforms)**

```ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onShow(() => {
  // Sync currentRoute to real page
  router.syncRoute()
})
```

After calling `syncRoute()`:
- `currentRoute` updates to real page
- `onRouteChange` listeners trigger (`to._synced === true`)
- `afterEach` **doesn't trigger** (not a complete navigation)

**Solution 3: `onRouteChange` after-the-fact handling (all platforms)**

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // State sync (may be triggered by physical back)
    console.log('User may have returned via physical back to:', to.path)

    // After-the-fact handling: update title, analytics, etc.
    if (to.meta.title) {
      uni.setNavigationBarTitle({ title: to.meta.title as string })
    }
  }
})
```

### Wrap Common Back Handler

```ts
// composables/use-back-guard.ts
import { onShow } from '@dcloudio/uni-app'
import { onBackPress } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

export function useBackGuard(options: {
  dirty: () => boolean
  onConfirm?: () => void
}) {
  const router = useRouter()

  // App: intercept physical back button
  // #ifdef APP-PLUS
  onBackPress(() => {
    if (options.dirty()) {
      uni.showModal({
        title: 'Notice',
        content: 'You have unsaved changes. Leave anyway?',
        success: (res) => {
          if (res.confirm) {
            options.onConfirm?.()
            router.back()
          }
        }
      })
      return true // Block this back
    }
    return false
  })
  // #endif

  // All platforms: sync state in onShow
  onShow(() => {
    router.syncRoute()
  })
}
```

```ts
// Use in page
const dirty = ref(false)

useBackGuard({
  dirty: () => dirty.value,
  onConfirm: () => { /* save or cleanup */ }
})
```

## Limitation 5: H5 Routing Mode

### Problem

H5 uni-app uses History API (`history.pushState`). Uni Router's behavior on H5:

- `push` → `history.pushState` (adds history record)
- `replace` → `history.replaceState` (replaces current record)
- `relaunch` → multiple `history.replaceState` (cannot clear history stack)
- `back` → `history.back()`

::: warning H5 Cannot Truly "Clear Stack"
H5's History API doesn't support clearing the history stack. `relaunch` on H5 can only `replace` the current record; **users can still use browser back to return to previous pages**.

To implement "cannot return after logout" on H5, you need backend redirects or listen to `popstate` for re-authentication.
:::

### H5 Refresh Issue

H5 refresh loses the page stack, `getCurrentPages()` only returns the current page. At this point:

- `back()` may fail (stack insufficient) → throws `NAVIGATION_CANCELLED`
- `params` (non-persistent) lost

**Solution: params persistence**

```ts
// Persist params, readable after H5 refresh
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123 },
  persistent: true
})
```

Or enable globally:

```ts
const router = createRouter({
  routes,
  paramsPersistent: true
})
```

## Limitation 6: Navigation Animation App Only

### Problem

`animation` param and `meta.animation` **only work on App**. Mini-program and H5 navigation animations are system-controlled:

| Platform | Animation |
| --- | --- |
| App | ✅ Custom `animationType` |
| H5 | ❌ Browser default transition (usually no animation) |
| Mini-Program | ❌ System default slide animation |

### Solution

No special handling needed. Passing `animation` on non-App is silently ignored (no warning), doesn't affect functionality.

```ts
// Cross-platform safe, App has animation, others don't
await router.push({ name: 'about', animation: { type: 'slide-in-bottom' } })
```

## Limitation 7: TabBar Config Must Match pages.json

### Problem

`meta.isTab` must match `pages.json`'s `tabBar.list` declaration, otherwise navigation behavior is abnormal:

```json
// pages.json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index" },
      { "pagePath": "pages/user/user" }
    ]
  }
}
```

```ts
// ✅ Correct: matches pages.json
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// ❌ Wrong: declared isTab but pages.json has no tabBar
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } }
]
// → uni.switchTab will fail because this page is not a TabBar page
```

### Solution

Use `@meng-xi/vite-plugin`'s `dts` feature to auto-generate types, reducing manual config errors. See [Auto-Generating Route Config](./auto-generate).

## Limitation 8: No Dynamic Routing

### Problem

uni-app page paths are statically declared by `pages.json` at compile time and **don't support runtime dynamic registration**:

```ts
// ❌ Not supported
router.addRoute({ path: '/dynamic', component: Dynamic })
router.removeRoute('dynamic')
```

Also doesn't support vue-router's dynamic path matching:

```ts
// ❌ Not supported
{ path: '/user/:id' }  // uni-app page paths are fixed
```

### Solution

**Pass params via query or params**

```ts
// ✅ Use query to pass ID
router.push({ name: 'user', query: { id: '123' } })

// ✅ Use params to pass complex data
router.push({ name: 'user', params: { profile: { name: 'Tom' } } })
```

**Conditional rendering via in-page logic**

```ts
// Render different content based on params in page
const route = useRoute()
const userId = computed(() => route.query.id)
```

## Limitation 9: EventChannel push Only

### Problem

`events` + `eventChannel` page communication mechanism depends on `uni.navigateTo` and is **only available in `push` mode**:

```ts
// ✅ push supports
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: { update(data) { /* ... */ } }
})

// ❌ replace/relaunch/back don't support
await router.replace({ path: 'detail', events: {...} })
// ⚠️ Warning: uni.redirectTo does not support events. The events option will be ignored.
```

### Solution

If you need communication after `replace` / `relaunch`, use global state or storage:

```ts
// Use Pinia to pass data
const store = useDataStore()
store.pendingData = { message: 'hello' }
await router.replace({ name: 'detail' })

// Target page reads
const store = useDataStore()
console.log(store.pendingData) // { message: 'hello' }
```

## Limitation 10: Cold Start Bypasses Guards

### Problem

When a user **directly enters** a page via the following methods, the page is loaded directly by the uni-app framework, **bypassing router navigation**, and guards (`beforeEach` etc.) are not executed:

| Scenario | Platform |
| --- | --- |
| Direct URL access | H5 |
| QR code / scene value | Mini-program |
| Deeplink / URL Scheme | App |

```
User accesses https://example.com/#/pages/about/about
  → uni-app directly loads the about page (requireAuth: true)
  → Router guards are not executed
  → Unauthenticated user directly enters a protected page
```

### Cause

uni-app's page loading is done directly by the framework during cold start. The router (based on `uni.navigateTo` interception) only takes effect in subsequent programmatic navigations. Cold start page loading does not call `navigateTo`, so neither the interceptor nor guards can intervene.

### Solution: guardRoute()

`router.guardRoute()` runs the guard chain against the current (or specified) route and decides whether to redirect based on guard results:

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
  router.isReady().then(() => {
    router.guardRoute(undefined, {
      onAbort: (failure) => {
        // Guard aborted (e.g., not logged in), navigate to a safe page
        console.warn('Cold start guard aborted:', failure.code)
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

Guard result handling:

| Guard Result | Behavior |
| --- | --- |
| Pass (`next()`) | No navigation, resolves with the target route |
| Redirect (`next(location)`) | Navigates to the redirect target using the guard-specified mode (default `relaunch`) |
| Abort (`next(false)`) | Calls the `onAbort` callback and rejects with `NavigationFailure` |

::: warning Cold start cannot truly "block entry"
In cold start scenarios the page is already loaded, so `guardRoute()` cannot truly prevent the page from displaying. When a guard aborts, using the `onAbort` callback to execute `router.relaunch()` to navigate to a safe page is the recommended approach.
:::

See [Router Instance - guardRoute()](../api/router-instance#guardroute) and [Route Guards - Cold Start Guard Check](./guards#cold-start-guard-check).

## Cross-Platform Development Tips

### 1. Conditional Compilation

Use uni-app's conditional compilation for platform differences:

```ts
// #ifdef APP-PLUS
// App only
onBackPress(() => { /* ... */ })
// #endif

// #ifdef H5
// H5 only
window.addEventListener('popstate', handlePopState)
// #endif

// #ifdef MP-WEIXIN
// WeChat mini-program only
// #endif
```

### 2. Unified Back Handling

```ts
// composables/use-page.ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

export function usePage() {
  const router = useRouter()

  // All platforms: sync state in onShow
  onShow(() => {
    router.syncRoute()
  })

  return { router }
}
```

### 3. Safe Stack Depth Management

```ts
// Wrap safe navigation, auto-handle stack depth
export function useSafeNavigation() {
  const router = useRouter()

  const safePush = async (location: RouteLocationRaw) => {
    const pages = getCurrentPages()
    // #ifdef MP
    // Mini-program: stack depth limit 10, reserve 2 buffer
    if (pages.length >= 8) {
      await router.relaunch(location)
      return
    }
    // #endif
    await router.push(location)
  }

  return { safePush }
}
```

### 4. Platform Capability Detection

```ts
// Detect if a feature is supported
const supports = {
  animation: false, // Runtime detection
  backPress: false,
  eventChannel: true
}

// #ifdef APP-PLUS
supports.animation = true
supports.backPress = true
// #endif

// Choose strategy based on capabilities
if (supports.animation) {
  await router.push({ name: 'about', animation: { type: 'fade-in' } })
} else {
  await router.push({ name: 'about' })
}
```

## Platform Feature Comparison

| Feature | App | H5 | WeChat MP | Alipay MP | ByteDance MP |
| --- | --- | --- | --- | --- | --- |
| Page stack limit | No hard limit | Unlimited | 10 | 10 | 10 |
| Navigation animation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Physical back interception | ✅ `onBackPress` | ❌ | ❌ | ❌ | ❌ |
| `switchTab` query | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reLaunch` animation | ❌ | ❌ | ❌ | ❌ | ❌ |
| EventChannel | ✅ | ✅ | ✅ | ⚠️ Partial | ✅ |
| `params` persistence | ✅ storage | ✅ storage | ✅ storage | ✅ storage | ✅ storage |
| `onRouteChange` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guard interception | ✅ Programmatic | ✅ Programmatic | ✅ Programmatic | ✅ Programmatic | ✅ Programmatic |

::: tip Programmatic Navigation
"Programmatic" means navigation triggered via `router.push()` / `router.back()` etc. Non-programmatic methods like physical back button, browser back bypass the router, guards cannot intercept.
:::

## Next Steps

- [Interceptor Mechanism](./interceptor) — Intercept native APIs for unified guard flow
- [Recipes](./recipes) — Complete cross-platform solutions
- [FAQ](./faq) — Pitfall records
