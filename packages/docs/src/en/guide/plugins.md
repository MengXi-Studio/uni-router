# Plugin System

Uni Router adopts a **core + plugin** architecture: the core provides only uni-app native navigation capabilities, while extended features (param passing, navigation animation, inter-page communication, API interception) are delivered through plugins that users register on demand.

## Design Philosophy

Uni Router's plugin system follows these principles:

1. **Lean core**: The core only includes route matching, navigation execution, guard chain, state synchronization, and other capabilities natively supported by uni-app
2. **Plugin extensions**: All non-native capabilities are provided through plugins; they only take effect when explicitly registered by the user
3. **Non-intrusive**: When a plugin is not registered, the type declarations for its dependent fields (`params`/`animation`/`events` etc.) still exist, providing complete type hints; runtime usage throws a `PLUGIN_REQUIRED` error
4. **Composable**: Plugins are installed in array order, inject into the navigation flow via hooks, and share data between plugins through `pluginData`

## Built-in Plugins

| Plugin | name | Functionality | Corresponding Option |
| --- | --- | --- | --- |
| `ParamsPlugin` | `'params'` | Page param passing (`params`/`persistent`) | `paramsPersistent` |
| `AnimationPlugin` | `'animation'` | Navigation animation (App) | — |
| `ChannelPlugin` | `'channel'` | Inter-page communication + `usePageChannel()` | `useUniEventChannel` |
| `InterceptorPlugin` | `'interceptor'` | Intercept uni native navigation APIs | `interceptUniApi` |

## Registering Plugins

Register plugins in the `plugins` option of `createRouter()`:

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [
    ParamsPlugin,      // Enable params passing
    AnimationPlugin,   // Enable navigation animation
    ChannelPlugin,     // Enable inter-page communication
    InterceptorPlugin  // Enable API interception
  ],
  // Plugin corresponding options
  paramsPersistent: true,      // Requires ParamsPlugin
  useUniEventChannel: true,    // Requires ChannelPlugin
  interceptUniApi: true        // Requires InterceptorPlugin
})
```

::: warning Options and Plugin Coordination
`paramsPersistent`/`useUniEventChannel`/`interceptUniApi` options require the corresponding plugin to be registered to take effect. If an option is set but the plugin is not registered, the router will output a warning.
:::

### Register on Demand

Only register the plugins you need:

```ts
// Only need param passing and API interception
const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, InterceptorPlugin],
  paramsPersistent: true,
  interceptUniApi: true
})
```

## Plugin Dependency Checking

### Runtime Errors

When using a plugin-dependent feature without registering the plugin, the router throws a `PLUGIN_REQUIRED` error:

```ts
// ParamsPlugin not registered
await router.push({ path: '/detail', params: { id: 123 } })
// → Throws NavigationFailure (PLUGIN_REQUIRED)
```

### Option-Level Warnings

When setting a plugin option without registering the corresponding plugin, the router outputs a warning:

```ts
const router = createRouter({
  routes: [...],
  // ParamsPlugin not registered, but paramsPersistent is set
  paramsPersistent: true
})
// → Warning: options.paramsPersistent is set but ParamsPlugin is not registered
```

### hasPlugin() Check

The `Router` instance provides a `hasPlugin()` method for runtime checking whether a plugin is registered:

```ts
if (router.hasPlugin('params')) {
  // Safe to use params feature
  await router.push({ path: '/detail', params: { id: 123 } })
}
```

## Plugin Hooks

Each plugin registers hooks at different stages of the navigation flow via `PluginContext`:

| Hook | Timing | Purpose |
| --- | --- | --- |
| `onEnrichLocation` | Before matcher.resolve | Inject internal keys into query |
| `onAfterResolve` | After resolve, before guards | Extract plugin data from enriched location |
| `onPrepareNavigation` | Before uni API call | Modify navigation URL query and options |
| `onCompleteNavigation` | After uni API call succeeds | Extend NavigationResult |
| `onNavigationAbort` | When navigation is aborted/failed | Perform cleanup operations |
| `onRouteSync` | During syncCurrentRoute | Rebuild plugin data from URL query |
| `onAppInstall` | During router.install() | Register app-level cleanup logic |

## Plugin Details

### ParamsPlugin

Provides page param passing capability, breaking through uni-app's limitation of only supporting URL query.

**Features when enabled:**
- `RouteLocationRaw.params` — Pass any JSON-serializable data
- `RouteLocationRaw.persistent` — Persist params to storage
- `RouterOptions.paramsPersistent` — Global default persistence

**How it works:** Params are stored in an in-memory Map, injected into URL query via `__params_key`; the target page retrieves them from the Map using the key. See [Param Passing](./navigation#special-usage-params-for-complex-data).

### AnimationPlugin

Provides custom navigation animation capability for App.

**Features when enabled:**
- `RouteLocationRaw.animation` — Specify animation during navigation
- `router.back(delta, animation)` — Specify animation when going back

**Priority:** Inline param > `meta.animation` > uni default

### ChannelPlugin

Provides bidirectional inter-page communication capability.

**Features when enabled:**
- `RouteLocationRaw.events` — Listen for target page events
- `NavigationResult.eventChannel` — Communicate with target page (available for all navigation methods when `useUniEventChannel: true`)
- `usePageChannel()` — Target page obtains communication channel

**Two modes:**
- Default mode: Only `push` uses native EventChannel
- `useUniEventChannel: true`: All navigation methods use built-in communication manager

See [Inter-page Communication](./navigation#special-usage-page-communication) and [Interceptor Mechanism](./interceptor).

### InterceptorPlugin

Provides the ability to intercept uni native navigation APIs, ensuring guards are globally enforced.

**Features when enabled:**
- Intercepts `uni.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`
- Forwards external calls to the router for processing

See [Interceptor Mechanism](./interceptor).

## Custom Plugins

Plugins implement the `RouterPlugin` interface:

```ts
import type { RouterPlugin, PluginContext } from '@meng-xi/uni-router'
import type { RouterOptions } from '@meng-xi/uni-router'

const MyPlugin: RouterPlugin = {
  name: 'my-plugin',

  install(context: PluginContext, options: RouterOptions) {
    // Register hooks via context
    context.onEnrichLocation((location) => {
      // Enrich route location before resolve
      return location
    })

    context.onAfterResolve((enrichedLocation, pluginData) => {
      // Extract data after resolve
    })

    context.onPrepareNavigation((ctx) => {
      // Modify navigation options
    })

    context.onCompleteNavigation((ctx) => {
      // Extend navigation result
    })

    context.onNavigationAbort((pluginData) => {
      // Cleanup when navigation aborts
    })

    context.onRouteSync((query, params) => {
      // Rebuild data from URL during state sync
    })

    context.onAppInstall((app) => {
      // Register cleanup logic on app install
    })
  }
}
```

### PluginContext API

| Property/Method | Description |
| --- | --- |
| `currentRoute` | Current route location (read-only) |
| `resolve(location)` | Resolve route location |
| `router` | Router instance reference |
| `paramsManager` | Core ParamsManager instance |
| `hasPlugin(name)` | Check if a plugin is registered |
| `onEnrichLocation(hook)` | Register enrich location hook |
| `onAfterResolve(hook)` | Register after resolve hook |
| `onPrepareNavigation(hook)` | Register prepare navigation hook |
| `onCompleteNavigation(hook)` | Register complete navigation hook |
| `onNavigationAbort(hook)` | Register navigation abort hook |
| `onRouteSync(hook)` | Register route sync hook |
| `onAppInstall(hook)` | Register app install hook |

## Next Steps

- [Navigation](./navigation) — Detailed usage of plugin-dependent features
- [Interceptor Mechanism](./interceptor) — In-depth explanation of InterceptorPlugin
- [Error Handling](./error-handling) — PLUGIN_REQUIRED error code explanation
- [API Reference](../api/create-router) — createRouter() and plugins option
