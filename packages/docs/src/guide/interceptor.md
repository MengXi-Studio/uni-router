# 拦截器机制

Uni Router 提供可选的 `interceptUniApi` 选项，拦截 `uni.navigateTo` 等原生导航 API，将外部直接调用转由路由器处理。本章深入讲解拦截器的工作原理、适用场景和注意事项。

## 为什么需要拦截器

### 问题场景

未启用拦截器时，直接调用 uni 原生 API 会**绕过路由守卫**：

```ts
// 路由器配置了登录守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// ✅ 通过路由器调用 → 守卫生效
await router.push({ name: 'protected' })

// ❌ 直接调用 uni API → 守卫不生效，直接跳转
uni.navigateTo({ url: '/pages/protected/protected' })
```

这在团队协作中是个隐患：某个开发者可能习惯性使用 `uni.navigateTo`，导致守卫被绕过。

### 解决方案

启用 `interceptUniApi` 后，所有原生导航 API 调用都会被拦截并转由路由器处理：

```ts
const router = createRouter({
  routes,
  interceptUniApi: true // 启用拦截
})

// 现在两种方式等价，守卫都生效
await router.push({ name: 'protected' })
uni.navigateTo({ url: '/pages/protected/protected' }) // → 转由 router.push 处理
```

## 启用与配置

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true  // 默认 false
})
```

::: warning 默认关闭
`interceptUniApi` 默认为 `false`。这是为了渐进式采用——你可以先在不启用拦截器的情况下集成路由器，逐步将 `uni.navigateTo` 迁移为 `router.push`，确认无误后再启用拦截器作为"兜底"。
:::

## 拦截的 API

拦截器覆盖 5 个 uni 导航 API：

| uni API | 转发到 | 说明 |
| --- | --- | --- |
| `uni.navigateTo` | `router.push` | 入栈导航 |
| `uni.redirectTo` | `router.replace` | 替换导航 |
| `uni.switchTab` | `router.push` | TabBar 切换（路由器自动识别） |
| `uni.reLaunch` | `router.relaunch` | 重置导航 |
| `uni.navigateBack` | `router.back` | 返回导航 |

### 参数转换

拦截器会解析 uni API 的参数并转换为路由器接受的格式：

```ts
// uni.navigateTo({ url: '/pages/about/about?id=1', animationType: 'fade-in' })
// → router.push({ path: 'pages/about/about', query: { id: '1' }, animation: { type: 'fade-in' } })

// uni.navigateBack({ delta: 2, animationType: 'slide-out-right' })
// → router.back(2, { type: 'slide-out-right' })

// uni.navigateTo({ url: '/pages/detail/detail', events: { update: fn } })
// → router.push({ path: 'pages/detail/detail', events: { update: fn } })
```

## 工作原理

### uni.addInterceptor 机制

uni-app 提供 `uni.addInterceptor(api, interceptor)` API，可以在调用目标 API 前插入拦截逻辑：

```ts
uni.addInterceptor('navigateTo', {
  invoke(args) {
    // args 是调用参数
    // 返回 args → 放行原始调用
    // 返回 false → 阻止原始调用
    // 修改 args → 修改后放行
  }
})
```

Uni Router 利用此机制，在 `invoke` 中判断调用来源并决定是否放行。

### 调用来源区分

核心问题：路由器自身也会调用 `uni.navigateTo`（在 `executeNavigation` 阶段）。如何区分"路由器发起的调用"和"外部直接调用"？

**解决方案：计数器标记**

```ts
class InterceptorManager {
  private routerCallCount = 0

  // 路由器调用 uni API 前标记
  markRouterCall(): void {
    this.routerCallCount++
  }

  // 拦截器中检查
  isRouterCall(): boolean {
    if (this.routerCallCount > 0) {
      this.routerCallCount--
      return true // 路由器发起，放行
    }
    return false // 外部发起，拦截
  }
}
```

**流程对比**

```
路由器发起的调用:
  router.push() → executeNavigation → navigateTo()
    → markRouterCall() (count: 0 → 1)
    → uni.navigateTo()
      → 拦截器 invoke
        → isRouterCall() → true (count: 1 → 0)
        → 返回 args，放行
    → 实际执行 uni.navigateTo

外部直接调用:
  uni.navigateTo()
    → 拦截器 invoke
      → isRouterCall() → false (count: 0)
      → handleInterceptedNavigation() 转发到 router.push
      → 返回 false，阻止原始调用
```

::: tip 为何用计数器而非布尔值
并发导航时，可能连续多次 `markRouterCall()`。用计数器可以正确匹配每次调用，避免标记被错误消费。
:::

### 双重保险：清空 URL

```ts
invoke(args) {
  if (activeManager?.isRouterCall()) {
    return args // 路由器调用，放行
  }
  // 外部调用，转发到路由器
  const result = handleInterceptedNavigation(api, args)
  // 双重保险：清空 URL
  if ('url' in args) args.url = ''
  return result // 返回 false 阻止
}
```

部分低版本小程序基础库可能**忽略 `invoke` 返回的 `false`** 而继续执行原始 API。清空 `args.url` 作为双重保险，即使基础库忽略了返回值，空 URL 也会导致原始调用失败（不会跳转到错误页面）。

## 注意事项

### 1. success / fail 回调不触发

::: warning 回调丢失
启用拦截器后，直接调用 `uni.navigateTo()` 的 `success` / `fail` / `complete` 回调**不会被触发**。

因为原始调用被阻止（返回 `false`），转由路由器执行。路由器返回 Promise 而非回调。
:::

```ts
// ❌ success 不会触发
uni.navigateTo({
  url: '/pages/about/about',
  success: () => {
    console.log('不会执行')
  }
})

// ✅ 使用路由器的 Promise
await router.push({ name: 'about' })
console.log('导航完成')
```

### 2. 仅支持单实例

```ts
// ⚠️ 警告: Another router instance has already installed interceptors.
const router1 = createRouter({ routes: routes1, interceptUniApi: true })
const router2 = createRouter({ routes: routes2, interceptUniApi: true })
// router2 会替换 router1 的拦截器
```

拦截器是全局的（`uni.addInterceptor` 作用于全局），同一时刻只能有一个路由器实例启用拦截。通常一个应用只需一个路由器实例，这不是问题。

### 3. 平台支持

```ts
if (typeof uni.addInterceptor !== 'function') {
  console.warn('[uni-router] uni.addInterceptor is not available, interceptUniApi option will be ignored')
  return
}
```

`uni.addInterceptor` 在主流平台可用（App、H5、微信/支付宝/字节/百度/QQ 小程序）。极少数平台可能不支持，此时拦截器选项被静默忽略。

### 4. 不影响路由器内部调用

启用拦截器后，路由器自身的 `push` / `replace` / `relaunch` / `back` 仍正常工作，不会被重复拦截（通过 `markRouterCall` 标记区分）。

### 5. switchTab 的特殊处理

```ts
case 'switchTab': {
  const { path } = parseUniUrl(args.url || '')
  if (path) {
    router.push(path) // 转发到 push，路由器会根据 meta.isTab 自动选择 switchTab
  }
  break
}
```

外部调用 `uni.switchTab` 会被转发到 `router.push`。路由器会根据目标路由的 `meta.isTab` 自动选择 `switchTab`。

::: warning switchTab 的 query 丢失
`uni.switchTab` 本身不支持 query。拦截器解析 URL 时会提取 query，但由于最终仍走 `uni.switchTab`，query 会被忽略。这是 uni-app 的限制，非拦截器问题。
:::

#### H5 平台的差异化策略

::: danger 关键差异
上述「阻止 + 转发」逻辑**仅适用于小程序平台和 App 平台**。在 H5 平台下，`switchTab` 不能被同步阻止，否则会导致 TabBar 组件状态卡死。
:::

**问题现象**

在 H5 平台下，若拦截器对 `uni.switchTab` 返回 `false`（同步阻止），TabBar 组件内部的「切换中」状态无法被清除。表现为：

- 点击 TabBar 某个菜单后，**该菜单保持高亮**，其他菜单**无法再被点击**
- 后续点击事件被运行时直接忽略，应用陷入"假死"状态

**根本原因**

H5 平台的 TabBar 是运行时管理的组件，其切换流程依赖 `uni.switchTab` 调用的完整执行。同步阻止调用会打断组件内部状态机，导致「切换中」状态无法流转到「完成」状态。

> **关于 App 平台**：App 平台（含 App-vue 和 App-nvue）的业务代码运行在 jscore/v8 逻辑层，**不在 webview 中**，不存在 `window`/`document` 对象。其 TabBar 为原生组件，行为与小程序一致，走完整的「阻止 + 转发」流程，守卫正常生效。

**解决方案：放行 + 同步状态**

针对 H5 平台，拦截器采用差异化策略——不阻止原始调用，而在 `success` 回调中同步路由状态：

```ts
function handleWebSwitchTab(args: Record<string, any>): Record<string, any> {
  const router = activeManager?.getRouter()
  if (!router) return args

  // 包装 success 回调，在 switchTab 完成后同步路由状态
  const originalSuccess = args.success
  args.success = function (res: any) {
    router.syncRoute() // 同步路由状态，使 useRoute 等响应式 API 正常工作
    if (typeof originalSuccess === 'function') {
      originalSuccess(res)
    }
  }

  return args // 放行原始调用
}
```

平台检测通过 `window` / `document` 对象是否存在来识别 H5 平台：

```ts
function isWebPlatform(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
```

::: warning H5 平台的守卫限制
由于 H5 平台下 `switchTab` 调用被放行，**外部 `uni.switchTab` 不会经过前置守卫（beforeEach）**。这意味着：

- 通过 `uni.switchTab` 跳转的 TabBar 页面不会触发守卫的权限校验
- 若 TabBar 页面需要权限控制，应在页面 `onShow` 生命周期中处理

```ts
// TabBar 页面权限控制示例
onShow(() => {
  if (!isLoggedIn()) {
    router.replace({ name: 'login' })
  }
})
```

其他 API（`navigateTo` / `redirectTo` / `reLaunch` / `navigateBack`）在所有平台均走完整的拦截 + 守卫流程，不受此差异影响。
:::

## 何时启用

### 推荐启用的场景

- **团队协作**：多人开发，担心有人直接用 `uni.navigateTo` 绕过守卫
- **存量项目迁移**：已有大量 `uni.navigateTo` 调用，无法一次性迁移到 `router.push`
- **第三方库调用**：使用的第三方 UI 库内部调用了 `uni.navigateTo`

### 不需要启用的场景

- **新项目**：从一开始就统一使用 `router.push`
- **完全可控**：确认所有导航都通过路由器
- **避免回调丢失**：有大量依赖 `uni.navigateTo` 回调的旧代码

## 存量项目迁移策略

### 阶段一：集成路由器，不启用拦截

```ts
const router = createRouter({
  routes: [...]
  // interceptUniApi: false (默认)
})
```

逐步将 `uni.navigateTo` 迁移为 `router.push`：

```ts
// 旧代码
uni.navigateTo({ url: '/pages/about/about?id=1' })

// 迁移后
await router.push({ path: 'pages/about/about', query: { id: '1' } })
```

### 阶段二：启用拦截器作为兜底

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true // 启用，捕获遗漏的 uni API 调用
})
```

此时即使有遗漏的 `uni.navigateTo`，也会被拦截并转由路由器处理。

### 阶段三：处理回调迁移

将依赖回调的旧代码迁移为 Promise：

```ts
// 旧代码
uni.navigateTo({
  url: '/pages/about/about',
  success: () => { /* 导航后逻辑 */ },
  fail: (err) => { /* 错误处理 */ }
})

// 迁移后
try {
  await router.push({ name: 'about' })
  // 导航后逻辑
} catch (err) {
  // 错误处理
}
```

## 与守卫的协作

启用拦截器后，所有导航（无论通过路由器还是 uni API）都会经过守卫：

```
uni.navigateTo({ url: '/protected' })
  → 拦截器拦截
  → router.push({ path: 'protected' })
  → beforeEach 守卫
    → 未登录 → next({ name: 'login' })
  → 重定向到 login
```

这确保了守卫的**全局强制性**，无论导航来源如何。

## 拦截器的安装与卸载

### 安装

`interceptUniApi: true` 时，路由器构造函数中自动安装：

```ts
constructor(options: RouterOptions) {
  // ...
  if (this._interceptUniApi) {
    installInterceptors(this)
  }
}
```

### 卸载

`removeInterceptors()` 清除所有拦截器并释放路由器引用。通常在应用卸载时调用（如 HMR 热更新场景）：

```ts
// vite.config.ts 的 HMR 处理
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeInterceptors()
  })
}
```

::: tip HMR 场景
开发环境下热更新会重新创建路由器实例。如果不卸载旧拦截器，会导致警告"Another router instance has already installed interceptors"。在 `import.meta.hot.dispose` 中调用 `removeInterceptors()` 可避免。
:::

## 完整示例

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { isTab: true } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
    { path: 'pages/login/login', name: 'login' }
  ],
  interceptUniApi: true // 启用拦截
})

// 登录守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!uni.getStorageSync('token')
  if (to.meta.requireAuth && !isLoggedIn) {
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})

// 以下三种调用方式等价，守卫都生效
// 1. 路由器 API
await router.push({ name: 'about' })

// 2. uni.navigateTo（被拦截）
uni.navigateTo({ url: '/pages/about/about' })

// 3. RouterLink 组件
// <RouterLink to="pages/about/about">关于</RouterLink>
```

## 下一步

- [导航流程原理](./navigation-flow) — 拦截器在完整流程中的位置
- [平台兼容性](./compatibility) — 各平台限制
- [实战指南](./recipes) — 完整业务方案
