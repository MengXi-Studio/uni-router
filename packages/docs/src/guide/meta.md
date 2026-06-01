# 路由元信息

路由元信息（RouteMeta）用于为路由附加自定义属性，如页面标题、权限要求、TabBar 标识等。

## RouteMeta 接口

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  [key: string]: unknown
}
```

## 内置字段

### title

页面标题，可在 `afterEach` 钩子中用于动态设置导航栏标题：

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

标识该页面是否为 TabBar 页面。路由器会根据此字段自动选择导航 API：

- `isTab: true` → 使用 `uni.switchTab`
- `isTab: false` 或未设置 → 使用 `uni.navigateTo` / `uni.redirectTo`

```ts
const routes = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// 自动使用 uni.switchTab
router.push({ name: 'user' })
```

::: important
`isTab` 必须与 `pages.json` 中的 `tabBar.list` 声明一致。如果页面是 TabBar 页面但未设置 `isTab: true`，导航将使用 `uni.navigateTo` 而非 `uni.switchTab`，导致导航失败。
:::

### requireAuth

标识该页面是否需要登录认证，常与路由守卫配合使用：

```ts
const routes = [
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true } }
]

router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## 自定义扩展字段

`RouteMeta` 支持通过索引签名添加任意自定义字段：

```ts
const routes = [
  {
    path: 'pages/article/article',
    name: 'article',
    meta: {
      title: '文章详情',
      requireAuth: false,
      keepAlive: true,
      pageType: 'content',
      permissions: ['read', 'comment']
    }
  }
]
```

在守卫中访问自定义字段：

```ts
router.beforeEach((to, from, next) => {
  const permissions = to.meta.permissions as string[] | undefined
  if (permissions && !hasPermissions(permissions)) {
    next(false)
  } else {
    next()
  }
})
```

::: tip
访问自定义字段时需要类型断言，因为索引签名的值为 `unknown` 类型。
:::

## 访问元信息

### 在组件中

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
console.log(route.meta.title)
console.log(route.meta.isTab)
```

### 在守卫中

```ts
router.beforeEach((to, from, next) => {
  console.log(to.meta.requireAuth)
  next()
})
```

### 通过 Router 实例

```ts
router.currentRoute.meta.title
```
