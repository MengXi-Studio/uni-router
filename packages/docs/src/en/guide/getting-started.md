# Quick Start

This section helps you quickly integrate Uni Router into your uni-app project, from installation to full usage.

## Prerequisites

Ensure your project meets the following conditions:

- uni-app project (based on Vue 3)
- Has a `pages.json` configuration file
- Pages are declared in `pages.json`

::: warning Vue 2 Not Supported
Uni Router is only compatible with Vue 3, depending on Vue 3's Composition API (`inject` / `ref`), `app.provide`, `<script setup>` and other features.
:::

## Installation

::: code-group

```bash [pnpm]
pnpm add @meng-xi/uni-router
```

```bash [npm]
npm install @meng-xi/uni-router
```

```bash [yarn]
yarn add @meng-xi/uni-router
```

:::

See [Installation Guide](./installation) for details.

## Step 1: Define Route Configuration

Create `src/router/index.ts` and define route configurations consistent with `pages.json`:

```ts
// src/router/index.ts
import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: 'Home', isTab: true }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: 'About', requireAuth: true }
  },
  {
    path: 'pages/login/login',
    name: 'login',
    meta: { title: 'Login' }
  },
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { title: 'Profile', isTab: true }
  }
]

const router = createRouter({
  routes,
  strict: true,
  plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin],
  paramsPersistent: false,     // Requires ParamsPlugin
  useUniEventChannel: true,    // Requires ChannelPlugin
  interceptUniApi: true,       // Requires InterceptorPlugin, intercept native API to ensure guards take effect
  guardTimeout: 15000          // Guard timeout (ms)
})

export default router
```

::: tip Register Plugins on Demand
Plugins in `plugins` are registered on demand. Unregistered plugin features are unavailable (using them throws a `PLUGIN_REQUIRED` error). If you don't need param passing or API interception, just register the plugins you need. See [Plugin System](./plugins).

Recommended to use [`@meng-xi/vite-plugin`](./auto-generate) to automatically generate route configurations from `pages.json`, avoiding manual maintenance.
:::

## Step 2: Register Router

Install the router in `main.ts`:

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router) // Register $router and $route global properties
  return { app }
}
```

## Step 3: Configure Route Guards

Add guards in `router/index.ts`:

```ts
// Login status check
function isLoggedIn(): boolean {
  return !!uni.getStorageSync('token')
}

// Global before guard
router.beforeEach((to, from, next) => {
  // Not logged in accessing protected page
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(
      { name: 'login', query: { redirect: to.fullPath } },
      { mode: 'replace' }
    )
    return
  }

  // Already logged in accessing login page
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }, { mode: 'replace' })
    return
  }

  next()
})

// Global after hook
router.afterEach((to) => {
  // Auto set page title
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

## Step 4: Use in Pages

### Composition API (Recommended)

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="container">
    <text>Current path: {{ route.path }}</text>
    <text>Page title: {{ route.meta.title }}</text>

    <button @click="goAbout">Go to About</button>
    <button @click="goUser">Go to Profile</button>
    <button @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

async function goAbout() {
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('Navigation failed:', err)
  }
}

async function goUser() {
  await router.push({ name: 'user' })
}

async function goBack() {
  try {
    await router.back()
  } catch {
    // Insufficient stack, return to home
    await router.relaunch({ name: 'home' })
  }
}
</script>
```

### Options API

```vue
<template>
  <view>
    <text>Current path: {{ $route.path }}</text>
    <button @click="goAbout">Go to About</button>
  </view>
</template>

<script>
export default {
  methods: {
    goAbout() {
      this.$router.push({ name: 'about', query: { id: '1' } })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>
```

## Step 5: Use RouterLink Component

```vue
<template>
  <view>
    <!-- Path string -->
    <RouterLink to="pages/about/about">About</RouterLink>

    <!-- Named route -->
    <RouterLink :to="{ name: 'about' }">About</RouterLink>

    <!-- With query -->
    <RouterLink :to="{ name: 'about', query: { id: '1' } }">About 1</RouterLink>
  </view>
</template>

<script setup>
import { RouterLink } from '@meng-xi/uni-router'
</script>
```

## Step 6: Handle Cold-Start Guards

When a user directly enters a page via H5 URL / mini-program scene value / App deeplink, the page is loaded directly by the uni-app framework without going through the router's navigation, meaning guards (`beforeEach` etc.) are not executed. Use `guardRoute()` to retroactively execute the guard chain for the current page:

```ts
// router/index.ts
router.isReady().then(() => {
  router.guardRoute(undefined, {
    onAbort: () => {
      // Guard aborted: page already loaded, cannot prevent entry. Manually redirect to safe page
      router.relaunch({ name: 'home' })
    }
  })
})
```

::: tip Auto Route State Sync
When `app.use(router)` is called, the router injects a global mixin that automatically calls `syncRoute()` on each page's `onShow` lifecycle to synchronize route state. Therefore, you **don't need** to manually call `syncRoute()` in `App.vue`'s `onShow`.

If you need to access route info in `onLoad` (which fires before `onShow`), you can call it manually:

```ts
import { onLoad } from '@dcloudio/uni-app'
import { useRoute } from '@meng-xi/uni-router'

onLoad(() => {
  const route = useRoute()
  // route.value may still be stale here, sync manually
  router.syncRoute()
  console.log(route.value.query)
})
```
:::

## Complete Example

### Login Page

```vue
<!-- pages/login/login.vue -->
<template>
  <view class="login">
    <input v-model="username" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="handleLogin" :loading="loading">Login</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const { token } = await loginApi(username.value, password.value)
    uni.setStorageSync('token', token)

    // Login successful, return to original page
    const redirect = route.value.query.redirect as string
    if (redirect) {
      await router.replace(redirect)
    } else {
      await router.relaunch({ name: 'home' })
    }
  } catch (err) {
    uni.showToast({ title: 'Login failed', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loginApi(username: string, password: string) {
  // Simulate login API
  return new Promise<{ token: string }>((resolve) => {
    setTimeout(() => resolve({ token: 'mock-token' }), 500)
  })
}
</script>
```

### Protected Page

```vue
<!-- pages/about/about.vue -->
<template>
  <view>
    <text>About Page</text>
    <text>From: {{ route.query.from }}</text>
    <button @click="goBack">Back</button>
  </view>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '@meng-xi/uni-router'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.back()
}
</script>
```

## Directory Structure

The completed project structure:

```
src/
├── main.ts                  # App entry
├── App.vue                  # Root component
├── pages.json               # uni-app page config
├── router/
│   └── index.ts             # Router instance + guards
└── pages/
    ├── index/
    │   └── index.vue        # Home page
    ├── about/
    │   └── about.vue        # About page
    ├── login/
    │   └── login.vue        # Login page
    └── user/
        └── user.vue         # User page
```

## Next Steps

- [Plugin System](./plugins) — Understand the core + plugin architecture
- [Route Configuration](./route-config) — Learn more about route configuration
- [Navigation](./navigation) — Four navigation methods explained
- [Route Guards](./guards) — Complete guard mechanism
- [Recipes](./recipes) — Complete business solutions
- [Platform Compatibility](./compatibility) — uni-app limitations
