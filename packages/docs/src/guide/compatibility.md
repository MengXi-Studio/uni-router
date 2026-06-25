# 平台兼容性

uni-app 是跨平台框架，支持 App、H5、各小程序平台。每个平台有不同的导航机制和限制。本章系统梳理这些限制，并说明 Uni Router 如何应对、以及你该如何编写跨平台代码。

## 平台概览

| 平台 | 路由模式 | 页面栈上限 | 动画 | 物理返回拦截 |
| --- | --- | --- | --- | --- |
| App（iOS/Android） | 原生页面栈 | 无硬限制（建议 ≤10） | ✅ 自定义 | ✅ `onBackPress` |
| H5 | History API | 无限制 | ❌ 系统控制 | ❌ `popstate` 只读 |
| 微信小程序 | 原生页面栈 | **10 层** | ❌ 系统控制 | ❌ 左上角返回 |
| 支付宝小程序 | 原生页面栈 | **10 层** | ❌ 系统控制 | ❌ 左上角返回 |
| 字节小程序 | 原生页面栈 | **10 层** | ❌ 系统控制 | ❌ 左上角返回 |
| 百度小程序 | 原生页面栈 | **10 层** | ❌ 系统控制 | ❌ 左上角返回 |
| QQ 小程序 | 原生页面栈 | **10 层** | ❌ 系统控制 | ❌ 左上角返回 |

::: warning 小程序页面栈上限
所有小程序平台页面栈上限为 **10 层**。超过后 `navigateTo` 会失败并报错。这是平台硬限制，Uni Router 无法突破。
:::

## 限制一：页面栈深度（小程序）

### 问题

小程序页面栈最多 10 层。连续 `push` 超过 10 次后，第 11 次会失败：

```
栈: [A, B, C, D, E, F, G, H, I, J]  (已满)
push(K) → uni.navigateTo 失败
→ Uni Router 抛出 NavigationFailure (NAVIGATION_API_ERROR)
```

### 应对方案

**方案 1：用 `relaunch` 重置栈**

```ts
// 当栈深度接近上限时，用 relaunch 重置
const pages = getCurrentPages()
if (pages.length >= 8) {
  // 栈快满了，用 relaunch 重置
  await router.relaunch({ name: 'target' })
} else {
  await router.push({ name: 'target' })
}
```

**方案 2：用 `replace` 替换而非入栈**

```ts
// 详情页之间切换用 replace，避免栈增长
await router.replace({ name: 'detail', query: { id: nextId } })
```

**方案 3：封装安全导航方法**

```ts
// utils/safe-navigate.ts
import { useRouter } from '@meng-xi/uni-router'

export function useSafePush() {
  const router = useRouter()

  return async function safePush(location: Parameters<typeof router.push>[0]) {
    const pages = getCurrentPages()
    if (pages.length >= 8) {
      // 栈接近上限，用 relaunch
      await router.relaunch(location)
    } else {
      await router.push(location)
    }
  }
}
```

## 限制二：switchTab 不支持 query

### 问题

`uni.switchTab` 由小程序规范决定，**不支持 URL 参数**。传入 query 会被忽略：

```ts
await router.push({ name: 'user', query: { tab: 'profile' } })
// meta.isTab: true → 走 uni.switchTab
// ⚠️ 警告: uni.switchTab does not support query parameters. They will be ignored.
// query 丢失，目标页面读不到 tab 参数
```

### 应对方案

**方案 1：用 `params` 传递（推荐）**

```ts
// params 通过内部 Map 存储，不依赖 URL
await router.push({ name: 'user', params: { tab: 'profile' } })

// 目标页面
const route = useRoute()
console.log(route.params.tab) // 'profile'
```

::: warning params 的局限
`params` 依赖 `__params_key` 注入到 URL query。但 `switchTab` 不支持 query，因此 **TabBar 页面实际上也无法接收 params**。

这是 uni-app 的硬限制。TabBar 页面间的数据传递需依赖全局状态（Pinia/Vuex）或 storage。
:::

**方案 2：全局状态管理**

```ts
// 用 Pinia 管理跨页面状态
const useTabStore = defineStore('tab', () => {
  const activeTab = ref('profile')
  return { activeTab }
})

// 导航前设置
const tabStore = useTabStore()
tabStore.activeTab = 'profile'
await router.push({ name: 'user' })

// TabBar 页面读取
const route = useRoute()
const tabStore = useTabStore()
console.log(tabStore.activeTab) // 'profile'
```

**方案 3：storage 传递**

```ts
// 导航前存入 storage
uni.setStorageSync('user_tab', 'profile')
await router.push({ name: 'user' })

// TabBar 页面读取
const tab = uni.getStorageSync('user_tab') || 'default'
```

## 限制三：reLaunch 不支持动画

### 问题

`uni.reLaunch` 会关闭所有页面，**不接受动画参数**：

```ts
await router.relaunch({ name: 'home', animation: { type: 'fade-in' } })
// ⚠️ 警告: uni.reLaunch does not support animation parameters. The animation option will be ignored.
```

### 原因

`reLaunch` 关闭所有页面后打开新页面，"从哪里动画进来"语义不明确，因此平台不支持。

### 应对

无需特殊处理，了解即可。如需动画效果，改用 `replace`（仅替换栈顶，支持动画）。

## 限制四：物理返回键无法拦截

### 问题

以下返回操作**不经过路由器**，守卫无法拦截：

| 平台 | 返回方式 |
| --- | --- |
| App（Android） | 物理返回键 |
| App（iOS） | 边缘滑动返回 |
| H5 | 浏览器后退按钮 |
| 小程序 | 左上角返回箭头、滑动返回 |

```
用户按返回键
  → uni-app 原生 navigateBack（不经过路由器）
  → router.currentRoute 仍是旧值（不同步）
  → afterEach 不触发
  → 守卫不执行
```

### 应对方案

**方案 1：App 端 `onBackPress`（仅 App）**

```ts
import { onBackPress } from '@dcloudio/uni-app'

onBackPress((options) => {
  // options.from: 'backbutton' | 'navigateBack'
  if (formDirty.value) {
    showConfirmDialog()
    return true // 阻止返回
  }
  return false // 允许返回
})
```

::: warning onBackPress 仅 App 端
`onBackPress` 只在 App 端生效。H5 和小程序无此生命周期。
:::

**方案 2：`onShow` + `syncRoute`（全平台）**

```ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onShow(() => {
  // 同步 currentRoute 为真实页面
  router.syncRoute()
})
```

调用 `syncRoute()` 后：
- `currentRoute` 更新为真实页面
- `onRouteChange` 监听器触发（`to._synced === true`）
- `afterEach` **不触发**（非完整导航）

**方案 3：`onRouteChange` 事后处理（全平台）**

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // 状态同步（可能是物理返回触发）
    console.log('用户可能通过物理返回回到了:', to.path)

    // 事后处理：更新标题、埋点等
    if (to.meta.title) {
      uni.setNavigationBarTitle({ title: to.meta.title as string })
    }
  }
})
```

### 封装通用返回处理

```ts
// composables/use-back-guard.ts
import { onShow } from '@dcloudio/uni-app'
import { onBackPress } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

export function useBackGuard(options: {
  dirty: () => boolean
  onConfirm?: () => void
}) {
  const router = useRouter()

  // App 端：拦截物理返回键
  // #ifdef APP-PLUS
  onBackPress(() => {
    if (options.dirty()) {
      uni.showModal({
        title: '提示',
        content: '有未保存的修改，确认离开？',
        success: (res) => {
          if (res.confirm) {
            options.onConfirm?.()
            router.back()
          }
        }
      })
      return true // 阻止本次返回
    }
    return false
  })
  // #endif

  // 全平台：onShow 同步状态
  onShow(() => {
    router.syncRoute()
  })
}
```

```ts
// 页面中使用
const dirty = ref(false)

useBackGuard({
  dirty: () => dirty.value,
  onConfirm: () => { /* 保存或清理 */ }
})
```

## 限制五：H5 路由模式

### 问题

H5 端 uni-app 使用 History API（`history.pushState`）。Uni Router 在 H5 上的行为：

- `push` → `history.pushState`（新增历史记录）
- `replace` → `history.replaceState`（替换当前记录）
- `relaunch` → 多次 `history.replaceState`（无法清空历史栈）
- `back` → `history.back()`

::: warning H5 无法真正"清栈"
H5 的 History API 不支持清空历史栈。`relaunch` 在 H5 上只能 `replace` 当前记录，**用户仍可通过浏览器后退回到之前的页面**。

如需在 H5 上实现"退出登录后无法返回"，需配合后端重定向或监听 `popstate` 重新鉴权。
:::

### H5 刷新问题

H5 刷新后页面栈丢失，`getCurrentPages()` 只返回当前页。此时：

- `back()` 可能失败（栈不足）→ 抛出 `NAVIGATION_CANCELLED`
- `params`（非持久化）丢失

**应对：params 持久化**

```ts
// 持久化 params，H5 刷新后仍可读取
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123 },
  persistent: true
})
```

或全局开启：

```ts
const router = createRouter({
  routes,
  paramsPersistent: true
})
```

## 限制六：导航动画仅 App 端

### 问题

`animation` 参数和 `meta.animation` **仅 App 端生效**。小程序和 H5 的导航动画由系统控制：

| 平台 | 动画 |
| --- | --- |
| App | ✅ 可自定义 `animationType` |
| H5 | ❌ 浏览器默认过渡（通常无动画） |
| 小程序 | ❌ 系统默认滑入动画 |

### 应对

无需特殊处理。传入 `animation` 在非 App 端会被静默忽略（不警告），不影响功能。

```ts
// 跨平台安全，App 端有动画，其他端无动画
await router.push({ name: 'about', animation: { type: 'slide-in-bottom' } })
```

## 限制七：TabBar 配置必须与 pages.json 一致

### 问题

`meta.isTab` 必须与 `pages.json` 的 `tabBar.list` 声明一致，否则导航行为异常：

```json
// pages.json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index" },
      { "pagePath": "pages/user/user" }
    ]
  }
}
```

```ts
// ✅ 正确：与 pages.json 一致
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// ❌ 错误：声明了 isTab 但 pages.json 没有 tabBar
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { isTab: true } }
]
// → uni.switchTab 会失败，因为该页面不是 TabBar 页面
```

### 应对

使用 `@meng-xi/vite-plugin` 的 `dts` 功能自动生成类型，减少手动配置错误。详见[自动生成路由类型](./auto-generate)。

## 限制八：不支持动态路由

### 问题

uni-app 页面路径在编译时由 `pages.json` 静态声明，**不支持运行时动态注册**：

```ts
// ❌ 不支持
router.addRoute({ path: '/dynamic', component: Dynamic })
router.removeRoute('dynamic')
```

也不支持 vue-router 的动态路径匹配：

```ts
// ❌ 不支持
{ path: '/user/:id' }  // uni-app 页面路径固定
```

### 应对

**传递参数用 query 或 params**

```ts
// ✅ 用 query 传递 ID
router.push({ name: 'user', query: { id: '123' } })

// ✅ 用 params 传递复杂数据
router.push({ name: 'user', params: { profile: { name: 'Tom' } } })
```

**条件渲染用页面内逻辑**

```ts
// 页面内根据参数渲染不同内容
const route = useRoute()
const userId = computed(() => route.query.id)
```

## 限制九：EventChannel 仅 push 可用

### 问题

`events` + `eventChannel` 页面通信机制依赖 `uni.navigateTo`，**仅 `push` 模式可用**：

```ts
// ✅ push 支持
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: { update(data) { /* ... */ } }
})

// ❌ replace/relaunch/back 不支持
await router.replace({ path: 'detail', events: {...} })
// ⚠️ 警告: uni.redirectTo does not support events. The events option will be ignored.
```

### 应对

如需在 `replace` / `relaunch` 后通信，使用全局状态或 storage：

```ts
// 用 Pinia 传递数据
const store = useDataStore()
store.pendingData = { message: 'hello' }
await router.replace({ name: 'detail' })

// 目标页面读取
const store = useDataStore()
console.log(store.pendingData) // { message: 'hello' }
```

## 限制十：冷启动绕过守卫

### 问题

当用户通过以下方式**直接进入**某个页面时，页面由 uni-app 框架直接加载，**不经过路由器导航**，守卫（`beforeEach` 等）未执行：

| 场景 | 平台 |
| --- | --- |
| 直接访问 URL | H5 |
| 扫码进入 / 场景值 | 小程序 |
| Deeplink / URL Scheme | App |

```
用户访问 https://example.com/#/pages/about/about
  → uni-app 直接加载 about 页（requireAuth: true）
  → 路由器守卫未执行
  → 未登录用户直接进入了受保护页面
```

### 原因

uni-app 的页面加载由框架在冷启动时直接完成，路由器（基于 `uni.navigateTo` 拦截）只能在后续的编程式导航中生效。冷启动页面加载不调用 `navigateTo`，因此拦截器和守卫均无法介入。

### 应对方案：guardRoute()

`router.guardRoute()` 对当前（或指定）路由补执行守卫链，按守卫结果决定是否重定向：

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
  router.isReady().then(() => {
    router.guardRoute(undefined, {
      onAbort: (failure) => {
        // 守卫中止（如未登录），跳转到安全页面
        console.warn('冷启动守卫中止:', failure.code)
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

守卫结果处理：

| 守卫结果 | 行为 |
| --- | --- |
| 放行（`next()`） | 不执行导航，resolve 目标路由 |
| 重定向（`next(location)`） | 按守卫指定的方式（默认 `relaunch`）跳转 |
| 中止（`next(false)`） | 调用 `onAbort` 回调，并 reject `NavigationFailure` |

::: warning 冷启动无法真正"阻止进入"
冷启动场景下页面已加载，`guardRoute()` 无法真正阻止页面显示。当守卫中止时，通过 `onAbort` 回调执行 `router.relaunch()` 跳转到安全页面是推荐的应对方式。
:::

详见 [Router 实例 - guardRoute()](../api/router-instance#guardroute) 和 [路由守卫 - 冷启动守卫检查](./guards#冷启动守卫检查)。

## 跨平台开发建议

### 1. 条件编译

针对平台差异使用 uni-app 的条件编译：

```ts
// #ifdef APP-PLUS
// 仅 App 端执行
onBackPress(() => { /* ... */ })
// #endif

// #ifdef H5
// 仅 H5 端执行
window.addEventListener('popstate', handlePopState)
// #endif

// #ifdef MP-WEIXIN
// 仅微信小程序执行
// #endif
```

### 2. 统一返回处理

```ts
// composables/use-page.ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

export function usePage() {
  const router = useRouter()

  // 全平台：onShow 同步状态
  onShow(() => {
    router.syncRoute()
  })

  return { router }
}
```

### 3. 安全的栈深度管理

```ts
// 封装安全导航，自动处理栈深度
export function useSafeNavigation() {
  const router = useRouter()

  const safePush = async (location: RouteLocationRaw) => {
    const pages = getCurrentPages()
    // #ifdef MP
    // 小程序：栈深度限制 10，预留 2 层缓冲
    if (pages.length >= 8) {
      await router.relaunch(location)
      return
    }
    // #endif
    await router.push(location)
  }

  return { safePush }
}
```

### 4. 平台能力检测

```ts
// 检测是否支持某特性
const supports = {
  animation: false, // 运行时判断
  backPress: false,
  eventChannel: true
}

// #ifdef APP-PLUS
supports.animation = true
supports.backPress = true
// #endif

// 根据能力选择策略
if (supports.animation) {
  await router.push({ name: 'about', animation: { type: 'fade-in' } })
} else {
  await router.push({ name: 'about' })
}
```

## 平台特性对照表

| 特性 | App | H5 | 微信小程序 | 支付宝小程序 | 字节小程序 |
| --- | --- | --- | --- | --- | --- |
| 页面栈上限 | 无硬限制 | 无限制 | 10 | 10 | 10 |
| 导航动画 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 物理返回拦截 | ✅ `onBackPress` | ❌ | ❌ | ❌ | ❌ |
| `switchTab` query | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reLaunch` 动画 | ❌ | ❌ | ❌ | ❌ | ❌ |
| EventChannel | ✅ | ✅ | ✅ | ⚠️ 部分 | ✅ |
| `params` 持久化 | ✅ storage | ✅ storage | ✅ storage | ✅ storage | ✅ storage |
| `onRouteChange` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 守卫拦截 | ✅ 编程式 | ✅ 编程式 | ✅ 编程式 | ✅ 编程式 | ✅ 编程式 |

::: tip 编程式导航
"编程式"指通过 `router.push()` / `router.back()` 等方法触发的导航。物理返回键、浏览器后退等非编程方式不经过路由器，守卫无法拦截。
:::

## 下一步

- [拦截器机制](./interceptor) — 拦截原生 API 统一守卫流程
- [实战指南](./recipes) — 跨平台完整方案
- [常见问题](./faq) — 踩坑记录
