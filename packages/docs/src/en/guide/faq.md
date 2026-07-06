# FAQ

A collection of high-frequency issues and troubleshooting ideas when using Uni Router.

## Guards Not Working

### Symptom

Configured `beforeEach`, but guard logic doesn't execute.

### Troubleshooting

**1. Are you calling through the router**

```ts
// ❌ Direct uni API call, guard doesn't work
uni.navigateTo({ url: '/pages/about/about' })

// ✅ Through the router
await router.push({ name: 'about' })
```

**Solution**: Enable `interceptUniApi: true` to intercept all native API calls.

**2. Is the guard returning correctly**

```ts
// ❌ Forgot to call next
router.beforeEach((to, from, next) => {
  if (needAuth) {
    next({ name: 'login' })
  }
  // Missing next() in else branch
})

// ✅ All branches call next
router.beforeEach((to, from, next) => {
  if (needAuth) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

**3. Are async guards properly awaited**

```ts
// ❌ Async operation not awaited, next called before async completes
router.beforeEach((to, from, next) => {
  fetchUser().then(user => {
    if (!user) next({ name: 'login' })
  })
  next() // Executes immediately here
})

// ✅ Use async/await for async guards
router.beforeEach(async (to, from, next) => {
  const user = await fetchUser()
  if (!user) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## params Lost

### Symptom

After `router.push({ path: 'detail', params: { id: 123 } })`, the target page's `route.params` is empty.

### Cause

Uni Router's params are implemented via in-memory storage + URL key. Possible causes:

**1. Page Refresh (H5)**

params are stored in memory; H5 refresh loses memory.

```ts
// ❌ params lost after H5 refresh
const route = useRoute()
console.log(route.params.id) // undefined
```

**Solution**: Use query for critical params, params only for complex objects.

```ts
// Critical params via query
await router.push({ path: 'detail', query: { id: '123' } })

// Complex objects via params (accept refresh loss)
await router.push({
  path: 'detail',
  query: { id: '123' },
  params: { detailData: largeObject }
})
```

**2. Page Stack Cleared**

After `relaunch` or stack overflow, the original page is destroyed and params are cleaned. Note: `back()` returning to the original page **does not lose params** (the actual navigation URL preserves `__params_key`, params can be rebuilt).

**3. Wrong Read Timing**

params are ready at page `onLoad`, but need to be read via `useRoute()`.

```ts
// ❌ Directly access global variable
import { router } from '@/router'
console.log(router.currentRoute.params.id) // May not be updated

// ✅ Use useRoute
import { useRoute } from '@meng-xi/uni-router'
const route = useRoute()
console.log(route.params.id) // Correct
```

## Page Stack Overflow

### Symptom

Navigation error in mini-program: `navigateTo:fail webview count limit exceed`.

### Cause

Mini-program page stack limit is 10 levels; `navigateTo` fails when exceeded.

### Solution

Use `useSafeNav` wrapper, switch to `relaunch` when near limit:

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function safePush(location) {
  const pages = getCurrentPages()
  if (pages.length >= 8) {
    await router.relaunch(location)
  } else {
    await router.push(location)
  }
}
```

See [Recipes - Page Stack Depth Management](./recipes#page-stack-depth-management).

## Physical Back Cannot Be Intercepted

### Symptom

User presses physical back button (Android back, mini-program top arrow), guard doesn't trigger.

### Cause

This is a uni-app platform limitation:

- **App**: Can be intercepted via `onBackPress`
- **H5**: Browser back button cannot be intercepted; can only listen to `popstate` for after-the-fact handling
- **Mini-program**: Top back arrow cannot be intercepted

### Solution

```ts
// App: onBackPress
import { onBackPress } from '@dcloudio/uni-app'

onBackPress(() => {
  if (hasUnsavedData) {
    showConfirmDialog()
    return true // Block default back
  }
  return false
})

// All platforms: onRouteChange for after-the-fact handling
// currentRoute is auto-synced by the global mixin in install(), no manual syncRoute needed
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

router.onRouteChange((to, from) => {
  if (to._synced) {
    // State sync (may be triggered by physical back)
    handleBackNavigation(to, from)
  }
})
```

See [Platform Compatibility](./compatibility#physical-back-cannot-be-intercepted).

## switchTab Query Lost

### Symptom

```ts
await router.push({ name: 'user', query: { tab: 'orders' } })
// Target page route.query.tab is undefined
```

### Cause

`uni.switchTab` doesn't support query params. When target route has `meta.isTab: true`, the router calls `switchTab`, and query is discarded.

### Solution

Use global state to pass params:

```ts
// Initiating page
const tabStore = useTabStore()
tabStore.setTabParam('user', { tab: 'orders' })
await router.push({ name: 'user' })

// Target page onShow
onShow(() => {
  // currentRoute is auto-synced by the global mixin, no manual syncRoute needed
  const param = tabStore.getTabParam('user')
  if (param?.tab) {
    activeTab.value = param.tab
    tabStore.clearTabParam('user')
  }
})
```

See [Recipes - TabBar Page Data Passing](./recipes#tabbar-page-data-passing).

## afterEach Not Triggered

### Symptom

After physical back, `afterEach` hook doesn't execute.

### Cause

Physical back is uni-app native behavior; it doesn't go through the router's navigation flow, so `afterEach` doesn't trigger.

### Solution

Use `onRouteChange` to listen for all route changes (including state sync):

```ts
router.onRouteChange((to, from) => {
  console.log('Route change:', from.path, '→', to.path)
  // Physical back also triggers
})

// Distinguish complete navigation from state sync
router.onRouteChange((to, from) => {
  if (to._synced) {
    // State sync (physical back etc.)
  } else {
    // Complete navigation
  }
})
```

See [Navigation Flow - State Sync Mechanism](./navigation-flow#state-sync-mechanism).

## Navigation Deadlock in Guards

### Symptom

Calling `router.push()` in a guard causes navigation to hang.

### Cause

```ts
// ❌ Deadlock
router.beforeEach((to, from, next) => {
  router.push({ name: 'other' }) // Triggers new navigation, waits for current
  next()                          // Current navigation waits for guard to complete
  // Mutual wait → deadlock
})
```

### Solution

Use `next(location)` redirect instead of calling `router.push` in guards:

```ts
// ✅ Redirect
router.beforeEach((to, from, next) => {
  if (needRedirect) {
    next({ name: 'other' }) // Redirect, no deadlock
  } else {
    next()
  }
})
```

## Duplicate Navigation Error

### Symptom

```ts
await router.push({ name: 'about' })
await router.push({ name: 'about' }) // Throws NavigationFailure
```

### Cause

`push` to the same location (path + name + query match) throws `NAVIGATION_DUPLICATED` error to prevent meaningless duplicate stacking.

### Solution

**1. Catch and ignore**

```ts
try {
  await router.push({ name: 'about' })
} catch (err) {
  if (err.code !== 'NAVIGATION_DUPLICATED') throw err
}
```

**2. Use replace instead**

```ts
await router.replace({ name: 'about' }) // replace doesn't check duplicates
```

**3. Wrap safe push**

```ts
async function safePush(location) {
  try {
    await router.push(location)
  } catch (err) {
    if (err.code === 'NAVIGATION_DUPLICATED') return
    throw err
  }
}
```

## H5 Refresh 404

### Symptom

In H5, accessing `https://example.com/pages/about/about` returns 404 after refresh.

### Cause

Uni Router uses hash mode (`#/path`), but users may directly access URLs without hash.

### Solution

**1. Use hash mode**

Ensure URL is like `https://example.com/#/pages/about/about`; hash is preserved after refresh.

**2. Server redirect configuration**

If using history mode, configure server to redirect all paths to index.html:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

::: warning uni-app H5 Limitation
uni-app's H5 routing is controlled by `manifest.json`'s `h5.router.mode`; Uni Router works on top of it. Recommend keeping uni-app's hash mode to avoid refresh issues.
:::

## TabBar Page onShow Not Triggered

### Symptom

Switching from TabBar page A to TabBar page B, then back to A, A's `onShow` doesn't trigger.

### Troubleshooting

**1. Are you using `switchTab`**

`switchTab` should trigger `onShow` normally when switching TabBar pages. If not triggered, check if `reLaunch` was used instead.

**2. Did you read the correct `currentRoute` in `onShow`**

The router registers a global mixin in `install()` that automatically calls `syncRoute()` in each page's `onShow`, **no manual call needed**. Just read via `useRoute()`:

```ts
// ✅ currentRoute is auto-synced by the mixin
import { onShow } from '@dcloudio/uni-app'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

onShow(() => {
  console.log(route.value.path, route.value.query)
  // Other logic
})
```

If you need route info in `onLoad` (earlier than `onShow`), you can manually call `router.syncRoute()` once.

**3. Was the page destroyed**

`reLaunch` destroys all pages. If using `reLaunch` to switch tabs, `onShow` won't trigger (page is a new instance, triggers `onLoad`).

## Router Initialization Timing

### Symptom

Accessing `router.currentRoute` in `App.vue`'s `onLaunch` returns initial value instead of current page.

### Cause

The router initializes during `App.vue`'s `setup` phase, when the page stack may not be established yet.

### Solution

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
  // Router is initialized here, but page stack may not be ready
  console.log(router.currentRoute) // Initial value
})

// The router registers a global mixin in install() that auto-syncs in each page's onShow
// So page-level onShow doesn't need to manually call router.syncRoute()
```

::: tip Cold Start Guard Check
If you need to run guards against the real entry page in `onLaunch`, pass `options.path`:

```ts
onLaunch((options) => {
  router.isReady().then(() => {
    const launchPath = options?.path ? `/${options.path}` : undefined
    router.guardRoute(launchPath, {
      onAbort: (failure) => {
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

Calling `guardRoute(undefined)` directly will check `START_LOCATION` (path `/`) instead of the real entry page. See [Router Instance - guardRoute()](../api/router-instance#guardroute) for details.
:::

## Multiple Router Instance Conflict

### Symptom

Console warning: `Another router instance has already installed interceptors. Replacing with the new instance.`

### Cause

More than one router instance with `interceptUniApi: true` enabled. Interceptors are global; only one active instance can exist.

### Solution

**1. Ensure singleton**

```ts
// router/index.ts
let router: Router | null = null

export function useAppRouter() {
  if (!router) {
    router = createRouter({
      routes,
      interceptUniApi: true
    })
  }
  return router
}
```

**2. Unload on HMR hot reload**

```ts
// vite.config.ts
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeInterceptors()
  })
}
```

## Type Extension Not Working

### Symptom

After extending `RouteMeta`, TypeScript doesn't recognize new fields.

### Troubleshooting

**1. Is the module declared correctly**

```ts
// types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    requireAuth?: boolean
    roles?: string[]
  }
}
```

**2. Does tsconfig include this file**

```json
// tsconfig.json
{
  "include": ["src/**/*.ts", "src/types/**/*.d.ts"]
}
```

**3. Are there multiple conflicting declarations**

Check if multiple files declare `RouteMeta`, which may cause conflicts.

## params Lost After back

### Symptom

After `router.back()`, the target page's `route.params` is empty.

### Cause

When `back()` returns to the original page, since `matcher.resolve` removes `__params_key` during resolution, the actual navigation URL doesn't contain the key, preventing `syncCurrentRoute` from rebuilding params.

### Solution

::: tip Fixed
This issue has been fixed in the latest version. During `push` / `replace`, the actual navigation URL preserves `__params_key` (even though `route.query` doesn't expose it). When `back()` returns, `syncCurrentRoute` reads the key from URL and uses `peek` to rebuild params. **Usually no manual handling needed.**
:::

If params are still lost, possible causes:

**1. Page was destroyed**

After `relaunch` or stack overflow, the original page is destroyed and params are cleaned.

**2. Cross-relaunch passing**

`relaunch` clears the page stack; params cannot be preserved. Use global state:

```ts
// Initiating page
const store = useDataStore()
store.setData(largeObject)
await router.relaunch({ name: 'target' })

// Target page
const data = store.consumeData()
```

**3. TabBar pages**

Since `switchTab` doesn't support query, `__params_key` cannot be passed, so TabBar pages cannot receive params. Use global state instead.

## Guard Timeout

### Symptom

Console error: `Navigation guard timeout`.

### Cause

Guard has time-consuming operations (like network requests) exceeding default timeout (10 seconds).

### Solution

**1. Increase timeout**

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 seconds
})
```

**2. Optimize guard logic**

Move time-consuming operations to `beforeResolve` or page `onLoad`:

```ts
// ❌ Time-consuming request in beforeEach
router.beforeEach(async (to, from, next) => {
  await fetchLargeData() // Time-consuming
  next()
})

// ✅ Move to page onLoad
router.beforeEach((to, from, next) => {
  // Only quick checks
  next()
})

// In page
onLoad(async () => {
  await fetchLargeData()
})
```

## EventChannel Unavailable in replace

### Symptom

After `router.replace`, target page's `getOpenerEventChannel()` returns undefined.

### Cause

EventChannel is a `navigateTo`-exclusive capability; `redirectTo` / `reLaunch` don't support it.

### Solution

Use global state instead:

```ts
// Initiating page
const store = useCommStore()
store.setData(payload)
await router.replace({ name: 'target' })

// Target page
const data = store.consumeData()
```

See [Recipes - Page Communication](./recipes#page-communication).

## Navigation White Screen

### Symptom

After calling `router.push`, page is blank.

### Troubleshooting

**1. Is the route path correct**

```ts
// ❌ Wrong path
await router.push({ path: 'about' }) // Missing pages/ prefix

// ✅ Correct path
await router.push({ path: 'pages/about/about' })
// Or use name
await router.push({ name: 'about' })
```

**2. Is the page registered in pages.json**

uni-app requires all pages to be registered in `pages.json`. Unregistered pages cannot be navigated to.

**3. Are there JS errors**

Check if the target page's `onLoad` / `setup` has errors.

**4. Is the route config correct**

```ts
// ❌ path doesn't match pages.json
{ path: 'pages/about', name: 'about' } // Should be pages/about/about

// ✅ Matches pages.json
{ path: 'pages/about/about', name: 'about' }
```

## Animation Not Working

### Symptom

Set `animation: { type: 'fade-in' }`, but no animation effect.

### Cause

Animation is only supported on App; H5 and mini-programs don't support it.

### Solution

```ts
// Conditionally set animation
// #ifdef APP-PLUS
await router.push({ name: 'about', animation: { type: 'fade-in', duration: 300 } })
// #endif

// #ifndef APP-PLUS
await router.push({ name: 'about' }) // No animation on other platforms
// #endif
```

See [Platform Compatibility - Navigation Animation](./compatibility#navigation-animation-app-only).

## Route Lazy Loading

### Symptom

Want to load page components on demand to reduce initial bundle size.

### Note

uni-app's page loading is determined by `pages.json` configuration; it doesn't support Vue Router's `() => import()` lazy loading syntax. All pages registered in `pages.json` will be bundled.

### Alternatives

**1. Subpackage loading**

```json
// pages.json
{
  "subPackages": [
    {
      "root": "subpkg",
      "pages": [
        { "path": "detail/detail", "style": { "navigationBarTitleText": "Detail" } }
      ]
    }
  ]
}
```

**2. Use subpackage paths in route config**

```ts
const routes: RouteConfig[] = [
  { path: 'subpkg/detail/detail', name: 'detail' }
]
```

## Still Can't Solve?

If none of the above solves your issue:

1. Check the [API docs](../api/create-router) to confirm usage
2. Check [Navigation Flow](./navigation-flow) to understand the internal mechanism
3. Check [Platform Compatibility](./compatibility) to confirm if it's a platform limitation
4. Submit an issue on [GitHub Issues](https://github.com/MengXi-Studio/uni-router/issues) with:
   - Reproduction steps
   - Platform used (App / H5 / mini-program)
   - uni-app version and Uni Router version
   - Complete error information
