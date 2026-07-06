# 路由守卫

路由守卫是 Uni Router 的核心能力，允许在导航过程中插入自定义逻辑：鉴权、日志、数据预取、离开确认等。本章将深入讲解守卫的执行机制、`next()` 的所有行为、以及 v1.7.0 引入的可控重定向。

## 守卫全景

Uni Router 提供四种守卫，按执行顺序：

```
导航触发
  │
  ├─ 1. beforeEach        全局前置守卫（可多个）
  │     └─ 可中止 / 重定向 / 放行
  │
  ├─ 2. beforeEnter       路由独享守卫（配置在 RouteConfig）
  │     └─ 可中止 / 重定向 / 放行
  │
  ├─ 3. beforeResolve     全局解析守卫（可多个）
  │     └─ 可中止 / 重定向 / 放行
  │
  ├─ 4. uni 导航 API 调用  navigateTo / redirectTo / ...
  │
  └─ 5. afterEach         全局后置钩子（可多个）
        └─ 仅观察，无法改变导航结果
```

### 各守卫的定位

| 守卫 | 注册方式 | 典型场景 |
| --- | --- | --- |
| `beforeEach` | `router.beforeEach(fn)` | 登录鉴权、权限检查、全局日志 |
| `beforeEnter` | `RouteConfig.beforeEnter` | 某路由的专属校验（如需读取特定数据） |
| `beforeResolve` | `router.beforeResolve(fn)` | 数据预取完成后的最终确认 |
| `afterEach` | `router.afterEach(fn)` | 设置标题、埋点、清理状态 |

::: tip beforeResolve 的定位
`beforeResolve` 在 `beforeEnter` 之后执行，此时所有前置校验已通过。适合放"所有守卫都同意后"的最终逻辑，如确认数据已加载完毕。它与 `beforeEach` 的区别仅在于执行时机。
:::

## 注册守卫

### 全局守卫

```ts
const router = createRouter({ routes })

// 前置守卫
const removeBefore = router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// 解析守卫
router.beforeResolve(async (to, from, next) => {
  // 所有前置守卫通过后，预取数据
  if (to.name === 'detail') {
    await store.fetchDetail(to.query.id)
  }
  next()
})

// 后置钩子
router.afterEach((to, from) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})

// 移除守卫
removeBefore()
```

### 路由独享守卫

```ts
const routes = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    meta: { requireAdmin: true },
    beforeEnter: (to, from, next) => {
      if (user.role === 'admin') next()
      else next({ name: '403' })
    }
  },
  {
    path: 'pages/edit/edit',
    name: 'edit',
    // 支持数组形式
    beforeEnter: [
      checkAuth,
      checkPermission,
      checkLockStatus
    ]
  }
]
```

::: tip 守卫数组
`beforeEnter` 支持传入数组，按顺序执行。任一守卫中止或重定向，后续守卫不再执行。
:::

## next() 的所有行为

`next` 是守卫函数的第三个参数，**必须调用**以 resolve 守卫。它有三种行为：

### 1. 放行：`next()` 或 `next(undefined)`

```ts
router.beforeEach((to, from, next) => {
  next() // 放行，继续执行下一个守卫
})
```

### 2. 中止：`next(false)`

```ts
router.beforeEach((to, from, next) => {
  if (isOffline()) {
    uni.showToast({ title: '网络不可用', icon: 'none' })
    next(false) // 中止导航，停留在当前页
  } else {
    next()
  }
})
```

中止会抛出 `NavigationFailure`（`NAVIGATION_ABORTED`）。

### 3. 重定向：`next(location)`

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // 重定向到登录页，携带原目标用于登录后跳回
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

重定向会**重新触发完整的守卫链**（从 `beforeEach` 开始），并增加重定向深度计数。

## 可控重定向（v1.7.0+）

::: tip v1.7.0 新增
此功能在 v1.7.0 引入。之前的版本重定向方式固定为触发守卫的原始导航方式。
:::

### 默认重定向方式

不指定 `mode` 时，重定向沿用原始导航方式：

```ts
// 原始导航是 push
await router.push({ name: 'protected' })
// beforeEach 中 next({ name: 'login' })
// → 重定向用 push 方式（navigateTo）

// 原始导航是 replace
await router.replace({ name: 'protected' })
// beforeEach 中 next({ name: 'login' })
// → 重定向用 replace 方式（redirectTo）
```

::: warning back 的特殊情况
原始导航是 `back` 时，重定向无法用 `back`（目标不在页面栈中），自动回退为 `relaunch`。
:::

### 指定重定向方式

通过第二个参数 `options.mode` 显式指定：

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // 登录页用 replace，避免用户返回到受保护页面的中间状态
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

### mode 选项

```ts
type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

| mode | 对应 uni API | 适用场景 |
| --- | --- | --- |
| `'push'` | `navigateTo` | 登录后需返回原页面 |
| `'replace'` | `redirectTo` | 替换当前页，不留历史 |
| `'relaunch'` | `reLaunch` | 清空栈（如权限不足时回到首页） |

### 实战：登录重定向方式选择

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    if (from.name === 'login') {
      // 已在登录页还无权限，用 replace 避免栈堆积
      next(false)
    } else {
      // 用 replace 跳登录页，登录成功后 replace 回目标页
      // 这样用户不会返回到"未登录的中间态"
      next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
    }
  } else {
    next()
  }
})

// 登录成功后
async function onLoginSuccess(redirect: string) {
  // 用 replace 回到原页面，避免登录页留在栈中
  await router.replace(redirect)
}
```

### 实战：权限不足清栈

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    // 权限不足，清空栈回到首页
    next({ name: 'home' }, { mode: 'relaunch' })
  } else {
    next()
  }
})
```

## 异步守卫

守卫支持 `async` 函数和返回 Promise：

```ts
router.beforeEach(async (to, from, next) => {
  // 异步校验 token 有效性
  const valid = await checkToken()
  if (!valid) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

### Promise resolve 自动放行

如果守卫是 async 函数且 Promise resolve 时**未调用 next**，会自动放行：

```ts
router.beforeEach(async (to, from, next) => {
  await preloadData(to)
  // 未调用 next，但 Promise resolve → 自动 next()
})
```

::: warning 建议显式调用 next
虽然自动放行很方便，但显式调用 `next()` 可读性更好，且能在复杂逻辑中避免歧义。
:::

### Promise reject 中止导航

```ts
router.beforeEach(async (to, from, next) => {
  try {
    await fetchUserProfile()
    next()
  } catch (err) {
    // reject 会中止导航（NAVIGATION_CANCELLED）
    throw err
  }
})
```

::: warning reject vs next(false)
- `next(false)` → `NAVIGATION_ABORTED`（用户主动中止）
- `throw` / `reject` → `NAVIGATION_CANCELLED`（异常导致取消）

建议用 `next(false)` 表达"主动中止"，用异常表达"意外错误"。
:::

## 超时保护

守卫可能因异步操作卡住（如网络请求无响应）。Uni Router 提供超时保护：

```ts
const router = createRouter({
  routes,
  guardTimeout: 10000 // 默认 10 秒
})
```

```
守卫执行
  → 10 秒内未调用 next() 也未 resolve/reject
  → 输出警告: "Navigation guard did not resolve within 10s"
  → 自动中止导航 (NAVIGATION_CANCELLED)
```

::: tip 调整超时
守卫中有耗时请求时调大超时：

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 秒
})
```

设为 `0` 可禁用超时保护（不推荐，可能导致导航永久挂起）。
:::

## 守卫执行细节

### 执行顺序

同一类型的多个守卫按注册顺序执行：

```ts
router.beforeEach(guard1) // 先执行
router.beforeEach(guard2) // 后执行
router.beforeEach(guard3) // 最后执行
```

```
guard1 → guard2 → guard3 → beforeEnter → beforeResolve1 → beforeResolve2 → API
```

### 中止/重定向的短路效应

任一守卫中止或重定向，**后续守卫不再执行**：

```ts
router.beforeEach((to, from, next) => {
  next(false) // 中止
})

router.beforeEach((to, from, next) => {
  console.log('不会执行')
  next()
})
```

### 重定向重新触发守卫链

```ts
router.beforeEach((to, from, next) => {
  if (to.name === 'a') {
    next({ name: 'b' }) // 重定向到 b
    return
  }
  next()
})

router.beforeEach((to, from, next) => {
  // 重定向到 b 时，此守卫会再次执行
  console.log(to.name) // 'b'
  next()
})
```

```
push(a) → beforeEach[1] 重定向到 b
        → beforeEach[1] 再次执行（to=b）→ 放行
        → beforeEach[2] 执行（to=b）→ 放行
        → ... → navigateTo(b)
```

::: warning 避免无限重定向
重定向深度上限为 10。A→B→A→B... 循环会在第 10 次后抛出 `NAVIGATION_CANCELLED`。务必在重定向条件中加入终止判断。
:::

## afterEach 后置钩子

`afterEach` 在导航完成后执行，**无法改变导航结果**（不接受 `next` 参数）：

```ts
router.afterEach((to, from) => {
  // 设置页面标题
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }

  // 埋点
  trackPageView(to.path, from.path)
})
```

### afterEach 不触发的场景

::: warning 状态同步不触发 afterEach
`afterEach` 仅在**完整导航**（经过前置守卫）完成后触发。以下场景**不触发** `afterEach`：

1. `syncRoute()` / `syncCurrentRoute()` 的状态同步
2. 物理返回键、浏览器后退（不经过路由器）

如需监听所有路由变化（包括状态同步），使用 `onRouteChange`。
:::

```ts
router.onRouteChange((to, from) => {
  // 完整导航和状态同步都会触发
  if (to._synced) {
    console.log('状态同步（非完整导航）')
  }
})
```

## 实战模式

### 模式 1：登录鉴权

```ts
// 全局前置守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // 未登录 → 跳登录页，replace 避免返回到受保护页
    next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
  } else if (to.name === 'login' && isLoggedIn) {
    // 已登录访问登录页 → 跳首页
    next({ name: 'home' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

### 模式 2：权限控制

```ts
// 扩展 RouteMeta
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

router.beforeEach((to, from, next) => {
  const userRoles = getUserRoles()

  if (to.meta.roles && !to.meta.roles.some(r => userRoles.includes(r))) {
    // 权限不足 → 清栈回首页
    next({ name: 'home' }, { mode: 'relaunch' })
  } else {
    next()
  }
})
```

### 模式 3：离开确认

```ts
// 标记页面为"脏"状态
const routes = [
  {
    path: 'pages/edit/edit',
    name: 'edit',
    meta: { dirty: false } // 运行时动态修改
  }
]

router.beforeEach((to, from, next) => {
  if (from.meta.dirty) {
    uni.showModal({
      title: '提示',
      content: '有未保存的修改，确认离开？',
      success: (res) => {
        if (res.confirm) {
          from.meta.dirty = false // 重置
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
```

### 模式 4：数据预取

```ts
// beforeResolve 中预取（所有前置校验已通过）
router.beforeResolve(async (to, from, next) => {
  try {
    switch (to.name) {
      case 'detail':
        await store.fetchDetail(to.query.id)
        break
      case 'list':
        await store.fetchList(to.queryInt('page', 1))
        break
    }
    next()
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
    next(false) // 数据加载失败，中止导航
  }
})
```

### 模式 5：页面标题自动设置

```ts
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    uni.setNavigationBarTitle({ title })
  } else {
    uni.setNavigationBarTitle({ title: '默认标题' })
  }
})
```

### 模式 6：路由级独享校验

```ts
const routes = [
  {
    path: 'pages/order/order',
    name: 'order',
    beforeEnter: [
      // 必须先选择地址
      (to, from, next) => {
        if (!store.selectedAddress) {
          uni.showToast({ title: '请先选择地址', icon: 'none' })
          next(false)
        } else {
          next()
        }
      },
      // 必须有商品
      (to, from, next) => {
        if (store.cart.length === 0) {
          next({ name: 'cart' })
        } else {
          next()
        }
      }
    ]
  }
]
```

## 守卫与物理返回键

::: warning 核心限制
物理返回键、浏览器后退、小程序左上角返回**不经过路由器**，守卫无法拦截。

这是 uni-app 框架的固有限制，非本库不足。
:::

### 应对方案

**方案 1：App 端监听 onBackPress**

```ts
// 仅 App 端生效
onBackPress((options) => {
  if (pageState.dirty) {
    showConfirmDialog()
    return true // 阻止默认返回
  }
  return false // 允许返回
})
```

**方案 2：onShow 自动同步状态**

路由器在 `install()` 时已注册全局 mixin，会在每个页面 `onShow` 自动调用 `router.syncRoute()` 同步 `currentRoute` 为真实页面，**无需手动调用**：

```ts
// 路由器内部已注册：
// app.mixin({ onShow() { router.syncRoute() } })

// 因此你的页面中通常无需手动同步，直接在 onShow / onRouteChange 中读取即可
import { onShow } from '@dcloudio/uni-app'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

onShow(() => {
  // currentRoute 已被 mixin 自动同步
  console.log(route.value.path, route.value.params)
})
```

如需在 `onLoad`（早于 `onShow`）中读取路由信息，可手动调用一次 `router.syncRoute()`。

**方案 3：onRouteChange 事后处理**

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // 状态同步（可能是物理返回触发）
    handleBackNavigation(to, from)
  }
})
```

详见[平台兼容性](./compatibility)。

## 冷启动守卫检查

### 问题：冷启动绕过守卫

当用户通过以下方式**直接进入**某个页面时，页面由 uni-app 框架直接加载，**不经过路由器导航**，守卫（`beforeEach` 等）未执行：

| 场景 | 平台 |
| --- | --- |
| 直接访问 URL | H5 |
| 扫码进入 / 场景值 | 小程序 |
| Deeplink / URL Scheme | App |

```
用户访问 https://example.com/#/pages/about/about
  → uni-app 直接加载 about 页
  → 路由器守卫未执行（未经过 router.push）
  → 未登录用户直接进入了 requireAuth 页面
```

### 解决方案：guardRoute()

`router.guardRoute()` 对当前（或指定）路由补执行守卫链，按守卫结果决定是否重定向：

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch((options) => {
  router.isReady().then(() => {
    // onLaunch 时页面栈可能为空（Page.onLoad 尚未触发），currentRoute 仍是 START_LOCATION。
    // 优先从 launch options.path 获取真实入口路径传给 guardRoute，确保守卫校验的是实际页面。
    const launchPath = options?.path ? `/${options.path}` : undefined
    router.guardRoute(launchPath, {
      onAbort: (failure) => {
        // 守卫中止（如未登录），跳转到安全页面
        console.warn('冷启动守卫中止:', failure.code)
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

::: warning 必须传入 options.path
`onLaunch` 触发时页面栈为空，`router.currentRoute` 仍是 `START_LOCATION`（path 为 `/`）。若调用 `guardRoute(undefined)`，守卫会校验 `/` 而非真实入口页面，导致基于 `to.path` / `to.name` / `to.meta` 的守卫逻辑失效。

`options.path` 由 uni-app 框架在 `onLaunch` 时传入（不含前导 `/`，需手动补全），各端均可用。
:::

### 守卫结果处理

| 守卫结果 | 行为 |
| --- | --- |
| 放行（`next()`） | 不执行导航，resolve 目标路由 |
| 重定向（`next(location)`） | 按守卫指定的方式（默认 `relaunch`）跳转到重定向目标 |
| 中止（`next(false)`） | 调用 `onAbort` 回调，并 reject `NavigationFailure` |

::: warning 冷启动无法真正"阻止进入"
冷启动场景下页面已加载，`guardRoute()` 无法真正阻止页面显示。当守卫中止时，通过 `onAbort` 回调执行 `router.relaunch()` 跳转到安全页面是推荐的应对方式。
:::

### 与 syncRoute 的区别

| 方法 | 作用 | 执行守卫 |
| --- | --- | --- |
| `syncRoute()` | 同步 `currentRoute` 为真实页面栈状态 | 否 |
| `guardRoute()` | 对当前路由补执行守卫链 | 是 |

两者可配合使用：

- `syncRoute`：物理返回后的状态同步
- `guardRoute`：冷启动时的守卫补执行

详见 [Router 实例 - guardRoute()](../api/router-instance#guardroute)。

## 守卫类型定义

```ts
// 前置守卫
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  next: NavigationGuardNext
) => void | Promise<void>

// next 回调
type NavigationGuardNext = (
  to?: RouteLocationRaw | false,
  options?: NavigationGuardNextOptions
) => void

// next 选项
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode // 'push' | 'replace' | 'relaunch'
}

// 后置钩子
type PostNavigationGuard = (
  to: RouteLocation,
  from: RouteLocation
) => void
```

## 最佳实践

### 1. 守卫职责单一

```ts
// ✅ 每个守卫只做一件事
router.beforeEach(checkAuth)
router.beforeEach(checkPermission)
router.beforeEach(checkMaintenance)

// ❌ 一个守卫做所有事
router.beforeEach((to, from, next) => {
  // 100 行混合逻辑...
})
```

### 2. 显式调用 next

```ts
// ✅ 清晰
router.beforeEach(async (to, from, next) => {
  const ok = await check()
  next(ok ? undefined : { name: 'login' })
})

// ⚠️ 依赖自动放行，可读性差
router.beforeEach(async (to, from) => {
  await check()
})
```

### 3. 重定向加终止条件

```ts
// ✅ 避免循环
router.beforeEach((to, from, next) => {
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }) // 已登录访问登录页 → 跳首页
  } else if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }) // 未登录访问受保护页 → 跳登录页
  } else {
    next()
  }
})
```

### 4. 数据预取放 beforeResolve

```ts
// ✅ 前置校验通过后再预取
router.beforeResolve(async (to, from, next) => {
  await preloadData(to)
  next()
})

// ❌ 放 beforeEach 会阻塞其他守卫
```

## 下一步

- [导航流程原理](./navigation-flow) — 守卫在完整流程中的位置
- [实战指南](./recipes) — 完整业务方案
- [拦截器机制](./interceptor) — 拦截原生 API 的原理
