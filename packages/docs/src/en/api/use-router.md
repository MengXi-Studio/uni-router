# useRouter()

Get the current router instance inside a Vue component's `setup()`. This is the entry point for the Composition API.

## Type

```ts
function useRouter(): Router
```

## Return Value

Returns a [`Router`](./router-instance) instance.

## Call Constraints

::: warning Must be called inside setup
`useRouter()` relies on Vue's `inject`, so it can only be called inside a component's `setup()` function (or `<script setup>`). Calling it in the following scenarios will throw `SETUP_ERROR`:

- Regular functions / utility methods
- Module top level
- Async callbacks (setTimeout, Promise.then, etc.)
- Event handlers (but you can **use** an already-obtained router inside event handlers)
:::

## Thrown Errors

| Error Code | Condition |
|-----------|-----------|
| `SETUP_ERROR` | Called outside setup |
| `SETUP_ERROR` | Router not installed via `app.use(router)` |

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function goAbout() {
  await router.push({ name: 'about' })
}

function back() {
  router.back()
}
</script>

<template>
  <button @click="goAbout">Go to About</button>
  <button @click="back">Back</button>
</template>
```

### Using in Event Handlers

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function handleLogin() {
  // Login logic...
  await router.replace({ name: 'home' })
}

async function handleLogout() {
  // Logout logic...
  await router.relaunch({ name: 'login' })
}
</script>
```

### Sync State with onShow

```vue
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// Sync state after physical back button
onShow(() => {
  router.syncRoute()
})
</script>
```

### Using in Non-Component Code

In non-component scenarios like Pinia stores or utility functions, **import the router instance directly** instead of using `useRouter()`:

```ts
// src/router/index.ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({ /* ... */ })
export default router
```

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'  // Direct import

export const useUserStore = defineStore('user', () => {
  async function logout() {
    // ✅ Use the imported router directly
    await router.relaunch({ name: 'login' })
  }

  return { logout }
})
```

::: tip useRouter vs direct import
- **Inside components**: Prefer `useRouter()`, follows Composition API style, easier to test and use dependency injection
- **Outside components** (Pinia, utility functions): Import the router instance directly to avoid `inject` limitations
:::

## Differences from vue-router

| Feature | vue-router | Uni Router |
| --- | --- | --- |
| Call location | In setup | In setup |
| Non-component usage | Via `inject` + context | Direct import of instance |
| Return type | `Router` | `Router` |
| Error handling | Throws warning | Throws `RouterError` (`SETUP_ERROR`) |

## Next Steps

- [Router Instance](./router-instance) — Full API of the router instance
- [useRoute()](./use-route) — Get the current route location
- [Composition API Guide](../guide/composables) — Deep dive into the Composition API
