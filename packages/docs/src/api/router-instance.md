# Router 实例

`createRouter()` 返回的路由器实例，提供路由导航、守卫注册和状态查询能力。本章列出所有可用的属性和方法。

## 属性

### currentRoute

- **类型**: `Readonly<RouteLocation>`
- **说明**: 当前路由位置（只读）。反映路由器当前所处的路由状态

```ts
router.currentRoute.path       // '/pages/about/about'
router.currentRoute.query      // { id: '1' }
router.currentRoute.params     // { info: {...} }
router.currentRoute.meta       // { title: '关于', requireAuth: true }
router.currentRoute.fullPath   // '/pages/about/about?id=1'
router.currentRoute.name       // 'about'
```

::: warning 非实时同步
`currentRoute` 在物理返回键、浏览器后退时**不会自动更新**（这些操作不经过路由器）。需在页面 `onShow` 中调用 `syncRoute()` 同步状态。详见 [syncRoute()](#syncroute)。
:::

## 导航方法

### push()

导航到新页面，向页面栈压入新页面。

```ts
push(location: RouteLocationRaw): Promise<NavigationResult>
```

- 普通页面 → `uni.navigateTo`
- TabBar 页面（`meta.isTab: true`）→ `uni.switchTab`
- 重复导航（路径、名称、查询参数均相同）时抛出 `NAVIGATION_DUPLICATED`
- 返回 `NavigationResult`（继承自 `RouteLocation`），包含可选的 `eventChannel` 用于页面间通信

```ts
// 路径字符串
await router.push('pages/about/about')

// 路径对象 + 查询参数
await router.push({ path: 'pages/about/about', query: { id: '1' } })

// 命名路由（推荐）
await router.push({ name: 'about', query: { id: '1' } })

// 使用 params 传递复杂数据
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123, info: { name: 'Tom' } }
})

// 使用 EventChannel 进行页面间通信
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: {
    update(data) { console.log('收到更新:', data) }
  }
})
eventChannel.emit('init', { message: '初始化数据' })
```

::: info NavigationResult 向后兼容
`NavigationResult` 继承自 `RouteLocation`，原有代码 `const route = await router.push(...)` 无需修改。`eventChannel` 仅在 `push` 模式下可用，`replace` / `relaunch` 返回的 `eventChannel` 为 `undefined`。
:::

::: warning TabBar 页面限制
当目标路由 `meta.isTab: true` 时，`push` 改用 `uni.switchTab`，此时 `query` / `animation` / `events` 均被忽略。如需向 TabBar 页面传参，使用 `params`。
:::

详见[路由导航](../guide/navigation#push-入栈导航)。

### replace()

替换当前页面，不增加栈深度。常用于登录后替换登录页、表单提交后替换表单页。

```ts
replace(location: RouteLocationRaw): Promise<RouteLocation>
```

- 普通页面 → `uni.redirectTo`
- TabBar 页面 → `uni.switchTab`
- **不检测重复导航**（可替换到当前页，用于刷新）
- 不返回 `eventChannel`

```ts
// 登录成功后替换登录页
await router.replace({ name: 'home' })

// 表单提交后替换为详情页
await router.replace({ path: 'pages/detail/detail', query: { id: result.id } })
```

::: tip 何时用 replace 而非 push
- 登录成功后：避免登录页留在栈中
- 表单提交后：避免用户返回到表单页重复提交
- 重定向场景：守卫中 `next(location, { mode: 'replace' })`
:::

### relaunch()

关闭所有页面并打开目标页面，重置整个页面栈。

```ts
relaunch(location: RouteLocationRaw): Promise<RouteLocation>
```

- 普通页面 → `uni.reLaunch`
- TabBar 页面 → `uni.switchTab`
- **不进行重复导航检测**（清栈场景下目标页面可能就是当前页面）
- `uni.reLaunch` 不支持动画参数，传入时将输出警告

```ts
// 退出登录
await router.relaunch({ name: 'login' })

// 从深层页面返回首页
await router.relaunch({ name: 'home' })

// 带重定向参数
await router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: tip 何时用 relaunch
- 退出登录：清空所有页面，用户无法返回受保护页面
- 从深层页面回首页：避免多次 `back()`，体验更好
- 权限不足：清栈回到首页，避免用户返回无权限页面
:::

### back()

返回上一页或多级页面，是唯一执行完整守卫链的"后退"操作。

```ts
back(delta?: number, animation?: NavigationAnimation): Promise<RouteLocation>
```

- **delta**: 返回的页面数，默认为 `1`
- **animation**: 导航动画（仅 App 端生效），覆盖 `meta.animation`。未指定时使用目标页面的 `meta.animation`
- 执行 `beforeEach` → `beforeResolve` 守卫链，守卫可中止或重定向返回操作
- 页面栈不足时抛出 `NavigationFailure`（`NAVIGATION_CANCELLED`）
- 守卫中止时抛出 `NavigationFailure`
- 返回同步后的当前路由位置，调用者可获取返回到的目标页面信息

```ts
// 返回上一页
await router.back()

// 返回两级
await router.back(2)

// 自定义动画
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

::: warning 物理返回键无法拦截
`back()` 仅拦截**编程式**调用。物理返回键（Android）、浏览器后退（H5）、小程序左上角返回**直接触发原生 `navigateBack`**，不经过路由器，守卫无法拦截。

应对方案：
1. 在页面 `onShow` 中调用 `router.syncRoute()` 同步状态
2. 在 `onRouteChange` 中做事后处理
3. App 端可监听 `onBackPress` 拦截物理返回键
:::

## 守卫注册方法

### beforeEach()

注册全局前置守卫，在每次导航前执行。

```ts
beforeEach(guard: NavigationGuard): () => void
```

- **返回值**: 用于移除此守卫的函数

```ts
const remove = router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// 需要时移除
remove()
```

::: tip 守卫执行顺序
同一类型的多个守卫按**注册顺序**执行。任一守卫中止或重定向，后续守卫不再执行。
:::

详见[路由守卫](../guide/guards)。

### beforeResolve()

注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行。

```ts
beforeResolve(guard: NavigationGuard): () => void
```

```ts
router.beforeResolve(async (to, from, next) => {
  // 所有前置校验已通过，可安全预取数据
  if (to.name === 'detail') {
    await store.fetchDetail(to.query.id)
  }
  next()
})
```

::: tip beforeResolve vs beforeEach
`beforeResolve` 在 `beforeEach` 和 `beforeEnter` 之后执行，适合放"所有守卫都同意后"的最终逻辑，如数据预取。它与 `beforeEach` 的区别仅在于执行时机。
:::

### afterEach()

注册全局后置钩子，在导航完成后执行。

```ts
afterEach(guard: PostNavigationGuard): () => void
```

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

::: warning afterEach 不触发的场景
`afterEach` 仅在**完整导航**（经过前置守卫）完成后触发。以下场景**不触发** `afterEach`：

1. `syncRoute()` / `syncCurrentRoute()` 的状态同步
2. 物理返回键、浏览器后退（不经过路由器）

如需监听所有路由变化（包括状态同步），使用 [`onRouteChange()`](#onroutechange)。
:::

## 路由查询方法

### getRoutes()

获取所有已注册的路由配置列表。

```ts
getRoutes(): RouteConfig[]
```

- **返回值**: 路由配置数组的浅拷贝

```ts
const routes = router.getRoutes()
console.log(routes.map(r => r.name))
// ['home', 'about', 'user', 'login']
```

### hasRoute()

检查是否存在指定名称的路由。

```ts
hasRoute(name: string): boolean
```

```ts
if (router.hasRoute('admin')) {
  await router.push({ name: 'admin' })
} else {
  uni.showToast({ title: '页面不存在', icon: 'none' })
}
```

### resolve()

解析路由位置为完整的 `RouteLocation` 对象，**不执行导航**。

```ts
resolve(location: RouteLocationRaw): RouteLocation
```

```ts
// 解析命名路由
const location = router.resolve({ name: 'about', query: { id: '1' } })
console.log(location.fullPath) // '/pages/about/about?id=1'
console.log(location.path)     // '/pages/about/about'
console.log(location.meta)     // { requireAuth: true }

// 解析路径字符串
const loc = router.resolve('pages/about/about?id=1&tab=info')
console.log(loc.query) // { id: '1', tab: 'info' }
```

::: tip 用途
- 生成导航 URL（用于 `<navigator>` 组件或分享链接）
- 在不导航的情况下检查路由是否存在
- 获取路由的 meta 信息
:::

## 状态与生命周期

### isReady()

等待路由器初始化完成。

```ts
isReady(): Promise<void>
```

```ts
// 在需要确保路由器就绪的场景
await router.isReady()
console.log(router.currentRoute.path)
```

::: tip 就绪时机
路由器在 `app.use(router)` 安装时标记为就绪，因此 `isReady()` 的回调在所有插件安装完成后执行，可安全使用已安装的插件（如 Pinia）。
:::

::: warning 超时保护
当配置了 `readyTimeout`（非 0）时，若路由器在超时时间内未完成初始化，此 Promise 将被 reject，防止永久挂起。
:::

### onRouteChange()

注册路由变化监听器，订阅路由状态变化。

```ts
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void
```

- **返回值**: 用于移除此监听器的函数

当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。与 `afterEach` 不同，此方法用于订阅路由状态变化，**不参与导航流程控制**。

```ts
const remove = router.onRouteChange((to, from) => {
  console.log('路由变化:', from.path, '→', to.path)

  // 可通过 to._synced 区分完整导航和状态同步
  if (to._synced) {
    console.log('状态同步（非完整导航，可能是物理返回）')
    handleBackNavigation(to, from)
  } else {
    console.log('完整导航')
    trackPageView(to.path)
  }
})

// 需要时移除
remove()
```

::: tip onRouteChange vs afterEach
| 场景 | `afterEach` | `onRouteChange` |
| --- | --- | --- |
| 完整导航（`push` / `replace` 等） | ✅ 触发 | ✅ 触发 |
| `syncRoute()` 状态同步 | ❌ 不触发 | ✅ 触发 |
| 物理返回键后 `onShow` 中 `syncRoute()` | ❌ 不触发 | ✅ 触发 |
| 参与导航控制（可中止） | ✅ | ❌ |

如需监听**所有**路由变化（包括物理返回），使用 `onRouteChange`。
:::

### onError()

注册路由错误处理回调。

```ts
onError(handler: RouterOnError): () => void
```

```ts
router.onError((error, to, from) => {
  console.error(error.code, error.message)

  // 根据错误码处理
  switch (error.code) {
    case 'NAVIGATION_ABORTED':
      // 守卫中止，通常无需处理
      break
    case 'NAVIGATION_DUPLICATED':
      // 重复导航，忽略
      break
    case 'NAVIGATION_API_ERROR':
      uni.showToast({ title: '导航失败', icon: 'none' })
      console.error('原始错误:', error.cause)
      break
  }
})
```

::: tip 全局错误处理
`onError` 捕获所有导航过程中的错误，包括守卫异常、API 调用失败等。建议在生产环境注册全局错误处理，用于日志上报。
:::

### syncRoute()

同步路由状态与实际页面栈。

```ts
syncRoute(): void
```

当页面通过浏览器后退、物理返回键等非路由器方式切换时，路由器的 `currentRoute` 可能与实际页面不同步。调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。

```ts
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// 建议在每个页面的 onShow 中调用
onShow(() => {
  router.syncRoute()
})
```

::: warning 必须手动同步的场景
以下场景 `currentRoute` 不会自动更新，**必须**调用 `syncRoute()` 同步：

1. **物理返回键**（Android / App）
2. **浏览器后退**（H5）
3. **小程序左上角返回**
4. **`uni.navigateBack` 直接调用**（未启用 `interceptUniApi` 时）

未同步会导致 `currentRoute` 与实际页面不一致，`useRoute()` 返回旧值。
:::

## 安装方法

### install()

安装路由器到 Vue 应用实例（由 `app.use(router)` 内部调用，通常无需手动调用）。

```ts
install(app: App): void
```

安装时会注册以下内容：

- **`$router`** — 全局属性，可通过 `this.$router` 访问路由器实例
- **`$route`** — 全局属性（计算属性），可通过 `this.$route` 访问当前路由位置
- **provide** — 通过 `provide(ROUTER_SYMBOL, router)` 注入路由器实例，使 `useRouter()` / `useRoute()` 可用
- **markReady** — 标记路由器为就绪状态，所有等待中的 `isReady()` Promise 将被 resolve

## 方法总览

| 方法 | 用途 | 返回值 |
| --- | --- | --- |
| `push()` | 入栈导航 | `Promise<NavigationResult>` |
| `replace()` | 替换当前页 | `Promise<RouteLocation>` |
| `relaunch()` | 清栈后入栈 | `Promise<RouteLocation>` |
| `back()` | 返回上一页 | `Promise<RouteLocation>` |
| `beforeEach()` | 注册前置守卫 | 移除函数 |
| `beforeResolve()` | 注册解析守卫 | 移除函数 |
| `afterEach()` | 注册后置钩子 | 移除函数 |
| `getRoutes()` | 获取所有路由 | `RouteConfig[]` |
| `hasRoute()` | 检查路由存在 | `boolean` |
| `resolve()` | 解析路由位置 | `RouteLocation` |
| `isReady()` | 等待就绪 | `Promise<void>` |
| `onRouteChange()` | 监听路由变化 | 移除函数 |
| `onError()` | 注册错误处理 | 移除函数 |
| `syncRoute()` | 同步状态 | `void` |
| `install()` | 安装到 Vue | `void` |

## 下一步

- [useRouter()](./use-router) — 在组件中获取路由器实例
- [路由导航](../guide/navigation) — 四种导航方式的深入讲解
- [路由守卫](../guide/guards) — 守卫机制与实战模式
