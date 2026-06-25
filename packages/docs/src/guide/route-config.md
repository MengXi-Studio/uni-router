# 路由配置

路由配置是 Uni Router 的基础。本章详细讲解 `RouteConfig` 的每个字段、路由匹配规则、与 `pages.json` 的协作关系，以及大型项目的路由组织方式。

## RouteConfig 详解

每个路由配置项对应 `pages.json` 中的一个页面：

```ts
interface RouteConfig {
  path: string              // 页面路径（必填）
  name?: string             // 路由名称（推荐）
  meta?: RouteMeta          // 路由元信息
  beforeEnter?: NavigationGuard | NavigationGuard[]  // 路由独享守卫
  [key: string]: any        // 自定义扩展属性
}
```

### path

页面路径，必须与 `pages.json` 中的声明**完全一致**（不含前导 `/`）：

```ts
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/about/about" }
  ]
}

// 路由配置
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home' },
  { path: 'pages/about/about', name: 'about' }
]
```

::: warning 路径一致性
`path` 必须与 `pages.json` 完全一致，否则路由匹配失败。常见错误：

```ts
// ❌ 错误：缺少 pages/ 前缀
{ path: 'about/about' }

// ❌ 错误：多了前导 /
{ path: '/pages/about/about' }

// ❌ 错误：路径不完整
{ path: 'pages/about' }

// ✅ 正确
{ path: 'pages/about/about' }
```
:::

#### 分包路径

分包页面的路径需包含分包根目录：

```json
// pages.json
{
  "subPackages": [
    {
      "root": "subpkg",
      "pages": [
        { "path": "detail/detail" }
      ]
    }
  ]
}
```

```ts
// 路由配置：path = 分包根 + 页面路径
const routes: RouteConfig[] = [
  { path: 'subpkg/detail/detail', name: 'detail' }
]

// 导航
await router.push({ name: 'detail' })
```

### name

路由名称，用于命名导航。**强烈建议为每个路由配置唯一的 name**。

```ts
// 命名导航（推荐）
await router.push({ name: 'about' })

// 路径导航（不推荐，路径变化时需修改所有调用处）
await router.push({ path: 'pages/about/about' })
```

#### 命名的好处

1. **解耦路径**：路径变化时只需改路由配置，无需修改业务代码
2. **类型安全**：配合自动生成，可获得 name 的类型提示
3. **可读性**：`{ name: 'user-profile' }` 比 `'pages/user/profile/profile'` 更清晰

#### 重复名称

如果定义了重复的 `name`，后定义的会覆盖先定义的，并输出警告：

```ts
const routes = [
  { path: 'pages/a/a', name: 'detail' },
  { path: 'pages/b/b', name: 'detail' } // ⚠️ 覆盖前者
]

router.push({ name: 'detail' }) // 跳转到 pages/b/b
```

### meta

路由元信息，详见[路由元信息](./meta)。

### beforeEnter

路由独享守卫，详见[路由守卫 - beforeEnter](./guards#beforeenter-路由独享守卫)。

## 创建路由器

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    {
      path: 'pages/index/index',
      name: 'home',
      meta: { isTab: true, title: '首页' }
    },
    {
      path: 'pages/about/about',
      name: 'about',
      meta: { title: '关于', requireAuth: true }
    }
  ],
  strict: true,           // 严格模式
  interceptUniApi: true,  // 拦截原生 API
  guardTimeout: 15000,    // 守卫超时
  readyTimeout: 5000      // 就绪超时
})
```

### 配置选项详解

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | - | 路由配置数组（必填） |
| `strict` | `boolean` | `true` | 严格模式，未匹配的命名路由抛出错误 |
| `interceptUniApi` | `boolean` | `false` | 拦截 `uni.navigateTo` 等原生 API |
| `guardTimeout` | `number` | `10000` | 守卫超时时间（毫秒） |
| `readyTimeout` | `number` | `5000` | 路由器就绪超时（毫秒） |

### strict 选项

- **`true`**（默认）：未匹配的命名路由抛出 `ROUTE_NOT_FOUND` 错误
- **`false`**：未匹配的命名路由仅警告，并用 name 作为路径回退

```ts
// 严格模式
const router = createRouter({ routes, strict: true })
await router.push({ name: 'not-exist' }) // 抛出错误

// 宽松模式
const router = createRouter({ routes, strict: false })
await router.push({ name: 'not-exist' }) // 警告，尝试跳转到 /not-exist
```

::: tip 推荐严格模式
生产环境推荐 `strict: true`，及早发现路由配置错误。开发阶段可临时设为 `false` 便于调试。
:::

### guardTimeout 选项

守卫执行的超时时间。如果守卫中有网络请求等耗时操作，建议调大：

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 守卫中有网络请求，30 秒
})
```

超时后导航会被取消，抛出 `NAVIGATION_CANCELLED`。

### readyTimeout 选项

路由器初始化等待页面栈就绪的超时时间。通常无需修改。

## 路由匹配规则

Uni Router 支持路径和名称两种匹配方式。

### 路径匹配

```ts
// 字符串形式
router.push('pages/about/about')
router.push('/pages/about/about') // 自动补全 /
router.push('pages/about/about?id=1') // 带 query

// 对象形式
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

#### 路径规范化

```ts
// 以下写法等价
router.push('pages/about/about')
router.push('/pages/about/about')
router.push('pages/about/about/') // 末尾 / 会被忽略
```

#### query 解析

```ts
// URL 字符串中的 query 会被解析
router.push('pages/about/about?id=1&tab=info')
// 等价于
router.push({ path: 'pages/about/about', query: { id: '1', tab: 'info' } })
```

### 名称匹配

```ts
// 基本用法
router.push({ name: 'about' })

// 带 query
router.push({ name: 'about', query: { id: '1' } })

// 带 params（复杂数据）
router.push({ name: 'detail', params: { item: largeObject } })
```

### 混合使用

```ts
// ❌ 不推荐：path 和 name 同时使用（name 优先）
router.push({ path: 'pages/about/about', name: 'about' })

// ✅ 推荐：二选一
router.push({ name: 'about' })
// 或
router.push({ path: 'pages/about/about' })
```

## 与 pages.json 的关系

Uni Router **不替代** `pages.json`，而是与之配合：

| 职责 | pages.json | Uni Router |
| --- | --- | --- |
| 页面注册 | ✅ 必须声明 | ❌ 不负责 |
| 路由导航 | `uni.navigateTo` 等 | `push` / `replace` / `back` |
| 路由守卫 | ❌ 不支持 | ✅ `beforeEach` 等 |
| 路由元信息 | ❌ 不支持 | ✅ `meta` 字段 |
| 命名路由 | ❌ 不支持 | ✅ `name` 字段 |
| 页面样式 | ✅ `style` | ❌ 不负责 |
| TabBar 配置 | ✅ `tabBar` | ❌ 不负责 |

### 配置一致性

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/about/about" }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" }
    ]
  }
}
```

```ts
// 路由配置必须与 pages.json 一致
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
  { path: 'pages/about/about', name: 'about' }
]
```

::: warning isTab 一致性
`meta.isTab` 必须与 `pages.json` 的 `tabBar.list` 一致：
- TabBar 页面必须设 `isTab: true`，否则用 `navigateTo` 跳 TabBar 页会失败
- 非 TabBar 页面不要设 `isTab: true`，否则用 `switchTab` 跳非 TabBar 页会失败
:::

## 路由组织方式

### 单文件组织（小型项目）

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
    { path: 'pages/about/about', name: 'about' },
    { path: 'pages/login/login', name: 'login' }
  ]
})

export default router
```

### 模块化组织（中大型项目）

按业务模块拆分路由：

```
src/
├── router/
│   ├── index.ts          # 路由器实例
│   └── routes.ts         # 汇总路由
├── modules/
│   ├── user/
│   │   └── routes.ts     # 用户模块
│   ├── order/
│   │   └── routes.ts     # 订单模块
│   └── product/
│       └── routes.ts     # 商品模块
```

```ts
// modules/user/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const userRoutes: RouteConfig[] = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: '我的' } },
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true } },
  { path: 'pages/settings/settings', name: 'settings', meta: { requireAuth: true } }
]
```

```ts
// router/routes.ts
import { userRoutes } from '@/modules/user/routes'
import { orderRoutes } from '@/modules/order/routes'
import { productRoutes } from '@/modules/product/routes'

export const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: '首页' } },
  { path: 'pages/login/login', name: 'login' },
  ...userRoutes,
  ...orderRoutes,
  ...productRoutes
]
```

### 自动生成（推荐）

使用 `@meng-xi/vite-plugin` 从 `pages.json` 自动生成路由配置和类型声明：

```ts
// vite.config.ts
import uniRouter from '@meng-xi/vite-plugin'

export default {
  plugins: [
    uniRouter({
      pagesJsonPath: 'src/pages.json',
      outputDir: 'src/router'
    })
  ]
}
```

详见[自动生成路由配置](./auto-generate)。

## 常见配置错误

### 1. 路径与 pages.json 不一致

```ts
// ❌ pages.json 中是 pages/about/about，路由配置写错
{ path: 'pages/about', name: 'about' }

// ✅ 一致
{ path: 'pages/about/about', name: 'about' }
```

### 2. 忘记设置 isTab

```ts
// ❌ TabBar 页面未设 isTab
{ path: 'pages/user/user', name: 'user' }
router.push({ name: 'user' }) // 用 navigateTo 跳 TabBar 页，失败

// ✅ 设置 isTab
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
router.push({ name: 'user' }) // 用 switchTab，成功
```

### 3. 重复的 name

```ts
// ❌ 重复 name
const routes = [
  { path: 'pages/a/a', name: 'detail' },
  { path: 'pages/b/b', name: 'detail' } // 覆盖前者
]

// ✅ 唯一 name
const routes = [
  { path: 'pages/a/a', name: 'detail-a' },
  { path: 'pages/b/b', name: 'detail-b' }
]
```

### 4. 分包路径错误

```ts
// ❌ 分包路径未包含分包根
{ path: 'detail/detail', name: 'detail' } // 分包根是 subpkg

// ✅ 包含分包根
{ path: 'subpkg/detail/detail', name: 'detail' }
```

## 下一步

- [路由元信息](./meta) — meta 字段详解
- [路由守卫](./guards) — beforeEnter 等守卫
- [自动生成路由配置](./auto-generate) — 从 pages.json 生成配置
