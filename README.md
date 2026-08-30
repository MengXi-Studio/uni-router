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

- **vue-router 风格 API** - `push` / `replace` / `relaunch` / `back`，自动根据 `meta.isTab` 切换 `switchTab`，重复导航自动拒绝，并发导航自动排队
- **路由守卫** - `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter` / `onBeforeRouteLeave` / `onBeforeBack`，支持可控重定向与守卫超时保护（`guardTimeout`）
- **返回拦截** - App 物理返回键 / 导航栏返回 / `navigateBack`、H5 浏览器后退 / 后退手势均可被守卫拦截；`app.setSideSlipGesture` 控制 iOS 侧滑手势
- **冷启动守卫** - `guardRoute()` 对 H5 URL / 小程序场景值 / App deeplink 直达的页面补执行守卫链，支持重定向与中止回调
- **命名路由 & 路由元信息** - 通过 `name` 导航，`meta` 携带自定义数据（含 `isTab`、默认动画）
- **插件架构** - Params / Animation / Channel / Interceptor 四类插件按需注册；未注册时使用对应功能会抛出 `PLUGIN_REQUIRED` 明确提示
- **TypeScript 类型提示** - 路由名称和路径自动补全与类型检查（配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin)）
- **页面间通信** - `usePageChannel()` 内置通信管理器；默认 `push` 使用原生 `EventChannel`，开启 `useUniEventChannel` 后所有导航方式均支持
- **声明式导航** - `RouterLink`（H5 端渲染原生 `<a>` 标签）+ `TabBar` / `TabBarItem` 组件，支持徽标 / 小红点 / 安全区 / 切换前拦截，支持 SCSS 主题定制
- **页面参数传递** - `params` 传递复杂数据不暴露 URL；支持 storage 持久化（`persistent`），H5 刷新后仍可读取
- **查询参数增强** - `route.queryInt()` / `queryNumber()` / `queryBool()`
- **导航动画** - `push` / `replace` / `back` 支持动画参数（App 原生窗口动画，H5 端返回退出动画），可通过 `meta.animation` 设置默认
- **路由状态自动同步** - `app.use(router)` 注入全局 Mixin，页面 `onShow` 自动 `syncRoute()`，支持严格模式（`strict`）
- **错误处理** - `RouterError` / `NavigationFailure` / `UniApiError`，`RouterErrorCode` 错误码，`isNavigationFailure()` 精准判断
- **组合式 API** - `useRouter()` / `useRoute()` / `usePageChannel()` / `onBeforeRouteLeave()` / `useLink()`

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
import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin], // 按需注册插件
	interceptUniApi: true // 需要 InterceptorPlugin，拦截原生 API 确保守卫生效
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router) // 注入全局 mixin，onShow 时自动 syncRoute()
	return { app }
}
```

### 2. 路由导航

```typescript
const router = useRouter()

// 返回 NavigationResult（默认仅 push 含 eventChannel，可页面间通信）
await router.push({ path: '/pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
await router.push({ path: '/pages/detail/detail', params: { info: { name: 'Tom' } } })

// 返回更新后的目标路由位置（RouteLocation）
await router.back()
```

> 目标路由若在 `meta.isTab` 中声明为 TabBar 页面，`push` / `replace` / `relaunch` 会自动改用 `uni.switchTab`。

### 3. 路由守卫

```typescript
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		return { name: 'login' } // 重定向
	}
	// 不返回值或 return true 表示放行
})

// 组件内离开守卫（onBeforeRouteLeave）
import { onBeforeRouteLeave } from '@meng-xi/uni-router'

onBeforeRouteLeave((to, from) => {
	if (hasUnsavedChanges) {
		return false // 中止导航
	}
})

// 返回守卫（onBeforeBack）：拦截 App 物理返回键 / 导航栏返回 / navigateBack、H5 后退
router.onBeforeBack((to, from) => {
	if (from.meta.requireConfirm) {
		// 返回 false 阻止返回，返回 true / undefined 放行；也可 return 重定向路由
		return new Promise(resolve => {
			uni.showModal({
				title: '提示',
				content: '确认返回？',
				success: res => resolve(res.confirm)
			})
		})
	}
})

// 冷启动守卫（guardRoute）：H5 URL / 小程序场景值 / App deeplink 直达页面时补执行守卫链
// 通常放在 App.vue 的 onLaunch 中
router.isReady().then(() => {
	router.guardRoute(undefined, {
		onAbort: () => router.relaunch('/pages/index/index')
	})
})
```

### 4. 组件

```vue
<!-- RouterLink：声明式导航 -->
<RouterLink :to="{ name: 'about' }">关于</RouterLink>

<!-- TabBar / TabBarItem：自定义底部导航 -->
<TabBar :before-change="onBeforeChange">
	<TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
	<TabBarItem to="/pages/about/about" icon-path="/static/user.png" text="我的" badge="5" />
</TabBar>
```

## 路由选项

`createRouter` 支持以下常用选项：

| 选项                 | 类型               | 默认值  | 说明                                                        |
| -------------------- | ------------------ | ------- | ----------------------------------------------------------- |
| `routes`             | `RouteConfig[]`    | -       | 路由配置，需与 `pages.json` 声明一致                        |
| `strict`             | `boolean`          | `true`  | 严格模式，未匹配的命名路由抛出异常                          |
| `guardTimeout`       | `number`           | `10000` | 守卫超时（ms），超时警告并自动中止导航，设 `0` 关闭         |
| `readyTimeout`       | `number`           | `0`     | 就绪超时（ms），防止 `await router.isReady()` 挂起          |
| `plugins`            | `RouterPlugin[]`   | `[]`    | 按需注册插件                                                |
| `paramsPersistent`   | `boolean`          | `false` | params 是否默认持久化到 storage（需 ParamsPlugin）          |
| `useUniEventChannel` | `boolean`          | `false` | 所有导航方式均使用内置通信管理器（需 ChannelPlugin）        |
| `interceptUniApi`    | `boolean`          | `false` | 拦截 uni 原生导航 API，确保守卫生效（需 InterceptorPlugin） |
| `app`                | `AppRouterOptions` | -       | App 专属配置，如 `setSideSlipGesture` 控制 iOS 侧滑返回手势 |

## 文档

📖 **[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## License

[MIT](LICENSE)
