# useRoute()

Get a reactive reference to the current route location. Must be called inside a Vue component's `setup()` function.

## Type

```ts
function useRoute(): Ref<RouteLocation>
```

## Return Value

Returns a reactive reference (`Ref<RouteLocation>`) to the current [`RouteLocation`](./type-route-location).

- Access route info via `route.value` in `<script setup>`
- Auto-unwrapped in templates, use `route.path` directly
- Automatically updates when the route changes, triggering component re-render

::: tip Reactivity principle
`useRoute()` returns a reactive reference that automatically updates when the route changes. The same router instance shares the same reactive ref, ensuring all components get consistent route state.

Underlying implementation: the router maintains a `ref<RouteLocation>` internally, updates it on every navigation completion or state sync, and all `useRoute()` calls return the same ref.
:::

## Call Constraints

::: warning Must be called inside setup
`useRoute()` relies on Vue's `inject`, so it can only be called inside a component's `setup()` function (or `<script setup>`). Calling it in the following scenarios will throw `SETUP_ERROR`:

- Regular functions / utility methods
- Module top level
- Async callbacks (setTimeout, Promise.then, etc.)
:::

## Thrown Errors

| Error Code    | Condition                                  |
| ------------- | ------------------------------------------ |
| `SETUP_ERROR` | Called outside setup                       |
| `SETUP_ERROR` | Router not installed via `app.use(router)` |

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Access via .value in <script setup>
console.log(route.value.path)
console.log(route.value.query.id)
console.log(route.value.params.info)
console.log(route.value.meta.title)
</script>
```

```vue
<template>
  <!-- Auto-unwrapped in template, no .value needed -->
  <view>Current path: {{ route.path }}</view>
  <view>Query: {{ route.query.id }}</view>
  <view>Page params: {{ route.params.id }}</view>
  <view>Page title: {{ route.meta.title }}</view>
</template>
```

### Reading Query Parameters (Type Parsing)

`RouteLocation` provides three type-parsing methods to avoid manual conversion:

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Assume URL: /pages/detail/detail?id=123&price=19.99&enabled=true

// queryInt - parse as integer
const id = route.value.queryInt('id')        // 123
const page = route.value.queryInt('page', 1) // 1 (default value)

// queryNumber - parse as number (supports floats)
const price = route.value.queryNumber('price')     // 19.99
const total = route.value.queryNumber('total', 0)  // 0 (default value)

// queryBool - parse as boolean
const enabled = route.value.queryBool('enabled')         // true
const visible = route.value.queryBool('visible', false)  // false (default value)
</script>
```

::: tip Type parsing rules
- `queryInt()` / `queryNumber()`: Returns `defaultValue` on parse failure, or `undefined` if not provided
- `queryBool()`: Only recognizes `'true'` / `'1'` → `true`, `'false'` / `'0'` → `false`; other values return `defaultValue`
:::

### Reading Page Parameters (params)

`params` is used to pass complex data without exposing it in the URL:

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Assume navigation: router.push({ path: '/detail', params: { id: 123, info: { name: 'Tom' } } })
console.log(route.value.params.id)        // 123
console.log(route.value.params.info)      // { name: 'Tom' }
console.log(route.value.params.info.name) // 'Tom'
</script>
```

::: warning params limitations
1. **Does not support functions, Symbols, or other non-JSON-serializable values**
2. **TabBar pages**: Since `switchTab` doesn't support query, `__params_key` cannot be passed; TabBar pages cannot receive params
3. **Page stack sync**: After `back()`, the target page's params are read via `peek` (to avoid accidental deletion)
4. **Not persisted by default**: Lost on H5 refresh; configure `persistent: true` to persist
:::

### Watching Route Changes

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Watch path changes
watch(
  () => route.value.path,
  (newPath, oldPath) => {
    console.log('Path changed:', oldPath, '→', newPath)
  }
)

// Watch query parameters
watch(
  () => route.value.query.id,
  (newId) => {
    if (newId) fetchDetail(newId)
  }
)
</script>
```

### Sync State with onShow

Physical back button and browser back bypass the router, so `route` is not automatically updated. Call `syncRoute()` in `onShow`:

```vue
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

onShow(() => {
  // route will auto-update after sync
  router.syncRoute()
  console.log('Current page:', route.value.path)
})
</script>
```

### Reading Route in Non-Component Code

In non-component scenarios like Pinia stores or utility functions, **use the router instance's `currentRoute` directly**:

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  function getCurrentPath() {
    // ✅ Read currentRoute directly
    return router.currentRoute.path
  }

  function getCurrentQuery() {
    return router.currentRoute.query
  }

  return { getCurrentPath, getCurrentQuery }
})
```

::: warning currentRoute is not reactive
In non-component scenarios, `router.currentRoute` is **not reactive**; you get the current snapshot value. For reactive updates, use `useRoute()` inside components.
:::

## Differences from vue-router

| Feature | vue-router | Uni Router |
| --- | --- | --- |
| Return type | `RouteLocationNormalized` | `Ref<RouteLocation>` |
| Reactive | ✅ | ✅ |
| `params` | URL path params (e.g., `/user/:id`) | In-memory params (not exposed in URL) |
| Type parsing methods | ❌ | `queryInt()` / `queryNumber()` / `queryBool()` |
| Physical back sync | Automatic | Requires manual `syncRoute()` |

## Next Steps

- [RouteLocation Type](./type-route-location) — Full fields of route location
- [useRouter()](./use-router) — Get the router instance
- [Composition API Guide](../guide/composables) — Deep dive into the Composition API
