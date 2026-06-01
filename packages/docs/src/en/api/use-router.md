# useRouter()

Get the current router instance. Must be called inside a Vue component's `setup()` function.

## Type

```ts
function useRouter(): Router
```

## Return Value

Returns a [`Router`](./router-instance) instance.

## Thrown Errors

| Error Code | Condition |
|-----------|-----------|
| `SETUP_ERROR` | Called outside setup |
| `SETUP_ERROR` | Router not installed via `app.use(router)` |

## Example

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function navigate() {
  await router.push({ name: 'about' })
}
</script>
```
