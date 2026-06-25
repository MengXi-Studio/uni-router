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

## Introduction

`@meng-xi/uni-router` is a routing management library for uni-app that provides a vue-router-style API, bringing the familiar navigation experience to uni-app.

## Features

- **vue-router-style API** - `push` / `replace` / `relaunch` / `back`, zero learning curve
- **Route Guards** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- **Named Routes & Route Meta** - Navigate by `name`, carry custom data via `meta`
- **TypeScript Type Hints** - Autocompletion and type checking for route names and paths
- **uni API Interception** - Optionally intercept native navigation APIs to enforce guard flow
- **Page Communication** - `push` supports `events` and `eventChannel` (corresponds to uni EventChannel)
- **Declarative Navigation** - `RouterLink` component, wraps uni `navigator`, supports navigation params, animation, page communication
- **Page Params** - `params` passes complex data without exposing in URL, supports `persistent` storage
- **Query Enhancement** - `queryInt()` / `queryNumber()` / `queryBool()` convenience methods
- **Navigation Animation** - `push` / `replace` / `back` support animation params, App only
- **Route State Sync** - `syncRoute()` handles browser back, physical back button, etc.
- **Error Handling** - Complete `RouterError` / `NavigationFailure` system with `onError` global capture
- **Composables** - `useRouter()` / `useRoute()` for reactive router access

## Installation

```bash
# npm
npm install @meng-xi/uni-router

# yarn
yarn add @meng-xi/uni-router

# pnpm
pnpm add @meng-xi/uni-router
```

Optionally use [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) to auto-generate route config and type declarations from `pages.json`:

```bash
pnpm add @meng-xi/vite-plugin -D
```

## Quick Start

### 1. Configure vite.config.ts

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
			dts: true, // Auto-generate type declarations
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

const router = useRouter()
const route = useRoute() // Returns reactive ref, auto-updates on route changes

// Path navigation
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// Named navigation
await router.push({ name: 'about' })

// Page params (not exposed in URL, supports complex data)
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })

// Go back (executes full guard chain)
await router.back()
```

### 4. Route Guards

```typescript
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		// Use replace mode to avoid extra history pages after the login page
		next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
	} else {
		next()
	}
})
```

## Documentation

For complete API reference, usage guides, and examples, please visit the official website:

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
