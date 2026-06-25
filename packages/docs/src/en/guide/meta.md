# Route Meta

Route meta (RouteMeta) is custom data attached to routes, used to control page behavior, permissions, animations, etc. This chapter details built-in fields, type extension, and practical applications.

## RouteMeta Interface

```ts
interface RouteMeta {
  title?: string                    // Page title
  isTab?: boolean                   // Whether it's a TabBar page
  requireAuth?: boolean             // Whether login is required
  animation?: NavigationAnimation   // Default navigation animation
  [key: string]: unknown            // Custom extension fields
}
```

The `[key: string]: unknown` index signature allows adding arbitrary custom fields without modifying the library's type definitions.

## Built-in Fields

### title

Page title, commonly used in `afterEach` to set the navigation bar title:

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About Us' } }
]

router.afterEach((to) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### isTab

Identifies TabBar pages. The router selects the navigation API based on this field:

- `isTab: true` → `uni.switchTab`
- `isTab: false` or not set → `uni.navigateTo` / `uni.redirectTo`

```ts
const routes = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// Automatically uses uni.switchTab
router.push({ name: 'user' })
```

::: warning Must be consistent with pages.json
`isTab` must be consistent with `pages.json`'s `tabBar.list`:

```ts
// pages.json
{ "tabBar": { "list": [{ "pagePath": "pages/user/user" }] } }

// ❌ Error: isTab not set, will use navigateTo to jump to TabBar page, fails
{ path: 'pages/user/user', name: 'user' }

// ✅ Correct
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
```
:::

### requireAuth

Identifies pages that require login, works with guards:

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

Default navigation animation (App only):

```ts
interface NavigationAnimation {
  type: UniAnimationType  // Animation type
  duration?: number       // Duration (ms), default 300
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

// Use default animation from meta
await router.push({ name: 'about' })

// Override animation from meta
await router.push({ name: 'about', animation: { type: 'slide-in-right' } })
```

#### Animation Priority

```
Inline param > meta.animation > uni default
```

::: info Platform Limitation
Animation is only supported on App, has no effect on H5 and mini-programs. See [Platform Compatibility](./compatibility#navigation-animation-app-only).
:::

## Type Extension

Extend `RouteMeta` via TypeScript module declaration to get type hints:

### Basic Extension

```ts
// src/types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // Custom fields
    roles?: string[]           // Allowed roles
    permissions?: string[]     // Required permissions
    keepAlive?: boolean        // Whether to cache
    pageType?: 'list' | 'detail' | 'form'  // Page type
  }
}
```

### Using Extended Types

```ts
// Route configuration has type hints
const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      requireAuth: true,
      roles: ['admin'],           // ✅ Type hint
      permissions: ['user:manage'] // ✅ Type hint
    }
  }
]

// Accessing meta fields in guards doesn't need assertion
router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {  // ✅ Type is string[]
    next(false)
  } else {
    next()
  }
})
```

### Complete Business Type Extension

```ts
// src/types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    // Basic
    title?: string
    isTab?: boolean
    requireAuth?: boolean
    animation?: NavigationAnimation

    // Permissions
    roles?: string[]
    permissions?: string[]

    // Page behavior
    keepAlive?: boolean
    preload?: boolean              // Whether to preload data
    closeCurrent?: boolean         // Whether to close current page after navigation

    // Business fields
    module?: 'user' | 'order' | 'product'  // Module
    breadcrumb?: string[]                   // Breadcrumb
    analyticsKey?: string                   // Analytics key
  }
}
```

### Configure tsconfig

Ensure `tsconfig.json` includes the type declaration file:

```json
{
  "include": ["src/**/*.ts", "src/types/**/*.d.ts"]
}
```

## Accessing Meta

### In Components

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Access via .value (in script setup)
console.log(route.value.meta.title)
console.log(route.value.meta.requireAuth)

// Auto-unwrapped in template
// <text>{{ route.meta.title }}</text>
```

### In Guards

```ts
router.beforeEach((to, from, next) => {
  console.log(to.meta.requireAuth)  // Direct access
  console.log(to.meta.roles)        // Extended field
  next()
})
```

### Via Router Instance

```ts
router.currentRoute.meta.title
```

::: tip Reactive
`useRoute()` returns a reactive reference, components auto-update when `meta` changes. `router.currentRoute` is a plain property, not reactive.
:::

## Practical Applications

### Permission Control

```ts
// Type extension
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
    permissions?: string[]
  }
}

// Route configuration
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

// Guard
router.beforeEach((to, from, next) => {
  // Role check
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    uni.showToast({ title: 'No permission', icon: 'none' })
    next({ name: 'home' }, { mode: 'relaunch' })
    return
  }

  // Permission check
  if (to.meta.permissions && !hasPermission(to.meta.permissions)) {
    uni.showToast({ title: 'Insufficient permissions', icon: 'none' })
    next({ name: 'home' }, { mode: 'relaunch' })
    return
  }

  next()
})
```

### Auto Page Title Setting

```ts
// Type extension
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    title?: string
    dynamicTitle?: boolean  // Whether dynamic title
  }
}

// Route configuration
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
  { path: 'pages/detail/detail', name: 'detail', meta: { dynamicTitle: true } }
]

// Guard
router.afterEach((to) => {
  if (to.meta.dynamicTitle) {
    // Dynamic title: get from data
    const store = useDetailStore()
    uni.setNavigationBarTitle({ title: store.detail?.title || 'Detail' })
  } else if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title })
  }
})
```

### Data Preloading

```ts
// Type extension
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    preload?: boolean
    preloadKey?: string
  }
}

// Route configuration
const routes = [
  {
    path: 'pages/detail/detail',
    name: 'detail',
    meta: { preload: true, preloadKey: 'detail' }
  }
]

// Guard
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

### Analytics Tracking

```ts
// Type extension
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    analyticsKey?: string
    module?: string
  }
}

// Route configuration
const routes = [
  {
    path: 'pages/order/list',
    name: 'order-list',
    meta: { analyticsKey: 'order_list_view', module: 'order' }
  }
]

// Guard
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

### Page Cache Control

```ts
// Type extension
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    keepAlive?: boolean
  }
}

// Route configuration
const routes = [
  { path: 'pages/list/list', name: 'list', meta: { keepAlive: true } }
]

// Control cache in App.vue
// #ifdef APP-PLUS
const route = useRoute()
const cachedPages = computed(() => {
  return route.meta.keepAlive ? [route.path] : []
})
// #endif
```

## meta and pages.json Collaboration

`pages.json`'s `style` field can also configure page styles, complementing `meta`:

| Config | pages.json style | RouteMeta |
| --- | --- | --- |
| Nav bar title | `navigationBarTitleText` | `title` |
| Nav bar background color | `navigationBarBackgroundColor` | Custom field |
| Pull to refresh | `enablePullDownRefresh` | Custom field |
| Permission control | ❌ | `requireAuth` / `roles` |
| Animation | ❌ | `animation` |

::: tip Recommended Division
- **Static styles**: Use `pages.json`'s `style` (like nav bar color, background color)
- **Dynamic behavior**: Use `meta` (like permissions, animation, preloading)
:::

## Next Steps

- [Route Configuration](./route-config) — RouteConfig details
- [Route Guards](./guards) — How to use meta in guards
- [Recipes](./recipes) — Complete business solutions
