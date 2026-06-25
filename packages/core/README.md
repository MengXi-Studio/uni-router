**中文** | [English](./README-en.md)

<div align="center">
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="梦曦工作室 Logo" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/logo.png">
	</a>
	<a href="https://github.com/MengXi-Studio/uni-router">
		<img alt="微信公众号 二维码" width="215" src="https://github.com/MengXi-Studio/uni-router/blob/master/packages/docs/src/public/QR_code.jpg">
	</a>
	<br>
	<h1>@meng-xi/uni-router</h1>
	<p>为 uni-app 提供类似 vue-router 风格的路由管理系统</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

</div>

## 介绍

`@meng-xi/uni-router` 是一个为 uni-app 打造的路由管理库，提供 vue-router 风格的 API，让你在 uni-app 中也能享受熟悉的导航体验。

## 特性

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`，零学习成本
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- **命名路由 & 路由元信息** - 通过 `name` 导航，`meta` 携带自定义数据
- **TypeScript 类型提示** - 路由名称和路径自动补全与类型检查
- **uni API 拦截** - 可选拦截原生导航 API，统一守卫流程
- **页面间通信** - `push` 支持 `events` 和 `eventChannel`（对应 uni EventChannel）
- **声明式导航** - `RouterLink` 组件，基于 uni `navigator` 封装，支持导航参数、动画、页面通信
- **页面参数传递** - `params` 传递复杂数据，不暴露在 URL，支持 `persistent` 持久化
- **查询参数增强** - `queryInt()` / `queryNumber()` / `queryBool()` 便捷解析
- **导航动画** - `push` / `replace` / `back` 支持动画参数，仅 App 端生效
- **路由状态同步** - `syncRoute()` 处理浏览器后退、物理返回键等场景
- **错误处理** - 完整的 `RouterError` / `NavigationFailure` 体系，`onError` 全局捕获
- **组合式 API** - `useRouter()` / `useRoute()` 响应式访问路由

## 安装

```bash
# npm
npm install @meng-xi/uni-router

# yarn
yarn add @meng-xi/uni-router

# pnpm
pnpm add @meng-xi/uni-router
```

配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 可从 `pages.json` 自动生成路由配置和类型声明：

```bash
pnpm add @meng-xi/vite-plugin -D
```

## 快速开始

### 1. 配置 vite.config.ts

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
			dts: true, // 自动生成类型声明
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

const router = useRouter()
const route = useRoute() // 返回响应式引用，路由变化时自动更新

// 路径导航
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// 命名导航
await router.push({ name: 'about' })

// 页面参数传递（params 不暴露在 URL，支持复杂数据）
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })

// 返回（执行完整守卫链）
await router.back()
```

### 4. 路由守卫

```typescript
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		// 使用 replace 模式重定向，避免登录页之后残留受保护页面的历史
		next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
	} else {
		next()
	}
})
```

## 文档

完整的 API 参考、使用指南和示例请查阅官方网站：

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
