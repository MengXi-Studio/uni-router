# RouterOptions

Router initialization options, passed to [`createRouter()`](./create-router).

## Type Definition

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
  interceptUniApi?: boolean
  guardTimeout?: number
  readyTimeout?: number
  paramsPersistent?: boolean
}
```

## Property Details

### routes

- **Type**: `RouteConfig[]`
- **Required**: Yes
- **Description**: Route configuration list, must be consistent with page declarations in `pages.json`

::: warning Must match pages.json
uni-app pages are statically declared in `pages.json`. Uni Router does not auto-register pages. The `path` in `routes` must have a corresponding declaration in `pages.json`, otherwise navigation will fail.

It's recommended to use [`@meng-xi/vite-plugin`](../guide/auto-generate) to auto-generate route configuration and avoid manual inconsistency.
:::

```ts
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About' } }
]

const router = createRouter({ routes })
```

### strict

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to enable strict mode
  - `true`: Unmatched named routes throw `ROUTE_NOT_FOUND` error
  - `false`: Unmatched named routes only output a warning and fall back to using the name as the path

```ts
// Strict mode (recommended for production)
const router = createRouter({ routes, strict: true })

// Lenient mode (migration phase or prototyping)
const router = createRouter({ routes, strict: false })
```

::: tip When to disable strict mode
- Migration phase: gradually migrate to named routes, unmigrated parts fall back to paths
- Rapid prototyping: don't care about route configuration completeness
- For production, keep `true` to catch configuration errors early
:::

### interceptUniApi

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to intercept uni native navigation APIs (`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`)

When enabled, direct calls to `uni.navigateTo()` and similar methods will be intercepted and redirected through the router, ensuring route guards (`beforeEach` / `beforeResolve` / `afterEach`) always take effect.

```ts
const router = createRouter({
  routes,
  interceptUniApi: true // Intercept native APIs
})
```

::: warning Side effects after enabling
1. `success` / `fail` callbacks of direct `uni.navigateTo()` calls will not be triggered (the original call is blocked and re-executed by the router)
2. H5 TabBar clicks trigger `uni.switchTab`; this is specially handled: the original call is allowed through and route state is synced in `success`
3. It is recommended to uniformly use `router.push()` / `router.replace()` / `router.back()` for navigation
:::

::: tip When to enable
- Need to ensure all navigation goes through guards (e.g., permission control)
- Migration phase, gradually replacing native API calls
- Need guards to take effect when third-party libraries directly call `uni.navigateTo`
:::

See [Interceptor Mechanism](../guide/interceptor) for details.

### guardTimeout

- **Type**: `number`
- **Default**: `10000` (10 seconds)
- **Description**: Guard timeout in milliseconds. When a guard function neither calls `next()` nor returns a rejected Promise within this time, a warning is output and navigation is automatically aborted to prevent permanent hanging

```ts
const router = createRouter({
  routes: [...],
  guardTimeout: 30000 // Increase timeout when guards have slow async requests
})
```

::: tip Tuning suggestions
| Scenario | Suggested Value |
| --- | --- |
| Pure synchronous guards | `10000` (default) |
| Guards with network requests | `30000` (30 seconds) |
| Guards with large file reads | `60000` (60 seconds) |
| Disable timeout protection | `0` (not recommended) |

Set to `0` to disable timeout protection, but this may cause navigation to hang permanently; not recommended.
:::

### readyTimeout

- **Type**: `number`
- **Default**: `0` (never timeout)
- **Description**: Router ready timeout in milliseconds. When the router fails to initialize within this time, `await router.isReady()` will be rejected, preventing the Promise from hanging permanently on router init exceptions

```ts
const router = createRouter({
  routes: [...],
  readyTimeout: 5000 // Reject isReady() Promise if not ready within 5 seconds
})
```

::: tip When to configure readyTimeout
- Test environment: set a short timeout (e.g., 5000ms) to quickly catch init issues
- Production: can keep default `0` (never timeout), or set a larger value (e.g., 30000ms) as a fallback
- When the router fails to initialize, `isReady()` will hang permanently; setting a timeout avoids this
:::

### paramsPersistent

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Default value for page parameter persistence
  - `true`: All `params` are persisted via `uni.setStorageSync` by default, still readable after H5 refresh
  - `false`: `params` are stored in memory only, lost when the page is closed
  - A single navigation can override this default via the `persistent` option

```ts
// Global default persistence
const router = createRouter({
  routes: [...],
  paramsPersistent: true
})

// Override per navigation (not persisted)
await router.push({
  path: '/detail',
  params: { id: 123 },
  persistent: false
})

// Override per navigation (persisted)
await router.push({
  path: '/detail',
  params: { id: 123 },
  persistent: true
})
```

::: warning Cost of persistence
Persistence writes to storage; frequent use of large objects increases storage overhead. Recommendations:
- Only enable for scenarios that need data recovery after H5 refresh
- Prefer memory mode (`persistent: false`) for large objects
- Persisted params should be cleaned up promptly (the `router` auto-cleans on page close)
:::

## Full Example

```ts
import { createRouter } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About', requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { title: 'Profile', isTab: true } },
  { path: 'pages/login/login', name: 'login', meta: { title: 'Login' } }
]

const router = createRouter({
  routes,
  strict: true,              // Strict mode
  interceptUniApi: true,     // Intercept native APIs
  guardTimeout: 15000,       // Guard timeout 15s
  readyTimeout: 5000,        // Ready timeout 5s
  paramsPersistent: false    // params not persisted by default
})

export default router
```

## Configuration Combination Suggestions

### Minimal Configuration (Rapid Prototyping)

```ts
const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home' },
    { path: 'pages/about/about', name: 'about' }
  ]
})
```

### Production Recommended Configuration

```ts
const router = createRouter({
  routes,
  strict: true,              // Catch configuration errors early
  interceptUniApi: true,     // Unify guard flow
  guardTimeout: 15000,       // Adapt to network requests
  readyTimeout: 10000,       // Fallback protection
  paramsPersistent: false    // Default memory mode
})
```

### High-Security Scenario Configuration

```ts
const router = createRouter({
  routes,
  strict: true,
  interceptUniApi: true,     // Ensure all navigation goes through permission checks
  guardTimeout: 30000,       // Adapt to complex permission checks
  readyTimeout: 5000,
  paramsPersistent: false    // Avoid persisting sensitive data
})
```

## Next Steps

- [createRouter()](./create-router) — Create a router instance
- [RouteConfig Type](./type-route-config) — Route configuration type
- [Interceptor Mechanism](../guide/interceptor) — Principle of intercepting native APIs
