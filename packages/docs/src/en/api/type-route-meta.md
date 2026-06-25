# RouteMeta

Route meta information, used to describe additional properties of a route. Configured via `RouteConfig.meta`, accessed via `to.meta` / `route.meta` in guards, `afterEach` hooks, and components.

## Type Definition

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  animation?: NavigationAnimation
  [key: string]: any
}
```

## Built-in Properties

### title

- **Type**: `string | undefined`
- **Description**: Page title, can be used in `afterEach` hooks to set the navigation bar title

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About Us' } }
]

// Auto-set title in afterEach
router.afterEach((to) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### isTab

- **Type**: `boolean | undefined`
- **Description**: Whether the page is a TabBar page. The router automatically selects the navigation API based on this field
  - `true` → `uni.switchTab`
  - `false` / not set → `uni.navigateTo` / `uni.redirectTo`

::: warning Must match pages.json
`meta.isTab` must be consistent with the `tabBar.list` declaration in `pages.json`. If `isTab: true` is declared but the page is not in `tabBar.list`, `uni.switchTab` will fail; and vice versa.

It's recommended to use [`@meng-xi/vite-plugin`](../guide/auto-generate) to auto-generate route configuration; it will automatically identify TabBar pages and set `isTab`.
:::

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },   // TabBar page
  { path: 'pages/about/about', name: 'about', meta: { isTab: false } }  // Regular page
]
```

### requireAuth

- **Type**: `boolean | undefined`
- **Description**: Whether login authentication is required, commonly used with `beforeEach` guards

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { requireAuth: false } },
  { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
  { path: 'pages/user/user', name: 'user', meta: { requireAuth: true } }
]

// Global before guard
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

- **Type**: `NavigationAnimation | undefined`
- **Description**: Default navigation animation (App only), can be overridden by the `animation` parameter passed to `push` / `replace` / `back`

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // default 300ms
}
```

Animation priority: `inline param` > `meta.animation` > `uni default`

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

// Use the default animation from meta
await router.push({ name: 'about' }) // fade-in, 300ms

// Override at call site
await router.push({ name: 'about', animation: { type: 'slide-in-right' } }) // slide-in-right, 300ms
```

::: warning Platform limitations
Animation **only works on App**. Navigation animations on mini-programs and H5 are system-controlled and cannot be customized.

`UniAnimationType` optional values:
- `'auto'` — Auto select
- `'none'` — No animation
- `'slide-in-right'` — Slide in from right (default)
- `'slide-in-left'` — Slide in from left
- `'slide-in-top'` — Slide in from top
- `'slide-in-bottom'` — Slide in from bottom
- `'fade-in'` — Fade in
- `'zoom-fade-in'` — Zoom fade in
- `'zoom-out'` — Zoom out
:::

## Custom Extensions

Arbitrary custom fields are supported through the index signature `[key: string]: any`:

```ts
const routes = [
  {
    path: 'pages/article/detail',
    name: 'article-detail',
    meta: {
      title: 'Article Detail',
      requireAuth: false,
      keepAlive: true,              // Custom: whether to cache
      permissions: ['read', 'comment'],  // Custom: required permissions
      layout: 'default',            // Custom: layout type
      breadcrumb: ['Home', 'Article', 'Detail']  // Custom: breadcrumb
    }
  }
]
```

### Type Enhancement (Recommended)

Add type hints to `RouteMeta` via TypeScript declaration merging:

```ts
// src/types/router.d.ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // Custom fields
    keepAlive?: boolean
    permissions?: string[]
    layout?: 'default' | 'simple' | 'full'
    breadcrumb?: string[]
    // Business fields
    roles?: string[]        // Required roles
    module?: string         // Belonging module
    cacheKey?: string       // Cache key
  }
}
```

After enhancement, accessing custom fields in route configuration and guards will have type hints:

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      title: 'Admin Panel',
      requireAuth: true,
      roles: ['admin', 'superadmin'],  // ✅ Has type hints
      module: 'admin'                  // ✅ Has type hints
    }
  }
]

// Access in guard
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

::: tip Benefits of type enhancement
- **Type safety**: Typos will cause compile-time errors
- **Auto-completion**: IDE will suggest available fields
- **Documentation**: Team members can intuitively see which meta fields are supported
:::

## Practical Applications

### Permission Control

```ts
// Extend types
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
      title: 'Admin Panel',
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

### Dynamic Title

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About Us' } },
  { path: 'pages/user/user', name: 'user', meta: { title: 'Profile' } }
]

// Uniformly set title in afterEach
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  uni.setNavigationBarTitle({ title: title || 'Default Title' })
})
```

### Page Cache Control

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
      cacheKey: 'list-data'  // Cache key
    }
  }
]

// In the page, decide whether to cache based on meta
const route = useRoute()
const shouldCache = computed(() => route.value.meta.keepAlive === true)
```

### Layout Switching

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

// In App.vue, switch layout based on meta
const route = useRoute()
const currentLayout = computed(() => route.value.meta.layout || 'default')
```

### Analytics Tracking

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    trackName?: string  // Analytics page name
    trackParams?: Record<string, any>  // Analytics params
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

## Next Steps

- [RouteConfig Type](./type-route-config) — Route configuration
- [Route Meta Guide](../guide/meta) — Deep dive into meta usage
- [Recipes](../guide/recipes) — Complete business solutions
