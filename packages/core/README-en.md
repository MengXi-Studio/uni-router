[中文](./README.md) | **English**

<div align="center">
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/logo.png">
	</a>
	<br>
	<h1>@meng-xi/uni-router</h1>
	<p>A vue-router-style routing management system for uni-app</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

</div>

## Features

- **vue-router-style API** - Familiar `push` / `replace` / `relaunch` / `back` navigation, zero learning curve
- **Route Guards** - Global `beforeEach`, `beforeResolve`, `afterEach`, and per-route `beforeEnter`
- **Named Routes** - Navigate by `name` instead of hardcoded path strings
- **Route Meta** - `meta` field for page titles, auth flags, TabBar indicators, and custom data
- **TypeScript Type Hints** - Autocompletion and type checking for route names and paths via module augmentation
- **Error Handling** - Complete `RouterError` / `NavigationFailure` system with `onError` global capture
- **Composables** - `useRouter()` / `useRoute()` for convenient router access in components, `useRoute()` returns a reactive ref that auto-updates on route changes
- **RouterLink Component** - Declarative navigation component based on uni-app `navigator`, with `error` event for navigation failure handling
- **uni API Interception** - Optionally intercept native navigation APIs to enforce guard flow
- **Guard Timeout Protection** - Configurable `guardTimeout` to prevent navigation from hanging when guards don't call `next()`
- **Navigation Animation** - Support animation params in `push` / `replace` / `back`, with route-level `meta.animation` defaults. App only, other platforms auto-ignore
- **Page Communication** - `push` supports `events` param and `eventChannel` return value for bidirectional page communication (corresponds to uni.navigateTo EventChannel)
- **Route State Sync** - `syncRoute()` method keeps route state consistent with the page stack, handling browser back, physical back button, etc.

📖 **Full Documentation: [https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## Installation

```bash
# npm
npm install @meng-xi/uni-router

# yarn
yarn add @meng-xi/uni-router

# pnpm
pnpm add @meng-xi/uni-router
```

Optionally use [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) to auto-generate route config and type declarations:

```bash
pnpm add @meng-xi/vite-plugin -D
```

## Quick Start

### 1. Configure vite.config.ts

Use the `generateRouter` plugin to auto-generate route config from `pages.json`:

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			dts: true, // Auto-generate type declarations for name/path hints
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

### 2. Create Router

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	strict: true,
	interceptUniApi: true, // Intercept uni native navigation APIs to ensure guards work
	guardTimeout: 15000 // Guard timeout in ms, default 10000
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

### 3. Route Navigation

```typescript
import { useRouter, useRoute } from '@meng-xi/uni-router'

// Use in component setup
const router = useRouter()
const route = useRoute() // Returns Ref<RouteLocation>, auto-updates on route changes

// Path navigation
await router.push('/pages/about/about')
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// Named navigation
await router.push({ name: 'about' })

// Go back (executes full guard chain)
await router.back()
await router.back(2) // Go back two levels
await router.back(1, { type: 'slide-out-left' }) // Go back with animation

// Close all pages and open target page (corresponds to uni.reLaunch)
await router.relaunch('/pages/index/index')
await router.relaunch({ name: 'login', query: { redirect: '/about' } })
```

### 4. Page Communication (EventChannel)

`push` supports `events` param and `eventChannel` return value, corresponding to uni-app's native `uni.navigateTo` EventChannel mechanism. Only `push` mode supports this.

```typescript
// Page A: navigate and listen for events from the opened page
const { eventChannel } = await router.push({
	path: '/pages/detail/detail',
	query: { id: '1' },
	events: {
		// Listen for the update event from the opened page
		update(data) {
			console.log('Received update:', data)
		}
	}
})

// Send event to the opened page
eventChannel.emit('init', { message: 'Init data from Page A' })

// Page B (detail): get EventChannel and communicate
// <script setup>
const instance = getCurrentInstance()
const eventChannel = instance.proxy.getOpenerEventChannel()

// Listen for the init event from the opener page
eventChannel.on('init', (data) => {
	console.log('Received init data:', data)
})

// Send update event to the opener page
eventChannel.emit('update', { result: 'Processing complete' })
```

### 5. Navigation Animation

Navigation animation only takes effect on App, other platforms auto-ignore. Priority: `inline param` > `meta.animation` > `uni default`.

```typescript
import type { NavigationAnimation } from '@meng-xi/uni-router'

// Option 1: Pass animation when navigating
await router.push({ path: '/pages/about/about', animation: { type: 'slide-in-bottom' } })
await router.back(1, { type: 'slide-out-right', duration: 500 })

// Option 2: Route-level default animation (set meta.animation in route config)
const routes = [
	{
		path: 'pages/about/about',
		name: 'about',
		meta: { animation: { type: 'fade-in', duration: 300 } }
	}
]

// Option 3: RouterLink animation prop
// <RouterLink to="/pages/about/about" :animation="{ type: 'slide-in-bottom' }">About</RouterLink>
```

### 6. Route Guards

```typescript
// Global before guard - auth check
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// Global after hook
router.afterEach((to, from) => {
	console.log(`Navigation complete: ${from.path} → ${to.path}`)
})

// Route change listener (includes navigation and state sync)
router.onRouteChange((to, from) => {
	console.log(`Route changed: ${from.path} → ${to.path}`)
})
```

### 7. Declarative Navigation

```vue
<template>
	<RouterLink to="/pages/about/about">About Page</RouterLink>
	<RouterLink :to="{ name: 'about' }" replace>Replace Navigation</RouterLink>
	<RouterLink :to="{ name: 'admin' }" @error="onNavError">Admin Panel</RouterLink>
	<RouterLink to="/pages/about/about" :animation="{ type: 'slide-in-bottom' }">Slide In Bottom</RouterLink>
	<RouterLink to="/pages/index/index" relaunch>Back to Home</RouterLink>
</template>

<script setup>
import { RouterLink } from '@meng-xi/uni-router/components/RouterLink.vue'

function onNavError(error) {
	console.log('Navigation failed:', error.code)
}
</script>
```

## API Overview

### Core

| API                     | Description                               |
| ----------------------- | ----------------------------------------- |
| `createRouter(options)` | Create a router instance                  |
| `useRouter()`           | Get router instance (composable)          |
| `useRoute()`            | Get current route location (reactive ref) |
| `RouterLink`            | Declarative navigation component          |

### Router Instance Methods

| Method                            | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `router.push(location)`           | Navigate to a new page, returns `NavigationResult` (with `eventChannel`) |
| `router.replace(location)`        | Replace the current page                                           |
| `router.relaunch(location)`       | Close all pages and open target page                               |
| `router.back(delta?, animation?)` | Go back one or more pages (with guard chain)                       |
| `router.beforeEach(guard)`        | Register global before guard                 |
| `router.beforeResolve(guard)`     | Register global resolve guard                |
| `router.afterEach(guard)`         | Register global after hook                   |
| `router.onRouteChange(fn)`        | Register route change listener               |
| `router.onError(handler)`         | Register error handler                       |
| `router.syncRoute()`              | Sync route state with page stack             |
| `router.resolve(location)`        | Resolve route location (no navigation)       |
| `router.getRoutes()`              | Get all route configs                        |
| `router.hasRoute(name)`           | Check if a route exists                      |

### Error Codes

| Code                    | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `NAVIGATION_ABORTED`    | Navigation aborted by guard or guard timeout                      |
| `NAVIGATION_CANCELLED`  | Navigation cancelled (guard exception or redirect limit exceeded) |
| `NAVIGATION_DUPLICATED` | Redundant navigation to current location                          |
| `ROUTE_NOT_FOUND`       | No matching route found                                           |
| `NAVIGATION_API_ERROR`  | uni navigation API call failed                                    |
| `SETUP_ERROR`           | Router initialization or usage error                              |

### Exported Types

| Type                  | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `NavigationResult`    | `push` return type, extends `RouteLocation`, includes `eventChannel` |
| `EventChannel`        | Page communication event channel, supports `emit` / `on` / `off`    |
| `EventListeners`      | Event listener collection, `Record<string, (...args: any[]) => void>` |
| `NavigationAnimation` | Navigation animation config, with `type` and optional `duration`    |

## TypeScript Type Hints

With `dts: true` enabled, the plugin auto-generates type declarations for type-safe route navigation:

```typescript
// Route name autocompletion
router.push({ name: 'pagesIndexIndex' }) // ✅ Autocompletes
router.push({ name: 'invalidName' }) // ❌ Type error

// Path autocompletion
router.push({ path: '/pages/index/index' }) // ✅ Autocompletes
router.push({ path: '/invalid/path' }) // ❌ Type error
```

## Relationship with pages.json

Uni Router does **not replace** `pages.json`, but works alongside it:

| Responsibility    | pages.json          | Uni Router                       |
| ----------------- | ------------------- | -------------------------------- |
| Page registration | Required            | Not responsible                  |
| Route navigation  | uni.navigateTo etc. | push / replace / relaunch / back |
| Route guards      | Not supported       | beforeEach etc.                  |
| Route meta        | Not supported       | meta field                       |
| Named routes      | Not supported       | name field                       |

## License

[MIT](LICENSE)
