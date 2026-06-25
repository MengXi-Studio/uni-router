# RouteConfig

路由配置项，对应 `pages.json` 中的页面声明。每个 `RouteConfig` 描述一个页面的路由信息。

## 类型定义

```ts
interface RouteConfig {
  path: string
  name?: string
  meta?: RouteMeta
  beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

## 属性

### path

- **类型**: `string`
- **必填**: 是
- **说明**: 页面路径，需与 `pages.json` 中的路径一致（不含前导 `/`）

::: warning 路径格式
- ✅ 正确：`'pages/index/index'`、`'pages/user/detail/detail'`
- ❌ 错误：`'/pages/index/index'`（含前导 `/`）、`'pages/index'`（不完整）

路径会自动规范化（补全前导 `/`），但建议在配置时保持与 `pages.json` 一致的格式。
:::

```ts
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home' },
  { path: 'pages/user/detail/detail', name: 'user-detail' }
]
```

### name

- **类型**: `string`
- **必填**: 否
- **说明**: 路由名称，用于命名路由导航。重复名称会被覆盖并输出警告

::: tip 推荐使用命名路由
命名路由解耦了路径，重构时只需修改路由配置中的 `path`，无需全局搜索替换字符串。配合 `@meng-xi/vite-plugin` 的 `dts` 功能，还能获得类型检查和自动补全。
:::

```ts
// 命名路由导航
await router.push({ name: 'user-detail', query: { id: '1' } })

// 配合类型增强（dts 生成）
await router.push({ name: 'user-detail' as const, query: { id: '1' } })
// ↑ 'user-detail' 会有类型提示，拼写错误会报错
```

### meta

- **类型**: [`RouteMeta`](./type-route-meta)
- **必填**: 否
- **说明**: 路由元信息，用于描述路由的附加属性

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: {
      title: '首页',
      isTab: true  // 标记为 TabBar 页面
    }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: {
      title: '关于',
      requireAuth: true  // 需要登录认证
    }
  }
]
```

详见 [RouteMeta 类型](./type-route-meta)。

### beforeEnter

- **类型**: [`NavigationGuard`](./type-navigation-guard) | [`NavigationGuard`](./type-navigation-guard)[]
- **必填**: 否
- **说明**: 路由独享守卫，仅在进入该路由时触发。支持单个守卫或守卫数组

::: tip beforeEnter vs beforeEach
- `beforeEach`：全局守卫，对所有路由生效
- `beforeEnter`：路由独享守卫，仅对该路由生效
- 执行顺序：`beforeEach` → `beforeEnter` → `beforeResolve`

`beforeEnter` 适合放某路由的专属校验逻辑（如订单页需先选择地址）。
:::

#### 单个守卫

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: { requireAdmin: true },
    beforeEnter: (to, from, next) => {
      if (user.role === 'admin') {
        next()
      } else {
        next({ name: '403' })
      }
    }
  }
]
```

#### 守卫数组

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/order/order',
    name: 'order',
    beforeEnter: [
      // 1. 必须先选择地址
      (to, from, next) => {
        if (!store.selectedAddress) {
          uni.showToast({ title: '请先选择地址', icon: 'none' })
          next(false)
        } else {
          next()
        }
      },
      // 2. 必须有商品
      (to, from, next) => {
        if (store.cart.length === 0) {
          next({ name: 'cart' })
        } else {
          next()
        }
      },
      // 3. 检查库存
      async (to, from, next) => {
        const hasStock = await checkStock(store.cart)
        if (!hasStock) {
          uni.showToast({ title: '商品库存不足', icon: 'none' })
          next(false)
        } else {
          next()
        }
      }
    ]
  }
]
```

::: warning 数组守卫的执行规则
- 按数组顺序执行
- 任一守卫中止（`next(false)`）或重定向（`next(location)`），后续守卫不再执行
- 所有守卫通过后，才会执行 `beforeResolve`
:::

## 完整示例

```ts
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  // 首页（TabBar）
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: '首页', isTab: true }
  },
  // 关于页（需登录）
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: '关于', requireAuth: true },
    beforeEnter: (to, from, next) => {
      if (isLoggedIn()) next()
      else next({ name: 'login' })
    }
  },
  // 用户页（TabBar）
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { title: '我的', isTab: true }
  },
  // 登录页
  {
    path: 'pages/login/login',
    name: 'login',
    meta: { title: '登录' }
  },
  // 订单页（多重校验）
  {
    path: 'pages/order/order',
    name: 'order',
    meta: { title: '确认订单', requireAuth: true },
    beforeEnter: [
      checkAddress,
      checkCart,
      checkStock
    ]
  }
]

export default routes
```

## 与 pages.json 的关系

`RouteConfig` 的 `path` 必须与 `pages.json` 中的页面声明一致：

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } },
    { "path": "pages/about/about", "style": { "navigationBarTitleText": "关于" } },
    { "path": "pages/user/user", "style": { "navigationBarTitleText": "我的" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/user/user", "text": "我的" }
    ]
  }
}
```

```ts
// 对应的 RouteConfig
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },  // ← isTab 必须与 tabBar.list 一致
  { path: 'pages/about/about', name: 'about' },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }     // ← isTab 必须与 tabBar.list 一致
]
```

::: warning isTab 必须与 tabBar.list 一致
`meta.isTab` 必须与 `pages.json` 的 `tabBar.list` 声明一致。如果声明了 `isTab: true` 但不在 `tabBar.list` 中，`uni.switchTab` 会失败；反之亦然。

建议使用 [`@meng-xi/vite-plugin`](../guide/auto-generate) 自动生成路由配置，会自动识别 TabBar 页面并设置 `isTab`。
:::

## 下一步

- [RouteMeta 类型](./type-route-meta) — 路由元信息
- [NavigationGuard 类型](./type-navigation-guard) — 守卫类型定义
- [路由配置指南](../guide/route-config) — 路由配置的深入讲解
