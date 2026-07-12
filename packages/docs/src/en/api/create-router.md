# createRouter()

Creates a uni-app router instance. This is the entry function for using Uni Router.

## Type

```ts
function createRouter(options: RouterOptions): Router
```

## Parameters

### options

Router initialization options, type [`RouterOptions`](./type-router-options).

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
  plugins?: RouterPlugin[]
  interceptUniApi?: boolean
  guardTimeout?: number
  readyTimeout?: number
  paramsPersistent?: boolean
  useUniEventChannel?: boolean
}
```

#### options.routes

- **Type**: `RouteConfig[]`
- **Required**: Yes
- **Description**: Route configuration list, must be consistent with page declarations in `pages.json`

::: warning Must match pages.json
uni-app pages are statically declared in `pages.json`. Uni Router does not auto-register pages. The `path` in `routes` must have a corresponding declaration in `pages.json`, otherwise navigation will fail.
:::

#### options.strict

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to enable strict mode
  - `true`: Unmatched named routes throw `ROUTE_NOT_FOUND` error
  - `false`: Unmatched named routes only output a warning and fall back to using the name as the path

::: tip When to disable strict mode
Only disable during migration or rapid prototyping. For production, keep `true` to catch route configuration errors early.
:::

#### options.plugins

- **Type**: `RouterPlugin[]`
- **Default**: `undefined`
- **Description**: Router plugin list. Plugins are installed in array order, registering hooks into the router's navigation flow. The core only provides basic navigation capabilities; all extended features (params, animation, channel, interceptor) are provided through plugins. Users must explicitly import and register them.

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin]
})
```

::: tip Register only what you need
Only register the plugins you use. Using a feature without registering its plugin will throw a `PLUGIN_REQUIRED` error. See [Plugin System](../guide/plugins) for details.
:::

#### options.interceptUniApi

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to intercept uni native navigation APIs (`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`)

When enabled, direct calls to `uni.navigateTo()` and similar methods will be intercepted and redirected through the router, ensuring route guards (`beforeEach` / `beforeResolve` / `afterEach`) always take effect.

::: warning Side effects after enabling
1. `success` / `fail` callbacks of direct `uni.navigateTo()` calls will not be triggered (the original call is blocked and re-executed by the router)
2. H5 TabBar clicks trigger `uni.switchTab`; this is specially handled: the original call is allowed through and route state is synced in `success`
3. It is recommended to uniformly use `router.push()` / `router.replace()` / `router.back()` for navigation
:::

See [Interceptor Mechanism](../guide/interceptor) for details.

::: warning Requires InterceptorPlugin
`interceptUniApi: true` requires `InterceptorPlugin` to be registered. If this option is set but the plugin is not registered, the router will output a warning.
:::

#### options.guardTimeout

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
- Guards with network requests: `30000` (30 seconds) recommended
- Pure synchronous guards: default `10000` is fine
- Set to `0` to disable timeout protection (not recommended, may cause navigation to hang permanently)
:::

#### options.readyTimeout

- **Type**: `number`
- **Default**: `0` (never timeout)
- **Description**: Router ready timeout in milliseconds. When the router fails to initialize within this time, `await router.isReady()` will be rejected, preventing the Promise from hanging permanently on router init exceptions

```ts
const router = createRouter({
  routes: [...],
  readyTimeout: 5000 // Reject isReady() Promise if not ready within 5 seconds
})
```

#### options.paramsPersistent

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Default value for page parameter persistence
  - `true`: All `params` are persisted via `uni.setStorageSync` by default, still readable after H5 refresh
  - `false`: `params` are stored in memory only, lost when the page is closed
  - A single navigation can override this default via the `persistent` option

```ts
const router = createRouter({
  routes: [...],
  paramsPersistent: true // All params persisted by default
})

// Override per navigation
await router.push({ path: '/detail', params: { id: 123 }, persistent: false }) // Not persisted
```

::: warning Cost of persistence
Persistence writes to storage; frequent use of large objects increases storage overhead. Only enable it for scenarios that need data recovery after H5 refresh.
:::

::: warning Requires ParamsPlugin
`paramsPersistent: true` requires `ParamsPlugin` to be registered. If this option is set but the plugin is not registered, the router will output a warning.
:::

#### options.useUniEventChannel

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use the built-in communication manager instead of `uni.navigateTo`'s native EventChannel
  - `false` (default): `push` uses `uni.navigateTo`'s native EventChannel; other navigation methods (`replace` / `relaunch` / `back`) don't support page communication
  - `true`: All navigation methods (`push` / `replace` / `relaunch` / `back`) use the built-in communication manager

::: warning Requires ChannelPlugin
`useUniEventChannel: true` requires `ChannelPlugin` to be registered. If this option is set but the plugin is not registered, the router will output a warning.
:::

## Return Value

Returns a [`Router`](./router-instance) instance.

## Examples

### Minimal Configuration

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
    { path: 'pages/about/about', name: 'about', meta: { title: 'About' } }
  ]
})

export default router
```

### Full Configuration

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About', requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { title: 'Profile', isTab: true } },
  { path: 'pages/login/login', name: 'login', meta: { title: 'Login' } }
]

const router = createRouter({
  routes,
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin],
  strict: true,
  paramsPersistent: false,
  useUniEventChannel: false,
  interceptUniApi: true,
  guardTimeout: 15000,
  readyTimeout: 5000
})

export default router
```

### Register to Vue App

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  return { app }
}
```

::: tip Installation timing
`app.use(router)` triggers `install`, registers global properties `$router` / `$route`, and injects the router instance via `provide`, making `useRouter()` / `useRoute()` available. It also marks the router as ready, resolving all pending `isReady()` Promises.
:::

### Using the Router in a Pinia Store

Since the router is ready after `app.use(router)`, it can be safely used inside Pinia stores:

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  async function logout() {
    // Clear login state
    localStorage.removeItem('token')
    // Navigate to login page, clear stack
    await router.relaunch({ name: 'login' })
  }

  return { logout }
})
```

::: warning Avoid navigation at module top level
Do not call `router.push()` at module top level; call it inside functions. When module top-level code executes, the Vue app may not be mounted yet, and an empty page stack will cause navigation to fail.
:::

## FAQ

### Q: Must route configuration exactly match pages.json?

A: The `path` must have a corresponding declaration in `pages.json`. `name` and `meta` are Uni Router extension fields and don't need to be configured in `pages.json`. It's recommended to use [`@meng-xi/vite-plugin`](../guide/auto-generate) to auto-generate route configuration and avoid manual inconsistency.

### Q: After enabling interceptUniApi, will existing uni.navigateTo code still work?

A: Yes, but behavior changes. After enabling, `uni.navigateTo` is intercepted and redirected through the router; `success` / `fail` callbacks will not fire. It's recommended to gradually migrate to `router.push()` and similar APIs. Note: `interceptUniApi` requires `InterceptorPlugin` to be registered to take effect.

### Q: Can multiple router instances coexist?

A: Technically yes, but **not recommended**. uni-app uses a single page stack model; multiple router instances will cause state confusion. Always use a single router instance.

## Next Steps

- [Router Instance](./router-instance) — Full API of the router instance
- [RouterOptions Type](./type-router-options) — Configuration type definition
- [Getting Started](../guide/getting-started) — Complete integration example
