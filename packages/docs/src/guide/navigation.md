# 路由导航

路由导航是 Uni Router 的核心能力。本章将深入讲解四种导航方式的工作原理、uni-app 底层限制、以及如何利用库的特性实现特殊用法。

## 四种导航方式总览

| 方法 | 栈操作 | 对应 uni API | 重复检测 | 动画 | events | 返回值 |
| --- | --- | --- | --- | --- | --- | --- |
| `push()` | 入栈 +1 | `navigateTo` / `switchTab` | ✅ | ✅ | ✅ | `NavigationResult` |
| `replace()` | 替换栈顶 | `redirectTo` / `switchTab` | ❌ | ✅ | ⚠️¹ | `NavigationResult` |
| `relaunch()` | 清栈后入栈 | `reLaunch` / `switchTab` | ❌ | ❌ | ⚠️¹ | `NavigationResult` |
| `back()` | 出栈 -n | `navigateBack` | ❌ | ✅ | ❌ | `RouteLocation` |

> ¹ 默认不支持 `events`；启用 `useUniEventChannel: true` 后，`replace` / `relaunch` 也支持页面通信，返回的 `eventChannel` 可用。

::: tip TabBar 页面自动识别
当目标路由的 `meta.isTab` 为 `true` 时，`push` / `replace` / `relaunch` 都会自动改用 `uni.switchTab`。你无需手动判断，只需在路由配置中正确声明 `isTab`。
:::

## push — 入栈导航

`push` 是最常用的导航方式，向页面栈压入新页面。

```ts
router.push(location: RouteLocationRaw): Promise<NavigationResult>
```

### 基本用法

```ts
// 路径字符串
await router.push('pages/about/about')

// 路径对象 + 查询参数
await router.push({ path: 'pages/about/about', query: { id: '1' } })

// 命名路由（推荐，重构友好）
await router.push({ name: 'about', query: { id: '1' } })

// 字符串带 query
await router.push('pages/about/about?id=1&tab=info')
```

### 返回值 NavigationResult

`push` 返回 `NavigationResult`，继承自 `RouteLocation`，额外包含 `eventChannel`：

```ts
const result = await router.push({ name: 'detail', query: { id: '1' } })
console.log(result.path)       // '/pages/detail/detail'
console.log(result.query.id)   // '1'
console.log(result.eventChannel) // EventChannel 实例（仅 push 可用）
```

::: info 向后兼容
`NavigationResult` 继承自 `RouteLocation`，原有代码 `const route = await router.push(...)` 无需修改。
:::

### 重复导航检测

`push` 会检测目标是否与当前位置完全相同（路径、名称、查询参数均一致），相同时抛出 `NAVIGATION_DUPLICATED`：

```ts
// 当前已在 /pages/about/about?id=1
await router.push({ name: 'about', query: { id: '1' } })
// → 抛出 NavigationFailure (NAVIGATION_DUPLICATED)
```

::: warning 仅 push 检测重复
`replace` / `relaunch` / `back` **不检测重复**。这是因为 `replace` 常用于刷新当前页，`relaunch` 常用于重置到当前页（如退出登录后回到首页），`back` 返回的页面本就可能与当前相同。
:::

### TabBar 页面的限制

当目标是 TabBar 页面（`meta.isTab: true`）时，`push` 改用 `uni.switchTab`，此时以下限制生效：

| 特性 | 普通页面 | TabBar 页面 |
| --- | --- | --- |
| `query` | ✅ 拼接到 URL | ❌ 被忽略并警告 |
| `animation` | ✅ 生效 | ❌ 被忽略并警告 |
| `events` | ✅ 生效 | ❌ 被忽略 |
| `eventChannel` | ✅ 返回 | ❌ `undefined` |

```ts
// TabBar 页面，query 会被忽略
await router.push({ name: 'user', query: { tab: 'profile' } })
// ⚠️ 警告: uni.switchTab does not support query parameters. They will be ignored.
```

::: warning 这是 uni-app 的硬限制
`uni.switchTab` 由小程序规范决定，不支持 URL 参数。如需向 TabBar 页面传参，使用 `params`（见下文特殊用法）。
:::

## replace — 替换导航

`replace` 替换当前页面，不增加栈深度。常用于登录后替换登录页、表单提交后替换表单页。

```ts
router.replace(location: RouteLocationRaw): Promise<RouteLocation>
```

```ts
// 登录成功后替换登录页
await router.replace({ name: 'home' })

// 表单提交后替换为详情页
await router.replace({ path: 'pages/detail/detail', query: { id: result.id } })
```

### 与 push 的差异

- **不检测重复**：可替换到当前页（用于刷新）
- **默认不返回 eventChannel**：`redirectTo` 不支持原生页面通信，返回的 `NavigationResult.eventChannel` 为 `undefined`（启用 `useUniEventChannel: true` 后可用内置通道通信）
- **events 默认被忽略**：传入 `events` 会输出警告（启用 `useUniEventChannel: true` 后生效）
- **TabBar 限制相同**：`meta.isTab` 时改用 `switchTab`

## relaunch — 重置导航

`relaunch` 关闭所有页面后打开目标页面，常用于退出登录、返回首页、重置整个流程。

```ts
router.relaunch(location: RouteLocationRaw): Promise<RouteLocation>
```

```ts
// 退出登录
await router.relaunch({ name: 'login' })

// 从深层页面返回首页
await router.relaunch({ name: 'home' })

// 带重定向参数
await router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

### 特殊限制

::: warning reLaunch 不支持动画
`uni.reLaunch` 不接受动画参数。传入 `animation` 时会输出警告并被忽略。这是因为 `reLaunch` 会关闭所有页面，动画语义不明确。

但 TabBar 页面走 `switchTab`，同样不支持动画。
:::

### 不检测重复的原因

`relaunch` 常用于"重置到当前页"的场景，例如：

- 用户在首页点击"回到首页"按钮
- 退出登录后目标页恰好是当前页

因此 `relaunch` 不做重复检测，确保这类场景能正常执行。

## back — 返回导航

`back` 返回上一页或多级页面，是唯一执行完整守卫链的"后退"操作。

```ts
router.back(delta?: number, animation?: NavigationAnimation): Promise<RouteLocation>
```

```ts
// 返回上一页
await router.back()

// 返回两级
await router.back(2)

// 自定义动画
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### 工作原理

`back` 通过 `getCurrentPages()` 读取页面栈，计算目标页面：

```
当前栈: [A, B, C, D]  (D 是当前页)
back(2) → 目标是 B (index = 4-1-2 = 1)
→ 调用 uni.navigateBack({ delta: 2 })
→ 同步 currentRoute 为 B
```

若页面栈不足（`targetIndex < 0`），抛出 `NAVIGATION_CANCELLED`。

### 守卫拦截

`back` 执行完整的守卫链（`beforeEach` → `beforeResolve`），守卫可以：

- `next()` 放行返回
- `next(false)` 阻止返回（如"表单未保存"提示）
- `next(location)` 重定向到其他页面

```ts
router.beforeEach((to, from, next) => {
  if (from.meta.dirty && !confirm('未保存的修改将丢失，确认离开？')) {
    next(false) // 阻止返回
  } else {
    next()
  }
})
```

::: warning 物理返回键无法拦截
`back()` 仅拦截**编程式**调用。物理返回键（Android）、浏览器后退（H5）、小程序左上角返回**直接触发原生 `navigateBack`**，不经过路由器，守卫无法拦截。

应对方案：
1. 路由器在 `install()` 时已注册全局 mixin，会在每个页面 `onShow` 自动调用 `router.syncRoute()` 同步状态（无需手动调用）
2. 在 `onRouteChange` 中做事后处理
3. App 端可监听 `onBackPress` 拦截物理返回键
:::

## 路由位置 RouteLocationRaw

所有导航方法接受 `RouteLocationRaw` 类型，支持三种形式：

### 字符串形式

```ts
router.push('pages/about/about')
router.push('pages/about/about?id=1&tab=info')
```

路径会自动规范化（补全前导 `/`）。字符串中的 query 会被解析。

### 路径对象

```ts
router.push({
  path: 'pages/about/about',
  query: { id: '1', tab: 'info' },
  params: { detail: { name: 'Tom' } },
  animation: { type: 'slide-in-right' },
  events: { update(data) { /* ... */ } }
})
```

### 命名对象

```ts
router.push({
  name: 'about',
  query: { id: '1' },
  params: { detail: { name: 'Tom' } }
})
```

::: tip 推荐使用命名路由
命名路由解耦了路径，重构时只需修改路由配置中的 `path`，无需全局搜索替换字符串。配合 `@meng-xi/vite-plugin` 的 `dts` 功能，还能获得类型检查和自动补全。
:::

## 特殊用法：params 传递复杂数据

uni-app 原生导航仅支持 URL query（字符串）。Uni Router 的 `params` 突破了这一限制：

### 传递任意 JSON 数据

```ts
// 传递对象
await router.push({
  path: 'pages/detail/detail',
  params: {
    id: 123,
    info: { name: 'Tom', age: 20 },
    tags: ['a', 'b', 'c']
  }
})

// 目标页面读取
const route = useRoute()
console.log(route.params.id)      // 123
console.log(route.params.info)    // { name: 'Tom', age: 20 }
console.log(route.params.tags)    // ['a', 'b', 'c']
```

### 实现原理

`params` 不暴露在 URL 中，而是通过内部 `Map` 存储，并将一个随机 key 注入到 URL query 中（`__params_key`）。目标页面通过 key 从 Map 中读取。

```
导航时:
  params: { id: 123, info: {...} }
  → 存入 ParamsManager (key: "abc123")
  → URL: /pages/detail/detail?__params_key=abc123

目标页面:
  → 从 query 读取 __params_key
  → 从 ParamsManager 取出 params
  → route.params = { id: 123, info: {...} }
```

::: tip __params_key 的 URL 保留
虽然 `route.query` 中**不包含** `__params_key`（matcher 解析时会移除内部 key，避免暴露给用户），但**实际导航 URL 中会保留**它。这样在 `back()` 返回原页面时，`syncCurrentRoute` 可从 URL 重建 params，避免丢失。如需获取用户可见 query，请使用 `route.query`。
:::

### 持久化（H5 刷新不丢失）

默认 `params` 存在内存中，页面关闭后丢失。设置 `persistent: true` 可持久化到 storage，H5 刷新后仍可读取：

```ts
// 单次导航持久化
await router.push({
  path: 'pages/detail/detail',
  params: { id: 123 },
  persistent: true
})

// 全局默认持久化
const router = createRouter({
  routes,
  paramsPersistent: true // 所有 params 默认持久化
})
```

::: warning params 的局限
1. **不支持函数、Symbol 等非 JSON 可序列化值**
2. **TabBar 页面**：由于 `switchTab` 不支持 query，`__params_key` 无法传递，TabBar 页面无法接收 params
3. **`relaunch` / 栈溢出**：会清空或重建页面栈，原页面 params 无法保留，需用全局状态传递
:::

## 特殊用法：页面间通信

Uni Router 提供两种页面间通信模式：原生 EventChannel（默认）和内置通信管理器（`useUniEventChannel: true`）。

### 模式一：原生 EventChannel（默认）

`push` 支持 `events` + `eventChannel` 双向通信，对应 `uni.navigateTo` 的 EventChannel 机制：

```ts
// 发起页
const { eventChannel } = await router.push({
  path: 'pages/detail/detail',
  events: {
    // 监听目标页面发来的事件
    update(data) { console.log('收到更新:', data) }
  }
})

// 向目标页面发送事件
eventChannel.emit('init', { message: '初始化数据' })
```

```ts
// 目标页面
import { getCurrentPages } from 'uni-app'

const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const eventChannel = currentPage.getOpenerEventChannel()

eventChannel.on('init', (data) => {
  console.log('收到初始化:', data)
})

// 向发起页发送事件
eventChannel.emit('update', { status: 'loaded' })
```

::: warning 原生模式的局限
- **仅 `push` 支持**：`replace` / `relaunch` / `back` 不支持 `events`，传入时会被忽略并警告（`redirectTo` / `reLaunch` / `navigateBack` 不创建 EventChannel）
- **时序问题**：`uni.navigateTo` 的 `success` 回调可能早于目标页面 `setup` 执行，此时 `emit` 会早于 `on` 注册导致事件丢失
- **H5 刷新丢失**：原生通道不持久化，刷新后通道失效
:::

### 模式二：内置通信管理器（useUniEventChannel）

启用 `createRouter({ useUniEventChannel: true })` 后，所有导航方式（`push` / `replace` / `relaunch`）都使用内置通信管理器，目标页面通过 [`usePageChannel()`](../api/use-page-channel) 获取通道：

```ts
// 发起页：replace / relaunch 也返回 eventChannel
const { eventChannel } = await router.replace({
  name: 'detail',
  params: { id: 123 },
  events: {
    ready(data) { console.log('目标页就绪:', data) }
  }
})

// 向目标页面发送事件
eventChannel.emit('init', { message: '初始化数据' })
```

```vue
<!-- 目标页面：使用 usePageChannel() 替代 getOpenerEventChannel() -->
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// 监听发起页发送的事件
channel.on('init', (data) => {
  console.log('收到初始化:', data)
})

// 向发起页发送事件
channel.emit('ready', { status: 'loaded' })
</script>
```

内置通信管理器的优势：

| 特性 | 原生 EventChannel | 内置通信管理器 |
| --- | --- | --- |
| 适用导航方式 | 仅 `push` | `push` / `replace` / `relaunch` |
| 时序问题 | emit 早于 on 时事件丢失 | 粘性事件缓存，不丢失 |
| H5 刷新 | 通道丢失 | `__nav_id` 持久化，可重建 |
| 生命周期清理 | 手动管理 | 页面卸载自动销毁 |
| 目标页获取方式 | `getOpenerEventChannel()` | `usePageChannel()` |

::: tip 粘性事件缓存
内置通道实现粘性事件机制：`emit` 时**总是**缓存事件参数；`on` / `once` 注册时若已有缓存，会**异步触发**（不删除缓存）。无论 `emit` 和 `on` 的先后顺序，所有监听器都能收到最后一次 `emit` 的数据，彻底解决时序竞争问题。
:::

::: warning 切换模式时的注意
- 启用 `useUniEventChannel` 后，`push` 不再使用原生 EventChannel，目标页需改用 `usePageChannel()`
- `events` 选项在两种模式下均可使用，但内置模式下通过 `uni.$emit` 转发
- 详见 [`usePageChannel()` API](../api/use-page-channel) 与 [`useUniEventChannel` 选项](../api/type-router-options#useunieventchannel)
:::

## 特殊用法：导航动画

App 端支持自定义导航动画，三级优先级：

```
调用时传入 animation > meta.animation > uni 默认值
```

### 路由级默认动画

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]
```

### 调用时覆盖

```ts
await router.push({ name: 'about', animation: { type: 'slide-in-bottom', duration: 500 } })
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### 动画类型

`type` 对应 `uni.navigateTo` 的 `animationType`，App 端可选值：

| 值 | 说明 |
| --- | --- |
| `'auto'` | 自动选择 |
| `'none'` | 无动画 |
| `'slide-in-right'` | 从右滑入（默认） |
| `'slide-in-left'` | 从左滑入 |
| `'slide-in-top'` | 从顶部滑入 |
| `'slide-in-bottom'` | 从底部滑入 |
| `'fade-in'` | 淡入 |
| `'zoom-fade-in'` | 缩放淡入 |
| `'zoom-out'` | 缩出 |

::: warning 平台限制
动画**仅 App 端生效**。小程序和 H5 的导航动画由系统控制，无法自定义。`reLaunch` 即使在 App 端也不支持动画。
:::

## 并发导航处理

Uni Router 内置并发导航排队机制：

```ts
// 连续两次导航
router.push({ name: 'a' })  // 立即执行
router.push({ name: 'b' })  // 等待第一次完成后再执行
```

```
时间线:
  t0: push(a) 开始执行
  t1: push(b) 进入等待（pendingNavigation 存在）
  t2: push(a) 完成 → push(b) 开始执行
  t3: push(b) 完成
```

::: tip 避免导航冲突
并发导航排队确保同一时刻只有一个导航在进行，避免页面栈混乱。但建议避免在守卫中触发新导航，可能导致死锁。
:::

## 重定向深度保护

守卫中的 `next(location)` 会触发重定向，Uni Router 限制最大重定向深度为 **10 层**，超过时抛出 `NAVIGATION_CANCELLED`：

```ts
// 错误示例：A→B→A→B→... 无限重定向
router.beforeEach((to, from, next) => {
  if (to.name === 'a') next({ name: 'b' })
  else if (to.name === 'b') next({ name: 'a' })
})
```

```
→ push(a) → beforeEach 重定向到 b
→ push(b) → beforeEach 重定向到 a
→ ... (10 次后)
→ 抛出 NAVIGATION_CANCELLED: Maximum redirect depth (10) exceeded
```

## 导航失败处理

所有导航方法返回 Promise，失败时 reject `NavigationFailure`：

```ts
import { NavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

try {
  await router.push({ name: 'about' })
} catch (error) {
  if (error instanceof NavigationFailure) {
    switch (error.code) {
      case RouterErrorCode.NAVIGATION_ABORTED:
        console.log('被守卫中止')
        break
      case RouterErrorCode.NAVIGATION_DUPLICATED:
        console.log('重复导航，已在当前页')
        break
      case RouterErrorCode.NAVIGATION_CANCELLED:
        console.log('被取消（重定向超限或栈不足）')
        break
      case RouterErrorCode.NAVIGATION_API_ERROR:
        console.error('uni API 失败', error.cause)
        break
    }
  }
}
```

也可通过 `onError` 全局捕获：

```ts
router.onError((error, to, from) => {
  // 上报错误日志
  trackError(error.code, { to: to.path, from: from.path })
})
```

详见[错误处理](./error-handling)。

## 最佳实践

### 1. 统一使用命名路由

```ts
// ✅ 推荐
router.push({ name: 'detail', query: { id: '1' } })

// ❌ 不推荐（路径硬编码）
router.push('pages/detail/detail?id=1')
```

### 2. TabBar 页面用 params 传参

```ts
// ✅ TabBar 页面用 params（query 会被 switchTab 忽略）
router.push({ name: 'user', params: { tab: 'profile' } })

// ❌ query 会被忽略
router.push({ name: 'user', query: { tab: 'profile' } })
```

### 3. 退出登录用 relaunch

```ts
// ✅ 清空栈，用户无法返回受保护页面
await router.relaunch({ name: 'login' })

// ❌ replace 后用户仍可返回
await router.replace({ name: 'login' })
```

### 4. 深层页面返回首页用 relaunch

```ts
// 当前栈: [home, list, detail, comment]
// 从 comment 直接回 home

// ✅ 清栈，避免 back 多次
await router.relaunch({ name: 'home' })

// ❌ 多次 back，体验差且可能栈不足
await router.back(3)
```

### 5. 表单页用 back 守卫拦截

```ts
router.beforeEach((to, from, next) => {
  if (from.meta.dirty) {
    uni.showModal({
      title: '提示',
      content: '未保存的修改将丢失，确认离开？',
      success: (res) => res.confirm ? next() : next(false)
    })
  } else {
    next()
  }
})
```

## 下一步

- [路由守卫](./guards) — 掌握守卫机制与可控重定向
- [导航流程原理](./navigation-flow) — 理解从 push 到页面展示的完整流程
- [实战指南](./recipes) — 登录认证、权限控制等完整方案
