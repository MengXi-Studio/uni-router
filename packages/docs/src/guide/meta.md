# 路由元信息

路由元信息（RouteMeta）是附加在路由上的自定义数据，用于控制页面行为、权限、动画等。本章详细讲解内置字段、类型扩展和实战应用。

## RouteMeta 接口

```ts
interface RouteMeta {
  title?: string                    // 页面标题
  isTab?: boolean                   // 是否为 TabBar 页面
  requireAuth?: boolean             // 是否需要登录
  animation?: NavigationAnimation   // 默认导航动画
  [key: string]: unknown            // 自定义扩展字段
}
```

`[key: string]: unknown` 索引签名允许添加任意自定义字段，无需修改库的类型定义。

## 内置字段

### title

页面标题，常在 `afterEach` 中设置导航栏标题：

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于我们' } }
]

router.afterEach((to) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### isTab

标识 TabBar 页面。路由器根据此字段选择导航 API：

- `isTab: true` → `uni.switchTab`
- `isTab: false` 或未设置 → `uni.navigateTo` / `uni.redirectTo`

```ts
const routes = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// 自动使用 uni.switchTab
router.push({ name: 'user' })
```

::: warning 必须与 pages.json 一致
`isTab` 必须与 `pages.json` 的 `tabBar.list` 一致：

```ts
// pages.json
{ "tabBar": { "list": [{ "pagePath": "pages/user/user" }] } }

// ❌ 错误：未设 isTab，会用 navigateTo 跳 TabBar 页，失败
{ path: 'pages/user/user', name: 'user' }

// ✅ 正确
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
```
:::

### requireAuth

标识需要登录的页面，与守卫配合：

```ts
const routes = [
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true } }
]

router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

### animation

默认导航动画（仅 App 端生效）：

```ts
interface NavigationAnimation {
  type: UniAnimationType  // 动画类型
  duration?: number       // 持续时间（毫秒），默认 300
}
```

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]

// 使用 meta 中的默认动画
await router.push({ name: 'about' })

// 覆盖 meta 中的动画
await router.push({ name: 'about', animation: { type: 'slide-in-right' } })
```

#### 动画优先级

```
调用时传入 > meta.animation > uni 默认值
```

::: info 平台限制
动画仅 App 端支持，H5 和小程序无效。详见[平台兼容性](./compatibility#导航动画仅-app-支持)。
:::

## 类型扩展

通过 TypeScript 模块声明扩展 `RouteMeta`，获得类型提示：

### 基本扩展

```ts
// src/types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // 自定义字段
    roles?: string[]           // 允许访问的角色
    permissions?: string[]     // 所需权限
    keepAlive?: boolean        // 是否缓存
    pageType?: 'list' | 'detail' | 'form'  // 页面类型
  }
}
```

### 使用扩展后的类型

```ts
// 路由配置中有类型提示
const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      requireAuth: true,
      roles: ['admin'],           // ✅ 类型提示
      permissions: ['user:manage'] // ✅ 类型提示
    }
  }
]

// 守卫中访问 meta 字段无需断言
router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {  // ✅ 类型为 string[]
    next(false)
  } else {
    next()
  }
})
```

### 完整业务类型扩展

```ts
// src/types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // 基础
    title?: string
    isTab?: boolean
    requireAuth?: boolean
    animation?: NavigationAnimation

    // 权限
    roles?: string[]
    permissions?: string[]

    // 页面行为
    keepAlive?: boolean
    preload?: boolean              // 是否预取数据
    closeCurrent?: boolean         // 导航后是否关闭当前页

    // 业务字段
    module?: 'user' | 'order' | 'product'  // 所属模块
    breadcrumb?: string[]                   // 面包屑
    analyticsKey?: string                   // 埋点标识
  }
}
```

### 配置 tsconfig

确保 `tsconfig.json` 包含类型声明文件：

```json
{
  "include": ["src/**/*.ts", "src/types/**/*.d.ts"]
}
```

## 访问元信息

### 在组件中

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 通过 .value 访问（script setup 中）
console.log(route.value.meta.title)
console.log(route.value.meta.requireAuth)

// 模板中自动解包
// <text>{{ route.meta.title }}</text>
```

### 在守卫中

```ts
router.beforeEach((to, from, next) => {
  console.log(to.meta.requireAuth)  // 直接访问
  console.log(to.meta.roles)        // 扩展字段
  next()
})
```

### 通过 Router 实例

```ts
router.currentRoute.meta.title
```

::: tip 响应式
`useRoute()` 返回响应式引用，`meta` 变化时组件会自动更新。`router.currentRoute` 是普通属性，非响应式。
:::

## 实战应用

### 权限控制

```ts
// 类型扩展
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
    permissions?: string[]
  }
}

// 路由配置
const routes = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: { roles: ['admin'], permissions: ['system:manage'] }
  },
  {
    path: 'pages/editor/editor',
    name: 'editor',
    meta: { roles: ['admin', 'editor'] }
  }
]

// 守卫
router.beforeEach((to, from, next) => {
  // 角色检查
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    uni.showToast({ title: '无权访问', icon: 'none' })
    next({ name: 'home' }, { mode: 'relaunch' })
    return
  }

  // 权限检查
  if (to.meta.permissions && !hasPermission(to.meta.permissions)) {
    uni.showToast({ title: '权限不足', icon: 'none' })
    next({ name: 'home' }, { mode: 'relaunch' })
    return
  }

  next()
})
```

### 页面标题自动设置

```ts
// 类型扩展
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    title?: string
    dynamicTitle?: boolean  // 是否动态标题
  }
}

// 路由配置
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
  { path: 'pages/detail/detail', name: 'detail', meta: { dynamicTitle: true } }
]

// 守卫
router.afterEach((to) => {
  if (to.meta.dynamicTitle) {
    // 动态标题：从数据中获取
    const store = useDetailStore()
    uni.setNavigationBarTitle({ title: store.detail?.title || '详情' })
  } else if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title })
  }
})
```

### 数据预取

```ts
// 类型扩展
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    preload?: boolean
    preloadKey?: string
  }
}

// 路由配置
const routes = [
  {
    path: 'pages/detail/detail',
    name: 'detail',
    meta: { preload: true, preloadKey: 'detail' }
  }
]

// 守卫
const preloaders = {
  detail: async (to) => {
    const store = useDetailStore()
    await store.fetchDetail(to.query.id)
  }
}

router.beforeResolve(async (to, from, next) => {
  if (to.meta.preload && to.meta.preloadKey) {
    try {
      await preloaders[to.meta.preloadKey](to)
      next()
    } catch {
      next(false)
    }
  } else {
    next()
  }
})
```

### 埋点统计

```ts
// 类型扩展
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    analyticsKey?: string
    module?: string
  }
}

// 路由配置
const routes = [
  {
    path: 'pages/order/list',
    name: 'order-list',
    meta: { analyticsKey: 'order_list_view', module: 'order' }
  }
]

// 守卫
router.afterEach((to) => {
  if (to.meta.analyticsKey) {
    analytics.report({
      event: 'page_view',
      key: to.meta.analyticsKey,
      module: to.meta.module,
      path: to.path
    })
  }
})
```

### 页面缓存控制

```ts
// 类型扩展
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    keepAlive?: boolean
  }
}

// 路由配置
const routes = [
  { path: 'pages/list/list', name: 'list', meta: { keepAlive: true } }
]

// 在 App.vue 中控制缓存
// #ifdef APP-PLUS
const route = useRoute()
const cachedPages = computed(() => {
  return route.meta.keepAlive ? [route.path] : []
})
// #endif
```

## meta 与 pages.json 的协作

`pages.json` 的 `style` 字段也可配置页面样式，与 `meta` 互补：

| 配置项 | pages.json style | RouteMeta |
| --- | --- | --- |
| 导航栏标题 | `navigationBarTitleText` | `title` |
| 导航栏背景色 | `navigationBarBackgroundColor` | 自定义字段 |
| 下拉刷新 | `enablePullDownRefresh` | 自定义字段 |
| 权限控制 | ❌ | `requireAuth` / `roles` |
| 动画 | ❌ | `animation` |

::: tip 推荐分工
- **静态样式**：用 `pages.json` 的 `style`（如导航栏颜色、背景色）
- **动态行为**：用 `meta`（如权限、动画、预取）
:::

## 下一步

- [路由配置](./route-config) — RouteConfig 详解
- [路由守卫](./guards) — 守卫中如何使用 meta
- [实战指南](./recipes) — 完整业务方案
