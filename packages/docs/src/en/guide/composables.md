# Composables

Uni Router provides two composable functions for accessing the router instance and current route information in Vue 3's `<script setup>`. This chapter covers usage, reactivity principles, and practical tips in detail.

## useRouter()

Get the current router instance. Must be called inside a Vue component's `setup()` function, and the router must be installed via `app.use(router)` first.

### Basic Usage

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// Programmatic navigation
await router.push({ name: 'about' })
await router.replace({ name: 'home' })
await router.back()
await router.relaunch({ name: 'login' })
```

### Complete Example

```vue
<template>
  <view>
    <button @click="goAbout">Go to About</button>
    <button @click="goBack">Go Back</button>
    <button @click="replaceHome">Replace with Home</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function goAbout() {
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('Navigation failed:', err)
  }
}

async function goBack() {
  try {
    await router.back()
  } catch (err) {
    // Insufficient stack, fall back to home
    await router.relaunch({ name: 'home' })
  }
}

async function replaceHome() {
  await router.replace({ name: 'home' })
}
</script>
```

### Error Cases

| Scenario             | Error Code    | Description                            |
| -------------------- | ------------- | -------------------------------------- |
| Called outside setup | `SETUP_ERROR` | `inject` can only be used inside setup |
| Router not installed | `SETUP_ERROR` | Need to call `app.use(router)` first   |

```ts
// ❌ Called outside setup
const router = useRouter() // Error

// ✅ Called inside setup
import { useRouter } from '@meng-xi/uni-router'

export default {
  setup() {
    const router = useRouter() // Correct
    return { router }
  }
}
```

## useRoute()

Get a reactive reference to the current route location. Must be called inside a Vue component's `setup()` function.

### Basic Usage

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Access via .value in <script setup>
console.log(route.value.path)
console.log(route.value.query)
console.log(route.value.params)
console.log(route.value.meta)
```

```vue
<template>
  <!-- Auto-unwrapped in template, no .value needed -->
  <text>Current path: {{ route.path }}</text>
  <text>Query: {{ route.query.id }}</text>
  <text>Page params: {{ route.params.id }}</text>
  <text>Page title: {{ route.meta.title }}</text>
</template>
```

### Reactivity

`useRoute()` returns `Ref<RouteLocation>`, which automatically updates when the route changes:

```ts
import { useRoute } from '@meng-xi/uni-router'
import { watch } from 'vue'

const route = useRoute()

// Watch route changes
watch(
  () => route.value.query.id,
  (newId, oldId) => {
    console.log('ID changed:', oldId, '→', newId)
    if (newId) fetchDetail(newId)
  }
)
```

::: tip Shared Reactivity
The same router instance shares the same reactive ref, ensuring all components get consistent route state. When the route changes, all components using `useRoute()` will update.
:::

### RouteLocation Details

The `RouteLocation` returned by `useRoute()` contains the following fields:

```ts
interface RouteLocation {
  path: string                    // Page path
  name?: string                   // Route name
  query: Record<string, string>   // Query parameters
  params: Record<string, any>     // Page parameters (complex data)
  meta: RouteMeta                 // Route meta information
  fullPath: string                // Full path (including query)
  _synced?: boolean               // Whether it's a state sync (physical back, etc.)
}
```

#### Query Convenience Methods

`query` provides type conversion methods that automatically parse strings to the corresponding types:

```ts
const route = useRoute()

// Basic access (string)
const id = route.value.query.id           // '123'

// Type conversion
const pageNum = route.value.queryInt('page', 1)          // 123
const price = route.value.queryNumber('price', 0)        // 99.9
const enabled = route.value.queryBool('enabled', false)  // true
```

| Method                   | Return Type | Description                       |
| ------------------------ | ----------- | --------------------------------- |
| `queryInt(key, default?)`    | `number`    | Parse as integer                  |
| `queryNumber(key, default?)` | `number`    | Parse as floating-point number    |
| `queryBool(key, default?)`   | `boolean`   | Parse as boolean                  |

::: tip Default Values
All convenience methods accept a default value parameter. When the query doesn't exist or parsing fails, the default value is returned.
:::

### Accessing params

```ts
const route = useRoute()

// Access params (complex data)
const item = route.value.params.item as Item
const list = route.value.params.list as Item[]
```

::: warning params Limitations
- params is stored in memory and lost on H5 refresh
- params is only available with `push`; may be lost after `replace` / `relaunch`
- See [Navigation - Passing Complex Data with params](./navigation#passing-complex-data-with-params)
:::

## Using Outside Components

In non-component scenarios like Pinia stores or utility functions, you cannot use `useRouter()` / `useRoute()`. In these cases, import the router instance directly:

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({ routes })

export default router
```

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  async function login(credentials) {
    const { token } = await loginApi(credentials)
    uni.setStorageSync('token', token)

    // Use router inside store
    await router.push({ name: 'home' })
  }

  function getCurrentPath() {
    // Access current route (non-reactive)
    return router.currentRoute.path
  }

  return { login, getCurrentPath }
})
```

::: warning Non-reactive
`router.currentRoute` is a plain property, not reactive. For reactivity, use `useRoute()` inside components.
:::

## Using with Options API

If using the Options API, access via `this.$router` and `this.$route`:

```vue
<script>
export default {
  computed: {
    currentPath() {
      return this.$route.path
    },
    pageTitle() {
      return this.$route.meta.title
    }
  },
  methods: {
    navigate() {
      this.$router.push({ name: 'about' })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>
```

### Global Property Registration

`app.use(router)` automatically registers the `$router` and `$route` global properties:

```ts
// main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router) // Registers $router and $route
  return { app }
}
```

## Practical Tips

### 1. Encapsulating Navigation Logic

```ts
// composables/use-nav.ts
import { useRouter } from '@meng-xi/uni-router'
import { ref } from 'vue'

export function useNav() {
  const router = useRouter()
  const loading = ref(false)

  async function safePush(location) {
    loading.value = true
    try {
      await router.push(location)
    } catch (err) {
      if (err.code !== 'NAVIGATION_DUPLICATED') {
        uni.showToast({ title: 'Navigation failed', icon: 'none' })
        console.error(err)
      }
    } finally {
      loading.value = false
    }
  }

  async function safeBack(fallback?) {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      await router.back()
    } else if (fallback) {
      await router.relaunch(fallback)
    } else {
      await router.relaunch({ name: 'home' })
    }
  }

  return { loading, safePush, safeBack }
}
```

### 2. Watching Route Changes

```ts
import { useRoute } from '@meng-xi/uni-router'
import { watch, computed } from 'vue'

const route = useRoute()

// Watch path changes
watch(
  () => route.value.path,
  (newPath) => {
    console.log('Page switched:', newPath)
  }
)

// Watch query changes
watch(
  () => route.value.query,
  (newQuery) => {
    console.log('Query changed:', newQuery)
  },
  { deep: true }
)

// Computed properties
const isLoginPage = computed(() => route.value.name === 'login')
const requireAuth = computed(() => route.value.meta.requireAuth === true)
```

### 3. Handling Page Parameters

```ts
import { useRoute } from '@meng-xi/uni-router'
import { ref, onMounted } from 'vue'

const route = useRoute()
const detail = ref(null)

onMounted(async () => {
  // Get ID from query
  const id = route.value.queryInt('id', 0)
  if (!id) {
    uni.showToast({ title: 'Invalid parameter', icon: 'none' })
    return
  }

  // Get complex data from params
  const previewData = route.value.params.preview
  if (previewData) {
    detail.value = previewData // Use preloaded data directly
  } else {
    detail.value = await fetchDetail(id) // Network request
  }
})
```

### 4. Conditional Rendering

```vue
<template>
  <view>
    <text v-if="route.meta.requireAuth">Login required</text>
    <text v-else>Public page</text>

    <button v-if="route.name !== 'home'" @click="goHome">Back to Home</button>
  </view>
</template>

<script setup>
import { useRoute, useRouter } from '@meng-xi/uni-router'

const route = useRoute()
const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
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
    <text>Page params: {{ JSON.stringify(route.params) }}</text>

    <view v-if="loading">Navigating...</view>

    <button @click="goAbout">Go to About</button>
    <button @click="goBack">Go Back</button>
    <button @click="replaceHome">Replace with Home</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'
import { ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

// Watch route changes
watch(
  () => route.value.path,
  (newPath) => {
    console.log('Route changed:', newPath)
  }
)

async function goAbout() {
  loading.value = true
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('Navigation failed:', err)
  } finally {
    loading.value = false
  }
}

async function goBack() {
  try {
    await router.back()
  } catch (err) {
    // Insufficient stack, go home
    await router.relaunch({ name: 'home' })
  }
}

async function replaceHome() {
  await router.replace({ name: 'home' })
}
</script>
```

## Next Steps

- [Route Configuration](./route-config) — Detailed route configuration
- [Navigation](./navigation) — Navigation API usage
- [API Reference](../api/create-router) — Complete API documentation
