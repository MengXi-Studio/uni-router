# Navigation Flow

Understanding the complete navigation flow helps you write more reliable guards, troubleshoot navigation issues, and understand Uni Router's design decisions. This chapter breaks down the entire process from calling `push()` to page display, from a source code perspective.

## Complete Flow Diagram

Taking `router.push({ name: 'about' })` as an example, the complete flow is:

```
router.push({ name: 'about' })
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 1. performNavigation()                                  │
│    ├─ await pendingNavigation (concurrency queueing)    │
│    ├─ enrichLocationWithParams() handle params          │
│    ├─ matcher.resolve() resolve to RouteLocation        │
│    ├─ extractAnimation() / extractEvents() extract opts │
│    ├─ duplicate navigation check (push only)            │
│    └─ set pendingNavigation                             │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. executeNavigation(to, from, mode, depth=0)           │
│    ├─ redirect depth check (>10 cancels)                │
│    ├─ get RouteConfig                                  │
│    │                                                    │
│    ├─ 2.1 runBeforeGuards()                             │
│    │      └─ execute beforeEach guards in order         │
│    │           ├─ next() → continue                     │
│    │           ├─ next(false) → abort (ABORTED)         │
│    │           ├─ next(location) → redirect             │
│    │           └─ timeout/exception → cancel (CANCELLED)│
│    │                                                    │
│    ├─ 2.2 runBeforeEnterGuards()                        │
│    │      └─ execute RouteConfig.beforeEnter            │
│    │                                                    │
│    ├─ 2.3 runBeforeResolveGuards()                      │
│    │      └─ execute beforeResolve guards in order      │
│    │                                                    │
│    ├─ 2.4 setCurrentRoute(to) update current route      │
│    │      └─ Ensures target page's onLoad/onShow see    │
│    │         the full target route (with name/params)   │
│    │                                                    │
│    └─ 2.5 call uni navigation API                       │
│           ├─ push → navigateTo (returns eventChannel)   │
│           ├─ replace → redirectTo / switchTab           │
│           ├─ relaunch → reLaunch / switchTab            │
│           └─ back → navigateBack                        │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. After navigation completes                           │
│    ├─ runAfterGuards() execute afterEach hooks          │
│    └─ return NavigationResult / RouteLocation           │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Cleanup                                              │
│    └─ clear pendingNavigation (in finally)              │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: performNavigation

This is the entry point of navigation, responsible for preparation.

### 1.1 Concurrent Navigation Queueing

```ts
if (this.pendingNavigation) {
  await this.pendingNavigation.catch(() => {})
}
```

If the previous navigation hasn't completed, the current navigation will wait. This ensures only one navigation is in progress at a time, avoiding page stack corruption.

```
push(a) starts ──────────────── completes
            push(b) waits ──────── starts ──── completes
```

::: tip Errors Already Handled
When waiting, `.catch(() => {})` swallows errors from the previous navigation because they've already been notified via the `onError` mechanism. The current navigation should not fail due to a previous failure.
:::

### 1.2 Handling params

```ts
const enrichedLocation = this.enrichLocationWithParams(location)
```

If `location` contains `params`, this step will:
1. Store `params` in `ParamsManager` (in-memory Map or storage)
2. Generate a random key
3. Inject the key into `location.query.__params_key`

```
Input: { path: 'detail', params: { id: 123 } }
Output: { path: 'detail', query: { __params_key: 'abc123' } }
      + ParamsManager.set('abc123', { id: 123 })
```

### 1.3 Route Resolution

```ts
const to = this.matcher.resolve(enrichedLocation)
```

`matcher.resolve()` resolves `RouteLocationRaw` to a complete `RouteLocation`:

- **Path form**: Normalize path (add leading `/`), match `RouteConfig` to get `meta` and `name`
- **Name form**: Look up `RouteConfig` by `name` to get `path` and `meta`
- **query**: Merge `location.query` with query from URL string
- **params**: Read actual parameters from `__params_key`

```
Input: { name: 'about', query: { id: '1' } }
Output: {
  path: '/pages/about/about',
  name: 'about',
  meta: { requireAuth: true },
  query: { id: '1' },
  params: {},
  fullPath: '/pages/about/about?id=1'
}
```

### 1.4 Duplicate Navigation Check (push only)

```ts
if (mode === 'push' && this.isSameRouteLocation(to, from)) {
  // Throw NAVIGATION_DUPLICATED
}
```

Compares `path` + `name` + `query`; if all match, it's considered a duplicate.

::: warning Why Only push Checks
- `replace`: Often used to refresh the current page
- `relaunch`: Often used to reset to the current page
- `back`: The returned page may be the same as the current one
:::

## Phase 2: executeNavigation

This is the core of navigation, executing the guard chain and API calls.

### 2.1 Redirect Depth Check

```ts
if (redirectDepth > MAX_REDIRECT_DEPTH) {
  // Throw NAVIGATION_CANCELLED
}
```

`MAX_REDIRECT_DEPTH = 10`. Each guard redirect recursively calls `executeNavigation` with `depth + 1` to prevent infinite loops.

### 2.2 Guard Chain Execution

```
beforeEach (global) → beforeEnter (route-specific) → beforeResolve (global)
```

Guards in each phase execute in registration order. If any guard returns a non-"pass" result, subsequent guards won't execute.

### 2.3 Guard Result Handling

`handleGuardResult()` decides the next step based on the `GuardResult` returned by the guard:

```ts
type GuardResult =
  | { type: 'next'; redirect?: RouteLocationRaw; mode?: NavigationRedirectMode }
  | { type: 'abort'; code: RouterErrorCode }
```

| Result | Handling |
| --- | --- |
| `next` (no redirect) | Pass, continue to next guard |
| `next` + `redirect` | Recursively call `executeNavigation` (redirect) |
| `abort` | Throw `NavigationFailure` |

### 2.4 Redirect Handling

When a guard calls `next(location, { mode })`:

```ts
const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, ...)
```

- `mode` priority: Guard specified > Original navigation mode
- `back` cannot redirect (target not in stack), falls back to `relaunch`
- Redirects **re-trigger the complete guard chain** (starting from `beforeEach`)

```
push(protected) → beforeEach redirects to login
                → executeNavigation(login, depth=1)
                → beforeEach(login) → pass
                → navigateTo(login)
```

### 2.5 Calling uni API

After all guards pass, **first** call `setCurrentRoute(to)` to update the current route in advance, **then** call the corresponding uni API based on `mode`:

```ts
// Update currentRoute in advance so target page's onLoad/onShow sees the full target route (with name/params)
// syncRoute's dedup mechanism will skip duplicate syncs in onShow, preserving the full route set here
this.routeState.setCurrentRoute(to)

try {
  const navOptions = {
    path: to.path,
    meta: to.meta,
    // The actual navigation URL needs __params_key appended back to query (to.query was cleaned by matcher and doesn't contain internal key)
    // so that syncCurrentRoute can read the key from URL to rebuild params when back() returns
    query: paramsKey ? { ...to.query, [PARAMS_KEY]: paramsKey } : to.query,
    animation,
    events
  }

  if (mode === 'push') {
    eventChannel = await navigateTo(navOptions)  // returns eventChannel
  } else if (mode === 'replace') {
    await replaceTo(navOptions)
  } else {
    await relaunchTo(navOptions)
  }
} catch (error) {
  // API call failed, rollback currentRoute
  this.routeState.setCurrentRoute(from)
  throw error
}
```

`navigateTo` / `replaceTo` / `relaunchTo` internally choose `switchTab` or the corresponding API based on `meta.isTab`.

::: tip markRouterCall
Before each uni API call, `markRouterCall()` is executed to mark that this call comes from the router. When `interceptUniApi` is enabled, the interceptor uses this mark to avoid circular interception.
:::

::: warning setCurrentRoute runs in advance
`setCurrentRoute(to)` executes **before** the uni navigation API call, not after. This way, when the target page's `onLoad` / `onShow` fires, `route.value` is already the full target route (with `name` / `params`), avoiding reading stale `currentRoute` in target page lifecycles.

The global mixin's `onShow` auto `syncRoute()` has dedup (skips if path + query match) and won't overwrite the full route info set here. If the API call fails, `currentRoute` rolls back to `from`.
:::

## Phase 3: After Navigation Completes

### 3.1 Execute Post Hooks

```ts
this.guardManager.runAfterGuards(to, from)
```

`afterEach` hooks execute in registration order. Note that `afterEach` doesn't accept a `next` parameter and cannot change the result.

### 3.2 Return Result

```ts
return { ...to, eventChannel }  // push mode
return to                        // other modes
```

## Special Flow for back()

`back()` doesn't go through `performNavigation`; it has an independent flow:

```
router.back(delta)
  │
  ├─ await pendingNavigation
  │
  ├─ read page stack getCurrentPages()
  ├─ calculate target: pages[length - 1 - delta]
  ├─ stack insufficient → throw NAVIGATION_CANCELLED
  │
  ├─ matcher.resolve(targetPath) resolve target
  │
  ├─ guard chain (same as executeNavigation)
  │   ├─ beforeEach
  │   ├─ beforeResolve
  │   └─ (no beforeEnter, since returning to existing page)
  │
  ├─ goBack(delta, animation) call uni.navigateBack
  │
  ├─ syncCurrentRoute() sync state
  │   ├─ read real page from stack, update currentRoute
  │   ├─ read __params_key from URL query, rebuild params via peek (no deletion)
  │   ├─ remove internal key from user-visible query
  │   └─ _synced = true (mark as state sync)
  │
  ├─ runAfterGuards(to, from)
  │
  └─ return currentRoute
```

::: warning back Does Not Execute beforeEnter
`back()` returns to an existing page and doesn't trigger `beforeEnter` (route-specific guard). Only global guards are executed.
:::

::: tip params Not Lost After back()
When `back()` returns to the original page, `syncCurrentRoute` reads `__params_key` from the URL query and uses `peek` (no deletion) to fetch params from `ParamsManager`. Because `push` already injected `__params_key` into the actual navigation URL (even though `route.query` doesn't expose it), `back()` can still rebuild params.
:::

## State Sync Mechanism

### Complete Navigation vs State Sync

| Type | Trigger | afterEach | onRouteChange | _synced |
| --- | --- | --- | --- | --- |
| Complete navigation | `push` / `replace` / `relaunch` / `back` | ✅ | ✅ | `false`/`undefined` |
| State sync | `syncRoute()` / `syncCurrentRoute()` | ❌ | ✅ | `true` |

### How syncRoute Works

```ts
syncRoute(): void {
  const from = this.routeState.getCurrentRoute()
  const currentPath = getCurrentPagePath()      // read from page stack
  const currentQuery = getCurrentPageQuery()

  // Path and query both match, no update needed
  if (currentPath === from.path && this.isSameQuery(currentQuery, from.query)) return

  this.syncCurrentRoute()
  this.paramsManager.cleanupStale()  // clean invalid params
}
```

`syncCurrentRoute` reads real page info from the stack, constructs a new `RouteLocation` (`_synced: true`), and updates the state. During this process, it reads `__params_key` from the URL query and uses `peek` to rebuild params (no deletion, for repeated reads), and removes the internal key from the user-visible query.

::: tip Auto Called via Global Mixin
The router injects `app.mixin({ onShow() { router.syncRoute() } })` in `install()`, which **automatically** syncs state in each page's `onShow`. The mixin hook runs before the component's own `onShow`, and `syncRoute` has built-in deduplication (skips if path + query match).

So for physical back button, browser back, direct `uni.navigateBack` calls, etc., **no need** to call `syncRoute()` manually. Manual call is only needed in lifecycles earlier than `onShow` (e.g., `onLoad`) when route info is needed immediately.
:::

### Why afterEach Doesn't Trigger

`afterEach` semantically means a hook "after navigation completes" that participates in navigation flow control (like setting titles). State sync is not navigation and shouldn't trigger `afterEach` which may have side effects.

But `onRouteChange` is a purely observational subscription; state sync should also notify it, so it triggers.

## Concurrency Guarantees

### Queueing Mechanism

```ts
// performNavigation
if (this.pendingNavigation) {
  await this.pendingNavigation.catch(() => {})
}
// ... preparation work ...
this.pendingNavigation = navigationPromise
try {
  return await navigationPromise
} finally {
  if (this.pendingNavigation === navigationPromise) {
    this.pendingNavigation = null
  }
}
```

### Guarantees

1. **Serial execution**: Only one navigation in progress at a time
2. **Error isolation**: Previous navigation failure doesn't affect the next
3. **State consistency**: `pendingNavigation` is cleared in `finally`, so no residue even on exceptions

::: warning Triggering Navigation in Guards
Calling `router.push()` in a guard causes the current navigation to wait for the new navigation, while the new navigation waits for the current guard to complete, forming a deadlock.

```ts
// ❌ Deadlock
router.beforeEach((to, from, next) => {
  router.push({ name: 'other' }) // triggers new navigation, waits for current
  next()
})
```

To navigate in a guard, use `next(location)` redirect.
:::

## Error Propagation

### Error Code Mapping

| Phase | Error Code | Trigger Condition |
| --- | --- | --- |
| Duplicate check | `NAVIGATION_DUPLICATED` | push to same location |
| Guard abort | `NAVIGATION_ABORTED` | `next(false)` |
| Guard timeout | `NAVIGATION_CANCELLED` | Guard didn't resolve in time |
| Guard exception | `NAVIGATION_CANCELLED` | Guard throw / reject |
| Redirect limit | `NAVIGATION_CANCELLED` | depth > 10 |
| Stack insufficient | `NAVIGATION_CANCELLED` | targetIndex < 0 on back |
| API failure | `NAVIGATION_API_ERROR` | uni API call failed |
| Route not found | `ROUTE_NOT_FOUND` | No match in strict mode |
| Init error | `SETUP_ERROR` | Router usage error |

### Error Notification Path

```
Error occurs
  ├─ triggerErrorHandlers(error, to, from)
  │   └─ Notify all onError registered callbacks
  │
  └─ Promise.reject(error)
      └─ Caller catches via catch
```

::: tip onError vs catch
`onError` is global listening, `catch` is local handling. Both trigger and don't conflict. Recommended:
- `onError`: Global logging, analytics, generic prompts
- `catch`: Local UI feedback (like toast)
:::

## params Lifecycle

```
During navigation:
  location.params = { id: 123 }
  → ParamsManager.set(key, { id: 123 })
  → Actual navigation URL: /detail?__params_key=key
  → route.query does not contain __params_key (matcher removed it during resolution)

Target page reads (first entry after push):
  route.params = ParamsManager.get(key)
  → get is lazy cleanup: deletes the key after reading (prevents duplicate reads)

back() returns to original page:
  → syncCurrentRoute reads __params_key from URL
  → ParamsManager.peek(key) (no deletion, can be read repeatedly)
  → rebuilds route.params

Page close / syncRoute:
  → ParamsManager.cleanupStale() cleans invalid keys

Router init:
  → ParamsManager.cleanupAll() clears all residuals
```

::: tip peek vs get
- `get(key)`: Deletes the key after reading, preventing duplicate reads. Suitable for first read after `push`.
- `peek(key)`: Reads without deleting. Suitable for rebuilding params on the original page after `back()`, since the user may `back` to the same page repeatedly.
:::

## Complete Sequence Example

Taking "unauthenticated user accessing a protected page" as an example:

```
1. router.push({ name: 'protected' })

2. performNavigation:
   ├─ resolve → to = { name: 'protected', meta: { requireAuth: true } }
   ├─ from = { name: 'home' }
   └─ Not duplicate, continue

3. executeNavigation(to, from, 'push', depth=0):
   ├─ beforeEach:
   │   └─ detect requireAuth && !isLoggedIn
   │   └─ next({ name: 'login' }, { mode: 'replace' })
   │   └─ returns { type: 'next', redirect: {name:'login'}, mode: 'replace' }
   │
   ├─ handleGuardResult:
   │   └─ redirectMode = 'replace' (guard specified)
   │   └─ recursive executeNavigation(login, from, 'replace', depth=1)

4. executeNavigation(login, from, 'replace', depth=1):
   ├─ beforeEach:
   │   └─ to.name === 'login' && !isLoggedIn → pass
   │   └─ next()
   ├─ beforeEnter: (login route has no specific guard)
   ├─ beforeResolve: pass
   ├─ setCurrentRoute(login)  ← update in advance, ensures target page's onLoad/onShow sees route.value ready
   └─ replaceTo → uni.redirectTo(login)

5. Navigation complete:
   ├─ afterEach(login, home)
   └─ return RouteLocation(login)

6. Cleanup pendingNavigation
```

## Next Steps

- [Route Guards](./guards) — Detailed guard usage
- [Interceptor Mechanism](./interceptor) — Principle of intercepting native APIs
- [FAQ](./faq) — Troubleshooting navigation issues
