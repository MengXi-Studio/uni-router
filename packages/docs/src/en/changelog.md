# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.7.1] - 2026-08-31

### Fixed

- **H5 back navigation infinite loop ("unable to go back, keeps flickering")** - Fixed the infinite loop / flicker between adjacent pages caused by the `onBeforeBack` popstate back guard on the H5 platform (issue #39)
  - **Symptom**: After entering Home → Level 2 → Level 3 on H5, performing back (`router.back()` or browser back) from Level 3 caused the page to rapidly switch back and forth between Level 2 and Level 3 without ever returning, with no JS errors in the console
  - **Root cause**: The H5 back guard previously used the strategy "`history.go(1)` to undo the back → re-run `navigateBack` after the guard passes". On H5, `navigateBack` fires **multiple** `popstate` events; when these self-triggered `popstate` events were misidentified as "new external backs" due to delayed dispatch timing, the code re-entered the "undo + replay" branch, forming an infinite loop
  - **Fix**: Before calling `router.back()` and any back after the guard passes, set an H5 in-progress back flag and **allow** every `popstate` produced by this navigation **within a time window** (no longer entering the "undo + replay" branch); also **track the target back path — matching the target URL marks the back complete** (deterministic termination), with the time window as a fallback that auto-resets
  - **Guard semantics preserved**: When the guard passes, it returns to the previous page normally; when the guard aborts, it stays on the current page. No more infinite loops in either case
  - Affected files: `router/back-guard.ts` (H5 in-progress back flag + target-match detection)、`router/index.ts` (pre-flag in `back()`)

## [2.7.0] - 2026-08-30

### Added

- **H5 navigation animations (CSS transitions)** - Extended navigation animation capability from the App platform to H5, using injected keyframe CSS to produce transitions aligned in naming with the App-side `animationType` (based on `transform` / `opacity`)
  - After a successful `push` (`uni.navigateTo`), plays the **enter animation** (`animatePageEnter`) on the target page, deferred to the next frame via `requestAnimationFrame` to wait for the page to finish rendering
  - For `back` (`uni.navigateBack`), first plays the **exit animation** (`animatePageExit`) on the current page, then performs the actual back after the animation ends, matching the App-side slide-out effect
  - Supports directional keyframes such as `slide-in/out-*`, `fade-in/out`, `zoom`, `pop`; styles are auto-cleaned after the animation ends (`animationend`), with a timer fallback to avoid residue during fast page switches
  - Default duration `300ms` (`DEFAULT_ANIMATION_DURATION`), overridable via `duration`
- **`plugins/animation/h5.ts` module** - H5 animation style injection (idempotent) and enter/exit animation playback logic. Since the npm build is produced by tsup and does not process `#ifdef H5` conditional compilation, it uses the runtime `getPlatform().isH5` platform check

### Changed

- **Animation effective values now unified at the router layer** - `meta.animation` is only injected into navigation options when `AnimationPlugin` is registered; without registration it has no effect even when configured. `navigate.ts` no longer falls back to reading `meta.animation` internally, consistent with the `PLUGIN_REQUIRED` gating for passing `animation` at call time
- **Unified animation platform capabilities** - App uses native window animations (`animationType`), H5 uses CSS transitions for `push` / `back`, and mini-program is controlled by the host

### Refactored

- Extracted helper modules such as `navigation/helpers/uni-api.ts`, `plugins/animation/helpers`, `plugins/interceptor/helpers/parse.ts` to consolidate the uni navigation calls and platform detection logic

## [2.6.0] - 2026-08-27

### Added

- **Global back guard `onBeforeBack`** - New `router.onBeforeBack()` method that intercepts back operations (App physical back key / top navigation bar back / `uni.navigateBack`, H5 browser back button / back gesture)
  - Returning `false` blocks the back, `true` / `undefined` allows it; supports async (Promise) and is not limited by uni-app's synchronous `onBackPress` return
  - On App, wired via the global mixin's `onBackPress` to the physical back key / nav bar back / `navigateBack`; after the guard passes it returns manually, using internal flags to avoid recursion
  - On H5, wired to browser back via the `popstate` event, using the "undo the back → run the guard chain → re-run the back after the guard passes" strategy
  - After the guard passes, it reuses the `beforeEach` → `beforeResolve` guard chain; abort / redirect behavior matches full navigation
  - New `BackGuard` / `BackGuardReturn` types
  - Platform limits: App / H5 can be intercepted; iOS swipe-back requires `app.setSideSlipGesture` to disable the gesture; native mini-program back cannot be intercepted
- **iOS swipe-back gesture control (`app.setSideSlipGesture`)** - New `RouterOptions.app` App-platform-specific config that dynamically sets the iOS swipe-back gesture per current route (maps to `plus.webview.setStyle({ popGesture })`)
  - `'none'` disables swipe-back so it flows through the guard chain (`onBeforeBack` takes effect)
  - `'close'` enables the native swipe-back gesture, preserving the native gesture experience (swipe bypasses the guard)
  - Called automatically by the global mixin on page `onShow`, effective only on iOS
  - New `AppRouterOptions` / `SideSlipGesture` types
- **`getPlatform()` platform detection utility** - Unified platform detection entry, based on `uni.getSystemInfoSync()` with caching
  - Returns `PlatformInfo`: `isApp` / `isH5` / `isMp` / `isIOS` / `isAndroid` / `uniPlatform` / `osName`
  - Backward compatible: when `uniPlatform` is missing, falls back to `typeof plus` / `typeof window` to infer App / H5
  - New `plus` global object and `uni.getSystemInfoSync()` type declarations

### Changed

- **Unified platform detection** - InterceptorPlugin's `isWebPlatform()` now uses `getPlatform().isH5`, removing scattered `typeof window` / `typeof document` special checks

## [2.5.0] - 2026-08-23

### Added

- **RouterLink renders as a native `<a>` tag on H5** - Restores the native capabilities of browser links (semantics, right-click new tab, URL recognition, accessibility, native `href` behavior)
  - On H5 it renders as `<a :href>` via `#ifdef H5` conditional compilation, with `href` provided reactively by `useLink`; a normal left-click calls `preventDefault` and defers to router navigation, **with the guard chain still applied**
  - Modifier keys (Ctrl/Cmd/Shift/Alt) or a middle-click preserve native browser behavior (e.g., open in a new tab)
  - `href` automatically adapts to hash routing (`#` prefix), ensuring right-click "open in new tab" routes correctly
  - Other platforms (App / mini-program) render as `<navigator>` (uni-app native navigation component), behavior unchanged
  - Modifier-key detection and hash-prefix logic in the script use `#ifdef H5` conditional compilation, stripped at compile time on non-H5 platforms to avoid the navigation being wrongly intercepted due to non-H5 event objects lacking the `button` property

## [2.4.0] - 2026-08-21

### Added

- **Controllable Redirect** - Completes the guard return-value mode with redirect-method control, allowing explicit specification of the navigation method used for a redirect by returning a `{ location, mode }` object
  - New `NavigationRedirect` interface extending `NavigationGuardReturn` (adding a `| NavigationRedirect` branch)
  - `mode` supports `'push'` (`uni.navigateTo`) / `'replace'` (`uni.redirectTo`) / `'relaunch'` (`uni.reLaunch`)
  - Redirect method priority: explicit `mode` > original navigation method > `back` falls back to `relaunch`
  - When `mode` is omitted, behavior is unchanged (uses the original navigation method), fully backward compatible
  - `guardRoute()` cold-start flows also support controllable redirects
  - Example:

```typescript
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		// Use replace to go to the login page, avoiding the login page lingering in the page stack
		return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
	}
})
```

### Fixed

- **Double `?` when injecting internal keys into string paths containing a query** - `injectQueryKey` did not split the existing query when injecting `__nav_id` / `__params_key` into a string path already containing a query (e.g., `'/detail?id=1'`), producing a malformed URL like `?id=1?__nav_id=...`
  - Fix: string paths are first split on `?` into path + existing query, then merged and injected, resulting in `?id=1&__nav_id=...`
  - This also benefits ChannelPlugin (`__nav_id`) and ParamsPlugin (`__params_key`)

## [2.3.1] - 2026-08-21

### Fixed

- **RouterLink console error on H5** - Replaced the root element from `<navigator>` to `<view>`, fixing the uni-h5 console error `[ERROR] <navigator/> should have url attribute` fired on every click on H5
  - `<view>` also supports press-state properties like `hover-class` / `hover-stop-propagation` / `hover-start-time` / `hover-stay-time`
  - Actual navigation is fully driven by `@click.stop="handleClick"` calling the router API, so navigation functionality is unaffected

### Changed

- **Component emits type refactor** - Converted `RouterLinkEmits` and `TabBarEmits` from `interface` to `type` aliases, consistent with the style of other type definitions

## [2.3.0] - 2026-08-19

### Added

- **`useLink` composable API** - Exposes RouterLink's internal behavior as a composable function for building custom navigation components
  - Behavior matches Vue Router 4.x's `useLink`, returning reactive route info, match state, and a navigation method
  - Returns: `route` (resolved route), `href` (target path), `isActive` (is it a match), `isExactActive` (is it an exact match), `navigate` (performs navigation)
  - Example:

```typescript
import { useLink } from '@meng-xi/uni-router'

const { href, isActive, navigate } = useLink({
	to: { name: 'pagesDetailDetail', query: { id: '1' } }
})

// Reactive binding
const classes = computed(() => ({
	'nav-link': true,
	'nav-link-active': isActive.value
}))
```

- **`isNavigationFailure` utility function** - Navigation failure type-checking helper, replacing manual `instanceof` + `code` checks

```typescript
import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

try {
	await router.push('/somewhere')
} catch (error) {
	if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED)) {
		// Ignore duplicated navigation
	}
}
```

- **`UseLinkOptions` / `UseLinkReturn` types** - Option and return types for `useLink`

## [2.2.0] - 2026-08-18

### Breaking Changes

- **`next()` callback mode fully removed** - The guard system now fully adopts the return-value mode, fully consistent with Vue Router 4.x
  - Removed the `NavigationGuardNext` type; the `(to, from, next)` three-argument signature is no longer supported
  - Removed the `NavigationGuardNextOptions` type; `next(location, { mode })` is no longer available
  - Removed the `runGuardWithNext()` function and the entire `next` callback execution path
  - Removed the `runGuard()` mode-detection dispatcher, replaced by a `runGuard()` that only supports return-value mode
  - The `NavigationGuard` type signature changed from `(to, from, next?)` to `(to, from)`
  - Guards control navigation behavior solely through their return value:
    - `return undefined` / `return true` → allow
    - `return false` → abort navigation (`NAVIGATION_ABORTED`)
    - `return '/login'` / `return { name: 'login' }` → redirect
    - `return new Error()` / `throw new Error()` → cancel navigation (`NAVIGATION_CANCELLED`)

### Added

- **`onBeforeRouteLeave` composable API** - An in-component leave guard that controls the leave navigation via its return value and is automatically removed when the component unmounts
  - Behavior matches Vue Router 4.x's `onBeforeRouteLeave`, supporting both sync and async guards
  - Example:

```typescript
import { onBeforeRouteLeave } from '@meng-xi/uni-router'

// Sync leave confirmation
onBeforeRouteLeave(() => {
	if (hasUnsavedChanges) {
		return false
	}
})

// Async confirmation dialog
onBeforeRouteLeave(() => {
	if (hasUnsavedChanges) {
		return new Promise(resolve => {
			uni.showModal({
				title: '确认离开',
				content: '有未保存的修改，确定要离开吗？',
				success: res => resolve(res.confirm)
			})
		})
	}
})
```

- **`RouteLeaveGuard` type** - In-component leave guard function type, with the same return values as `NavigationGuard`

### Important Limitation

`onBeforeRouteLeave` can only intercept navigation that goes through the router (`push` / `replace` / `back` / `relaunch`); it cannot intercept the physical back key, swipe-back gesture, browser back button, or the mini-program top-left back button.

### Migration Guide

1. Rewrite `(to, from, next) => { next() }` as `(to, from) => { return }`
2. `next(false)` → `return false`
3. `next({ name: 'login' })` → `return { name: 'login' }`
4. `next({ name: 'login' }, { mode: 'replace' })` → `return { name: 'login' }` (`mode` is no longer supported; the redirect reuses the original navigation method)

## [2.1.0] - 2026-08-16

### Added

- **Guard return-value mode (Vue Router 4.x compatible)** - Guards now fully support controlling navigation behavior through their return value, without calling the `next()` callback
  - `return undefined` / `return true` — allow
  - `return false` — abort navigation (`NAVIGATION_ABORTED`)
  - `return RouteLocationRaw` — redirect
  - `return Error` / `throw Error` — cancel navigation (`NAVIGATION_CANCELLED`)
  - `return { location, mode }` — redirect + specify navigation method
- **`NavigationGuardReturn` type** - Guard return-value type supporting `void | undefined | boolean | RouteLocationRaw | Error | null`
- **`afterEach` accepts a `failure` argument** - The third argument `failure` of the after hook is passed on failed navigation, letting you distinguish successful/failed navigation

### Changed

- **Automatic guard mode detection** - Detects the mode by the number of function parameters: three params `(to, from, next)` → callback mode (backward compatible), two params `(to, from)` → return-value mode (recommended)
- **Mixing warning** - A console warning is shown when both the `next()` callback and a return value are used

### Compatibility

- The `next()` callback mode remains fully compatible and is marked deprecated
- Legacy guard code continues to work without modification

## [2.0.0] - 2026-07-13

### Added

- **Plugin architecture** - Core functionality is split into plugins registered on demand; unregistered plugins add no bundle size or runtime overhead
  - `RouterPlugin` interface - a Swiper.js-style plugin system that registers hooks via `install(context, options)`
  - `PluginContext` interface - the hook-registration API the router exposes to plugins, supporting 7 lifecycle hooks
  - `RouterOptions.plugins` - plugin registration config; passing an array of plugins enables the corresponding features
  - `PLUGIN_REQUIRED` error code - thrown when using a feature whose plugin is not registered, helping quickly locate issues
- **ParamsPlugin** - Page parameter passing plugin (split out of the core)
  - `push` / `replace` / `relaunch` support `params` to pass complex data without exposing it in the URL
  - Persistent storage of params via `persistent`; still readable after an H5 refresh
  - `RouterOptions.paramsPersistent` global default
- **ChannelPlugin** - Inter-page communication plugin (split out of the core and enhanced)
  - `useUniEventChannel` option - when enabled, all navigation methods (push/replace/relaunch) support `eventChannel`
  - `UniEventChannel` class - implemented on the `uni.$emit/$on/$off/$once` global event bus, replacing the native EventChannel that was only available for push
  - Sticky event caching - `emit()` always caches event args, and `on()` / `once()` asynchronously fire cached events on registration, resolving timing races
  - `usePageChannel()` composable API - a convenient way for the target page to obtain the communication channel
  - `noopChannel` export - an empty-operation channel returned when there is no `__navId`, avoiding null pointers
- **InterceptorPlugin** - uni API interception plugin (split out of the core)
  - The `RouterOptions.interceptUniApi` option requires this plugin to take effect
  - Intercepts `navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack` to unify the guard flow
- **AnimationPlugin** - Navigation animation plugin (split out of the core)
  - `push` / `replace` / `back` support animation arguments, effective only on App
  - Route-level `meta.animation` default animation config
- **`applySyncHooks` navigation preprocessing** - Runs `routeSyncHooks` before `setCurrentRoute`, extracting internal keys like `__nav_id` from query into params, so `usePageChannel()` can correctly obtain the channel during the target page's `onLoad` / `<script setup>`

### Changed

- **`syncRoute` de-duplication optimization** - Runs `runSyncHooks` before comparing to remove internal keys (e.g., `__nav_id`, `__params_key`) from the URL query, avoiding an extra `onRouteChange` firing on every `onShow` due to internal-key differences
- **Centralized route-location parsing** - Logic such as `resolveLocation` / `extractParamsKey` in `router/index.ts` was extracted to `utils/route.ts`, removing duplication with `router/location.ts`
- **Data sharing between plugins** - `pluginData: Record<string, any>` is passed between stages of the navigation flow; plugins read/write data via agreed keys, avoiding direct coupling

### Breaking Changes

- **`createRouter` must explicitly register plugins** - `params` / `events` / `animation` / `interceptUniApi` features are no longer available by default; you must register the corresponding plugins in the `plugins` array

```typescript
// 1.x - features available by default
const router = createRouter({ routes, interceptUniApi: true })

// 2.0 - plugins must be registered explicitly
const router = createRouter({
	routes,
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin],
	interceptUniApi: true
})
```

- **`@meng-xi/uni-router/plugins` subpath export** - Plugins can be imported from both the main entry `@meng-xi/uni-router` and the subpath `@meng-xi/uni-router/plugins`
- **Unregistered-plugin features throw `PLUGIN_REQUIRED`** - Using `params` without ParamsPlugin, `events` without ChannelPlugin, `animation` without AnimationPlugin, or setting `interceptUniApi: true` without InterceptorPlugin all throw a `PLUGIN_REQUIRED` error

### Migration Guide

1. Add a `plugins` array in `createRouter` and register the feature plugins you need
2. Import plugins from `@meng-xi/uni-router`: `import { ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin } from '@meng-xi/uni-router'`
3. Import `usePageChannel()` from the `@meng-xi/uni-router` main entry
4. For the uni_modules version, import from `./uni_modules/mxuni-router-v2/js_sdk/index.js`

## [1.11.0] - 2026-07-10

### Added

- **TabBar / TabBarItem components** - Custom bottom navigation bar, to be used together
  - TabBar Props: `color` / `selectedColor` / `bgColor` / `borderStyle` / `fixed` / `border` / `placeholder` / `safeAreaInsetBottom` / `zIndex` / `beforeChange`
  - TabBar Events: `change(item, index)` / `error(error)`
  - TabBarItem Props: `to` / `text` / `iconPath` / `selectedIconPath` / `dot` / `badge` / `badgeMax` / `badgeColor` / `replace`
  - TabBarItem Slots: `#icon="{ active }"` custom icon, `default` custom text
  - Built-in badge system: `dot` small dot (higher priority than badge), `badge` numeric/text badge, `badgeMax` cap, `badgeColor` custom color
  - `beforeChange` interceptor: returning `false` or rejecting prevents the switch; supports async
- **SCSS theming** - Component styles migrated to SCSS, supporting two-level overrides
  - SCSS variable `!default`: compile-time override (via vite `css.preprocessorOptions.scss.additionalData`)
  - CSS custom properties: runtime override (set `--mx-tabbar-*` / `--mx-tabbar-item-*` on the parent element)
  - TabBar variables: `--mx-tabbar-height` / `--mx-tabbar-background` / `--mx-tabbar-border-color`
  - TabBarItem variables: `--mx-tabbar-item-icon-size` / `--mx-tabbar-item-font-size` / `--mx-tabbar-item-gap` / `--mx-tabbar-badge-color` / `--mx-tabbar-badge-dot-size` / `--mx-tabbar-badge-font-size` / `--mx-tabbar-badge-min-width` / `--mx-tabbar-badge-line-height` / `--mx-tabbar-badge-padding`
- **`TabBarItemProps` type export** - New export from the `@meng-xi/uni-router` main entry for typing the TabBar `change` event callback

### Changed

- **Component directories restructured to the easycom convention** - Components changed from flat files to the `components/<name>/<name>.vue` nested structure, conforming to easycom auto-registration
  - `components/RouterLink.vue` → `components/router-link/router-link.vue`
  - `components/TabBar.vue` → `components/tab-bar/tab-bar.vue`
  - `components/TabBarItem.vue` → `components/tab-bar-item/tab-bar-item.vue`
  - Shared context `tabbar-context.ts` → `tab-bar/context.ts`
  - Component types extracted to a sibling `type.ts` (`router-link/type.ts`, `tab-bar/type.ts`)
- **uni_modules version imports local js_sdk** - Component imports inside the mxuni-router package changed from `@meng-xi/uni-router` to the relative path `../../js_sdk/index`, removing the runtime dependency on the npm package
- **uni_modules version tag name change** - `<mxuni-router>` changed to `<RouterLink>` (easycom auto-registration)
- **Component TypeScript type extraction** - Each component's props/emits types extracted to a sibling `type.ts`; shared context (InjectionKey + interface) placed in `context.ts`
- **Component CSS → SCSS** - RouterLink, TabBar, and TabBarItem styles all migrated to SCSS using variables and custom properties

### Migration Notes

npm users need to update their component import paths:

| Old path                                          | New path                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `@meng-xi/uni-router/components/RouterLink.vue`   | `@meng-xi/uni-router/components/router-link/router-link.vue`     |
| `@meng-xi/uni-router/components/TabBar.vue`       | `@meng-xi/uni-router/components/tab-bar/tab-bar.vue`             |
| `@meng-xi/uni-router/components/TabBarItem.vue`   | `@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue`   |

uni_modules users need no changes; easycom auto-registers `<RouterLink>` / `<TabBar>` / `<TabBarItem>`.

## [1.10.0] - 2026-07-09

### Added

- **Built-in inter-page communication manager** - New `useUniEventChannel` option and `UniEventChannel` class, implemented on the `uni.$emit/$on/$off/$once` global event bus, replacing the native `uni.navigateTo` EventChannel so all navigation methods (push/replace/relaunch) support bidirectional inter-page communication
  - `RouterOptions.useUniEventChannel?: boolean` (default `false`) - when enabled, all navigation methods use the built-in communication manager; when default `false`, only `push` uses the native `uni.navigateTo` EventChannel and other methods do not support page communication
  - `UniEventChannel` class - implements the `EventChannel` interface with `emit` / `on` / `once` / `off` methods; each navigation generates a unique `navigationId` (format `nav-<timestamp>-<seq>`), wrapped by `wrapEventName()` as `uni-router:{navId}:{eventName}` to isolate event channels and avoid cross-talk between navigations
  - `__nav_id` is passed through the URL query; the target page reads and rebuilds the channel on `syncCurrentRoute`, so communication can be restored after an H5 refresh
  - New `noopChannel` export - an empty-operation channel whose methods are all no-ops that return itself; `usePageChannel()` returns `noopChannel` when there is no `__navId`, avoiding null pointers
- **Sticky event caching** - `emit()` always caches event args to `pendingEvents`; `on()` / `once()` asynchronously fire already-cached events on listener registration (without deleting the cache), resolving the timing race between the sender's `emit` and the target page's `setup` listener registration
  - Applicable scenario: after navigating, the sending page immediately `emit`s; the target page's `on` listener in `setup` still receives the cached event
  - The cache is cleaned up with `UniEventChannel.destroy()` (called automatically on page `onUnmounted`)
- **`usePageChannel()` composable API** - A convenient way for the target page to obtain the communication channel
  - Reads `route.params.__navId` and returns the corresponding `UniEventChannel` instance; returns `noopChannel` when there is no `__navId`
  - Calls `destroyChannel(navId)` automatically on `onUnmounted()` to clean up listeners and cache, avoiding memory leaks
- **`NavigationResult` return type** - The `push` / `replace` / `relaunch` return value was extended from `RouteLocation` to `NavigationResult` (inherits `RouteLocation`, adds optional `eventChannel?: EventChannel`)
  - Default mode: `eventChannel` is available only for `push` (corresponding to `uni.navigateTo`)
  - `useUniEventChannel: true`: all navigation methods return the built-in `UniEventChannel`
  - Type backward compatible: `NavigationResult extends RouteLocation`, so the original `const route: RouteLocation = await router.push(...)` still works
- **Channel registry (internal)** - `registerChannel` / `getOrCreateChannel` / `getRegisteredChannel` / `hasChannel` / `destroyChannel` manage the `navId → UniEventChannel` mapping
  - `registerChannel` uses a first-wins strategy: returns false if a channel for the same `navId` already exists, avoiding duplicate registration
  - `getOrCreateChannel` reuses a registered channel first, creating a new one otherwise
- **RouterLink's `navigated` event supports all navigation methods** - With the `NavigationResult` return type, `navigate()` now fires the `navigated` event uniformly for push/replace/relaunch and passes `eventChannel` (only push has a value in default mode; all methods have a value when `useUniEventChannel: true`); in 1.9.0 replace/relaunch had no `eventChannel` and only push fired it, which was the consistent behavior at the time

### Changed

- **Improved JSDoc for RouterLink's `events` prop and `navigated` event** - Clarifies that in default mode `events` only works for `push` and `navigated`'s `eventChannel` only has a value for `push`; after enabling `useUniEventChannel`, all navigation methods are affected

## [1.9.0] - 2026-07-06

### Added

- **Global mixin auto-sync of route state** - `install()` registers `app.mixin({ onShow() { router.syncRoute() } })`, so every page auto-syncs route state on `onShow` without manually calling `syncRoute()` in each page
  - The mixin hook runs before the component's own `onShow`; combined with `syncRoute()`'s de-duplication (skips when path + query are identical), redundant syncs are avoided
  - When the app returns from background, the active page's `onShow` auto-triggers sync; no manual call is needed in `App.vue`'s `onShow`
  - `onLoad` precedes `onShow`; call `syncRoute()` manually if you need to read route info in `onLoad`

### Fixed

- **params lost after `back()`** - During `push` / `replace`, the actual navigation URL preserves `__params_key` (not visible in `route.query`); after `back()` returns to the original page, `syncCurrentRoute` reads the key from the URL and rebuilds params with `peek`
  - **Issue**: `matcher.resolve` removes `__params_key` from the query, leaving the actual navigation URL without the key, so params could not be rebuilt from the URL after `back()`
  - **Fix**: `performNavigation` extracts the key via `extractParamsKey` after resolving, and `executeNavigation` stitches the key back into the query of the actual navigation URL; `syncCurrentRoute` reads the key from the URL and rebuilds params with `peek` (not `get`) to avoid lazy cleanup deleting by mistake
- **`setCurrentRoute` timing** - `setCurrentRoute(to)` was moved to before the uni navigation API call, ensuring `route.value` is already the complete target route (including `name` / `params`) when the target page's `onLoad` / `onShow` run
  - **Issue**: previously `setCurrentRoute` ran after the uni API succeeded, so when the target page's `onLoad` / `onShow` fired, `currentRoute` was still the source route and `route.value` lacked the target route info
  - **Fix**: call `setCurrentRoute(to)` before calling `navigateTo` / `replaceTo` / `relaunchTo`; roll back to `from` if the navigation API fails

## [1.8.1] - 2026-06-26

### Fixed

- **`interface` objects cannot be assigned to the `params` field** - Fixed the type error when `router.push({ params })` receives an object defined with `interface` in v1.8.0
  - **Issue**: In v1.8.0, the types of `RouteLocationPathRaw.params` / `RouteLocationNamedRaw.params` were `interface ParamObject` (with index signature `{ [key: string]: ParamValue }`). Under strict TypeScript, `interface`-defined object types have no explicit index signature and cannot be assigned to index-signature types, so `const params: MyInterface = {...}; router.push({ params })` failed with "Index signature for type 'string' is missing"
  - **Fix**: Added a `ParamsInput` type (`object`) as the input-side type; the `params` field now uses `ParamsInput`, which structurally subtypes any `interface` object. On the output side, `ParamObject` changed from `interface` to a `type` alias (`Record<string, ParamValue>`), preserving index-signature access
  - **Design note**: Research on vue-router's `RouteParamsRawGeneric` (`Record<string, RouteParamValueRaw | ...[]>`) found that its value type only contains primitives (`string | number | null | undefined`), and `interface` objects with primitive-typed properties structurally subtype `Record`. But mxuni-router's `ParamValue` includes `object` / `ParamValue[]` branches (for complex data). In that case, `Record<string, ParamValue>` is still incompatible with `interface` objects under strict vue-tsc, so `object` is required
  - JSON serializability is validated at runtime by `ParamsManager`
  - New `ParamsInput` type export

## [1.8.0] - 2026-06-25

### Added

- **Cold-start guard check `guardRoute()`** - Solves the problem where, when a user enters a page directly via an H5 URL / mini-program scene value / App deeplink, the page is loaded directly by the uni-app framework without going through router navigation, so guards (beforeEach, etc.) do not run
  - `Router.guardRoute(location?, options?)` - Runs the guard chain check for a given route (without actually navigating) and decides whether to redirect based on the guard result
  - `GuardRouteOptions` - option type including an `onAbort` callback fired with a `NavigationFailure` when the guard aborts
  - Behavior: guard passes → no navigation, resolves the target route; guard redirects → navigates using the guard-specified method (default `relaunch`, clearing the stack to avoid returning to a protected page); guard aborts → calls the `onAbort` callback and rejects with `NavigationFailure`
  - Runs the full guard chain: `beforeEach` → `beforeEnter` → `beforeResolve`
  - Typical usage: in `App.vue`'s `onLaunch`, call `router.isReady().then(() => router.guardRoute(undefined, { onAbort: () => router.relaunch('/pages/index/index') }))`
- **`UniApiError` / `UniApiCause` type exports** - Exported the previously internal uni API error types to improve the type readability of `NavigationFailure.cause`
  - `UniApiCause` - the error-reason type of the uni navigation API `fail` callback (`{ errMsg: string }`)
  - `UniApiError` - interface containing `api` (the failed API name, e.g., `navigateTo`) and `cause` (the original error reason)
  - `NavigationFailure.cause` narrowed from `unknown` to `UniApiError`, present only on `NAVIGATION_API_ERROR`
  - `isUniApiError()` changed to a type guard (`error is UniApiError`) for narrowing after `instanceof`

### Changed

- **`ParamValue` type compatibility enhancement** - The object branch changed from recursive `ParamObject` to `object`, compatible with `interface`-defined object types (which lack an index signature and cannot be assigned to `{ [key: string]: ... }`); added an `undefined` branch to support objects with optional properties (`JSON.stringify` ignores `undefined` properties)
- **`RouterLink` component refactor** - Location computation logic extracted into a `computed`; when no extra options (animation/events/persistent) are passed, `to` is used directly, avoiding needless object wrapping
- **Tightened uni API `fail` callback types** - In `env.d.ts`, the `fail` callback parameter type of each navigation API (`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`) was narrowed from `unknown` to `UniApiCause`

### Fixed

- **Guard mixing-mode warning** - Outputs a warning when a guard calls both `next()` and returns a Promise (async errors after `next()` are silently swallowed; developers should pick one resolution mode: the `next()` callback or `async/await`, not both)
- **`syncCurrentRoute` param cleanup** - Removed the unused `_from` parameter inside `syncRoute()`

## [1.7.0] - 2026-06-25

### Added

- **Controllable guard redirect method** - The `next()` callback gained an optional `options` argument supporting a specific navigation method for guard redirects
  - `NavigationGuardNextOptions` - the optional argument type of the `next()` callback containing a `mode` field
  - `NavigationRedirectMode` - the redirect-method type (`'push' | 'replace' | 'relaunch'`)
  - `next(location, { mode })` - specifies using `push` / `replace` / `relaunch` on redirect
  - When `mode` is not specified, it reuses the original navigation method that triggered the guard (backward compatible)
  - When the original navigation is `back`, omitting `mode` falls back to `relaunch` (because `back` cannot jump to a target outside the page stack)

### Fixed

- **H5 `interceptUniApi` causes TabBar clicks to freeze** - 1.6.3 restored switchTab going through the guard chain by reordering execution, but synchronously blocking `uni.switchTab` on H5 still leaves the TabBar component's internal "switching" state uncleared, so subsequent clicks are ignored. Now, for H5, switchTab uses the "let the original call through + sync state in the success callback" strategy
  - New `isWebPlatform()` to detect the H5 platform (via the presence of `window` / `document`)
  - New `handleWebSwitchTab()` wraps the `success` callback to call `router.syncRoute()` after switchTab completes
  - Trade-off: external `uni.switchTab` calls on H5 no longer pass through the pre-guard; TabBar page permission control must be handled in the page `onShow` lifecycle
  - Mini-program and App platforms are unaffected and still use the full "block + forward" flow

## [1.6.3] - 2026-06-24

### Fixed

- **`interceptUniApi` makes the H5 TabBar unclickable** - In the interceptor's `invoke` hook, `args.url = ''` ran before `handleInterceptedNavigation()`, causing `parseUniUrl('')` to return an empty path and the `switchTab` navigation to be swallowed. On H5, the TabBar is a Vue component and calls `uni.switchTab`, which after triggering the interceptor left the URL cleared prematurely; on mini-program the TabBar is a native component and clicks do not go through `uni.switchTab`, so it was unaffected. Execution order was swapped: parse the URL and trigger router navigation first, then clear the URL as a safety net, while restoring switchTab to go through the guard chain

## [1.6.2] - 2026-06-23

### Fixed

- **`isReady()` timing fix** - `markReady()` moved from `setCurrentRoute()` into `install()`, ensuring `isReady()` callbacks run after all plugins (e.g., Pinia) are installed, rather than firing immediately when `createRouter()` constructs

## [1.6.1] - 2026-06-23

### Changed

- **`isSameQuery` empty-object fast path** - Added reference equality (`a === b`) and double-empty-object (`keysA.length === 0`) quick returns, avoiding unnecessary `Object.keys` and `every` overhead in high-frequency scenarios
- **Centralized `Object.freeze` logic** - The freeze logic for `meta`, `query`, and `params` was consolidated from `setCurrentRoute` and `createStartLocation` into the `createRouteLocation` factory, removing duplicated code so future conditional freezing needs only one change

## [1.6.0] - 2026-06-23

### Added

- **Page parameter passing (params)** - `push` / `replace` / `relaunch` support `params` for passing complex data (objects, arrays, etc.) without exposing it in the URL; the target page reads it via `route.params`
  - `RouteLocationPathRaw.params` / `RouteLocationNamedRaw.params` - page params passed during navigation, supporting JSON-serializable data
  - `RouteLocation.params` - the resolved route location gained a `params` field (`Readonly<ParamObject>`) readable directly by the target page
  - `ParamObject` / `ParamValue` types - page param type definitions supporting nested objects and arrays
  - `QueryValue` type - query param value type (`string | number | boolean`) for the input type of the `query` field
- **Persistent param storage** - the `persistent` option persists params to `uni.setStorageSync`, still readable after an H5 refresh
  - `RouteLocationPathRaw.persistent` / `RouteLocationNamedRaw.persistent` - specifies whether a single navigation is persistent
  - `RouterOptions.paramsPersistent` - global default; when `true` all params are persistent by default, with single-navigation `persistent` able to override
- **Enhanced query-param methods** - `RouteLocation` provides three convenience methods that automatically parse query params to a specified type
  - `queryInt(key, defaultValue?)` - parses a query param as an integer, returning `defaultValue` on failure
  - `queryNumber(key, defaultValue?)` - parses a query param as a number (supports floats), returning `defaultValue` on failure
  - `queryBool(key, defaultValue?)` - parses a query param as a boolean (`'true'`/`'1'` → `true`, `'false'`/`'0'` → `false`), returning `defaultValue` when unrecognizable
- **RouterLink `params` prop** - declarative navigation supports passing page params, corresponding to `push`'s `params` option
- **RouterLink `persistent` prop** - declarative navigation supports param persistence, corresponding to `push`'s `persistent` option

## [1.5.0] - 2026-06-18

### Added

- **Router ready-timeout protection** - the `readyTimeout` config option to prevent `isReady()`'s Promise from hanging forever if router initialization fails
  - `RouterOptions.readyTimeout` - router ready timeout in milliseconds, default `0` (never times out); when set above 0, `isReady()` rejects after the timeout
  - `router.isReady()` timeout rejection - when `readyTimeout > 0` and the router does not finish initializing within the deadline, `await router.isReady()` throws a timeout error

### Fixed

- **`interceptUniApi` interceptor list doc omitted `reLaunch`** - The v1.0.0 docs only listed four APIs (`navigateTo` / `redirectTo` / `switchTab` / `navigateBack`), while the actual implementation (including the v1.3.0 addition) intercepts five; `reLaunch` was added to the docs
- **`RouteMeta` index-signature type fix** - `[key: string]` changed from `unknown` to `any`, consistent with the actual implementation
- **`router.back()` return value doc fix** - Return type corrected from `Promise<void>` to `Promise<RouteLocation>`, consistent with the actual implementation

## [1.4.0] - 2026-06-14

### Added

- **EventChannel inter-page communication** - `push` supports the `events` argument and an `eventChannel` return value for bidirectional inter-page communication
  - `RouteLocationPathRaw.events` / `RouteLocationNamedRaw.events` - event listeners passed during navigation that listen for events the target page sends via `eventChannel.emit`
  - `NavigationResult.eventChannel` - the `push` result gained an `eventChannel` field for sending events to the target page
  - `EventChannel` interface - full `on` / `once` / `off` / `emit` method definitions
  - `EventListeners` type - the event-listener map type
  - Passing `events` in non-push modes (replace / relaunch) outputs a warning and ignores it
  - TabBar pages (switchTab) do not support `events`; passing them outputs a warning and ignores it
- **RouterLink `events` prop** - declarative navigation supports inter-page communication, corresponding to `uni.navigateTo`'s `events` argument
- **RouterLink `@navigated` event** - fires after successful navigation with the argument `EventChannel | undefined`; only push mode returns an `eventChannel` instance
- **uni API interceptor supports `events`** - When intercepting `uni.navigateTo`, the `events` argument is extracted and forwarded to the router
- **Type exports** - New `EventChannel` and `EventListeners` type exports

## [1.3.0] - 2026-06-12

### Added

- **relaunch navigation method** - `router.relaunch(location)` closes all pages and opens the target page, corresponding to `uni.reLaunch`
  - TabBar pages automatically switch to `uni.switchTab`
  - `uni.reLaunch` does not support animation arguments; passing them outputs a warning
  - No duplicate-navigation detection (in a stack-clearing scenario the target page may be the current page)
  - Runs the full guard chain (beforeEach → beforeEnter → beforeResolve → afterEach)
- **RouterLink `relaunch` prop** - declarative navigation supports relaunch mode, with higher priority than `replace`
- **uni API interceptor adds `reLaunch`** - intercepts `uni.reLaunch` calls and forwards them to `router.relaunch()`

## [1.2.0] - 2026-06-11

### Added

- **Navigation animations** - Complete page-transition animation support, effective only on App and auto-ignored on other platforms
  - `NavigationAnimation` interface - animation config type containing `type` and optional `duration`
  - `UniAnimationType` type - covers all animation types uni-app supports (slide-in/out, fade-in/out, zoom-in/out, pop-in/out, auto, none)
  - `DEFAULT_ANIMATION_DURATION` constant - default animation duration 300ms
  - `RouteLocationPathRaw.animation` / `RouteLocationNamedRaw.animation` - animation arguments passed at navigation time, overriding `meta.animation`
  - `RouteMeta.animation` - route-level default animation config
  - `back(delta?, animation?)` - `back()` gained an optional `animation` argument
  - RouterLink gained an `animation` prop for declarative navigation animations
  - Animation priority: `passed at call time` > `meta.animation` > `uni default`

## [1.1.2] - 2026-06-10

### Fixed

- **`getCurrentPages()` environment protection** - New `safeGetCurrentPages()` function that returns an empty array when `getCurrentPages` does not exist in SSR / Node environments, avoiding a `ReferenceError`
- **Interceptor `invoke` low-version base-library compatibility** - Before intercepting an external navigation call, `args.url` is set to an empty string to prevent low-version mini-program base libraries from ignoring the `false` return value and running the original API anyway
- **Interceptor duplicate-installation warning** - `installInterceptors` outputs `console.warn` when it detects an existing active manager, reminding that only a single router instance is supported

## [1.1.1] - 2026-06-09

### Fixed

- **`back()` did not fire the `afterEach` guard** - `router.back()` did not run the `afterEach` hook after navigation completed; fixed
- **`back()` guard-mode error** - The guard mode for `back()` navigation was corrected from `'push'` to `'back'`, ensuring the guard chain correctly recognizes the back navigation
- **`syncRoute()` ignored query changes** - `syncRoute()` only compared paths, not query params, so route state was not synced when query changed; it now compares both path and query
- **`app.onUnmount` compatibility** - Calling `app.onUnmount` directly in `install` errors in uni-app environments (the API is new in Vue 3.5+); a defensive check was added

## [1.1.0] - 2026-06-08

### Added

- **Guard timeout protection** - the `guardTimeout` config option; navigation is auto-aborted when a guard does not call `next()` within the deadline, default 10000ms, set to 0 to disable
- **Route-change listener** - `router.onRouteChange()` registers a route-state-change listener fired on navigation completion and state sync, returning a function to remove the listener
- **Route-state sync marker** - the `RouteLocation.synced` field marking whether a route change was triggered by state sync (e.g., the physical back key)
- **RouterLink error event** - the `<mxuni-router>` component gained an `@error` event firing on navigation failure, passing a `NavigationFailure` object

### Changed

- **Enhanced uni API interception** - Optimized the `interceptUniApi` interceptor logic for greater interception stability
- **Enhanced guard execution** - Optimized the guard-chain execution logic with timeout protection and error handling
- **Enhanced composable API** - Optimized the internal implementation of `useRouter()` / `useRoute()`
- **fullPath determinism** - `buildFullPath` sorts query param keys so the same query produces a consistent `fullPath`
- **install type fix** - `install(app)` parameter type changed from `unknown` to `App` for better type hints

## [1.0.0] - 2026-06-07

### Added

- **Router core** - `createRouter()` creates a router instance supporting the `routes`, `strict`, and `interceptUniApi` options
- **Route navigation** - `router.push()` navigates to a new page, `router.replace()` replaces the current page, `router.back()` goes back to the previous page
- **Named routes** - Navigate via the `name` field without hardcoding path strings
- **Route meta info** - the `meta` field supports `title`, `isTab`, `requireAuth`, and custom extension fields
- **Global before guards** - `router.beforeEach()` runs before every navigation, supporting abort, allow, and redirect
- **Global resolve guards** - `router.beforeResolve()` runs after all before guards and route-scoped guards complete
- **Global after hooks** - `router.afterEach()` runs after navigation completes
- **Route-scoped guards** - the `beforeEnter` option fires when entering a specific route
- **Guard redirects** - calling `next(location)` in a guard redirects to another route, supporting multi-level redirects (max depth 10)
- **Composable API** - `useRouter()` gets the router instance, `useRoute()` gets the current route location
- **Error handling** - the `RouterError` route error class and the `NavigationFailure` navigation failure class (containing `to`, `from`, `cause` info)
- **Global error capture** - `router.onError()` registers error-handling callbacks
- **Route overview** - `router.resolve()` resolves a route location (without navigating), `router.getRoutes()` gets all route configs, `router.hasRoute()` checks whether a route exists
- **TypeScript type hints** - the `RouteNameMap` interface supports module augmentation for autocomplete and type-checking of route names and paths
- **uni API interception** - the `interceptUniApi` option intercepts `uni.navigateTo` / `uni.redirectTo` / `uni.switchTab` / `uni.navigateBack` to unify the guard flow
- **Duplicate-navigation detection** - `push` to the current page is auto-rejected with a `NAVIGATION_DUPLICATED` error
- **Concurrent-navigation queuing** - multiple concurrent navigations are queued automatically; the next runs after the previous completes
- **Path auto-normalization** - paths auto-prepend a leading `/`, and query strings auto-parse into `query` objects

### Error Codes

| Error code             | Description                              |
| ---------------------- | ---------------------------------------- |
| `NAVIGATION_ABORTED`   | Navigation aborted by a guard            |
| `NAVIGATION_CANCELLED` | Navigation cancelled (guard error or redirect limit) |
| `NAVIGATION_DUPLICATED`| Duplicate navigation to the current location |
| `ROUTE_NOT_FOUND`      | No matching route found                  |
| `NAVIGATION_API_ERROR` | uni navigation API call failed           |
| `SETUP_ERROR`          | Router initialization or usage error     |

## [0.1.4] - 2025-07-28

- Added the Hooks function `useMxRouter`
- Added the `Router` component
- `push`, `back`, and `go` on the `Router` class now support animations on the app platform
- Improved md documentation descriptions

## [0.1.3] - 2025-07-24

- Added the `umd.js` file
- Renamed the `MxRouter` class to the `Router` class
- The `Router` class supports singleton-style invocation internally
- The `Router` class added the `customGetCurrentRoute` option and the `setCustomGetCurrentRoute` function for setting a custom `getCurrentRoute` function

## [0.1.1] - 2025-07-20

- Adjusted the directory structure and vite.config configuration; updated the md file content to match the npm package

## [0.1.0] - 2025-07-19

> Initial release. `@mengxi/uni-router` is a routing library tailored for uni-app that closely mirrors the `vue-router` style while shipping practical utility functions, helping developers implement multi-platform routing efficiently.

- **`vue-router`-like style** - Familiar API design that lowers the learning curve and lets `vue-router` users get up to speed quickly
- **Multiple navigation methods** - Supports `push`, `replace`, `launch`, `tab`, `go`, `back` for various navigation scenarios
- **Global guard mechanism** - Before guards (auth checks, route interception) and after hooks (logging, page stats)
- **Utility functions** - Provides `parseLocation`, `buildUrl`, `getCurrentRoute`, etc. to simplify routing operations
- **Multi-platform support** - Compatible with H5, mini-program, App, and other platforms uni-app supports

---

See the [Releases](https://github.com/MengXi-Studio/uni-router/releases) page for the full history.