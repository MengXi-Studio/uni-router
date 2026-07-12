# RouterPlugin

Router plugin interface, designed with reference to the Swiper.js plugin architecture. Each plugin registers hooks into the `PluginContext` via the `install` method, and the router calls registered hooks sequentially at each stage of the navigation flow.

## Type Definition

```ts
interface RouterPlugin {
  /** Plugin name */
  name: string
  /**
   * Install the plugin
   * @param context - Plugin context, used to register hooks
   * @param options - Router initialization options (plugins can read their own options)
   */
  install(context: PluginContext, options: RouterOptions): void
}
```

## Built-in Plugins

| Plugin | name | Description |
| --- | --- | --- |
| `ParamsPlugin` | `'params'` | Page parameter passing (`params`/`persistent`), see [Navigation - params](../guide/navigation#special-usage-params-passing-complex-data) |
| `AnimationPlugin` | `'animation'` | Navigation animation (App only), see [Navigation - Animation](../guide/navigation#special-usage-navigation-animation) |
| `ChannelPlugin` | `'channel'` | Page communication + `usePageChannel()`, see [Navigation - Communication](../guide/navigation#special-usage-page-communication) |
| `InterceptorPlugin` | `'interceptor'` | Intercept uni native navigation APIs, see [Interceptor Mechanism](../guide/interceptor) |

## Registration

Register plugins via the `plugins` option in `createRouter()`:

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin],
  // Plugin-related options
  paramsPersistent: true,      // requires ParamsPlugin
  useUniEventChannel: true,    // requires ChannelPlugin
  interceptUniApi: true        // requires InterceptorPlugin
})
```

## PluginContext

Plugin context, the hook registration interface exposed by the router to plugins.

```ts
interface PluginContext {
  /** Enhance the raw route location before matcher.resolve() */
  onEnrichLocation(hook: (location: RouteLocationRaw) => RouteLocationRaw): void

  /** After resolve, before guards, extract plugin data from the enriched route location */
  onAfterResolve(hook: (enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>) => void): void

  /** Before uni API call, modify navigation URL query and options */
  onPrepareNavigation(hook: (ctx: NavigationPrepareContext) => void): void

  /** After uni API call succeeds, extend NavigationResult */
  onCompleteNavigation(hook: (ctx: NavigationCompleteContext) => void): void

  /** When navigation is aborted or fails, perform cleanup */
  onNavigationAbort(hook: (pluginData: Record<string, any>) => void): void

  /** During syncCurrentRoute, extract plugin data from URL query */
  onRouteSync(hook: (query: Record<string, string>, params: Record<string, any>) => void): void

  ** Triggered when router.install() is called */
  onAppInstall(hook: (app: App) => void): void

  /** Current route location (read-only) */
  readonly currentRoute: RouteLocation

  /** Resolve a route location to a full RouteLocation object */
  resolve(location: RouteLocationRaw): RouteLocation

  /** Router instance reference */
  readonly router: Router

  /** Core ParamsManager instance */
  readonly paramsManager: ParamsManager

  /** Check if a specified plugin is registered */
  hasPlugin(name: string): boolean
}
```

### NavigationPrepareContext

Navigation preparation context, used by plugins before uni API calls:

```ts
interface NavigationPrepareContext {
  /** Target route */
  to: RouteLocation
  /** Source route */
  from: RouteLocation
  /** Navigation mode */
  mode: 'push' | 'replace' | 'relaunch' | 'back'
  /** Data shared between plugins */
  pluginData: Record<string, any>
  /** Actual navigation URL query (mutable) */
  query: Record<string, string>
  /** uni navigation options (mutable) */
  options: UniNavigationOptions
}
```

### NavigationCompleteContext

Navigation completion context, used by plugins after uni API calls succeed:

```ts
interface NavigationCompleteContext {
  /** Target route */
  to: RouteLocation
  /** Navigation mode */
  mode: 'push' | 'replace' | 'relaunch' | 'back'
  /** Data shared between plugins */
  pluginData: Record<string, any>
  /** Native eventChannel (only available in push mode) */
  nativeEventChannel?: EventChannel
  /** Navigation result (mutable: extended by plugins) */
  result: Record<string, any>
}
```

## Custom Plugin Example

```ts
import type { RouterPlugin, PluginContext } from '@meng-xi/uni-router'
import type { RouterOptions } from '@meng-xi/uni-router'

const AnalyticsPlugin: RouterPlugin = {
  name: 'analytics',

  install(context: PluginContext, options: RouterOptions) {
    // Report after navigation completes
    context.onCompleteNavigation((ctx) => {
      trackPageView(ctx.to.path, ctx.mode)
    })

    // Report when navigation is aborted
    context.onNavigationAbort(() => {
      trackEvent('navigation_aborted')
    })
  }
}

// Register
const router = createRouter({
  routes: [...],
  plugins: [AnalyticsPlugin]
})
```

## Next Steps

- [Plugin System](../guide/plugins) — Plugin architecture in detail
- [createRouter()](./create-router) — plugins option
- [Router Instance](./router-instance) — hasPlugin() method
