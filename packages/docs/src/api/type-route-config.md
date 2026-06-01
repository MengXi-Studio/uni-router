# RouteConfig

路由配置项，对应 `pages.json` 中的页面声明。

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

### name

- **类型**: `string`
- **必填**: 否
- **说明**: 路由名称，用于命名路由导航。重复名称会被覆盖并输出警告

### meta

- **类型**: [`RouteMeta`](./type-route-meta)
- **必填**: 否
- **说明**: 路由元信息

### beforeEnter

- **类型**: [`NavigationGuard`](./type-navigation-guard) | [`NavigationGuard`](./type-navigation-guard)[]
- **必填**: 否
- **说明**: 路由独享守卫，仅在进入该路由时触发。支持单个守卫或守卫数组

## 示例

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: '首页' }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: '关于', requireAuth: true },
    beforeEnter: (to, from, next) => {
      if (isLoggedIn()) next()
      else next({ name: 'login' })
    }
  },
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { isTab: true }
  }
]
```
