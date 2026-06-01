# Composables

MengXi UniRouter provides two composable functions for accessing the router instance and current route information in Vue 3's `<script setup>`.

## useRouter()

Get the current router instance. Must be called inside a Vue component's `setup()` function, and the router must be installed via `app.use(router)` first.

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

await router.push({ name: 'about' })
await router.back()
```

### Error Cases

| Scenario | Error Code | Description |
|----------|-----------|-------------|
| Called outside setup | `SETUP_ERROR` | `inject` can only be used inside setup |
| Router not installed | `SETUP_ERROR` | Need to call `app.use(router)` first |

## useRoute()

Get the current route location information. Must be called inside a Vue component's `setup()` function.

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
console.log(route.path)
console.log(route.query)
console.log(route.meta)
```

::: warning
`useRoute()` returns a snapshot of the route location at the time of the call. It does not automatically react to subsequent route changes. For reactive route information, listen to `router.currentRoute`.
:::

## Using with Options API

If using the Options API, access via `this.$router` and `this.$route`:

```vue
<script>
export default {
  computed: {
    currentPath() {
      return this.$route.path
    }
  },
  methods: {
    navigate() {
      this.$router.push({ name: 'about' })
    }
  }
}
</script>
```

## Complete Example

```vue
<template>
  <view class="container">
    <text>Current path: {{ route.path }}</text>
    <text>Page title: {{ route.meta.title }}</text>
    <text>Query params: {{ JSON.stringify(route.query) }}</text>

    <button @click="goAbout">Go to About</button>
    <button @click="goBack">Go Back</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

async function goAbout() {
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (error) {
    console.error('Navigation failed', error)
  }
}

function goBack() {
  router.back()
}
</script>
```
