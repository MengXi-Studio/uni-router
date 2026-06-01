# 快速开始

本节将帮助你在 uni-app 项目中快速集成 Uni Router。

## 安装

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

## 基本用法

### 1. 定义路由配置

创建 `router/index.ts` 文件，定义路由配置。路由配置需与 `pages.json` 中的页面声明保持一致：

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
	{
		path: 'pages/index/index',
		name: 'home',
		meta: { title: '首页' }
	},
	{
		path: 'pages/about/about',
		name: 'about',
		meta: { title: '关于', requireAuth: true }
	},
	{
		path: 'pages/user/user',
		name: 'user',
		meta: { title: '我的', isTab: true }
	}
]

const router = createRouter({
	routes,
	strict: true
})

export default router
```

### 2. 注册路由器

在应用的入口文件 `main.ts` 中安装路由器：

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

### 3. 在组件中使用

#### 选项式 API

通过 `this.$router` 和 `this.$route` 访问：

```vue
<template>
	<view>
		<text>当前路径：{{ $route.path }}</text>
		<button @click="goAbout">前往关于页</button>
		<button @click="goBack">返回</button>
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

#### 组合式 API

使用 `useRouter()` 和 `useRoute()` 组合式函数：

```vue
<template>
	<view>
		<text>当前路径：{{ route.path }}</text>
		<button @click="goAbout">前往关于页</button>
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
		console.error('导航失败', error)
	}
}
</script>
```

### 4. 使用路由守卫

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

## 下一步

- [路由配置](./route-config) — 了解如何配置路由和元信息
- [路由导航](./navigation) — 了解 push / replace / back 的详细用法
- [路由守卫](./guards) — 了解完整的守卫机制
- [组合式 API](./composables) — 了解 useRouter 和 useRoute 的用法
