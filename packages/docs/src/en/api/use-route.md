# useRoute()

Get the current route location information. Must be called inside a Vue component's `setup()` function.

## Type

```ts
function useRoute(): RouteLocation
```

## Return Value

Returns the current [`RouteLocation`](./type-route-location) snapshot.

::: warning
Returns a snapshot of the route location at the time of the call. It does not automatically react to subsequent route changes.
:::

## Thrown Errors

| Error Code | Condition |
|-----------|-----------|
| `SETUP_ERROR` | Called outside setup |
| `SETUP_ERROR` | Router not installed via `app.use(router)` |

## Example

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
console.log(route.path)
console.log(route.query)
console.log(route.meta.title)
</script>
```
