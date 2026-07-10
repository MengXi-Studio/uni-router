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

## 特性

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`，`guardRoute` 冷启动补执行
- **命名路由 & 路由元信息** - 通过 `name` 导航，`meta` 携带自定义数据
- **TypeScript 类型提示** - 路由名称和路径自动补全与类型检查
- **uni API 拦截** - 可选拦截原生导航 API，统一守卫流程
- **页面间通信** - `useUniEventChannel` 内置通信管理器，所有导航方式支持 `eventChannel`
- **声明式导航** - `RouterLink` + `TabBar` / `TabBarItem` 组件，支持 SCSS 主题定制
- **页面参数传递** - `params` 传递复杂数据不暴露 URL，`back()` 后自动保留
- **查询参数增强** - `queryInt()` / `queryNumber()` / `queryBool()`
- **导航动画** - `push` / `replace` / `back` 支持动画参数，仅 App 端
- **路由状态自动同步** - 全局 Mixin 自动 `syncRoute()`，无需手动同步
- **错误处理** - `RouterError` / `NavigationFailure` / `UniApiError`，支持 `instanceof` 精准判断
- **组合式 API** - `useRouter()` / `useRoute()` / `usePageChannel()`

## 安装

```bash
pnpm add @meng-xi/uni-router
```

配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 从 `pages.json` 自动生成路由配置和类型声明：

```bash
pnpm add @meng-xi/vite-plugin -D
```

## 快速开始

### 1. 创建路由器

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	interceptUniApi: true // 拦截 uni 原生导航 API，确保守卫生效
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router) // 自动注册全局 mixin，onShow 时同步 currentRoute
	return { app }
}
```

### 2. 路由导航

```typescript
const router = useRouter()

await router.push({ path: '/pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })
await router.back()
```

### 3. 路由守卫

```typescript
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' }, { mode: 'replace' })
	} else {
		next()
	}
})
```

### 4. 组件

```vue
<!-- RouterLink：声明式导航 -->
<RouterLink :to="{ name: 'about' }">关于</RouterLink>

<!-- TabBar / TabBarItem：自定义底部导航 -->
<TabBar>
	<TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
	<TabBarItem to="/pages/about/about" icon-path="/static/user.png" text="我的" dot />
</TabBar>
```

## 文档

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
