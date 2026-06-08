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

::: tip `useRoute()` returns a reactive reference that automatically updates when the route changes. The same router instance shares the same reactive ref, ensuring all components get consistent route state. :::

## Thrown Errors

| Error Code    | Condition                                  |
| ------------- | ------------------------------------------ |
| `SETUP_ERROR` | Called outside setup                       |
| `SETUP_ERROR` | Router not installed via `app.use(router)` |

## Example

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Access via .value in <script setup>
console.log(route.value.path)
console.log(route.value.query)
console.log(route.value.meta.title)
</script>
```

```vue
<template>
	<!-- Auto-unwrapped in template, no .value needed -->
	<text>Current path: {{ route.path }}</text>
	<text>Query: {{ route.query.id }}</text>
</template>
```
