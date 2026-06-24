# RouterOptions

路由器初始化选项，传递给 [`createRouter()`](./create-router)。

## 类型定义

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
  interceptUniApi?: boolean
  guardTimeout?: number
  readyTimeout?: number
  paramsPersistent?: boolean
}
```

## 属性详解

### routes

- **类型**: `RouteConfig[]`
- **必填**: 是
- **说明**: 路由配置列表，需与 `pages.json` 中的页面声明保持一致

::: warning 必须与 pages.json 一致
uni-app 的页面由 `pages.json` 静态声明，Uni Router 不会自动注册页面。`routes` 中的 `path` 必须能在 `pages.json` 中找到对应声明，否则导航会失败。

建议使用 [`@meng-xi/vite-plugin`](../guide/auto-generate) 自动生成路由配置，避免手动维护不一致。
:::

```ts
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于' } }
]

const router = createRouter({ routes })
```

### strict

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用严格模式
  - `true`：未匹配的命名路由将抛出 `ROUTE_NOT_FOUND` 错误
  - `false`：未匹配的命名路由仅输出警告，并使用名称作为路径回退

```ts
// 严格模式（推荐生产环境）
const router = createRouter({ routes, strict: true })

// 宽松模式（迁移阶段或原型开发）
const router = createRouter({ routes, strict: false })
```

::: tip 何时关闭严格模式
- 迁移阶段：逐步迁移到命名路由，未迁移的部分回退为路径
- 快速原型：不关心路由配置完整性
- 生产环境建议保持 `true`，尽早发现配置错误
:::

### interceptUniApi

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否拦截 uni 原生导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）

启用后直接调用 `uni.navigateTo()` 等方法将被拦截并转由路由器处理，确保路由守卫（`beforeEach` / `beforeResolve` / `afterEach`）始终生效。

```ts
const router = createRouter({
  routes,
  interceptUniApi: true // 拦截原生 API
})
```

::: warning 启用后的副作用
1. 直接调用 `uni.navigateTo()` 等方法的 `success` / `fail` 回调将不会被触发（原始调用被阻止后转由路由器执行）
2. H5 平台 TabBar 点击会触发 `uni.switchTab`，已做特殊处理：放行原始调用并在 `success` 中同步路由状态
3. 建议统一使用 `router.push()` / `router.replace()` / `router.back()` 进行导航
:::

::: tip 何时启用
- 需要确保所有导航都经过守卫（如权限控制）
- 迁移阶段，逐步替换原生 API 调用
- 第三方库直接调用 `uni.navigateTo` 时需要守卫生效
:::

详见[拦截器机制](../guide/interceptor)。

### guardTimeout

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
| 场景 | 建议值 |
| --- | --- |
| 纯同步守卫 | `10000`（默认） |
| 守卫含网络请求 | `30000`（30 秒） |
| 守卫含大文件读取 | `60000`（60 秒） |
| 禁用超时保护 | `0`（不推荐） |

设为 `0` 可禁用超时保护，但可能导致导航永久挂起，不推荐。
:::

### readyTimeout

- **类型**: `number`
- **默认值**: `0`（永不超时）
- **说明**: 路由器就绪超时时间（毫秒）。当路由器在此时间内未能完成初始化时，`await router.isReady()` 将被 reject，防止路由器初始化异常时 Promise 永久挂起

```ts
const router = createRouter({
  routes: [...],
  readyTimeout: 5000 // 5 秒内未就绪则 reject isReady() Promise
})
```

::: tip 何时配置 readyTimeout
- 测试环境：设置较短超时（如 5000ms），快速发现初始化问题
- 生产环境：可保持默认 `0`（永不超时），或设置较大值（如 30000ms）作为兜底
- 路由器初始化异常时，`isReady()` 会永久挂起，设置超时可避免此问题
:::

### paramsPersistent

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 页面参数持久化默认值
  - `true`：所有 `params` 默认通过 `uni.setStorageSync` 持久化存储，H5 刷新后仍可读取
  - `false`：`params` 仅存储在内存中，页面关闭后数据丢失
  - 单次导航可通过 `persistent` 选项覆盖此默认值

```ts
// 全局默认持久化
const router = createRouter({
  routes: [...],
  paramsPersistent: true
})

// 单次导航覆盖（不持久化）
await router.push({
  path: '/detail',
  params: { id: 123 },
  persistent: false
})

// 单次导航覆盖（持久化）
await router.push({
  path: '/detail',
  params: { id: 123 },
  persistent: true
})
```

::: warning 持久化的代价
持久化会写入 storage，频繁使用大对象会增加存储开销。建议：
- 仅在需要 H5 刷新后恢复数据的场景启用
- 大对象优先使用内存模式（`persistent: false`）
- 持久化的 params 应及时清理（`router` 会在页面关闭时自动清理）
:::

## 完整示例

```ts
import { createRouter } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页', isTab: true } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于', requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { title: '我的', isTab: true } },
  { path: 'pages/login/login', name: 'login', meta: { title: '登录' } }
]

const router = createRouter({
  routes,
  strict: true,              // 严格模式
  interceptUniApi: true,     // 拦截原生 API
  guardTimeout: 15000,       // 守卫超时 15 秒
  readyTimeout: 5000,        // 就绪超时 5 秒
  paramsPersistent: false    // params 默认不持久化
})

export default router
```

## 配置组合建议

### 最小配置（快速原型）

```ts
const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home' },
    { path: 'pages/about/about', name: 'about' }
  ]
})
```

### 生产环境推荐配置

```ts
const router = createRouter({
  routes,
  strict: true,              // 尽早发现配置错误
  interceptUniApi: true,     // 统一守卫流程
  guardTimeout: 15000,       // 适配网络请求
  readyTimeout: 10000,       // 兜底保护
  paramsPersistent: false    // 默认内存模式
})
```

### 高安全场景配置

```ts
const router = createRouter({
  routes,
  strict: true,
  interceptUniApi: true,     // 确保所有导航经过权限校验
  guardTimeout: 30000,       // 适配复杂权限校验
  readyTimeout: 5000,
  paramsPersistent: false    // 避免敏感数据持久化
})
```

## 下一步

- [createRouter()](./create-router) — 创建路由器实例
- [RouteConfig 类型](./type-route-config) — 路由配置项类型
- [拦截器机制](../guide/interceptor) — 拦截原生 API 的原理
