# @meng-xi/uni-router

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

为 uni-app (Vue 3) 提供类似 vue-router 风格的路由管理系统（uni_modules 版本）。

> **仅支持 Vue 3** — 基于 Vue 3 Composition API，不支持 Vue 2 项目。

## 特性

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`，`guardRoute` 冷启动补执行
- **命名路由 & 路由元信息** - 通过 `name` 导航，`meta` 携带自定义数据
- **TypeScript 类型提示** - 路由名称和路径自动补全与类型检查
- **插件架构** - ParamsPlugin / ChannelPlugin / InterceptorPlugin / AnimationPlugin 按需注册
- **页面间通信** - `useUniEventChannel` 内置通信管理器，所有导航方式支持 `eventChannel`
- **声明式组件** - `RouterLink` / `TabBar` / `TabBarItem`，easycom 自动注册
- **页面参数传递** - `params` 传递复杂数据不暴露 URL，`back()` 后自动保留
- **查询参数增强** - `queryInt()` / `queryNumber()` / `queryBool()`
- **导航动画** - `push` / `replace` / `back` 支持动画参数，仅 App 端
- **路由状态自动同步** - 全局 Mixin 自动 `syncRoute()`，无需手动同步
- **错误处理** - `RouterError` / `NavigationFailure` / `UniApiError`，支持 `instanceof` 精准判断
- **组合式 API** - `useRouter()` / `useRoute()` / `usePageChannel()`

## 安装

将 `mxuni-router-v2` 目录复制到项目的 `uni_modules` 目录下即可，无需 npm 安装。

## 快速开始

### 1. 创建路由器

```typescript
// main.ts
import { createSSRApp } from 'vue'
import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin } from './uni_modules/mxuni-router-v2/js_sdk/index.js'
import App from './App.vue'

const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页', isTab: true } },
		{ path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
	],
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin],
	interceptUniApi: true // 需要 InterceptorPlugin
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router) // 自动注册全局 mixin，onShow 时同步 currentRoute
	return { app }
}
```

### 2. 路由导航

```typescript
import { useRouter, useRoute } from './uni_modules/mxuni-router-v2/js_sdk/index.js'

const router = useRouter()
const route = useRoute()

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

组件通过 easycom 自动注册，直接在模板中使用即可：

```vue
<!-- RouterLink：声明式导航 -->
<RouterLink :to="{ name: 'about' }">关于</RouterLink>

<!-- TabBar / TabBarItem：自定义底部导航 -->
<TabBar selected-color="#007aff">
	<TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
	<TabBarItem to="/pages/about/about" icon-path="/static/user.png" text="我的" dot />
</TabBar>
```

## 文档

📖 **[https://mengxi-studio.github.io/uni-router/v1/](https://mengxi-studio.github.io/uni-router/v1/)**

## License

[MIT](LICENSE)
