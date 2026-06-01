# Route Configuration

MengXi UniRouter's route configuration must be consistent with uni-app's `pages.json`. This section covers how to define route configurations and meta information.

## RouteConfig

Each route configuration item corresponds to a page declaration in `pages.json`:

```ts
interface RouteConfig {
  path: string
  name?: string
  meta?: RouteMeta
  beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

### path

Page path, must match the path in `pages.json` (without leading `/`):

```ts
const routes = [
  { path: 'pages/index/index', name: 'home' },
  { path: 'pages/about/about', name: 'about' },
  { path: 'pages/user/user', name: 'user' }
]
```

::: warning
The `path` field must exactly match the page path declared in `pages.json`, otherwise route matching will fail.
:::

### name

Route name for named route navigation. It's recommended to configure a unique name for each route:

```ts
router.push({ name: 'about' })
```

If duplicate names are defined, the later one overwrites the earlier one with a warning.

### meta

Route meta information. See [Route Meta](./meta) chapter for details.

### beforeEnter

Per-route guard. See [Route Guards](./guards#beforeenter) chapter for details.

## Creating a Router

Use `createRouter()` to create a router instance:

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    {
      path: 'pages/index/index',
      name: 'home',
      meta: { title: 'Home' }
    },
    {
      path: 'pages/about/about',
      name: 'about',
      meta: { title: 'About', requireAuth: true }
    },
    {
      path: 'pages/user/user',
      name: 'user',
      meta: { isTab: true }
    }
  ],
  strict: true
})
```

### strict Option

- **`true`** (default): Strict mode, unmatched named routes will throw `ROUTE_NOT_FOUND` error
- **`false`**: Lenient mode, unmatched named routes only output a warning and fall back to using the name as path

```ts
const router = createRouter({
  routes,
  strict: false
})
```

## Route Matching

MengXi UniRouter supports both path and name matching:

### Path Matching

```ts
router.push('pages/about/about')
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

Paths are automatically normalized (adding leading `/`), so the following are equivalent:

```ts
router.push('pages/about/about')
router.push('/pages/about/about')
```

### Name Matching

```ts
router.push({ name: 'about' })
router.push({ name: 'about', query: { id: '1' } })
```

### Path with Query String

```ts
router.push('pages/about/about?id=1&tab=info')
```

The query string is automatically parsed into a `query` object.

## Relationship with pages.json

MengXi UniRouter does **not replace** `pages.json`, but works alongside it:

| Responsibility | pages.json | MengXi UniRouter |
|---------------|-----------|-----------------|
| Page registration | ✅ Required | ❌ Not responsible |
| Route navigation | uni.navigateTo etc. | ✅ push / replace / back |
| Route guards | ❌ Not supported | ✅ beforeEach etc. |
| Route meta | ❌ Not supported | ✅ meta field |
| Named routes | ❌ Not supported | ✅ name field |

::: important
Page declarations in `pages.json` are the foundation of the uni-app framework. MengXi UniRouter's route configurations must be consistent with them. Pages not declared in `pages.json` cannot be navigated to.
:::
