[中文](./README.md) | **English**

<div align="center">
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/logo.png">
	</a>
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="WeChat Public Account QR Code" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/QR_code.jpg">
	</a>
	<br>
	<h1>@meng-xi/uni-router</h1>
	<p>A vue-router-style routing management system for uni-app</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

</div>

## Features

- **vue-router-style API** - `push` / `replace` / `relaunch` / `back`; automatically falls back to `switchTab` for TabBar routes via `meta.isTab`; rejects duplicate navigation and queues concurrent navigations
- **Route Guards** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter` / `onBeforeRouteLeave` / `onBeforeBack`, with controllable redirect and guard timeout protection (`guardTimeout`)
- **Back Interception** - Guards can intercept App hardware back / navigation-bar back / `navigateBack`, and H5 browser back / back gesture; `app.setSideSlipGesture` controls the iOS side-slip gesture
- **Cold-Start Guard** - `guardRoute()` runs the guard chain for pages entered directly via H5 URL / Mini-Program scene / App deep link, supporting redirects and abort callbacks
- **Named Routes & Route Meta** - Navigate by `name` and carry custom data via `meta` (including `isTab` and default animation)
- **Plugin Architecture** - Params / Animation / Channel / Interceptor plugins registered on demand; using a feature without its plugin throws a clear `PLUGIN_REQUIRED` error
- **TypeScript Type Hints** - Autocompletion and type checking for route names and paths (with [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin))
- **Page Communication** - `usePageChannel()` built-in manager; native `EventChannel` by default on `push`, and all navigation methods once `useUniEventChannel` is enabled
- **Declarative Navigation** - `RouterLink` (renders a native `<a>` tag on H5) + `TabBar` / `TabBarItem` components with badges / red dot / safe-area / before-change interception, SCSS theming supported
- **Page Params** - `params` passes complex data without URL exposure; storage persistence (`persistent`) supported so data survives an H5 refresh
- **Query Enhancement** - `route.queryInt()` / `queryNumber()` / `queryBool()`
- **Navigation Animation** - `push` / `replace` / `back` accept animation params (native window animation on App, exit animation on H5 back); default via `meta.animation`
- **Auto Route State Sync** - `app.use(router)` injects a global mixin that auto-invokes `syncRoute()` on each page's `onShow`; strict mode (`strict`) supported
- **Error Handling** - `RouterError` / `NavigationFailure` / `UniApiError`, `RouterErrorCode` error codes, `isNavigationFailure()` for precise discrimination
- **Composables** - `useRouter()` / `useRoute()` / `usePageChannel()` / `onBeforeRouteLeave()` / `useLink()`

## Installation

```bash
pnpm add @meng-xi/uni-router
```

Optionally use [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) to auto-generate route config and type declarations from `pages.json`:

```bash
pnpm add @meng-xi/vite-plugin -D
```

## Quick Start

### 1. Create Router

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin], // Register plugins on demand
	interceptUniApi: true // Requires InterceptorPlugin, intercept native APIs to ensure guards work
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router) // Injects global mixin that auto-invokes syncRoute() on each page's onShow
	return { app }
}
```

### 2. Route Navigation

```typescript
const router = useRouter()

// Resolve to a NavigationResult (eventChannel available on push by default, for page communication)
await router.push({ path: '/pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })

// Resolve to the updated target RouteLocation
await router.back()
```

> If the target route is declared as a TabBar page via `meta.isTab`, `push` / `replace` / `relaunch` automatically switch to `uni.switchTab`.

### 3. Route Guards

```typescript
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		return { name: 'login' } // redirect
	}
	// return undefined or true to proceed
})

// Component-level leave guard (onBeforeRouteLeave)
import { onBeforeRouteLeave } from '@meng-xi/uni-router'

onBeforeRouteLeave((to, from) => {
	if (hasUnsavedChanges) {
		return false // abort navigation
	}
})

// Back guard (onBeforeBack): intercepts App hardware back / navigation-bar back / navigateBack, H5 back
router.onBeforeBack((to, from) => {
	if (from.meta.requireConfirm) {
		// return false to block, true / undefined to allow; a redirect route may also be returned
		return new Promise(resolve => {
			uni.showModal({
				title: 'Confirm',
				content: 'Are you sure you want to go back?',
				success: res => resolve(res.confirm)
			})
		})
	}
})

// Cold-start guard (guardRoute): re-runs the guard chain for pages entered via
// H5 URL / Mini-Program scene / App deep link. Usually placed in App.vue's onLaunch.
router.isReady().then(() => {
	router.guardRoute(undefined, {
		onAbort: () => router.relaunch('/pages/index/index')
	})
})
```

### 4. Components

```vue
<!-- RouterLink: declarative navigation -->
<RouterLink :to="{ name: 'about' }">About</RouterLink>

<!-- TabBar / TabBarItem: custom bottom navigation -->
<TabBar :before-change="onBeforeChange">
	<TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="Home" />
	<TabBarItem to="/pages/about/about" icon-path="/static/user.png" text="Profile" badge="5" />
</TabBar>
```

## Router Options

`createRouter` accepts the following common options:

| Option               | Type               | Default | Description                                                                                |
| -------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `routes`             | `RouteConfig[]`    | -       | Route config, must match the `pages.json` declarations                                     |
| `strict`             | `boolean`          | `true`  | Strict mode, throws when a named route is not matched                                      |
| `guardTimeout`       | `number`           | `10000` | Guard timeout (ms); warns and aborts navigation on timeout, set `0` to disable             |
| `readyTimeout`       | `number`           | `0`     | Ready timeout (ms); prevents `await router.isReady()` from hanging                         |
| `plugins`            | `RouterPlugin[]`   | `[]`    | Plugins registered on demand                                                               |
| `paramsPersistent`   | `boolean`          | `false` | Whether `params` persist to storage by default (requires ParamsPlugin)                     |
| `useUniEventChannel` | `boolean`          | `false` | Use the built-in communication manager for all navigation methods (requires ChannelPlugin) |
| `interceptUniApi`    | `boolean`          | `false` | Intercept native uni navigation APIs so guards always run (requires InterceptorPlugin)     |
| `app`                | `AppRouterOptions` | -       | App-specific config, e.g. `setSideSlipGesture` for the iOS side-slip gesture               |

## Documentation

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
