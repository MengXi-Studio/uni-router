# Quick Start

This section will help you quickly integrate Uni Router into your uni-app project.

## Installation

::: code-group

```bash [pnpm]
pnpm add @meng-xi/uni-router
```

```bash [npm]
npm install @meng-xi/uni-router
```

```bash [yarn]
yarn add @meng-xi/uni-router
```

:::

## Basic Usage

### 1. Define Route Configuration

Create a `router/index.ts` file and define route configurations. The route configurations must be consistent with the page declarations in `pages.json`:

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
	{
		path: 'pages/index/index',
		name: 'home',
		meta: { title: 'Home' }
	},
	{
		path: 'pages/about/about',
		name: 'about',
		meta: { title: 'About', requireAuth: true }
	},
	{
		path: 'pages/user/user',
		name: 'user',
		meta: { title: 'Profile', isTab: true }
	}
]

const router = createRouter({
	routes,
	strict: true
})

export default router
```

### 2. Register the Router

Install the router in your app's entry file `main.ts`:

```ts
// main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

### 3. Use in Components

#### Options API

Access via `this.$router` and `this.$route`:

```vue
<template>
	<view>
		<text>Current path: {{ $route.path }}</text>
		<button @click="goAbout">Go to About</button>
		<button @click="goBack">Go Back</button>
	</view>
</template>

<script>
export default {
	methods: {
		goAbout() {
			this.$router.push({ name: 'about', query: { id: '1' } })
		},
		goBack() {
			this.$router.back()
		}
	}
}
</script>
```

#### Composition API

Use `useRouter()` and `useRoute()` composable functions:

```vue
<template>
	<view>
		<text>Current path: {{ route.path }}</text>
		<button @click="goAbout">Go to About</button>
	</view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

async function goAbout() {
	try {
		await router.push({ name: 'about', query: { id: '1' } })
	} catch (error) {
		console.error('Navigation failed', error)
	}
}
</script>
```

### 4. Use Route Guards

```ts
// router/index.ts
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'home' })
	} else {
		next()
	}
})

router.afterEach((to, from) => {
	if (to.meta.title) {
		uni.setNavigationBarTitle({ title: to.meta.title as string })
	}
})
```

## Next Steps

- [Route Configuration](./route-config) — Learn how to configure routes and meta
- [Navigation](./navigation) — Learn about push / replace / back in detail
- [Route Guards](./guards) — Learn the complete guard mechanism
- [Composables](./composables) — Learn about useRouter and useRoute
