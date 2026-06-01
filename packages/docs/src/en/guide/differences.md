# Differences from vue-router

Uni Router references vue-router's API design, but there are important differences due to uni-app framework specifics.

## Design Philosophy

|                    | vue-router                                 | Uni Router                           |
| ------------------ | ------------------------------------------ | ------------------------------------ |
| Page model         | Dynamic routing, component-level rendering | Static pages, pages.json declaration |
| Navigation method  | Manipulates browser History                | Calls uni native navigation APIs     |
| View rendering     | `<router-view>` component                  | uni-app page stack                   |
| Route registration | Runtime dynamic registration               | Compile-time pages.json              |

## API Differences

### Supported APIs

| vue-router API           | Uni Router                  | Notes                               |
| ------------------------ | --------------------------- | ----------------------------------- |
| `router.push()`          | ✅ `router.push()`          | Auto-selects navigateTo / switchTab |
| `router.replace()`       | ✅ `router.replace()`       | Auto-selects redirectTo / switchTab |
| `router.back()`          | ✅ `router.back(delta?)`    | Supports delta parameter            |
| `router.beforeEach()`    | ✅ `router.beforeEach()`    | Same behavior                       |
| `router.beforeResolve()` | ✅ `router.beforeResolve()` | Same behavior                       |
| `router.afterEach()`     | ✅ `router.afterEach()`     | Same behavior                       |
| `router.currentRoute`    | ✅ `router.currentRoute`    | Read-only                           |
| `router.resolve()`       | ✅ `router.resolve()`       | Same behavior                       |
| `router.isReady()`       | ✅ `router.isReady()`       | Same behavior                       |
| `router.onError()`       | ✅ `router.onError()`       | Same behavior                       |
| `router.hasRoute()`      | ✅ `router.hasRoute()`      | Name check only                     |
| `router.getRoutes()`     | ✅ `router.getRoutes()`     | Returns shallow copy                |
| `useRouter()`            | ✅ `useRouter()`            | Same behavior                       |
| `useRoute()`             | ✅ `useRoute()`             | Returns snapshot, not reactive      |

### Unsupported APIs

| vue-router API                 | Reason                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `router.go(n)`                 | Mini programs don't support forward navigation                                                  |
| `router.forward()`             | Mini programs don't support forward navigation                                                  |
| `router.addRoute()`            | uni-app pages are statically declared in pages.json                                             |
| `router.removeRoute()`         | Same as above                                                                                   |
| Modifying `router.getRoutes()` | Route config cannot be dynamically changed                                                      |
| `<router-view>`                | uni-app has its own page rendering mechanism                                                    |
| `<router-link>`                | Simplified [RouterLink](/en/api/router-link) component supported, path strings and replace only |
| Nested routes                  | uni-app has no nested views                                                                     |
| Named views                    | uni-app has no multi-view support                                                               |
| Route lazy loading             | uni-app has its own code splitting                                                              |
| Route aliases                  | uni-app page paths are fixed                                                                    |
| Regex paths                    | uni-app page paths are fixed                                                                    |
| History mode selection         | uni-app uses different routing modes per platform                                               |

## Navigation Behavior Differences

### TabBar Pages

In vue-router, TabBar pages use the same navigation method as regular pages. In Uni Router, different uni APIs are automatically selected based on `meta.isTab`:

```ts
// vue-router: unified push
router.push('/user')

// Uni Router: auto-select based on isTab
// isTab: true → uni.switchTab
// isTab: false → uni.navigateTo
router.push({ name: 'user' })
```

### Page Stack

vue-router manipulates the browser History stack. Uni Router manipulates the uni-app page stack:

- `push()` → Page pushed onto stack
- `replace()` → Replace top of stack
- `back()` → Page popped from stack

### replace to TabBar Page

In vue-router, replace only replaces the current route record. In Uni Router, replacing to a TabBar page closes all non-tab pages (determined by `uni.switchTab` behavior).

## Guard Differences

### next() Behavior

The `next()` behavior is mostly the same, but Uni Router has a redirect depth limit of 10.

### Error Handling

In vue-router 4.x, guards throwing errors cause navigation to fail. Uni Router behaves the same — guard exceptions are treated as `NAVIGATION_CANCELLED`.

## Migration Guide

If you're migrating from vue-router to Uni Router:

1. **Remove `<router-view>`**: uni-app doesn't need this component
2. **Replace `<router-link>`**: Use the simplified [RouterLink](/en/api/router-link) component instead, note that it only supports path strings
3. **Remove `router.go()` and `router.forward()`**: Use `router.back()` instead
4. **Remove dynamic route registration**: All pages must be declared in `pages.json`
5. **Set `isTab: true` for TabBar pages**: Ensure the correct navigation API is used
6. **Adjust replace-to-TabBar logic**: Note that `switchTab` closes all non-tab pages
7. **Remove nested routes and named views**: uni-app doesn't support them
