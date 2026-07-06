# 导航流程原理

理解导航的完整流程，有助于你编写更可靠的守卫、排查导航异常、以及理解 Uni Router 的设计决策。本章从源码角度剖析从调用 `push()` 到页面展示的全过程。

## 完整流程图

以 `router.push({ name: 'about' })` 为例，完整流程如下：

```
router.push({ name: 'about' })
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 1. performNavigation()                                  │
│    ├─ 等待 pendingNavigation（并发排队）                  │
│    ├─ enrichLocationWithParams() 处理 params             │
│    ├─ matcher.resolve() 解析为 RouteLocation             │
│    ├─ extractAnimation() / extractEvents() 提取选项       │
│    ├─ 重复导航检测（仅 push）                              │
│    └─ 设置 pendingNavigation                             │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. executeNavigation(to, from, mode, depth=0)           │
│    ├─ 重定向深度检查（>10 则取消）                         │
│    ├─ 获取 RouteConfig                                  │
│    │                                                    │
│    ├─ 2.1 runBeforeGuards()                             │
│    │      └─ 依次执行 beforeEach 守卫                    │
│    │           ├─ next() → 继续                          │
│    │           ├─ next(false) → 中止 (ABORTED)           │
│    │           ├─ next(location) → 重定向                │
│    │           └─ 超时/异常 → 取消 (CANCELLED)            │
│    │                                                    │
│    ├─ 2.2 runBeforeEnterGuards()                        │
│    │      └─ 执行 RouteConfig.beforeEnter               │
│    │                                                    │
│    ├─ 2.3 runBeforeResolveGuards()                      │
│    │      └─ 依次执行 beforeResolve 守卫                  │
│    │                                                    │
│    ├─ 2.4 setCurrentRoute(to) 提前更新当前路由            │
│    │      └─ 确保目标页 onLoad/onShow 时 route.value     │
│    │         已是完整目标路由（含 name/params）            │
│    │                                                    │
│    └─ 2.5 调用 uni 导航 API                              │
│           ├─ push → navigateTo (返回 eventChannel)       │
│           ├─ replace → redirectTo / switchTab           │
│           ├─ relaunch → reLaunch / switchTab            │
│           └─ back → navigateBack                        │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. 导航完成后                                             │
│    ├─ runAfterGuards() 执行 afterEach 钩子                │
│    └─ 返回 NavigationResult / RouteLocation              │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. 清理                                                  │
│    └─ 清除 pendingNavigation（finally）                  │
└─────────────────────────────────────────────────────────┘
```

## 阶段一：performNavigation

这是导航的入口，负责准备工作。

### 1.1 并发导航排队

```ts
if (this.pendingNavigation) {
  await this.pendingNavigation.catch(() => {})
}
```

如果前一次导航未完成，当前导航会等待。这确保同一时刻只有一个导航在进行，避免页面栈混乱。

```
push(a) 开始 ──────────────── 完成
            push(b) 等待 ──────── 开始 ──── 完成
```

::: tip 错误已处理
等待时用 `.catch(() => {})` 吞掉前一次导航的错误，因为错误已通过 `onError` 机制通知。当前导航不应因前一次失败而失败。
:::

### 1.2 处理 params

```ts
const enrichedLocation = this.enrichLocationWithParams(location)
```

如果 `location` 包含 `params`，此步骤会：
1. 将 `params` 存入 `ParamsManager`（内存 Map 或 storage）
2. 生成随机 key
3. 将 key 注入到 `location.query.__params_key`

```
输入: { path: 'detail', params: { id: 123 } }
输出: { path: 'detail', query: { __params_key: 'abc123' } }
      + ParamsManager.set('abc123', { id: 123 })
```

### 1.3 路由解析

```ts
const to = this.matcher.resolve(enrichedLocation)
```

`matcher.resolve()` 将 `RouteLocationRaw` 解析为完整的 `RouteLocation`：

- **路径形式**：规范化路径（补全 `/`），匹配 `RouteConfig` 获取 `meta` 和 `name`
- **名称形式**：通过 `name` 查找 `RouteConfig`，获取 `path` 和 `meta`
- **query**：合并 `location.query` 和 URL 字符串中的 query
- **params**：从 `__params_key` 读取实际参数

```
输入: { name: 'about', query: { id: '1' } }
输出: {
  path: '/pages/about/about',
  name: 'about',
  meta: { requireAuth: true },
  query: { id: '1' },
  params: {},
  fullPath: '/pages/about/about?id=1'
}
```

### 1.4 重复导航检测（仅 push）

```ts
if (mode === 'push' && this.isSameRouteLocation(to, from)) {
  // 抛出 NAVIGATION_DUPLICATED
}
```

比较 `path` + `name` + `query`，完全一致则判定为重复。

::: warning 为何仅 push 检测
- `replace`：常用于刷新当前页
- `relaunch`：常用于重置到当前页
- `back`：返回的页面本就可能与当前相同
:::

## 阶段二：executeNavigation

这是导航的核心，执行守卫链和 API 调用。

### 2.1 重定向深度检查

```ts
if (redirectDepth > MAX_REDIRECT_DEPTH) {
  // 抛出 NAVIGATION_CANCELLED
}
```

`MAX_REDIRECT_DEPTH = 10`。每次守卫重定向会递归调用 `executeNavigation` 并 `depth + 1`，防止无限循环。

### 2.2 守卫链执行

```
beforeEach (全局) → beforeEnter (路由独享) → beforeResolve (全局)
```

每个阶段的守卫按注册顺序执行。任一守卫返回非"放行"结果，后续守卫不再执行。

### 2.3 守卫结果处理

`handleGuardResult()` 根据守卫返回的 `GuardResult` 决定后续：

```ts
type GuardResult =
  | { type: 'next'; redirect?: RouteLocationRaw; mode?: NavigationRedirectMode }
  | { type: 'abort'; code: RouterErrorCode }
```

| 结果 | 处理 |
| --- | --- |
| `next`（无 redirect） | 放行，继续下一个守卫 |
| `next` + `redirect` | 递归调用 `executeNavigation`（重定向） |
| `abort` | 抛出 `NavigationFailure` |

### 2.4 重定向的处理

当守卫调用 `next(location, { mode })` 时：

```ts
const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, ...)
```

- `mode` 优先级：守卫指定 > 原始导航方式
- `back` 无法重定向（目标不在栈中），回退为 `relaunch`
- 重定向**重新触发完整守卫链**（从 `beforeEach` 开始）

```
push(protected) → beforeEach 重定向到 login
                → executeNavigation(login, depth=1)
                → beforeEach(login) → 放行
                → navigateTo(login)
```

### 2.5 调用 uni API

所有守卫通过后，**先**调用 `setCurrentRoute(to)` 提前更新当前路由，**再**根据 `mode` 调用对应的 uni API：

```ts
// 提前更新 currentRoute，确保目标页 onLoad/onShow 时 route.value 已是完整目标路由（含 name/params）
// syncRoute 的去重机制会跳过 onShow 中的重复同步，保留此处设置的完整路由信息
this.routeState.setCurrentRoute(to)

try {
  const navOptions = {
    path: to.path,
    meta: to.meta,
    // 实际导航 URL 需要将 __params_key 拼回 query（to.query 已被 matcher 清理，不含内部 key）
    // 这样 back() 返回时 syncCurrentRoute 可从 URL 读取 key 重建 params
    query: paramsKey ? { ...to.query, [PARAMS_KEY]: paramsKey } : to.query,
    animation,
    events
  }

  if (mode === 'push') {
    eventChannel = await navigateTo(navOptions)  // 返回 eventChannel
  } else if (mode === 'replace') {
    await replaceTo(navOptions)
  } else {
    await relaunchTo(navOptions)
  }
} catch (error) {
  // API 调用失败，回滚 currentRoute
  this.routeState.setCurrentRoute(from)
  throw error
}
```

`navigateTo` / `replaceTo` / `relaunchTo` 内部会根据 `meta.isTab` 选择 `switchTab` 或对应 API。

::: tip markRouterCall
每个 uni API 调用前会执行 `markRouterCall()`，标记此次调用来自路由器。当 `interceptUniApi` 启用时，拦截器通过此标记避免循环拦截。
:::

::: warning setCurrentRoute 提前执行
`setCurrentRoute(to)` 在 uni 导航 API 调用**之前**执行，而非之后。这样目标页 `onLoad` / `onShow` 触发时 `route.value` 已是完整目标路由（含 `name` / `params`），避免在目标页生命周期中读到旧的 `currentRoute`。

全局 mixin 的 `onShow` 自动 `syncRoute()` 有去重机制（路径 + query 一致则跳过），不会覆盖此处设置的完整路由信息。若 API 调用失败，`currentRoute` 会回滚为 `from`。
:::

## 阶段三：导航完成后

### 3.1 执行后置钩子

```ts
this.guardManager.runAfterGuards(to, from)
```

`afterEach` 钩子按注册顺序执行。注意 `afterEach` 不接受 `next` 参数，无法改变结果。

### 3.2 返回结果

```ts
return { ...to, eventChannel }  // push 模式
return to                        // 其他模式
```

## back() 的特殊流程

`back()` 不经过 `performNavigation`，有独立流程：

```
router.back(delta)
  │
  ├─ 等待 pendingNavigation
  │
  ├─ 读取页面栈 getCurrentPages()
  ├─ 计算目标: pages[length - 1 - delta]
  ├─ 栈不足 → 抛出 NAVIGATION_CANCELLED
  │
  ├─ matcher.resolve(targetPath) 解析目标
  │
  ├─ 守卫链（同 executeNavigation）
  │   ├─ beforeEach
  │   ├─ beforeResolve
  │   └─ （无 beforeEnter，因为是返回到已有页面）
  │
  ├─ goBack(delta, animation) 调用 uni.navigateBack
  │
  ├─ syncCurrentRoute() 同步状态
  │   ├─ 从页面栈读取真实页面，更新 currentRoute
  │   ├─ 从 URL query 读取 __params_key，用 peek 重建 params（不删除）
  │   ├─ 从用户可见 query 中移除内部 key
  │   └─ _synced = true（标记为状态同步）
  │
  ├─ runAfterGuards(to, from)
  │
  └─ 返回 currentRoute
```

::: warning back 不执行 beforeEnter
`back()` 返回到的是已存在的页面，不触发 `beforeEnter`（路由独享守卫）。仅执行全局守卫。
:::

::: tip back() 后 params 不丢失
`back()` 返回原页面时，`syncCurrentRoute` 会从 URL query 中读取 `__params_key`，用 `peek`（不删除）从 `ParamsManager` 取出 params。由于 `push` 时已将 `__params_key` 拼入实际导航 URL（即使 `route.query` 中不可见），`back()` 后仍可重建 params。
:::

## 状态同步机制

### 完整导航 vs 状态同步

| 类型 | 触发方式 | afterEach | onRouteChange | _synced |
| --- | --- | --- | --- | --- |
| 完整导航 | `push` / `replace` / `relaunch` / `back` | ✅ | ✅ | `false`/`undefined` |
| 状态同步 | `syncRoute()` / `syncCurrentRoute()` | ❌ | ✅ | `true` |

### syncRoute 的工作原理

```ts
syncRoute(): void {
  const from = this.routeState.getCurrentRoute()
  const currentPath = getCurrentPagePath()      // 从页面栈读取
  const currentQuery = getCurrentPageQuery()

  // 路径和 query 都一致，无需更新
  if (currentPath === from.path && this.isSameQuery(currentQuery, from.query)) return

  this.syncCurrentRoute()
  this.paramsManager.cleanupStale()  // 清理无效 params
}
```

`syncCurrentRoute` 从页面栈读取真实页面信息，构造新的 `RouteLocation`（`_synced: true`）并更新状态。期间会从 URL query 读取 `__params_key` 并用 `peek` 重建 params（不删除，便于反复读取），同时从用户可见 query 中移除该内部 key。

::: tip 已通过全局 mixin 自动调用
路由器在 `install()` 时注入了 `app.mixin({ onShow() { router.syncRoute() } })`，会在每个页面 `onShow` **自动**同步状态。mixin 钩子先于组件自身 `onShow` 执行，且 `syncRoute` 内部有去重机制（路径 + query 一致则跳过）。

因此，物理返回键、浏览器后退、`uni.navigateBack` 直接调用等场景下**无需**手动调用 `syncRoute()`。仅在 `onLoad` 等早于 `onShow` 的生命周期中需要立即读取路由信息时，才需手动调用。
:::

### 为何 afterEach 不触发

`afterEach` 的语义是"导航完成后"的钩子，参与导航流程控制（如设置标题）。状态同步不是导航，不应触发可能产生副作用的 `afterEach`。

但 `onRouteChange` 是纯观察性质的订阅，状态同步也应通知，因此会触发。

## 并发导航的保证

### 排队机制

```ts
// performNavigation
if (this.pendingNavigation) {
  await this.pendingNavigation.catch(() => {})
}
// ... 准备工作 ...
this.pendingNavigation = navigationPromise
try {
  return await navigationPromise
} finally {
  if (this.pendingNavigation === navigationPromise) {
    this.pendingNavigation = null
  }
}
```

### 保证

1. **串行执行**：同一时刻只有一个导航在进行
2. **错误隔离**：前一次导航失败不影响下一次
3. **状态一致**：`pendingNavigation` 在 `finally` 中清除，即使异常也不会残留

::: warning 守卫中触发导航
在守卫中调用 `router.push()` 会导致当前导航等待新导航完成，而新导航又等待当前守卫完成，形成死锁。

```ts
// ❌ 死锁
router.beforeEach((to, from, next) => {
  router.push({ name: 'other' }) // 触发新导航，等待当前导航
  next()
})
```

如需在守卫中跳转，使用 `next(location)` 重定向。
:::

## 错误传播

### 错误码对应

| 阶段 | 错误码 | 触发条件 |
| --- | --- | --- |
| 重复检测 | `NAVIGATION_DUPLICATED` | push 到相同位置 |
| 守卫中止 | `NAVIGATION_ABORTED` | `next(false)` |
| 守卫超时 | `NAVIGATION_CANCELLED` | 守卫超时未 resolve |
| 守卫异常 | `NAVIGATION_CANCELLED` | 守卫 throw / reject |
| 重定向超限 | `NAVIGATION_CANCELLED` | depth > 10 |
| 栈不足 | `NAVIGATION_CANCELLED` | back 时 targetIndex < 0 |
| API 失败 | `NAVIGATION_API_ERROR` | uni API 调用失败 |
| 路由未找到 | `ROUTE_NOT_FOUND` | 严格模式未匹配 |
| 初始化错误 | `SETUP_ERROR` | 路由器使用方式错误 |

### 错误通知路径

```
错误产生
  ├─ triggerErrorHandlers(error, to, from)
  │   └─ 通知所有 onError 注册的回调
  │
  └─ Promise.reject(error)
      └─ 调用方 catch 捕获
```

::: tip onError 与 catch 的关系
`onError` 是全局监听，`catch` 是局部处理。两者都会触发，互不冲突。建议：
- `onError`：全局日志、埋点、通用提示
- `catch`：局部 UI 反馈（如 toast）
:::

## params 的生命周期

```
导航时:
  location.params = { id: 123 }
  → ParamsManager.set(key, { id: 123 })
  → 实际导航 URL: /detail?__params_key=key
  → route.query 中不包含 __params_key（matcher 解析时已移除）

目标页面读取（push 后首次进入）:
  route.params = ParamsManager.get(key)
  → get 是惰性清理：读取后删除该 key（防止重复读取）

back() 返回原页面:
  → syncCurrentRoute 从 URL 读取 __params_key
  → ParamsManager.peek(key)（不删除，可反复读取）
  → 重建 route.params

页面关闭 / syncRoute:
  → ParamsManager.cleanupStale() 清理无效 key

路由器初始化:
  → ParamsManager.cleanupAll() 清空所有残留
```

::: tip peek vs get
- `get(key)`：读取后删除该 key，防止重复读取。适用于 `push` 后目标页首次读取。
- `peek(key)`：仅读取不删除。适用于 `back()` 后原页面重建 params，因为用户可能反复 `back` 到同一页面。
:::

## 完整时序示例

以"未登录用户访问受保护页面"为例：

```
1. router.push({ name: 'protected' })

2. performNavigation:
   ├─ resolve → to = { name: 'protected', meta: { requireAuth: true } }
   ├─ from = { name: 'home' }
   └─ 非重复，继续

3. executeNavigation(to, from, 'push', depth=0):
   ├─ beforeEach:
   │   └─ 检测 requireAuth && !isLoggedIn
   │   └─ next({ name: 'login' }, { mode: 'replace' })
   │   └─ 返回 { type: 'next', redirect: {name:'login'}, mode: 'replace' }
   │
   ├─ handleGuardResult:
   │   └─ redirectMode = 'replace' (守卫指定)
   │   └─ 递归 executeNavigation(login, from, 'replace', depth=1)

4. executeNavigation(login, from, 'replace', depth=1):
   ├─ beforeEach:
   │   └─ to.name === 'login' && !isLoggedIn → 放行
   │   └─ next()
   ├─ beforeEnter: (login 路由无独享守卫)
   ├─ beforeResolve: 放行
   ├─ setCurrentRoute(login)  ← 提前更新，确保目标页 onLoad/onShow 时 route.value 已就绪
   └─ replaceTo → uni.redirectTo(login)

5. 导航完成:
   ├─ afterEach(login, home)
   └─ 返回 RouteLocation(login)

6. 清理 pendingNavigation
```

## 下一步

- [路由守卫](./guards) — 守卫的详细用法
- [拦截器机制](./interceptor) — 拦截原生 API 的原理
- [常见问题](./faq) — 排查导航异常
