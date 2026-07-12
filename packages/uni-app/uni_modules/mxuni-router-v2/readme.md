# @meng-xi/uni-router

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

为 uni-app (Vue 3) 提供类似 vue-router 风格的路由管理系统（uni_modules 版本）。

> **仅支持 Vue 3** — 基于 Vue 3 Composition API，不支持 Vue 2 项目。

## 特性

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`，支持 `guardRoute` 冷启动补执行
- **页面间通信** - `useUniEventChannel` 内置通信管理器，粘性缓存确保时序安全
- **声明式组件** - `RouterLink` / `TabBar` / `TabBarItem`，easycom 自动注册
- **页面参数传递** - `params` 传递复杂数据，`back()` 后自动保留
- **查询参数增强** - `queryInt()` / `queryNumber()` / `queryBool()`
- **错误处理** - `RouterError` / `NavigationFailure` / `UniApiError`，`instanceof` 精准判断

## 安装

将 `mxuni-router` 目录复制到项目的 `uni_modules` 目录下即可，无需 npm 安装。

## 快速开始

```typescript
// main.ts
import { createSSRApp } from 'vue'
import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import App from './App.vue'

const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
		{ path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
	],
	interceptUniApi: true
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

组件在 uni_modules 中自动注册，直接使用即可：

```vue
<RouterLink to="/pages/about/about">关于</RouterLink>

<TabBar selected-color="#007aff">
	<TabBarItem to="/pages/index/index" text="首页" />
	<TabBarItem to="/pages/about/about" text="关于" :badge="5" />
</TabBar>
```

## 文档

📖 **[https://mengxi-studio.github.io/uni-router/v1/](https://mengxi-studio.github.io/uni-router/v1/)**

## License

[MIT](LICENSE)
