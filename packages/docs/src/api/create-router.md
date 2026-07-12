# createRouter()

创建 uni-app 路由器实例，是使用 Uni Router 的入口函数。

## 类型

```ts
function createRouter(options: RouterOptions): Router
```

## 参数

### options

路由器初始化选项，类型为 [`RouterOptions`](./type-router-options)。

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
  plugins?: RouterPlugin[]
  interceptUniApi?: boolean
  guardTimeout?: number
  readyTimeout?: number
  paramsPersistent?: boolean
  useUniEventChannel?: boolean
}
```

#### options.routes

- **类型**: `RouteConfig[]`
- **必填**: 是
- **说明**: 路由配置列表，需与 `pages.json` 中的页面声明保持一致

::: warning 必须与 pages.json 一致
uni-app 的页面由 `pages.json` 静态声明，Uni Router 不会自动注册页面。`routes` 中的 `path` 必须能在 `pages.json` 中找到对应声明，否则导航会失败。
:::

#### options.strict

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用严格模式
  - `true`：未匹配的命名路由将抛出 `ROUTE_NOT_FOUND` 错误
  - `false`：未匹配的命名路由仅输出警告，并使用名称作为路径回退

::: tip 何时关闭严格模式
仅在迁移阶段或快速原型开发时关闭。生产环境建议保持 `true`，以便尽早发现路由配置错误。
:::

#### options.plugins

- **类型**: `RouterPlugin[]`
- **默认值**: `undefined`
- **说明**: 路由器插件列表。插件按数组顺序依次安装，注册 hook 到路由器的导航流程中。核心仅提供基础导航能力，所有扩展功能（params、animation、channel、interceptor）均通过插件提供，用户需显式引入并注册

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin]
})
```

::: tip 按需注册
只需注册你使用的插件。未注册插件时使用其功能会抛出 `PLUGIN_REQUIRED` 错误。详见[插件系统](../guide/plugins)。
:::

#### options.interceptUniApi

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否拦截 uni 原生导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）

启用后直接调用 `uni.navigateTo()` 等方法将被拦截并转由路由器处理，确保路由守卫（`beforeEach` / `beforeResolve` / `afterEach`）始终生效。

::: warning 启用后的副作用
1. 直接调用 `uni.navigateTo()` 等方法的 `success` / `fail` 回调将不会被触发（原始调用被阻止后转由路由器执行）
2. H5 平台 TabBar 点击会触发 `uni.switchTab`，已做特殊处理：放行原始调用并在 `success` 中同步路由状态
3. 建议统一使用 `router.push()` / `router.replace()` / `router.back()` 进行导航
:::

详见[拦截器机制](../guide/interceptor)。

::: warning 需要 InterceptorPlugin
`interceptUniApi: true` 需要 `InterceptorPlugin` 已注册。若设置了此选项但未注册插件，路由器会输出警告。
:::

#### options.guardTimeout

- **类型**: `number`
- **默认值**: `10000`（10 秒）
- **说明**: 守卫超时时间（毫秒）。当守卫函数在此时间内既未调用 `next()` 也未返回 rejected Promise 时，将输出警告并自动中止导航以防止永久挂起

```ts
const router = createRouter({
  routes: [...],
  guardTimeout: 30000 // 守卫中异步请求较慢时调大超时
})
```

::: tip 调整建议
- 守卫中包含网络请求：建议 `30000`（30 秒）
- 纯同步守卫：保持默认 `10000` 即可
- 设为 `0` 可禁用超时保护（不推荐，可能导致导航永久挂起）
:::

#### options.readyTimeout

- **类型**: `number`
- **默认值**: `0`（永不超时）
- **说明**: 路由器就绪超时时间（毫秒）。当路由器在此时间内未能完成初始化时，`await router.isReady()` 将被 reject，防止路由器初始化异常时 Promise 永久挂起

```ts
const router = createRouter({
  routes: [...],
  readyTimeout: 5000 // 5 秒内未就绪则 reject isReady() Promise
})
```

#### options.paramsPersistent

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 页面参数持久化默认值
  - `true`：所有 `params` 默认通过 `uni.setStorageSync` 持久化存储，H5 刷新后仍可读取
  - `false`：`params` 仅存储在内存中，页面关闭后数据丢失
  - 单次导航可通过 `persistent` 选项覆盖此默认值

```ts
const router = createRouter({
  routes: [...],
  paramsPersistent: true // 所有 params 默认持久化
})

// 单次导航覆盖
await router.push({ path: '/detail', params: { id: 123 }, persistent: false }) // 不持久化
```

::: warning 持久化的代价
持久化会写入 storage，频繁使用大对象会增加存储开销。建议仅在需要 H5 刷新后恢复数据的场景启用。
:::

::: warning 需要 ParamsPlugin
`paramsPersistent: true` 需要 `ParamsPlugin` 已注册。若设置了此选项但未注册插件，路由器会输出警告。
:::

#### options.useUniEventChannel

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用内置通信管理器替代 uni.navigateTo 的原生 EventChannel
  - `false`（默认）：push 使用 uni.navigateTo 原生 EventChannel，其他导航方式不支持页面通信
  - `true`：所有导航方式（push/replace/relaunch/back）都使用内置通信管理器

::: warning 需要 ChannelPlugin
`useUniEventChannel: true` 需要 `ChannelPlugin` 已注册。若设置了此选项但未注册插件，路由器会输出警告。
:::

## 返回值

返回 [`Router`](./router-instance) 实例。

## 示例

### 最小配置

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
    { path: 'pages/about/about', name: 'about', meta: { title: '关于' } }
  ]
})

export default router
```

### 完整配置

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于', requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { title: '我的', isTab: true } },
  { path: 'pages/login/login', name: 'login', meta: { title: '登录' } }
]

const router = createRouter({
  routes,
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin],
  strict: true,
  paramsPersistent: false,
  useUniEventChannel: false,
  interceptUniApi: true,
  guardTimeout: 15000,
  readyTimeout: 5000
})

export default router
```

### 注册到 Vue 应用

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  return { app }
}
```

::: tip 安装时机
`app.use(router)` 会触发 `install`，注册全局属性 `$router` / `$route`，并通过 `provide` 注入路由器实例，使 `useRouter()` / `useRoute()` 可用。同时标记路由器为就绪状态，所有等待中的 `isReady()` Promise 将被 resolve。
:::

### 在 Pinia store 中使用路由器

由于 `app.use(router)` 后路由器即就绪，可在 Pinia store 中安全使用：

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  async function logout() {
    // 清除登录状态
    localStorage.removeItem('token')
    // 跳转登录页，清空栈
    await router.relaunch({ name: 'login' })
  }

  return { logout }
})
```

::: warning 避免在模块顶层调用导航
不要在模块顶层直接调用 `router.push()`，应在函数内部调用。模块顶层执行时 Vue 应用可能尚未挂载，页面栈为空会导致导航失败。
:::

## 常见问题

### Q: 路由配置必须与 pages.json 完全一致吗？

A: `path` 必须能在 `pages.json` 中找到对应声明。`name` 和 `meta` 是 Uni Router 扩展字段，无需在 `pages.json` 中配置。建议使用 [`@meng-xi/vite-plugin`](../guide/auto-generate) 自动生成路由配置，避免手动维护不一致。

### Q: interceptUniApi 启用后，原有 uni.navigateTo 代码还能用吗？

A: 能用，但行为会变化。启用后 `uni.navigateTo` 会被拦截转由路由器处理，`success` / `fail` 回调不会触发。建议逐步迁移到 `router.push()` 等 API。注意：`interceptUniApi` 需要 `InterceptorPlugin` 已注册才能生效。

### Q: 多个路由器实例能共存吗？

A: 技术上可以创建多个，但**不推荐**。uni-app 是单页面栈模型，多个路由器实例会导致状态混乱。始终使用单一路由器实例。

## 下一步

- [Router 实例](./router-instance) — 路由器实例的完整 API
- [RouterOptions 类型](./type-router-options) — 配置项类型定义
- [快速开始](../guide/getting-started) — 完整集成示例
