**中文** | [English](./README-en.md)

<div align="center">
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="梦曦工作室 Logo" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/logo.png">
	</a>
	<br>
	<h1>@meng-xi/uni-router</h1>
	<p>为 uni-app 提供类似 vue-router 风格的路由管理系统</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

</div>

## 特性

- **vue-router 风格 API** - 熟悉的 `push` / `replace` / `back` 导航方式，零学习成本
- **路由守卫** - 全局前置守卫 `beforeEach`、解析守卫 `beforeResolve`、后置钩子 `afterEach`、路由独享守卫 `beforeEnter`
- **命名路由** - 通过 `name` 进行导航，无需硬编码路径字符串
- **路由元信息** - `meta` 字段支持页面标题、权限标记、TabBar 标识等自定义数据
- **TypeScript 类型提示** - 通过模块增强为路由名称和路径提供自动补全和类型检查
- **错误处理** - 完整的 `RouterError` / `NavigationFailure` 体系，支持 `onError` 全局捕获
- **组合式 API** - `useRouter()` / `useRoute()` 在组件中便捷访问路由器，`useRoute()` 返回响应式引用，路由变化自动更新
- **RouterLink 组件** - 声明式导航组件，基于 uni-app `navigator` 封装，支持 `error` 事件捕获导航失败
- **uni API 拦截** - 可选拦截原生导航 API，统一走路由守卫流程
- **守卫超时保护** - 可配置 `guardTimeout`，防止守卫未调用 `next()` 导致导航永久挂起
- **导航动画** - 支持 `push` / `replace` / `back` 时传入动画参数，支持路由级 `meta.animation` 默认动画，仅 App 端生效
- **路由状态同步** - `syncRoute()` 方法确保路由状态与页面栈一致，处理浏览器后退、物理返回键等场景

📖 **完整文档：[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## 安装

```bash
# npm
npm install @meng-xi/uni-router

# yarn
yarn add @meng-xi/uni-router

# pnpm
pnpm add @meng-xi/uni-router
```

配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 可自动生成路由配置和类型声明：

```bash
pnpm add @meng-xi/vite-plugin -D
```

## 快速开始

### 1. 配置 vite.config.ts

使用 `generateRouter` 插件从 `pages.json` 自动生成路由配置：

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
			dts: true, // 自动生成类型声明，启用 name/path 类型提示
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

### 2. 创建路由器

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	strict: true,
	interceptUniApi: true, // 拦截 uni 原生导航 API，确保守卫生效
	guardTimeout: 15000 // 守卫超时时间（毫秒），默认 10000
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

### 3. 路由导航

```typescript
import { useRouter, useRoute } from '@meng-xi/uni-router'

// 在组件 setup 中使用
const router = useRouter()
const route = useRoute() // 返回 Ref<RouteLocation>，路由变化时自动更新

// 路径导航
await router.push('/pages/about/about')
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// 命名导航
await router.push({ name: 'about' })

// 返回（执行完整守卫链）
await router.back()
await router.back(2) // 返回两级
await router.back(1, { type: 'slide-out-left' }) // 返回并指定动画
```

### 4. 导航动画

导航动画仅 App 端生效，其他平台自动忽略。优先级：`调用时传入` > `meta.animation` > `uni 默认值`。

```typescript
import type { NavigationAnimation } from '@meng-xi/uni-router'

// 方式一：导航时传入动画
await router.push({ path: '/pages/about/about', animation: { type: 'slide-in-bottom' } })
await router.back(1, { type: 'slide-out-right', duration: 500 })

// 方式二：路由级默认动画（在路由配置中设置 meta.animation）
const routes = [
	{
		path: 'pages/about/about',
		name: 'about',
		meta: { animation: { type: 'fade-in', duration: 300 } }
	}
]

// 方式三：RouterLink 组件的 animation prop
// <RouterLink to="/pages/about/about" :animation="{ type: 'slide-in-bottom' }">关于页面</RouterLink>
```

### 5. 路由守卫

```typescript
// 全局前置守卫 - 登录验证
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 全局后置钩子
router.afterEach((to, from) => {
	console.log(`导航完成: ${from.path} → ${to.path}`)
})

// 路由变化监听（包括导航和状态同步）
router.onRouteChange((to, from) => {
	console.log(`路由变化: ${from.path} → ${to.path}`)
})
```

### 6. 声明式导航

```vue
<template>
	<RouterLink to="/pages/about/about">关于页面</RouterLink>
	<RouterLink :to="{ name: 'about' }" replace>替换导航</RouterLink>
	<RouterLink :to="{ name: 'admin' }" @error="onNavError">管理后台</RouterLink>
	<RouterLink to="/pages/about/about" :animation="{ type: 'slide-in-bottom' }">底部滑入</RouterLink>
</template>

<script setup>
import { RouterLink } from '@meng-xi/uni-router/components/RouterLink.vue'

function onNavError(error) {
	console.log('导航失败:', error.code)
}
</script>
```

## API 概览

### 核心

| API                     | 说明                           |
| ----------------------- | ------------------------------ |
| `createRouter(options)` | 创建路由器实例                 |
| `useRouter()`           | 获取路由器实例（组合式 API）   |
| `useRoute()`            | 获取当前路由位置（响应式引用） |
| `RouterLink`            | 声明式导航组件                 |

### Router 实例方法

| 方法                              | 说明                               |
| --------------------------------- | ---------------------------------- |
| `router.push(location)`           | 导航到新页面                       |
| `router.replace(location)`        | 替换当前页面                       |
| `router.back(delta?, animation?)` | 返回上一页或多级页面（执行守卫链） |
| `router.beforeEach(guard)`        | 注册全局前置守卫                   |
| `router.beforeResolve(guard)`     | 注册全局解析守卫                   |
| `router.afterEach(guard)`         | 注册全局后置钩子                   |
| `router.onRouteChange(fn)`        | 注册路由变化监听器                 |
| `router.onError(handler)`         | 注册错误处理回调                   |
| `router.syncRoute()`              | 同步路由状态与页面栈               |
| `router.resolve(location)`        | 解析路由位置（不导航）             |
| `router.getRoutes()`              | 获取所有路由配置                   |
| `router.hasRoute(name)`           | 检查路由是否存在                   |

### 错误码

| 错误码                  | 说明                               |
| ----------------------- | ---------------------------------- |
| `NAVIGATION_ABORTED`    | 导航被守卫中止或守卫超时           |
| `NAVIGATION_CANCELLED`  | 导航被取消（守卫异常或重定向超限） |
| `NAVIGATION_DUPLICATED` | 重复导航到当前位置                 |
| `ROUTE_NOT_FOUND`       | 未找到匹配的路由                   |
| `NAVIGATION_API_ERROR`  | uni 导航 API 调用失败              |
| `SETUP_ERROR`           | 路由器初始化或使用方式错误         |

## TypeScript 类型提示

启用 `dts: true` 后，插件自动生成类型声明文件，为路由导航提供类型安全：

```typescript
// 路由名称自动补全
router.push({ name: 'pagesIndexIndex' }) // ✅ 自动补全
router.push({ name: 'invalidName' }) // ❌ 类型错误

// 路径自动补全
router.push({ path: '/pages/index/index' }) // ✅ 自动补全
router.push({ path: '/invalid/path' }) // ❌ 类型错误
```

## 与 pages.json 的关系

Uni Router **不替代** `pages.json`，而是与之配合使用：

| 职责       | pages.json        | Uni Router            |
| ---------- | ----------------- | --------------------- |
| 页面注册   | 必须声明          | 不负责                |
| 路由导航   | uni.navigateTo 等 | push / replace / back |
| 路由守卫   | 不支持            | beforeEach 等         |
| 路由元信息 | 不支持            | meta 字段             |
| 命名路由   | 不支持            | name 字段             |

## License

[MIT](LICENSE)
