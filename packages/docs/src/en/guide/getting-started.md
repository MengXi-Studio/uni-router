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
import { createRouter } from '@meng-xi/uni-router'
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
  interceptUniApi: true,  // Intercept native API, ensure guards take effect
  guardTimeout: 15000     // Guard timeout (ms)
})

export default router
```

::: tip Auto Generation
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

## Step 6: Handle Page Synchronization

Handle route state synchronization in `App.vue` (for physical back and other scenarios):

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onShow(() => {
  // Sync route state (handle physical back and other scenarios)
  router.syncRoute()
})
</script>
```

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

- [Route Configuration](./route-config) — Learn more about route configuration
- [Navigation](./navigation) — Four navigation methods explained
- [Route Guards](./guards) — Complete guard mechanism
- [Recipes](./recipes) — Complete business solutions
- [Platform Compatibility](./compatibility) — uni-app limitations
