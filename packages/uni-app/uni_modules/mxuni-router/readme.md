# @meng-xi/uni-router

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

为 uni-app (Vue 3) 提供类似 vue-router 风格的路由管理系统（uni_modules 版本）。

> **⚠️ 仅支持 Vue 3** — 本库基于 Vue 3 Composition API（`inject` / `ref` / `defineProps` / `defineEmits`）和 `app.provide` 等 Vue 3 专属 API，不支持 uni-app Vue 2 项目。

---

## 特性

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`，零学习成本
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`，支持 `next(location, { mode })` 指定重定向方式
- **命名路由 & 路由元信息** - 通过 `name` 导航，`meta` 携带自定义数据
- **TypeScript 类型提示** - 路由名称和路径自动补全与类型检查
- **uni API 拦截** - 可选拦截原生导航 API，统一守卫流程（`interceptUniApi`）
- **页面间通信** - `push` 支持 `events` 和 `eventChannel`（对应 uni EventChannel）
- **页面参数传递** - `params` 传递复杂数据，不暴露在 URL，支持 `persistent` 持久化
- **查询参数增强** - `queryInt()` / `queryNumber()` / `queryBool()` 便捷解析
- **导航动画** - `push` / `replace` / `back` 支持动画参数，仅 App 端生效
- **路由状态同步** - `syncRoute()` 处理浏览器后退、物理返回键等场景
- **RouterLink 组件** - 声明式导航，支持 `params` / `events` / `animation` / `@navigated` / `@error`
- **错误处理** - 完整的 `RouterError` / `NavigationFailure` 体系，`onError` 全局捕获
- **组合式 API** - `useRouter()` / `useRoute()` 响应式访问路由

## 安装

### uni_modules（推荐）

将 `mxuni-router` 目录复制到项目的 `uni_modules` 目录下即可，无需 npm 安装。

### npm

```bash
pnpm add @meng-xi/uni-router
```

> npm 方式需将导入路径改为 `@meng-xi/uni-router`。

## 快速开始

### 1. 创建路由器

```typescript
// main.ts
import { createSSRApp } from 'vue'
import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import App from './App.vue'

const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
		{ path: 'pages/about/about', name: 'about', meta: { title: '关于', requireAuth: true } }
	],
	strict: true,
	interceptUniApi: true // 拦截 uni 原生导航 API，确保守卫生效
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

### 2. 路由导航

```typescript
import { useRouter, useRoute } from './uni_modules/mxuni-router/js_sdk/index.js'

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

### 3. 路由守卫

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

### 4. 自动生成路由配置（推荐）

配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 的 `generateRouter` 插件，可从 `pages.json` 自动生成路由配置和类型声明：

```bash
pnpm add @meng-xi/vite-plugin -D
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			dts: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

然后在 `main.ts` 中导入生成的路由配置：

```typescript
import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import routes from './router.config'

const router = createRouter({ routes })
```

## 文档

完整的 API 参考、配置项说明、RouterLink 组件属性、类型定义等请查阅官方网站：

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
