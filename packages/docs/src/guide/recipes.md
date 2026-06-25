# 实战指南

本章汇集真实业务场景的完整方案，每个方案都可直接用于项目。结合 Uni Router 的特性和 uni-app 的限制，提供最佳实践。

## 登录认证

最常见的需求：未登录用户访问受保护页面时跳转登录页，登录后返回原页面。

### 路由配置

```ts
// router/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const routes: RouteConfig[] = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: '首页' } },
  { path: 'pages/login/login', name: 'login', meta: { title: '登录' } },
  { path: 'pages/about/about', name: 'about', meta: { requireAuth: true, title: '关于' } },
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true, title: '个人中心' } },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: '我的' } }
]
```

### 守卫实现

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import { routes } from './routes'

const router = createRouter({
  routes,
  interceptUniApi: true // 拦截原生 API，防止绕过守卫
})

// 登录状态检查
function isLoggedIn(): boolean {
  return !!uni.getStorageSync('token')
}

router.beforeEach((to, from, next) => {
  // 1. 未登录访问受保护页面 → 跳登录页
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(
      { name: 'login', query: { redirect: to.fullPath } },
      { mode: 'replace' } // replace 避免返回到受保护页的中间态
    )
    return
  }

  // 2. 已登录访问登录页 → 跳首页
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }, { mode: 'replace' })
    return
  }

  // 3. 其他情况放行
  next()
})

export default router
```

### 登录页实现

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

    // 登录成功，返回原页面
    const redirect = route.query.redirect as string
    if (redirect) {
      // 用 replace 回到原页面，避免登录页留在栈中
      await router.replace(redirect)
    } else {
      // 无重定向目标，回首页
      await router.relaunch({ name: 'home' })
    }
  } catch (err) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>
```

### 关键点

1. **`mode: 'replace'`**：登录页用 replace 跳转，避免用户返回到"未登录的中间态"
2. **携带 redirect**：登录后能返回原目标页面
3. **已登录拦截登录页**：防止已登录用户误入登录页
4. **`interceptUniApi`**：确保 `uni.navigateTo` 也经过守卫

## 角色权限控制

基于角色的权限控制，不同角色访问不同页面。

### 扩展 RouteMeta

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

### 路由配置

```ts
export const routes: RouteConfig[] = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: {
      roles: ['admin'],           // 仅管理员
      title: '管理后台'
    }
  },
  {
    path: 'pages/editor/editor',
    name: 'editor',
    meta: {
      roles: ['admin', 'editor'], // 管理员或编辑
      title: '编辑器'
    }
  },
  {
    path: 'pages/order/order',
    name: 'order',
    meta: {
      permissions: ['order:view'], // 需要 order:view 权限
      title: '订单'
    }
  }
]
```

### 权限守卫

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
    // 不需要权限的页面直接放行
    if (!to.meta.roles && !to.meta.permissions) {
      next()
      return
    }

    // 未登录
    if (!uni.getStorageSync('token')) {
      next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
      return
    }

    // 获取用户信息（带缓存）
    try {
      await fetchUserInfo()
    } catch {
      // 获取失败，token 可能过期
      uni.removeStorageSync('token')
      clearUser()
      next({ name: 'login' }, { mode: 'relaunch' })
      return
    }

    // 角色检查
    if (to.meta.roles && !hasRole(to.meta.roles)) {
      uni.showToast({ title: '无权访问', icon: 'none' })
      next({ name: 'home' }, { mode: 'relaunch' })
      return
    }

    // 权限检查
    if (to.meta.permissions && !hasPermission(to.meta.permissions)) {
      uni.showToast({ title: '权限不足', icon: 'none' })
      next({ name: 'home' }, { mode: 'relaunch' })
      return
    }

    next()
  })
}
```

### 按钮级权限

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
<!-- 页面中使用 -->
<template>
  <button v-if="checkRole(['admin'])" @click="handleDelete">删除</button>
  <button v-if="checkPermission(['order:export'])" @click="handleExport">导出</button>
</template>

<script setup>
import { usePermission } from '@/composables/use-permission'
const { checkRole, checkPermission } = usePermission()
</script>
```

## 页面间通信

两种方案：EventChannel（仅 push）和全局状态（全导航方式）。

### 方案 1：EventChannel（推荐，仅 push）

适用场景：列表页 → 详情页，详情页修改后通知列表页刷新。

```ts
// pages/list/list.vue（发起页）
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
      // 监听详情页发来的更新事件
      updated: () => {
        // 刷新列表
        fetchList()
      },
      deleted: (deletedId: string) => {
        // 从列表中移除
        list.value = list.value.filter(item => item.id !== deletedId)
      }
    }
  })

  // 向详情页发送初始化数据
  eventChannel?.emit('init', { timestamp: Date.now() })
}
</script>
```

```ts
// pages/detail/detail.vue（目标页）
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

let eventChannel: any

onLoad(() => {
  // 获取 EventChannel
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  eventChannel = currentPage.getOpenerEventChannel()

  // 监听发起页的事件
  eventChannel.on('init', (data: any) => {
    console.log('收到初始化:', data)
  })
})

async function handleUpdate() {
  await updateApi(/* ... */)
  // 通知发起页已更新
  eventChannel?.emit('updated')
}

async function handleDelete() {
  await deleteApi(/* ... */)
  // 通知发起页已删除
  eventChannel?.emit('deleted', route.query.id)
  router.back()
}
</script>
```

### 方案 2：全局状态（全导航方式）

适用场景：`replace` / `relaunch` 后需要通信，或跨多页面通信。

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
// 发起页
const commStore = useCommStore()
commStore.markRefresh('list') // 标记列表需要刷新
await router.replace({ name: 'detail' })

// 目标页 onShow
onShow(() => {
  if (commStore.consumeRefresh('list')) {
    fetchList()
  }
})
```

## TabBar 页面数据传递

由于 `switchTab` 不支持 query，TabBar 页面间传参需用全局状态。

### 方案：Pinia + onShow

```ts
// stores/tab.ts
import { defineStore } from 'pinia'

export const useTabStore = defineStore('tab', () => {
  const activeTab = ref('home')     // 当前激活的 Tab
  const tabParams = ref<Record<string, any>>({}) // 各 Tab 的参数

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
// 从普通页跳转到 TabBar 页面并传参
const tabStore = useTabStore()
tabStore.setTabParam('user', { scrollTarget: 'orders' })
await router.push({ name: 'user' }) // switchTab，无法用 query
```

```ts
// TabBar 页面 onShow 中读取参数
import { onShow } from '@dcloudio/uni-app'

const tabStore = useTabStore()

onShow(() => {
  router.syncRoute() // 同步路由状态

  const param = tabStore.getTabParam('user')
  if (param?.scrollTarget) {
    // 滚动到指定位置
    scrollTo(param.scrollTarget)
    tabStore.clearTabParam('user') // 消费后清理
  }
})
```

## 表单离开确认

防止用户误操作离开未保存的表单。

### 方案：守卫 + onBackPress

```ts
// composables/use-dirty-guard.ts
import { onBackPress, onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'
import { ref, type Ref } from 'vue'

export function useDirtyGuard(dirty: Ref<boolean>, onLeave?: () => void) {
  const router = useRouter()

  // 编程式导航的守卫（router.push / router.back 等）
  const guard = router.beforeEach((to, from, next) => {
    if (from.meta._dirty && dirty.value) {
      uni.showModal({
        title: '提示',
        content: '有未保存的修改，确认离开？',
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

  // App 端：物理返回键
  // #ifdef APP-PLUS
  onBackPress(() => {
    if (dirty.value) {
      uni.showModal({
        title: '提示',
        content: '有未保存的修改，确认离开？',
        success: (res) => {
          if (res.confirm) {
            dirty.value = false
            onLeave?.()
            router.back()
          }
        }
      })
      return true // 阻止默认返回
    }
    return false
  })
  // #endif

  // 全平台：onShow 同步状态（物理返回后同步）
  onShow(() => {
    router.syncRoute()
  })

  // 返回卸载函数，离开页面时移除守卫
  return guard
}
```

### 使用

```vue
<!-- pages/edit/edit.vue -->
<template>
  <input v-model="form.name" @input="dirty = true" />
  <button @click="handleSave">保存</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDirtyGuard } from '@/composables/use-dirty-guard'

const form = ref({ name: '' })
const dirty = ref(false)

useDirtyGuard(dirty, () => {
  // 离开时的清理逻辑
  console.log('用户确认离开')
})

async function handleSave() {
  await saveApi(form.value)
  dirty.value = false
  uni.showToast({ title: '保存成功' })
}
</script>
```

::: warning 物理返回键的限制
`onBackPress` 仅 App 端生效。H5 和小程序的物理返回无法拦截，只能通过 `onShow` + `syncRoute` 做事后处理。详见[平台兼容性](./compatibility)。
:::

## 数据预取

在导航前预取数据，提升用户体验。

### 方案：beforeResolve

```ts
// router/guards/preload.ts
import type { Router } from '@meng-xi/uni-router'

// 页面数据加载器映射
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
        uni.showLoading({ title: '加载中...' })
        await preloader(to)
        next()
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' })
        next(false) // 数据加载失败，中止导航
      } finally {
        uni.hideLoading()
      }
    } else {
      next()
    }
  })
}
```

### 带缓存的预取

```ts
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

export function setupCachedPreload(router: Router) {
  router.beforeResolve(async (to, from, next) => {
    const cacheKey = `${to.name}:${to.fullPath}`
    const cached = cache.get(cacheKey)

    // 缓存未过期，直接放行
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

## 页面标题自动设置

### 方案：afterEach

```ts
// router/guards/title.ts
export function setupTitleGuard(router: Router) {
  router.afterEach((to) => {
    const title = to.meta.title as string | undefined
    uni.setNavigationBarTitle({ title: title || '默认标题' })
  })
}
```

### 动态标题

```ts
// 路由配置中不设 title，在页面中动态设置
router.afterEach((to) => {
  // 根据路由参数动态生成标题
  if (to.name === 'detail') {
    const store = useDetailStore()
    const title = store.detail?.title || '详情'
    uni.setNavigationBarTitle({ title })
  } else if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

## 埋点统计

### 方案：afterEach + onRouteChange

```ts
// utils/analytics.ts
export function trackPageView(path: string, fromPath: string, synced: boolean) {
  // 上报埋点
  analytics.report({
    event: 'page_view',
    page_path: path,
    from_path: fromPath,
    is_synced: synced, // 是否为状态同步（物理返回等）
    timestamp: Date.now()
  })
}

// router/guards/analytics.ts
export function setupAnalyticsGuard(router: Router) {
  // 完整导航
  router.afterEach((to, from) => {
    trackPageView(to.path, from.path, false)
  })

  // 状态同步（物理返回等）
  router.onRouteChange((to, from) => {
    if (to._synced) {
      trackPageView(to.path, from.path, true)
    }
  })
}
```

## 维护模式

应用维护时，所有导航重定向到维护页。

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
      // 检查失败不阻断
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
    // 维护页本身放行
    if (to.name === 'maintenance') {
      next()
      return
    }

    // 维护模式，重定向到维护页
    if (appStore.maintenanceMode) {
      next({ name: 'maintenance' }, { mode: 'relaunch' })
      return
    }

    next()
  })

  // 定期检查维护状态
  setInterval(() => {
    appStore.checkMaintenance()
  }, 60 * 1000) // 每分钟检查一次
}
```

## 页面栈深度管理

防止小程序页面栈溢出（上限 10 层）。

### 封装安全导航

```ts
// composables/use-safe-nav.ts
import { useRouter } from '@meng-xi/uni-router'
import type { RouteLocationRaw } from '@meng-xi/uni-router'

const STACK_WARNING_THRESHOLD = 8 // 预留 2 层缓冲

export function useSafeNav() {
  const router = useRouter()

  /**
   * 安全 push：栈接近上限时自动改用 relaunch
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
   * 安全返回：栈不足时改用 relaunch 到首页
   */
  async function safeBack(delta = 1, fallback?: RouteLocationRaw) {
    const pages = getCurrentPages()
    if (pages.length - delta < 1) {
      // 栈不足，跳转到 fallback 或首页
      await router.relaunch(fallback || { name: 'home' })
    } else {
      await router.back(delta)
    }
  }

  return { safePush, safeBack }
}
```

### 使用

```ts
const { safePush, safeBack } = useSafeNav()

// 列表 → 详情 → 评论 → 回复（可能栈很深）
await safePush({ name: 'detail', query: { id: '1' } })
await safePush({ name: 'comment', query: { id: '1' } })
// 当栈接近上限时自动改用 relaunch

// 安全返回
await safeBack(2, { name: 'home' }) // 栈不足时回首页
```

## 完整守卫组装

将所有守卫组合到一起：

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
  guardTimeout: 15000 // 守卫中有网络请求，调大超时
})

// 按顺序注册守卫
setupMaintenanceGuard(router)  // 1. 维护模式（最先检查）
setupAuthGuard(router)         // 2. 登录认证
setupPermissionGuard(router)   // 3. 权限控制
setupPreloadGuard(router)      // 4. 数据预取（beforeResolve）
setupTitleGuard(router)        // 5. 标题设置（afterEach）
setupAnalyticsGuard(router)    // 6. 埋点（afterEach + onRouteChange）

export default router
```

::: tip 守卫注册顺序
守卫按注册顺序执行。建议：
1. 维护模式（最早拦截）
2. 登录认证
3. 权限控制
4. 数据预取（放 beforeResolve）
5. 后置处理（afterEach）
:::

## 路由模块化

大型项目将路由按模块拆分：

```
src/
├── router/
│   ├── index.ts          # 路由器实例 + 守卫组装
│   ├── routes.ts         # 汇总所有路由
│   └── guards/
│       ├── auth.ts
│       ├── permission.ts
│       └── ...
├── modules/
│   ├── user/
│   │   └── routes.ts     # 用户模块路由
│   ├── order/
│   │   └── routes.ts     # 订单模块路由
│   └── product/
│       └── routes.ts     # 商品模块路由
```

```ts
// modules/user/routes.ts
import type { RouteConfig } from '@meng-xi/uni-router'

export const userRoutes: RouteConfig[] = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true, title: '我的' } },
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
  { path: 'pages/index/index', name: 'home', meta: { isTab: true, title: '首页' } },
  { path: 'pages/login/login', name: 'login' },
  ...userRoutes,
  ...orderRoutes,
  ...productRoutes
]
```

## 下一步

- [常见问题](./faq) — 踩坑记录
- [平台兼容性](./compatibility) — 各平台限制
- [API 参考](../api/create-router) — 完整 API 文档
