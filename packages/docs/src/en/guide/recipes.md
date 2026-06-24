# Recipes

This chapter collects complete solutions for real business scenarios. Each solution can be used directly in projects, combining Uni Router's features with uni-app's limitations to provide best practices.

## Authentication

The most common need: redirect unauthenticated users to the login page when accessing protected pages, and return to the original page after login.

### Route Configuration

```ts
// router/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: 'Home' } },
  { path: 'pages/login/login', name: 'login', meta: { title: 'Login' } },
  { path: 'pages/about/about', name: 'about', meta: { requireAuth: true, title: 'About' } },
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true, title: 'Profile' } },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: 'Me' } }
]
```

### Guard Implementation

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import { routes } from './routes'

const router = createRouter({
  routes,
  interceptUniApi: true // Intercept native APIs to prevent bypassing guards
})

// Login status check
function isLoggedIn(): boolean {
  return !!uni.getStorageSync('token')
}

router.beforeEach((to, from, next) => {
  // 1. Not logged in accessing protected page → go to login
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(
      { name: 'login', query: { redirect: to.fullPath } },
      { mode: 'replace' } // replace avoids returning to protected page's intermediate state
    )
    return
  }

  // 2. Already logged in accessing login page → go to home
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }, { mode: 'replace' })
    return
  }

  // 3. Other cases pass
  next()
})

export default router
```

### Login Page Implementation

```ts
// pages/login/login.vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const { token } = await loginApi(username.value, password.value)
    uni.setStorageSync('token', token)

    // Login success, return to original page
    const redirect = route.query.redirect as string
    if (redirect) {
      // Use replace to return, avoiding login page staying in stack
      await router.replace(redirect)
    } else {
      // No redirect target, go to home
      await router.relaunch({ name: 'home' })
    }
  } catch (err) {
    uni.showToast({ title: 'Login failed', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>
```

### Key Points

1. **`mode: 'replace'`**: Login page uses replace to avoid users returning to "unauthenticated intermediate state"
2. **Carry redirect**: After login can return to original target page
3. **Block login page for logged-in users**: Prevent authenticated users from entering login page
4. **`interceptUniApi`**: Ensure `uni.navigateTo` also goes through guards

## Role-Based Permission Control

Role-based permission control where different roles access different pages.

### Extend RouteMeta

```ts
// types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
    permissions?: string[]
  }
}
```

### Route Configuration

```ts
export const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      roles: ['admin'],           // Admin only
      title: 'Admin Panel'
    }
  },
  {
    path: 'pages/editor/editor',
    name: 'editor',
    meta: {
      roles: ['admin', 'editor'], // Admin or editor
      title: 'Editor'
    }
  },
  {
    path: 'pages/order/order',
    name: 'order',
    meta: {
      permissions: ['order:view'], // Requires order:view permission
      title: 'Orders'
    }
  }
]
```

### Permission Guard

```ts
// utils/auth.ts
interface UserInfo {
  roles: string[]
  permissions: string[]
}

let currentUser: UserInfo | null = null

export async function fetchUserInfo(): Promise<UserInfo> {
  if (currentUser) return currentUser
  const res = await getUserInfoApi()
  currentUser = {
    roles: res.roles || [],
    permissions: res.permissions || []
  }
  return currentUser
}

export function hasRole(roles: string[]): boolean {
  if (!currentUser) return false
  return roles.some(r => currentUser!.roles.includes(r))
}

export function hasPermission(perms: string[]): boolean {
  if (!currentUser) return false
  return perms.some(p => currentUser!.permissions.includes(p))
}

export function clearUser() {
  currentUser = null
}
```

```ts
// router/guards/permission.ts
import { fetchUserInfo, hasRole, hasPermission } from '@/utils/auth'

export function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    // Pages without permission requirements pass directly
    if (!to.meta.roles && !to.meta.permissions) {
      next()
      return
    }

    // Not logged in
    if (!uni.getStorageSync('token')) {
      next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
      return
    }

    // Get user info (with cache)
    try {
      await fetchUserInfo()
    } catch {
      // Fetch failed, token might be expired
      uni.removeStorageSync('token')
      clearUser()
      next({ name: 'login' }, { mode: 'relaunch' })
      return
    }

    // Role check
    if (to.meta.roles && !hasRole(to.meta.roles)) {
      uni.showToast({ title: 'Access denied', icon: 'none' })
      next({ name: 'home' }, { mode: 'relaunch' })
      return
    }

    // Permission check
    if (to.meta.permissions && !hasPermission(to.meta.permissions)) {
      uni.showToast({ title: 'Insufficient permissions', icon: 'none' })
      next({ name: 'home' }, { mode: 'relaunch' })
      return
    }

    next()
  })
}
```

### Button-Level Permissions

```ts
// composables/use-permission.ts
import { hasRole, hasPermission } from '@/utils/auth'

export function usePermission() {
  const checkRole = (roles: string[]) => hasRole(roles)
  const checkPermission = (perms: string[]) => hasPermission(perms)

  return { checkRole, checkPermission }
}
```

```vue
<!-- Use in page -->
<template>
  <button v-if="checkRole(['admin'])" @click="handleDelete">Delete</button>
  <button v-if="checkPermission(['order:export'])" @click="handleExport">Export</button>
</template>

<script setup>
import { usePermission } from '@/composables/use-permission'
const { checkRole, checkPermission } = usePermission()
</script>
```

## Page Communication

Two approaches: EventChannel (push only) and global state (all navigation modes).

### Approach 1: EventChannel (Recommended, push only)

Use case: List page → detail page, detail page notifies list page to refresh after modification.

```ts
// pages/list/list.vue (initiating page)
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'
import { ref } from 'vue'

const router = useRouter()
const list = ref<Item[]>([])

async function goDetail(id: string) {
  const { eventChannel } = await router.push({
    path: 'pages/detail/detail',
    query: { id },
    events: {
      // Listen for update events from detail page
      updated: () => {
        // Refresh list
        fetchList()
      },
      deleted: (deletedId: string) => {
        // Remove from list
        list.value = list.value.filter(item => item.id !== deletedId)
      }
    }
  })

  // Send initial data to detail page
  eventChannel?.emit('init', { timestamp: Date.now() })
}
</script>
```

```ts
// pages/detail/detail.vue (target page)
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

let eventChannel: any

onLoad(() => {
  // Get EventChannel
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  eventChannel = currentPage.getOpenerEventChannel()

  // Listen for events from initiating page
  eventChannel.on('init', (data: any) => {
    console.log('Received init:', data)
  })
})

async function handleUpdate() {
  await updateApi(/* ... */)
  // Notify initiating page of update
  eventChannel?.emit('updated')
}

async function handleDelete() {
  await deleteApi(/* ... */)
  // Notify initiating page of deletion
  eventChannel?.emit('deleted', route.query.id)
  router.back()
}
</script>
```

### Approach 2: Global State (All Navigation Modes)

Use case: Need communication after `replace` / `relaunch`, or cross-page communication.

```ts
// stores/communication.ts
import { defineStore } from 'pinia'

export const useCommStore = defineStore('communication', () => {
  const pendingData = ref<any>(null)
  const refreshFlags = ref<Record<string, boolean>>({})

  function setData(data: any) {
    pendingData.value = data
  }

  function consumeData() {
    const data = pendingData.value
    pendingData.value = null
    return data
  }

  function markRefresh(key: string) {
    refreshFlags.value[key] = true
  }

  function consumeRefresh(key: string): boolean {
    const flag = refreshFlags.value[key]
    delete refreshFlags.value[key]
    return flag
  }

  return { pendingData, setData, consumeData, markRefresh, consumeRefresh }
})
```

```ts
// Initiating page
const commStore = useCommStore()
commStore.markRefresh('list') // Mark list needs refresh
await router.replace({ name: 'detail' })

// Target page onShow
onShow(() => {
  if (commStore.consumeRefresh('list')) {
    fetchList()
  }
})
```

## TabBar Page Data Passing

Since `switchTab` doesn't support query, passing params between TabBar pages requires global state.

### Approach: Pinia + onShow

```ts
// stores/tab.ts
import { defineStore } from 'pinia'

export const useTabStore = defineStore('tab', () => {
  const activeTab = ref('home')     // Current active Tab
  const tabParams = ref<Record<string, any>>({}) // Params for each Tab

  function setTabParam(tab: string, param: any) {
    tabParams.value[tab] = param
  }

  function getTabParam(tab: string): any {
    return tabParams.value[tab]
  }

  function clearTabParam(tab: string) {
    delete tabParams.value[tab]
  }

  return { activeTab, tabParams, setTabParam, getTabParam, clearTabParam }
})
```

```ts
// Jump from normal page to TabBar page with params
const tabStore = useTabStore()
tabStore.setTabParam('user', { scrollTarget: 'orders' })
await router.push({ name: 'user' }) // switchTab, can't use query
```

```ts
// TabBar page reads params in onShow
import { onShow } from '@dcloudio/uni-app'

const tabStore = useTabStore()

onShow(() => {
  router.syncRoute() // Sync route state

  const param = tabStore.getTabParam('user')
  if (param?.scrollTarget) {
    // Scroll to specified position
    scrollTo(param.scrollTarget)
    tabStore.clearTabParam('user') // Clean after consuming
  }
})
```

## Form Leave Confirmation

Prevent users from accidentally leaving unsaved forms.

### Approach: Guard + onBackPress

```ts
// composables/use-dirty-guard.ts
import { onBackPress, onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'
import { ref, type Ref } from 'vue'

export function useDirtyGuard(dirty: Ref<boolean>, onLeave?: () => void) {
  const router = useRouter()

  // Guard for programmatic navigation (router.push / router.back etc.)
  const guard = router.beforeEach((to, from, next) => {
    if (from.meta._dirty && dirty.value) {
      uni.showModal({
        title: 'Notice',
        content: 'You have unsaved changes. Leave anyway?',
        success: (res) => {
          if (res.confirm) {
            dirty.value = false
            onLeave?.()
            next()
          } else {
            next(false)
          }
        }
      })
    } else {
      next()
    }
  })

  // App: physical back button
  // #ifdef APP-PLUS
  onBackPress(() => {
    if (dirty.value) {
      uni.showModal({
        title: 'Notice',
        content: 'You have unsaved changes. Leave anyway?',
        success: (res) => {
          if (res.confirm) {
            dirty.value = false
            onLeave?.()
            router.back()
          }
        }
      })
      return true // Block default back
    }
    return false
  })
  // #endif

  // All platforms: sync state in onShow (after physical back)
  onShow(() => {
    router.syncRoute()
  })

  // Return uninstall function, remove guard when leaving page
  return guard
}
```

### Usage

```vue
<!-- pages/edit/edit.vue -->
<template>
  <input v-model="form.name" @input="dirty = true" />
  <button @click="handleSave">Save</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDirtyGuard } from '@/composables/use-dirty-guard'

const form = ref({ name: '' })
const dirty = ref(false)

useDirtyGuard(dirty, () => {
  // Cleanup logic when leaving
  console.log('User confirmed leave')
})

async function handleSave() {
  await saveApi(form.value)
  dirty.value = false
  uni.showToast({ title: 'Saved successfully' })
}
</script>
```

::: warning Physical Back Button Limitations
`onBackPress` only works on App. H5 and mini-program physical back cannot be intercepted; can only handle after the fact via `onShow` + `syncRoute`. See [Platform Compatibility](./compatibility).
:::

## Data Preloading

Preload data before navigation to improve user experience.

### Approach: beforeResolve

```ts
// router/guards/preload.ts
import type { Router } from '@meng-xi/uni-router'

// Page data loader mapping
const preloaders: Record<string, (to: RouteLocation) => Promise<void>> = {
  detail: async (to) => {
    const store = useDetailStore()
    await store.fetchDetail(to.query.id)
  },
  list: async (to) => {
    const store = useListStore()
    const page = to.queryInt('page', 1)
    await store.fetchList(page)
  }
}

export function setupPreloadGuard(router: Router) {
  router.beforeResolve(async (to, from, next) => {
    const preloader = preloaders[to.name as string]
    if (preloader) {
      try {
        uni.showLoading({ title: 'Loading...' })
        await preloader(to)
        next()
      } catch (err) {
        uni.showToast({ title: 'Load failed', icon: 'none' })
        next(false) // Data load failed, abort navigation
      } finally {
        uni.hideLoading()
      }
    } else {
      next()
    }
  })
}
```

### Cached Preloading

```ts
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function setupCachedPreload(router: Router) {
  router.beforeResolve(async (to, from, next) => {
    const cacheKey = `${to.name}:${to.fullPath}`
    const cached = cache.get(cacheKey)

    // Cache not expired, pass directly
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      next()
      return
    }

    try {
      const data = await fetchData(to)
      cache.set(cacheKey, { data, timestamp: Date.now() })
      next()
    } catch {
      next(false)
    }
  })
}
```

## Auto Page Title Setting

### Approach: afterEach

```ts
// router/guards/title.ts
export function setupTitleGuard(router: Router) {
  router.afterEach((to) => {
    const title = to.meta.title as string | undefined
    uni.setNavigationBarTitle({ title: title || 'Default Title' })
  })
}
```

### Dynamic Title

```ts
// Don't set title in route config, set dynamically in page
router.afterEach((to) => {
  // Generate title based on route params
  if (to.name === 'detail') {
    const store = useDetailStore()
    const title = store.detail?.title || 'Detail'
    uni.setNavigationBarTitle({ title })
  } else if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

## Analytics Tracking

### Approach: afterEach + onRouteChange

```ts
// utils/analytics.ts
export function trackPageView(path: string, fromPath: string, synced: boolean) {
  // Report analytics
  analytics.report({
    event: 'page_view',
    page_path: path,
    from_path: fromPath,
    is_synced: synced, // Whether it's a state sync (physical back etc.)
    timestamp: Date.now()
  })
}

// router/guards/analytics.ts
export function setupAnalyticsGuard(router: Router) {
  // Complete navigation
  router.afterEach((to, from) => {
    trackPageView(to.path, from.path, false)
  })

  // State sync (physical back etc.)
  router.onRouteChange((to, from) => {
    if (to._synced) {
      trackPageView(to.path, from.path, true)
    }
  })
}
```

## Maintenance Mode

Redirect all navigation to a maintenance page when the app is under maintenance.

```ts
// stores/app.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const maintenanceMode = ref(false)

  async function checkMaintenance() {
    try {
      const res = await checkMaintenanceApi()
      maintenanceMode.value = res.maintenance
    } catch {
      // Check failure doesn't block
    }
  }

  return { maintenanceMode, checkMaintenance }
})
```

```ts
// router/guards/maintenance.ts
export function setupMaintenanceGuard(router: Router) {
  const appStore = useAppStore()

  router.beforeEach((to, from, next) => {
    // Maintenance page itself passes
    if (to.name === 'maintenance') {
      next()
      return
    }

    // Maintenance mode, redirect to maintenance page
    if (appStore.maintenanceMode) {
      next({ name: 'maintenance' }, { mode: 'relaunch' })
      return
    }

    next()
  })

  // Periodically check maintenance status
  setInterval(() => {
    appStore.checkMaintenance()
  }, 60 * 1000) // Check every minute
}
```

## Page Stack Depth Management

Prevent mini-program page stack overflow (limit 10 levels).

### Safe Navigation Wrapper

```ts
// composables/use-safe-nav.ts
import { useRouter } from '@meng-xi/uni-router'
import type { RouteLocationRaw } from '@meng-xi/uni-router'

const STACK_WARNING_THRESHOLD = 8 // Reserve 2 levels buffer

export function useSafeNav() {
  const router = useRouter()

  /**
   * Safe push: auto-switch to relaunch when stack near limit
   */
  async function safePush(location: RouteLocationRaw) {
    const pages = getCurrentPages()
    if (pages.length >= STACK_WARNING_THRESHOLD) {
      console.warn('[uni-router] Page stack near limit, using relaunch instead of push')
      await router.relaunch(location)
    } else {
      await router.push(location)
    }
  }

  /**
   * Safe back: switch to relaunch to home when stack insufficient
   */
  async function safeBack(delta = 1, fallback?: RouteLocationRaw) {
    const pages = getCurrentPages()
    if (pages.length - delta < 1) {
      // Stack insufficient, jump to fallback or home
      await router.relaunch(fallback || { name: 'home' })
    } else {
      await router.back(delta)
    }
  }

  return { safePush, safeBack }
}
```

### Usage

```ts
const { safePush, safeBack } = useSafeNav()

// List → Detail → Comment → Reply (stack may get deep)
await safePush({ name: 'detail', query: { id: '1' } })
await safePush({ name: 'comment', query: { id: '1' } })
// Auto-switches to relaunch when stack near limit

// Safe back
await safeBack(2, { name: 'home' }) // Goes home when stack insufficient
```

## Complete Guard Assembly

Combine all guards together:

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import { routes } from './routes'
import { setupAuthGuard } from './guards/auth'
import { setupPermissionGuard } from './guards/permission'
import { setupPreloadGuard } from './guards/preload'
import { setupTitleGuard } from './guards/title'
import { setupAnalyticsGuard } from './guards/analytics'
import { setupMaintenanceGuard } from './guards/maintenance'

const router = createRouter({
  routes,
  interceptUniApi: true,
  guardTimeout: 15000 // Guards have network requests, increase timeout
})

// Register guards in order
setupMaintenanceGuard(router)  // 1. Maintenance mode (check first)
setupAuthGuard(router)         // 2. Authentication
setupPermissionGuard(router)   // 3. Permission control
setupPreloadGuard(router)      // 4. Data preloading (beforeResolve)
setupTitleGuard(router)        // 5. Title setting (afterEach)
setupAnalyticsGuard(router)    // 6. Analytics (afterEach + onRouteChange)

export default router
```

::: tip Guard Registration Order
Guards execute in registration order. Recommended:
1. Maintenance mode (intercept earliest)
2. Authentication
3. Permission control
4. Data preloading (in beforeResolve)
5. Post-processing (afterEach)
:::

## Route Modularization

Split routes by module in large projects:

```
src/
├── router/
│   ├── index.ts          # Router instance + guard assembly
│   ├── routes.ts         # Aggregate all routes
│   └── guards/
│       ├── auth.ts
│       ├── permission.ts
│       └── ...
├── modules/
│   ├── user/
│   │   └── routes.ts     # User module routes
│   ├── order/
│   │   └── routes.ts     # Order module routes
│   └── product/
│       └── routes.ts     # Product module routes
```

```ts
// modules/user/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const userRoutes: RouteConfig[] = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: 'Me' } },
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true } },
  { path: 'pages/settings/settings', name: 'settings', meta: { requireAuth: true } }
]
```

```ts
// router/routes.ts
import { userRoutes } from '@/modules/user/routes'
import { orderRoutes } from '@/modules/order/routes'
import { productRoutes } from '@/modules/product/routes'

export const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: 'Home' } },
  { path: 'pages/login/login', name: 'login' },
  ...userRoutes,
  ...orderRoutes,
  ...productRoutes
]
```

## Next Steps

- [FAQ](./faq) — Pitfall records
- [Platform Compatibility](./compatibility) — Platform limitations
- [API Reference](../api/create-router) — Complete API documentation
