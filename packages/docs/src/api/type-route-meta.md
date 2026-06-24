# RouteMeta

路由元信息，用于描述路由的附加属性。通过 `RouteConfig.meta` 配置，在守卫、`afterEach` 钩子、组件中通过 `to.meta` / `route.meta` 访问。

## 类型定义

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  animation?: NavigationAnimation
  [key: string]: any
}
```

## 内置属性

### title

- **类型**: `string | undefined`
- **说明**: 页面标题，可在 `afterEach` 钩子中用于设置导航栏标题

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于我们' } }
]

// afterEach 中自动设置标题
router.afterEach((to) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### isTab

- **类型**: `boolean | undefined`
- **说明**: 是否为 TabBar 页面。路由器根据此字段自动选择导航 API
  - `true` → `uni.switchTab`
  - `false` / 未设置 → `uni.navigateTo` / `uni.redirectTo`

::: warning 必须与 pages.json 一致
`meta.isTab` 必须与 `pages.json` 的 `tabBar.list` 声明一致。如果声明了 `isTab: true` 但不在 `tabBar.list` 中，`uni.switchTab` 会失败；反之亦然。

建议使用 [`@meng-xi/vite-plugin`](../guide/auto-generate) 自动生成路由配置，会自动识别 TabBar 页面并设置 `isTab`。
:::

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },   // TabBar 页面
  { path: 'pages/about/about', name: 'about', meta: { isTab: false } }  // 普通页面
]
```

### requireAuth

- **类型**: `boolean | undefined`
- **说明**: 是否需要登录认证，常与 `beforeEach` 守卫配合使用

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { requireAuth: false } },
  { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { requireAuth: true } }
]

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

### animation

- **类型**: `NavigationAnimation | undefined`
- **说明**: 默认导航动画（仅 App 端生效），可被 `push` / `replace` / `back` 调用时传入的 `animation` 参数覆盖

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // 默认 300ms
}
```

动画优先级：`调用时传入` > `meta.animation` > `uni 默认值`

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  },
  {
    path: 'pages/detail/detail',
    name: 'detail',
    meta: { animation: { type: 'slide-in-bottom', duration: 500 } }
  }
]

// 使用 meta 中的默认动画
await router.push({ name: 'about' }) // fade-in, 300ms

// 调用时覆盖
await router.push({ name: 'about', animation: { type: 'slide-in-right' } }) // slide-in-right, 300ms
```

::: warning 平台限制
动画**仅 App 端生效**。小程序和 H5 的导航动画由系统控制，无法自定义。

`UniAnimationType` 可选值：
- `'auto'` — 自动选择
- `'none'` — 无动画
- `'slide-in-right'` — 从右滑入（默认）
- `'slide-in-left'` — 从左滑入
- `'slide-in-top'` — 从顶部滑入
- `'slide-in-bottom'` — 从底部滑入
- `'fade-in'` — 淡入
- `'zoom-fade-in'` — 缩放淡入
- `'zoom-out'` — 缩出
:::

## 自定义扩展

通过索引签名 `[key: string]: any` 支持任意自定义字段：

```ts
const routes = [
  {
    path: 'pages/article/detail',
    name: 'article-detail',
    meta: {
      title: '文章详情',
      requireAuth: false,
      keepAlive: true,              // 自定义：是否缓存
      permissions: ['read', 'comment'],  // 自定义：所需权限
      layout: 'default',            // 自定义：布局类型
      breadcrumb: ['首页', '文章', '详情']  // 自定义：面包屑
    }
  }
]
```

### 类型增强（推荐）

通过 TypeScript 的声明合并为 `RouteMeta` 添加类型提示：

```ts
// src/types/router.d.ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // 自定义字段
    keepAlive?: boolean
    permissions?: string[]
    layout?: 'default' | 'simple' | 'full'
    breadcrumb?: string[]
    // 业务字段
    roles?: string[]        // 所需角色
    module?: string         // 所属模块
    cacheKey?: string       // 缓存键
  }
}
```

增强后，在路由配置和守卫中访问自定义字段会有类型提示：

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      title: '管理后台',
      requireAuth: true,
      roles: ['admin', 'superadmin'],  // ✅ 有类型提示
      module: 'admin'                  // ✅ 有类型提示
    }
  }
]

// 守卫中访问
router.beforeEach((to, from, next) => {
  if (to.meta.roles) {
    const userRoles = getUserRoles()
    if (!to.meta.roles.some(r => userRoles.includes(r))) {
      next({ name: '403' })
      return
    }
  }
  next()
})
```

::: tip 类型增强的好处
- **类型安全**：拼写错误会在编译时报错
- **自动补全**：IDE 会提示可用的字段
- **文档化**：团队成员能直观看到支持哪些 meta 字段
:::

## 实战应用

### 权限控制

```ts
// 扩展类型
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
    permissions?: string[]
  }
}

const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      title: '管理后台',
      requireAuth: true,
      roles: ['admin'],
      permissions: ['read', 'write', 'delete']
    }
  }
]

router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    next({ name: '403' }, { mode: 'relaunch' })
    return
  }
  if (to.meta.permissions && !hasPermission(to.meta.permissions)) {
    next({ name: '403' })
    return
  }
  next()
})
```

### 动态标题

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
  { path: 'pages/about/about', name: 'about', meta: { title: '关于我们' } },
  { path: 'pages/user/user', name: 'user', meta: { title: '个人中心' } }
]

// afterEach 中统一设置标题
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  uni.setNavigationBarTitle({ title: title || '默认标题' })
})
```

### 页面缓存控制

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    keepAlive?: boolean
    cacheKey?: string
  }
}

const routes = [
  {
    path: 'pages/list/list',
    name: 'list',
    meta: {
      keepAlive: true,
      cacheKey: 'list-data'  // 缓存键
    }
  }
]

// 在页面中根据 meta 决定是否缓存
const route = useRoute()
const shouldCache = computed(() => route.value.meta.keepAlive === true)
```

### 布局切换

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    layout?: 'default' | 'simple' | 'full'
  }
}

const routes = [
  { path: 'pages/index/index', name: 'home', meta: { layout: 'default' } },
  { path: 'pages/login/login', name: 'login', meta: { layout: 'simple' } },
  { path: 'pages/editor/editor', name: 'editor', meta: { layout: 'full' } }
]

// App.vue 中根据 meta 切换布局
const route = useRoute()
const currentLayout = computed(() => route.value.meta.layout || 'default')
```

### 埋点上报

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    trackName?: string  // 埋点页面名
    trackParams?: Record<string, any>  // 埋点参数
  }
}

const routes = [
  {
    path: 'pages/detail/detail',
    name: 'detail',
    meta: {
      trackName: 'detail_page',
      trackParams: { source: 'home' }
    }
  }
]

router.afterEach((to) => {
  if (to.meta.trackName) {
    trackPageView(to.meta.trackName, to.meta.trackParams)
  }
})
```

## 下一步

- [RouteConfig 类型](./type-route-config) — 路由配置项
- [路由元信息指南](../guide/meta) — meta 的深入使用
- [实战指南](../guide/recipes) — 完整业务方案
