# @meng-xi/uni-router

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

为 uni-app (Vue 3) 提供类似 vue-router 风格的路由管理系统（uni_modules 版本）。

> **⚠️ 仅支持 Vue 3** — 本库基于 Vue 3 Composition API（`inject` / `ref` / `defineProps` / `defineEmits`）和 `app.provide` 等 Vue 3 专属 API，不支持 uni-app Vue 2 项目。

---

## 特性

- **vue-router 风格 API** - 熟悉的 `push` / `replace` / `relaunch` / `back` 导航方式，零学习成本
- **路由守卫** - 全局前置守卫 `beforeEach`、解析守卫 `beforeResolve`、后置钩子 `afterEach`、路由独享守卫 `beforeEnter`
- **守卫超时保护** - 守卫未调用 `next()` 时自动中止导航，超时时间可配置（`guardTimeout`）
- **路由器就绪超时保护** - 路由器初始化超时时 `isReady()` 自动 reject，防止 Promise 永久挂起（`readyTimeout`）
- **命名路由** - 通过 `name` 进行导航，无需硬编码路径字符串
- **路由元信息** - `meta` 字段支持页面标题、权限标记、TabBar 标识等自定义数据
- **导航动画** - 支持 `push` / `replace` / `back` 时传入动画参数，支持路由级 `meta.animation` 默认动画，仅 App 端生效
- **uni API 拦截** - 拦截 `uni.navigateTo` 等原生导航 API，确保守卫始终生效（`interceptUniApi`）
- **路由状态同步** - `syncRoute()` 将路由状态与实际页面栈同步，处理物理返回键等非路由器导航
- **路由变化监听** - `onRouteChange()` 订阅路由状态变化，包括导航完成和状态同步
- **页面参数传递** - `params` 支持传递复杂数据（对象、数组等），不暴露在 URL 中，目标页面通过 `route.params` 读取
- **参数持久化** - `persistent: true` 将 params 持久化到 storage，H5 刷新后仍可读取；`paramsPersistent` 全局默认值
- **查询参数增强** - `queryInt` / `queryNumber` / `queryBool` 便捷方法，自动解析 query 参数为指定类型
- **RouterLink 组件** - 声明式导航组件，支持 `push` / `replace` / `relaunch` 模式、`params` 参数传递、`events` 页面间通信、`animation` 导航动画、`@navigated` / `@error` 事件
- **页面间通信** - `push` 支持 `events` 参数和 `eventChannel` 返回值，实现页面间双向通信（对应 uni.navigateTo 的 EventChannel 机制）
- **TypeScript 类型提示** - 通过模块增强为路由名称和路径提供自动补全和类型检查
- **错误处理** - 完整的 `RouterError` / `NavigationFailure` 体系，支持 `onError` 全局捕获
- **组合式 API** - `useRouter()` / `useRoute()` 在组件中便捷访问路由器
- **uni_modules 集成** - 通过 uni_modules 方式安装，无需 npm，开箱即用

📖 **完整文档：[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## 安装

### uni_modules（推荐）

将 `mxuni-router` 目录复制到项目的 `uni_modules` 目录下：

```
src/
  └── uni_modules/
        └── mxuni-router/
              ├── js_sdk/
              │     ├── index.js
              │     ├── index.cjs
              │     ├── index.d.ts
              │     └── index.d.cts
              ├── components/
              │     └── mxuni-router/
              │           └── mxuni-router.vue
              ├── package.json
              └── readme.md
```

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
		{ path: 'pages/about/about', name: 'about', meta: { title: '关于', requireAuth: true } },
		{ path: 'pages/user/user', name: 'user', meta: { title: '我的', isTab: true } }
	],
	strict: true
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

// 在组件 setup 中使用
const router = useRouter()
const route = useRoute()

// 路径导航
await router.push('/pages/about/about')
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// 命名导航
await router.push({ name: 'about' })

// 带动画导航（仅 App 端生效）
await router.push({ path: '/pages/about/about', animation: { type: 'slide-in-bottom' } })

// 带页面间通信的导航
const result = await router.push({
	path: '/pages/about/about',
	events: {
		// 监听目标页面通过 eventChannel.emit 发送的事件
		receiveData: data => {
			console.log('收到数据:', data)
		}
	}
})
// 通过 eventChannel 向目标页面发送事件
result.eventChannel?.emit('fromOpener', { msg: '你好' })

// 返回
await router.back()
await router.back(2) // 返回两级
await router.back(1, { type: 'slide-out-left' }) // 返回并指定动画

// 关闭所有页面并打开目标页面（对应 uni.reLaunch）
await router.relaunch('/pages/index/index')
await router.relaunch({ name: 'login', query: { redirect: '/about' } })

// 带 params 跳转（传递复杂数据，不暴露在 URL 中）
await router.push({
	path: '/pages/detail/detail',
	query: { id: '1' },
	params: { userInfo: { name: 'Tom', age: 20 }, tags: ['vip', 'active'] }
})

// 带 params 持久化跳转（H5 刷新后仍可读取）
await router.push({
	path: '/pages/detail/detail',
	params: { bigData: largeObject },
	persistent: true
})

// 目标页面读取 params
const route = useRoute()
console.log(route.params.userInfo) // { name: 'Tom', age: 20 }

// 查询参数增强方法
// URL: /pages/detail/detail?id=123&price=19.99
route.queryInt('id') // 123
route.queryNumber('price') // 19.99

// URL: /pages/detail/detail?enabled=true
route.queryBool('enabled') // true

// 带默认值
route.queryInt('page', 1) // 1（参数不存在时）
```

### 3. 路由守卫

```typescript
// 全局前置守卫 - 登录验证
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 全局解析守卫 - 在所有前置守卫和路由独享守卫完成后执行
router.beforeResolve((to, from, next) => {
	console.log('所有守卫已通过，即将完成导航')
	next()
})

// 全局后置钩子
router.afterEach((to, from) => {
	console.log(`导航完成: ${from.path} → ${to.path}`)
})

// 路由独享守卫 - 在路由配置中定义
const router = createRouter({
	routes: [
		{
			path: '/pages/admin/index',
			name: 'admin',
			meta: { title: '管理页', requireAuth: true },
			beforeEnter(to, from, next) {
				console.log('进入管理页')
				next()
			}
		}
	]
})

// 守卫注册函数返回移除函数
const removeGuard = router.beforeEach((to, from, next) => {
	// ...
	next()
})
removeGuard() // 移除此守卫
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

## API 概览

### 核心

| API                     | 说明                           |
| ----------------------- | ------------------------------ |
| `createRouter(options)` | 创建路由器实例                 |
| `useRouter()`           | 获取路由器实例（组合式 API）   |
| `useRoute()`            | 获取当前路由位置（组合式 API） |

### Router 实例方法

| 方法                              | 说明                       | 返回值                      |
| --------------------------------- | -------------------------- | --------------------------- |
| `router.push(location)`           | 导航到新页面               | `Promise<NavigationResult>` |
| `router.replace(location)`        | 替换当前页面               | `Promise<RouteLocation>`    |
| `router.relaunch(location)`       | 关闭所有页面并打开目标页面 | `Promise<RouteLocation>`    |
| `router.back(delta?, animation?)` | 返回上一页或多级页面       | `Promise<RouteLocation>`    |
| `router.beforeEach(guard)`        | 注册全局前置守卫           | `() => void` 移除函数       |
| `router.beforeResolve(guard)`     | 注册全局解析守卫           | `() => void` 移除函数       |
| `router.afterEach(guard)`         | 注册全局后置钩子           | `() => void` 移除函数       |
| `router.onError(handler)`         | 注册错误处理回调           | `() => void` 移除函数       |
| `router.resolve(location)`        | 解析路由位置（不导航）     | `RouteLocation`             |
| `router.getRoutes()`              | 获取所有路由配置           | `RouteConfig[]`             |
| `router.hasRoute(name)`           | 检查路由是否存在           | `boolean`                   |
| `router.isReady()`                | 等待路由器初始化完成       | `Promise<void>`             |
| `router.onRouteChange(listener)`  | 注册路由变化监听器         | `() => void` 移除函数       |
| `router.syncRoute()`              | 同步路由状态与实际页面栈   | `void`                      |

### 错误码

| 错误码                  | 说明                               |
| ----------------------- | ---------------------------------- |
| `NAVIGATION_ABORTED`    | 导航被守卫中止                     |
| `NAVIGATION_CANCELLED`  | 导航被取消（守卫异常或重定向超限） |
| `NAVIGATION_DUPLICATED` | 重复导航到当前位置                 |
| `ROUTE_NOT_FOUND`       | 未找到匹配的路由                   |
| `NAVIGATION_API_ERROR`  | uni 导航 API 调用失败              |
| `SETUP_ERROR`           | 路由器初始化或使用方式错误         |

### 导出常量

| 常量                         | 值    | 说明                                                |
| ---------------------------- | ----- | --------------------------------------------------- |
| `DEFAULT_ANIMATION_DURATION` | `300` | 默认动画持续时间（毫秒），与 uni-app 官方默认值一致 |

### RouterOptions 配置项

| 选项               | 类型            | 默认值  | 说明                                                                                                                                                                     |
| ------------------ | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `routes`           | `RouteConfig[]` | -       | 路由配置列表，需与 `pages.json` 中的页面声明保持一致                                                                                                                     |
| `strict`           | `boolean`       | `true`  | 是否启用严格模式，启用后未匹配的命名路由将抛出异常                                                                                                                       |
| `interceptUniApi`  | `boolean`       | `false` | 是否拦截 `uni.navigateTo` / `uni.redirectTo` / `uni.switchTab` / `uni.reLaunch` / `uni.navigateBack` 原生导航 API，启用后直接调用 uni API 将转由路由器处理，确保守卫生效 |
| `guardTimeout`     | `number`        | `10000` | 守卫超时时间（毫秒），超时后自动中止导航并输出警告，设为 `0` 可禁用                                                                                                      |
| `readyTimeout`     | `number`        | `0`     | 路由器就绪超时时间（毫秒），超时后 `isReady()` 将 reject，防止 Promise 永久挂起，设为 `0` 可禁用                                                                         |
| `paramsPersistent` | `boolean`       | `false` | 页面参数持久化默认值，设为 true 时所有 params 默认通过 `uni.setStorageSync` 持久化存储，H5 刷新后仍可读取，单次导航可通过 `persistent` 选项覆盖                          |

### RouterLink 组件

声明式导航组件，对应 uni-app 的 `<navigator>`，自动通过路由器执行导航。

```html
<!-- 路径导航 -->
<mxuni-router to="/pages/about/about">
	<view>跳转到关于页</view>
</mxuni-router>

<!-- replace 模式 -->
<mxuni-router to="/pages/about/about" replace>
	<view>替换当前页</view>
</mxuni-router>

<!-- relaunch 模式 -->
<mxuni-router to="/pages/index/index" relaunch>
	<view>返回首页</view>
</mxuni-router>

<!-- 带动画导航（仅 App 端生效） -->
<mxuni-router to="/pages/about/about" :animation="{ type: 'slide-in-bottom' }">
	<view>底部滑入</view>
</mxuni-router>

<!-- 带页面间通信 -->
<mxuni-router :to="{ path: '/pages/about/about', query: { id: '1' } }" :events="{ receiveData: (data) => console.log(data) }" @navigated="onNavigated" @error="onNavError">
	<view>跳转并通信</view>
</mxuni-router>
```

```typescript
// @navigated 回调获取 eventChannel
function onNavigated(eventChannel) {
	// 向目标页面发送事件
	eventChannel?.emit('fromOpener', { msg: '你好' })
}
```

| 属性                   | 类型                  | 默认值              | 说明                                                                         |
| ---------------------- | --------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `to`                   | `RouteLocationRaw`    | -                   | 目标路由位置                                                                 |
| `replace`              | `boolean`             | `false`             | 是否使用替换模式导航                                                         |
| `relaunch`             | `boolean`             | `false`             | 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面），优先级高于 replace |
| `params`               | `ParamObject`         | `undefined`         | 页面参数，支持复杂数据（仅 JSON 可序列化值），不暴露在 URL 中                |
| `persistent`           | `boolean`             | `undefined`         | 页面参数是否持久化到 storage，H5 刷新后仍可读取                              |
| `animation`            | `NavigationAnimation` | `undefined`         | 导航动画（仅 App 端生效），覆盖 meta.animation                               |
| `events`               | `EventListeners`      | `undefined`         | 监听被打开页面通过 eventChannel 发送的事件                                   |
| `hoverClass`           | `string`              | `'navigator-hover'` | 按下时的样式类                                                               |
| `hoverStopPropagation` | `boolean`             | `false`             | 是否阻止祖先节点的点击态                                                     |
| `hoverStartTime`       | `number`              | `50`                | 按住后多久出现点击态（ms）                                                   |
| `hoverStayTime`        | `number`              | `600`               | 手指松开后点击态保留时间（ms）                                               |

| 事件        | 参数                   | 说明                                     |
| ----------- | ---------------------- | ---------------------------------------- |
| `navigated` | `EventChannel \| void` | 导航成功后触发，参数为 eventChannel 实例 |
| `error`     | `NavigationFailure`    | 导航失败时触发                           |

### RouteConfig 路由配置项

| 字段          | 类型                                   | 说明                                     |
| ------------- | -------------------------------------- | ---------------------------------------- |
| `path`        | `string`                               | 页面路径，需与 `pages.json` 中的路径一致 |
| `name`        | `string`                               | 路由名称，用于命名路由导航               |
| `meta`        | `RouteMeta`                            | 路由元信息                               |
| `beforeEnter` | `NavigationGuard \| NavigationGuard[]` | 路由独享守卫，进入该路由时触发           |

### RouteMeta 路由元信息

| 字段            | 类型                  | 说明                                                                     |
| --------------- | --------------------- | ------------------------------------------------------------------------ |
| `title`         | `string`              | 页面标题                                                                 |
| `isTab`         | `boolean`             | 是否为 TabBar 页面，为 true 时 push/replace 自动使用 switchTab           |
| `requireAuth`   | `boolean`             | 是否需要登录认证                                                         |
| `animation`     | `NavigationAnimation` | 默认导航动画（仅 App 端生效），可被 push/replace 时的 animation 参数覆盖 |
| `[key: string]` | `any`                 | 自定义扩展字段                                                           |

### NavigationResult 导航结果

`push()` 的返回值，继承 `RouteLocation`，额外包含 `eventChannel`：

| 字段           | 类型                        | 说明                           |
| -------------- | --------------------------- | ------------------------------ |
| `path`         | `string`                    | 规范化后的路径                 |
| `name`         | `string \| undefined`       | 路由名称                       |
| `meta`         | `RouteMeta`                 | 路由元信息                     |
| `query`        | `Record<string, string>`    | 查询参数                       |
| `params`       | `Readonly<ParamObject>`     | 页面参数（只读）               |
| `fullPath`     | `string`                    | 完整路径（含查询参数）         |
| `eventChannel` | `EventChannel \| undefined` | 页面间通信通道，仅 push 时可用 |

### RouteLocation 路由位置

`useRoute()` 返回的响应式路由位置，包含以下查询参数增强方法：

| 方法                              | 说明                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `queryInt(key, defaultValue?)`    | 将查询参数解析为整数，解析失败返回 `defaultValue`                              |
| `queryNumber(key, defaultValue?)` | 将查询参数解析为数值（支持浮点），解析失败返回 `defaultValue`                  |
| `queryBool(key, defaultValue?)`   | 将查询参数解析为布尔值（`'true'`/`'1'` → `true`），无法识别返回 `defaultValue` |

### Options API

在 Options API 组件中，可通过 `this.$router` 和 `this.$route` 访问路由器：

```typescript
export default {
	methods: {
		goToAbout() {
			this.$router.push('/pages/about/about')
		}
	},
	computed: {
		currentPath() {
			return this.$route.path
		}
	}
}
```

## TypeScript 类型提示

启用 `dts: true` 后，`generateRouter` 插件自动生成类型声明文件，为路由导航提供类型安全：

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

| 职责       | pages.json        | Uni Router                       |
| ---------- | ----------------- | -------------------------------- |
| 页面注册   | 必须声明          | 不负责                           |
| 路由导航   | uni.navigateTo 等 | push / replace / relaunch / back |
| 路由守卫   | 不支持            | beforeEach 等                    |
| 路由元信息 | 不支持            | meta 字段                        |
| 命名路由   | 不支持            | name 字段                        |

## License

[MIT](LICENSE)
