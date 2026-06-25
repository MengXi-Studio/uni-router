# Differences from vue-router

Uni Router references vue-router's API design, but due to the specifics of the uni-app framework, there are important differences between the two. This chapter provides a detailed comparison to help vue-router users get started quickly and avoid migration pitfalls.

## Design Philosophy Differences

| Dimension           | vue-router                                 | Uni Router                           |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| Page model          | Dynamic routing, component-level rendering | Static pages, `pages.json` declaration |
| Navigation method   | Manipulates browser History                | Calls uni native navigation APIs     |
| View rendering      | `<router-view>` component                  | uni-app page stack                   |
| Route registration  | Runtime dynamic registration               | Compile-time `pages.json`            |
| Page stack          | Browser History (no limit)                 | uni-app page stack (mini-program limit 10) |
| Cross-platform      | Web only                                   | App / H5 / various mini-programs     |

### Core Difference Analysis

#### 1. Page Model

**vue-router**: Single-page application, all pages are in the same HTML, dynamically rendered via `<router-view>`.

**Uni Router**: Each page is an independent uni-app page (separate `.vue` file), statically declared by `pages.json`, with the page stack managed by the uni-app framework during navigation.

```ts
// vue-router: dynamic route matching
{ path: '/user/:id', component: UserDetail }

// Uni Router: static path, parameters passed via query
{ path: 'pages/user/detail/detail', name: 'user-detail' }
// Navigation: router.push({ name: 'user-detail', query: { id: '123' } })
```

#### 2. Navigation Method

**vue-router**: Manipulates browser History API (`pushState` / `replaceState`).

**Uni Router**: Calls uni native navigation APIs (`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`).

```ts
// vue-router: manipulates History
router.push('/about')

// Uni Router: calls uni.navigateTo
router.push({ name: 'about' })
// Internally executes: uni.navigateTo({ url: '/pages/about/about' })
```

#### 3. Page Stack Limit

**vue-router**: Browser History has no limit.

**Uni Router**: Mini-program page stack limit is 10 levels; `navigateTo` fails when exceeded.

```ts
// Uni Router needs to consider page stack depth
const pages = getCurrentPages()
if (pages.length >= 8) {
  await router.relaunch({ name: 'target' }) // Use relaunch instead
} else {
  await router.push({ name: 'target' })
}
```

## API Comparison

### Supported APIs

| vue-router API         | Uni Router                  | Notes                               |
| ---------------------- | --------------------------- | ----------------------------------- |
| `router.push()`        | ✅ `router.push()`          | Auto-selects navigateTo / switchTab |
| `router.replace()`     | ✅ `router.replace()`       | Auto-selects redirectTo / switchTab |
| `router.relaunch()`    | ❌ → ✅ `router.relaunch()` | Uni Router exclusive, corresponds to reLaunch |
| `router.back()`        | ✅ `router.back(delta?)`    | Supports delta parameter            |
| `router.go(n)`         | ❌                          | Mini programs don't support forward navigation |
| `router.forward()`     | ❌                          | Mini programs don't support forward navigation |
| `router.beforeEach()`  | ✅ `router.beforeEach()`    | Same behavior                       |
| `router.beforeResolve()` | ✅ `router.beforeResolve()` | Same behavior                     |
| `router.afterEach()`   | ✅ `router.afterEach()`     | Same behavior                       |
| `router.currentRoute`  | ✅ `router.currentRoute`    | Read-only                           |
| `router.resolve()`     | ✅ `router.resolve()`       | Same behavior                       |
| `router.isReady()`     | ✅ `router.isReady()`       | Same behavior                       |
| `router.onError()`     | ✅ `router.onError()`       | Same behavior                       |
| `router.hasRoute()`    | ✅ `router.hasRoute()`      | Name check only                     |
| `router.getRoutes()`   | ✅ `router.getRoutes()`     | Returns shallow copy of config      |
| `router.addRoute()`    | ❌                          | uni-app pages are statically declared in pages.json |
| `router.removeRoute()` | ❌                          | Same as above                       |
| `useRouter()`          | ✅ `useRouter()`            | Same behavior                       |
| `useRoute()`           | ✅ `useRoute()`             | Returns reactive `Ref<RouteLocation>` |

### Unsupported Features

| vue-router Feature          | Reason                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `<router-view>`             | uni-app has its own page rendering mechanism                                                    |
| `<router-link>`             | Simplified [RouterLink](../api/router-link) component supported, based on `<navigator>` |
| Nested routes               | uni-app has no nested views                                                                     |
| Named views                 | uni-app has no multi-view support                                                               |
| Route lazy loading `() => import()` | uni-app has its own code splitting (sub-packages)                                       |
| Route aliases               | uni-app page paths are fixed                                                                    |
| Regex paths                 | uni-app page paths are fixed                                                                    |
| Dynamic routes `:id`        | uni-app page paths are fixed, use query to pass parameters                                      |
| History mode selection      | uni-app uses different routing modes per platform                                               |
| `scrollBehavior`            | uni-app has different scroll behaviors per platform                                             |

## Navigation Behavior Differences

### TabBar Pages

**vue-router**: TabBar pages use the same navigation method as regular pages.

**Uni Router**: Automatically selects different APIs based on `meta.isTab`:

```ts
// vue-router: unified push
router.push('/user')

// Uni Router: auto-select based on isTab
// isTab: true → uni.switchTab (no query support)
// isTab: false → uni.navigateTo (supports query)
router.push({ name: 'user' })
```

::: warning switchTab doesn't support query
`uni.switchTab` doesn't support query parameters. Passing parameters between TabBar pages requires global state. See [Platform Compatibility](./compatibility#switchtab-doesnt-support-query).
:::

### Page Stack Operations

**vue-router**: Manipulates browser History stack.

**Uni Router**: Manipulates uni-app page stack:

| Operation        | vue-router          | Uni Router          | uni API            |
| ---------------- | ------------------- | ------------------- | ------------------ |
| Push             | `router.push()`     | `router.push()`     | `navigateTo`       |
| Replace top      | `router.replace()`  | `router.replace()`  | `redirectTo`       |
| Clear stack      | -                   | `router.relaunch()` | `reLaunch`         |
| Pop              | `router.back()`     | `router.back()`     | `navigateBack`     |
| Forward          | `router.forward()`  | ❌                  | -                  |
| Specific steps   | `router.go(n)`      | `router.back(delta)`| `navigateBack({ delta })` |

### replace to TabBar Page

**vue-router**: `replace` only replaces the current route record.

**Uni Router**: `replace` to a TabBar page closes all non-tab pages (determined by `uni.switchTab` behavior).

```ts
// Current stack: [home, list, detail]
await router.replace({ name: 'user' }) // user is a TabBar page
// Stack becomes: [home, user] (list and detail are closed)
```

## Guard Differences

### next() Behavior

The `next()` behavior is mostly the same between the two, but Uni Router has the following extensions:

```ts
// vue-router
next()                    // Proceed
next(false)               // Abort
next('/path')             // Redirect
next({ name: 'route' })   // Redirect

// Uni Router (v1.7.0+)
next()                                          // Proceed
next(false)                                     // Abort
next('/path')                                   // Redirect (default push)
next({ name: 'route' })                         // Redirect (default push)
next({ name: 'route' }, { mode: 'replace' })    // Redirect (specify mode)
next({ name: 'route' }, { mode: 'relaunch' })   // Redirect (clear stack)
```

### Redirect Depth Limit

**vue-router**: No explicit limit.

**Uni Router**: Redirect depth limit is 10, preventing infinite loops.

### Guard Timeout

**vue-router**: No timeout mechanism.

**Uni Router**: Has `guardTimeout` option (default 10 seconds), navigation is cancelled on timeout.

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 seconds
})
```

## Data Passing Differences

### params

**vue-router**: params are passed via URL or memory, may be lost on refresh (depending on mode).

**Uni Router**: params are passed via memory + URL key, lost on H5 refresh.

```ts
// vue-router
router.push({ name: 'user', params: { id: 123 } })

// Uni Router
router.push({ name: 'user', params: { user: complexObject } })
// Internally: generates key, stores in memory, URL includes ?__params_key=xxx
```

### query

**vue-router**: All navigation methods support query.

**Uni Router**: `switchTab` doesn't support query; passing parameters between TabBar pages requires global state.

## Migration Guide

### 1. Remove Unsupported Features

```ts
// ❌ Remove dynamic routes
{ path: '/user/:id', component: UserDetail }

// ✅ Change to static path + query
{ path: 'pages/user/detail/detail', name: 'user-detail' }
// Navigation: router.push({ name: 'user-detail', query: { id: '123' } })
```

```ts
// ❌ Remove route lazy loading
{ path: '/about', component: () => import('./About.vue') }

// ✅ Declare pages in pages.json
{ "path": "pages/about/about" }
```

```ts
// ❌ Remove nested routes
{
  path: '/user',
  component: UserLayout,
  children: [
    { path: 'profile', component: UserProfile }
  ]
}

// ✅ Change to independent pages
{ path: 'pages/user/profile/profile', name: 'user-profile' }
```

### 2. Replace Components

```vue
<!-- ❌ Remove router-view -->
<router-view />

<!-- ✅ uni-app automatically renders pages, no router-view needed -->
```

```vue
<!-- ❌ vue-router's router-link -->
<router-link to="/about">About</router-link>

<!-- ✅ Uni Router's RouterLink -->
<RouterLink to="pages/about/about">About</RouterLink>
<!-- Or use named route -->
<RouterLink :to="{ name: 'about' }">About</RouterLink>
```

### 3. Adjust Navigation Methods

```ts
// ❌ Remove router.go() and router.forward()
router.go(2)
router.forward()

// ✅ Use router.back()
router.back(2) // Go back 2 levels
```

```ts
// ❌ Remove dynamic route registration
router.addRoute({ path: '/dynamic', component: Dynamic })

// ✅ All pages are statically declared in pages.json
```

### 4. Set isTab for TabBar Pages

```ts
// ❌ vue-router doesn't need distinction
{ path: '/user', component: User }

// ✅ Uni Router needs isTab marker
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
```

### 5. Handle Page Stack Limits

```ts
// vue-router: no need to consider stack depth
router.push('/page11')

// Uni Router: mini-program stack limit is 10, needs handling
async function safePush(location) {
  const pages = getCurrentPages()
  if (pages.length >= 8) {
    await router.relaunch(location)
  } else {
    await router.push(location)
  }
}
```

### 6. Adjust replace-to-TabBar Logic

```ts
// vue-router: replace only replaces current record
router.replace('/user')

// Uni Router: replace to TabBar closes all non-tab pages
// If you don't want to close other pages, use push instead
await router.push({ name: 'user' })
```

### 7. Handle params Refresh Loss

```ts
// vue-router: params may be preserved after refresh (depending on mode)
router.push({ name: 'user', params: { id: 123 } })

// Uni Router: params are lost on H5 refresh
// Use query for critical parameters, params for complex data
router.push({
  name: 'user',
  query: { id: '123' },        // Critical parameter, not lost on refresh
  params: { detail: largeObj } // Complex data, lost on refresh
})
```

## Migration Checklist

- [ ] Remove `<router-view>` component
- [ ] Replace `<router-link>` with `RouterLink`
- [ ] Remove dynamic routes `:id`, use query instead
- [ ] Remove route lazy loading `() => import()`
- [ ] Remove nested routes and named views
- [ ] Remove `router.go()` and `router.forward()`
- [ ] Remove `router.addRoute()` and `router.removeRoute()`
- [ ] Set `meta.isTab: true` for TabBar pages
- [ ] Ensure route `path` matches `pages.json`
- [ ] Handle page stack depth (mini-program limit 10)
- [ ] Adjust replace-to-TabBar logic
- [ ] Use query for critical parameters (params lost on refresh)
- [ ] Add `interceptUniApi: true` to intercept native APIs

## Next Steps

- [Getting Started](./getting-started) — Integration from scratch
- [Route Configuration](./route-config) — Detailed route configuration
- [Platform Compatibility](./compatibility) — uni-app limitations
