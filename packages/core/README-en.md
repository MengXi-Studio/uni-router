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

- **vue-router-style API** - `push` / `replace` / `relaunch` / `back`
- **Route Guards** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`, `guardRoute` for cold-start execution
- **Named Routes & Route Meta** - Navigate by `name`, carry custom data via `meta`
- **TypeScript Type Hints** - Autocompletion and type checking for route names and paths
- **uni API Interception** - Optionally intercept native navigation APIs to enforce guard flow
- **Page Communication** - `useUniEventChannel` built-in manager, all navigation methods support `eventChannel`
- **Declarative Navigation** - `RouterLink` + `TabBar` / `TabBarItem` components with SCSS theming
- **Page Params** - `params` passes complex data without URL exposure, auto-preserved after `back()`
- **Query Enhancement** - `queryInt()` / `queryNumber()` / `queryBool()`
- **Navigation Animation** - `push` / `replace` / `back` support animation params, App only
- **Auto Route State Sync** - Global mixin auto-invokes `syncRoute()`, no manual sync needed
- **Error Handling** - `RouterError` / `NavigationFailure` / `UniApiError`, supports `instanceof` discrimination
- **Composables** - `useRouter()` / `useRoute()` / `usePageChannel()`

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
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	interceptUniApi: true // Intercept uni native navigation APIs to ensure guards work
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router) // Auto-registers a global mixin that syncs currentRoute on each page's onShow
	return { app }
}
```

### 2. Route Navigation

```typescript
const router = useRouter()

await router.push({ path: '/pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })
await router.back()
```

### 3. Route Guards

```typescript
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' }, { mode: 'replace' })
	} else {
		next()
	}
})
```

### 4. Components

```vue
<!-- RouterLink: declarative navigation -->
<RouterLink :to="{ name: 'about' }">About</RouterLink>

<!-- TabBar / TabBarItem: custom bottom navigation -->
<TabBar>
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="Home" />
  <TabBarItem to="/pages/about/about" icon-path="/static/user.png" text="Profile" dot />
</TabBar>
```

## Documentation

📖 **[https://mengxi-studio.github.io/uni-router/v1/](https://mengxi-studio.github.io/uni-router/v1/)**

## License

[MIT](LICENSE)
