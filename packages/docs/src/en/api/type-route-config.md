# RouteConfig

Route configuration item, corresponding to a page declaration in `pages.json`. Each `RouteConfig` describes the routing information of a page.

## Type Definition

```ts
interface RouteConfig {
  path: string
  name?: string
  meta?: RouteMeta
  beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

## Properties

### path

- **Type**: `string`
- **Required**: Yes
- **Description**: Page path, must match the path in `pages.json` (without leading `/`)

::: warning Path format
- ✅ Correct: `'pages/index/index'`, `'pages/user/detail/detail'`
- ❌ Incorrect: `'/pages/index/index'` (has leading `/`), `'pages/index'` (incomplete)

The path is automatically normalized (leading `/` is added), but it's recommended to keep the same format as `pages.json` in configuration.
:::

```ts
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home' },
  { path: 'pages/user/detail/detail', name: 'user-detail' }
]
```

### name

- **Type**: `string`
- **Required**: No
- **Description**: Route name, used for named route navigation. Duplicate names will be overwritten with a warning

::: tip Recommend using named routes
Named routes decouple from paths; during refactoring, you only need to modify the `path` in the route configuration, without globally searching and replacing strings. Combined with the `dts` feature of `@meng-xi/vite-plugin`, you also get type checking and auto-completion.
:::

```ts
// Named route navigation
await router.push({ name: 'user-detail', query: { id: '1' } })

// With type enhancement (dts generation)
await router.push({ name: 'user-detail' as const, query: { id: '1' } })
// ↑ 'user-detail' will have type hints; typos will cause errors
```

### meta

- **Type**: [`RouteMeta`](./type-route-meta)
- **Required**: No
- **Description**: Route meta information, used to describe additional attributes of the route

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: {
      title: 'Home',
      isTab: true  // Mark as TabBar page
    }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: {
      title: 'About',
      requireAuth: true  // Requires login authentication
    }
  }
]
```

See [RouteMeta Type](./type-route-meta).

### beforeEnter

- **Type**: [`NavigationGuard`](./type-navigation-guard) | [`NavigationGuard`](./type-navigation-guard)[]
- **Required**: No
- **Description**: Per-route guard, triggered only when entering this route. Supports a single guard or an array of guards

::: tip beforeEnter vs beforeEach
- `beforeEach`: Global guard, applies to all routes
- `beforeEnter`: Per-route guard, only applies to this route
- Execution order: `beforeEach` → `beforeEnter` → `beforeResolve`

`beforeEnter` is suitable for route-specific validation logic (e.g., order page requires selecting an address first).
:::

#### Single Guard

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

#### Guard Array

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/order/order',
    name: 'order',
    beforeEnter: [
      // 1. Must select an address first
      (to, from, next) => {
        if (!store.selectedAddress) {
          uni.showToast({ title: 'Please select an address', icon: 'none' })
          next(false)
        } else {
          next()
        }
      },
      // 2. Must have products
      (to, from, next) => {
        if (store.cart.length === 0) {
          next({ name: 'cart' })
        } else {
          next()
        }
      },
      // 3. Check stock
      async (to, from, next) => {
        const hasStock = await checkStock(store.cart)
        if (!hasStock) {
          uni.showToast({ title: 'Insufficient stock', icon: 'none' })
          next(false)
        } else {
          next()
        }
      }
    ]
  }
]
```

::: warning Guard array execution rules
- Execute in array order
- If any guard aborts (`next(false)`) or redirects (`next(location)`), subsequent guards do not execute
- After all guards pass, `beforeResolve` is executed
:::

## Full Example

```ts
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  // Home (TabBar)
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: 'Home', isTab: true }
  },
  // About (requires login)
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: 'About', requireAuth: true },
    beforeEnter: (to, from, next) => {
      if (isLoggedIn()) next()
      else next({ name: 'login' })
    }
  },
  // User (TabBar)
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { title: 'Profile', isTab: true }
  },
  // Login
  {
    path: 'pages/login/login',
    name: 'login',
    meta: { title: 'Login' }
  },
  // Order (multiple checks)
  {
    path: 'pages/order/order',
    name: 'order',
    meta: { title: 'Confirm Order', requireAuth: true },
    beforeEnter: [
      checkAddress,
      checkCart,
      checkStock
    ]
  }
]

export default routes
```

## Relationship with pages.json

The `path` of `RouteConfig` must match the page declaration in `pages.json`:

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "Home" } },
    { "path": "pages/about/about", "style": { "navigationBarTitleText": "About" } },
    { "path": "pages/user/user", "style": { "navigationBarTitleText": "Profile" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "Home" },
      { "pagePath": "pages/user/user", "text": "Profile" }
    ]
  }
}
```

```ts
// Corresponding RouteConfig
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },  // ← isTab must match tabBar.list
  { path: 'pages/about/about', name: 'about' },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }     // ← isTab must match tabBar.list
]
```

::: warning isTab must match tabBar.list
`meta.isTab` must be consistent with the `tabBar.list` declaration in `pages.json`. If `isTab: true` is declared but the page is not in `tabBar.list`, `uni.switchTab` will fail; and vice versa.

It's recommended to use [`@meng-xi/vite-plugin`](../guide/auto-generate) to auto-generate route configuration; it will automatically identify TabBar pages and set `isTab`.
:::

## Next Steps

- [RouteMeta Type](./type-route-meta) — Route meta information
- [NavigationGuard Type](./type-navigation-guard) — Guard type definition
- [Route Configuration Guide](../guide/route-config) — Deep dive into route configuration
