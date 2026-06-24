# Route Configuration

Route configuration is the foundation of Uni Router. This chapter details each field of `RouteConfig`, route matching rules, the relationship with `pages.json`, and route organization for large projects.

## RouteConfig Details

Each route configuration item corresponds to a page in `pages.json`:

```ts
interface RouteConfig {
  path: string              // Page path (required)
  name?: string             // Route name (recommended)
  meta?: RouteMeta          // Route meta info
  beforeEnter?: NavigationGuard | NavigationGuard[]  // Route-exclusive guard
  [key: string]: any        // Custom extension properties
}
```

### path

Page path, must match the declaration in `pages.json` **exactly** (without leading `/`):

```ts
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/about/about" }
  ]
}

// Route configuration
const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home' },
  { path: 'pages/about/about', name: 'about' }
]
```

::: warning Path Consistency
`path` must match `pages.json` exactly, otherwise route matching fails. Common errors:

```ts
// ❌ Error: missing pages/ prefix
{ path: 'about/about' }

// ❌ Error: extra leading /
{ path: '/pages/about/about' }

// ❌ Error: incomplete path
{ path: 'pages/about' }

// ✅ Correct
{ path: 'pages/about/about' }
```
:::

#### Subpackage Paths

Subpackage page paths need to include the subpackage root directory:

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
// Route configuration: path = subpackage root + page path
const routes: RouteConfig[] = [
  { path: 'subpkg/detail/detail', name: 'detail' }
]

// Navigation
await router.push({ name: 'detail' })
```

### name

Route name, used for named navigation. **Strongly recommend configuring a unique name for each route**.

```ts
// Named navigation (recommended)
await router.push({ name: 'about' })

// Path navigation (not recommended, need to modify all callsites when path changes)
await router.push({ path: 'pages/about/about' })
```

#### Benefits of Naming

1. **Decoupled paths**: When path changes, only modify route config, no need to modify business code
2. **Type safety**: With auto-generation, get type hints for names
3. **Readability**: `{ name: 'user-profile' }` is clearer than `'pages/user/profile/profile'`

#### Duplicate Names

If duplicate `name` is defined, the later one overwrites the earlier one with a warning:

```ts
const routes = [
  { path: 'pages/a/a', name: 'detail' },
  { path: 'pages/b/b', name: 'detail' } // ⚠️ Overwrites the former
]

router.push({ name: 'detail' }) // Navigates to pages/b/b
```

### meta

Route meta information, see [Route Meta](./meta).

### beforeEnter

Route-exclusive guard, see [Route Guards - beforeEnter](./guards#beforeenter-route-exclusive-guard).

## Creating a Router

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    {
      path: 'pages/index/index',
      name: 'home',
      meta: { isTab: true, title: 'Home' }
    },
    {
      path: 'pages/about/about',
      name: 'about',
      meta: { title: 'About', requireAuth: true }
    }
  ],
  strict: true,           // Strict mode
  interceptUniApi: true,  // Intercept native API
  guardTimeout: 15000,    // Guard timeout
  readyTimeout: 5000      // Ready timeout
})
```

### Configuration Options Details

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | - | Route configuration array (required) |
| `strict` | `boolean` | `true` | Strict mode, unmatched named routes throw error |
| `interceptUniApi` | `boolean` | `false` | Intercept `uni.navigateTo` and other native APIs |
| `guardTimeout` | `number` | `10000` | Guard timeout (ms) |
| `readyTimeout` | `number` | `5000` | Router ready timeout (ms) |

### strict Option

- **`true`** (default): Unmatched named routes throw `ROUTE_NOT_FOUND` error
- **`false`**: Unmatched named routes only warn, and fall back to using name as path

```ts
// Strict mode
const router = createRouter({ routes, strict: true })
await router.push({ name: 'not-exist' }) // Throws error

// Lenient mode
const router = createRouter({ routes, strict: false })
await router.push({ name: 'not-exist' }) // Warns, tries to navigate to /not-exist
```

::: tip Recommend Strict Mode
Production environments should use `strict: true` to catch route configuration errors early. Can temporarily set to `false` during development for easier debugging.
:::

### guardTimeout Option

Guard execution timeout. If guards have time-consuming operations like network requests, increase it:

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // Guards have network requests, 30 seconds
})
```

When timeout occurs, navigation is cancelled and throws `NAVIGATION_CANCELLED`.

### readyTimeout Option

Router initialization timeout for waiting page stack to be ready. Usually no need to modify.

## Route Matching Rules

Uni Router supports both path and name matching.

### Path Matching

```ts
// String form
router.push('pages/about/about')
router.push('/pages/about/about') // Auto-adds /
router.push('pages/about/about?id=1') // With query

// Object form
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

#### Path Normalization

```ts
// The following are equivalent
router.push('pages/about/about')
router.push('/pages/about/about')
router.push('pages/about/about/') // Trailing / is ignored
```

#### Query Parsing

```ts
// Query in URL string is parsed
router.push('pages/about/about?id=1&tab=info')
// Equivalent to
router.push({ path: 'pages/about/about', query: { id: '1', tab: 'info' } })
```

### Name Matching

```ts
// Basic usage
router.push({ name: 'about' })

// With query
router.push({ name: 'about', query: { id: '1' } })

// With params (complex data)
router.push({ name: 'detail', params: { item: largeObject } })
```

### Mixed Usage

```ts
// ❌ Not recommended: path and name used together (name takes priority)
router.push({ path: 'pages/about/about', name: 'about' })

// ✅ Recommended: choose one
router.push({ name: 'about' })
// or
router.push({ path: 'pages/about/about' })
```

## Relationship with pages.json

Uni Router **does not replace** `pages.json`, but works with it:

| Responsibility | pages.json | Uni Router |
| --- | --- | --- |
| Page registration | ✅ Must declare | ❌ Not responsible |
| Route navigation | `uni.navigateTo` etc. | `push` / `replace` / `back` |
| Route guards | ❌ Not supported | ✅ `beforeEach` etc. |
| Route meta | ❌ Not supported | ✅ `meta` field |
| Named routes | ❌ Not supported | ✅ `name` field |
| Page styles | ✅ `style` | ❌ Not responsible |
| TabBar config | ✅ `tabBar` | ❌ Not responsible |

### Configuration Consistency

```json
// pages.json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/about/about" }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "Home" }
    ]
  }
}
```

```ts
// Route configuration must match pages.json
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
  { path: 'pages/about/about', name: 'about' }
]
```

::: warning isTab Consistency
`meta.isTab` must be consistent with `pages.json`'s `tabBar.list`:
- TabBar pages must set `isTab: true`, otherwise using `navigateTo` to jump to TabBar pages will fail
- Non-TabBar pages should not set `isTab: true`, otherwise using `switchTab` to jump to non-TabBar pages will fail
:::

## Route Organization

### Single File (Small Projects)

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

### Modular Organization (Medium/Large Projects)

Split routes by business module:

```
src/
├── router/
│   ├── index.ts          # Router instance
│   └── routes.ts         # Aggregated routes
├── modules/
│   ├── user/
│   │   └── routes.ts     # User module
│   ├── order/
│   │   └── routes.ts     # Order module
│   └── product/
│       └── routes.ts     # Product module
```

```ts
// modules/user/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const userRoutes: RouteConfig[] = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: 'Profile' } },
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
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: 'Home' } },
  { path: 'pages/login/login', name: 'login' },
  ...userRoutes,
  ...orderRoutes,
  ...productRoutes
]
```

### Auto Generation (Recommended)

Use `@meng-xi/vite-plugin` to auto-generate route configurations and type declarations from `pages.json`:

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

See [Auto Generate Routes](./auto-generate).

## Common Configuration Errors

### 1. Path Inconsistent with pages.json

```ts
// ❌ pages.json has pages/about/about, route config is wrong
{ path: 'pages/about', name: 'about' }

// ✅ Consistent
{ path: 'pages/about/about', name: 'about' }
```

### 2. Forgot to Set isTab

```ts
// ❌ TabBar page without isTab
{ path: 'pages/user/user', name: 'user' }
router.push({ name: 'user' }) // Uses navigateTo to jump to TabBar page, fails

// ✅ Set isTab
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
router.push({ name: 'user' }) // Uses switchTab, succeeds
```

### 3. Duplicate name

```ts
// ❌ Duplicate name
const routes = [
  { path: 'pages/a/a', name: 'detail' },
  { path: 'pages/b/b', name: 'detail' } // Overwrites former
]

// ✅ Unique name
const routes = [
  { path: 'pages/a/a', name: 'detail-a' },
  { path: 'pages/b/b', name: 'detail-b' }
]
```

### 4. Subpackage Path Error

```ts
// ❌ Subpackage path doesn't include subpackage root
{ path: 'detail/detail', name: 'detail' } // Subpackage root is subpkg

// ✅ Includes subpackage root
{ path: 'subpkg/detail/detail', name: 'detail' }
```

## Next Steps

- [Route Meta](./meta) — meta field details
- [Route Guards](./guards) — beforeEnter and other guards
- [Auto Generate Routes](./auto-generate) — Generate config from pages.json
