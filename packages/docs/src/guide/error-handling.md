# 错误处理

Uni Router 提供统一的错误处理机制，所有导航错误都使用 `NavigationFailure` 类封装，并附带结构化的错误码。本章详细讲解错误类型、错误码、处理方式和调试技巧。

## 错误类型

### RouterError

路由错误基类：

```ts
class RouterError extends Error {
  readonly code: RouterErrorCode  // 错误码
  readonly message: string        // 错误信息
}
```

### NavigationFailure

导航失败类，继承自 `RouterError`，包含导航上下文：

```ts
class NavigationFailure extends RouterError {
  readonly to: RouteLocation       // 目标路由
  readonly from: RouteLocation     // 来源路由
  readonly cause?: UniApiError     // 原始错误（仅 NAVIGATION_API_ERROR 时存在）
}
```

`cause` 类型为 `UniApiError`，封装了失败的 uni-app API 信息：

```ts
interface UniApiError {
  readonly api: string          // 调用失败的 API 名称（如 'navigateTo'）
  readonly cause: UniApiCause    // 原始错误原因
}

interface UniApiCause {
  errMsg: string                // 错误描述信息
}
```

## 错误码详解

| 错误码 | 说明 | 触发场景 | 是否可恢复 |
| --- | --- | --- | --- |
| `NAVIGATION_ABORTED` | 导航被守卫中止 | 守卫调用 `next(false)` | 是 |
| `NAVIGATION_CANCELLED` | 导航被取消 | 守卫超时/异常、重定向超限、栈不足 | 是 |
| `NAVIGATION_DUPLICATED` | 重复导航 | `push` 到当前已处于的页面 | 是 |
| `ROUTE_NOT_FOUND` | 路由未找到 | 严格模式下使用未定义的命名路由 | 是 |
| `NAVIGATION_API_ERROR` | uni API 调用失败 | `uni.navigateTo` 等调用失败 | 是 |
| `PLUGIN_REQUIRED` | 插件功能未注册 | 使用 `params`/`events`/`animation` 等插件依赖功能但未注册对应插件 | 是 |
| `SETUP_ERROR` | 初始化错误 | `useRouter()` 在 setup 外调用 | 否 |

### 错误码触发条件

#### NAVIGATION_ABORTED

```ts
// 守卫调用 next(false)
router.beforeEach((to, from, next) => {
  if (someCondition) {
    next(false) // 抛出 NAVIGATION_ABORTED
  } else {
    next()
  }
})
```

#### NAVIGATION_CANCELLED

多种场景会触发：

```ts
// 1. 守卫超时（超过 guardTimeout）
router.beforeEach(async (to, from, next) => {
  await verySlowOperation() // 超时
  next()
})

// 2. 守卫抛出异常
router.beforeEach(() => {
  throw new Error('守卫异常') // 抛出 NAVIGATION_CANCELLED
})

// 3. 重定向超限（>10 次）
router.beforeEach((to, from, next) => {
  next({ name: 'a' }) // a → b → a → b ... 超过 10 次
})

// 4. back() 时栈不足
router.back(10) // 当前栈只有 3 层
```

#### NAVIGATION_DUPLICATED

```ts
// 当前在 /pages/about/about
await router.push({ name: 'about' }) // 抛出 NAVIGATION_DUPLICATED
```

::: tip 仅 push 检测
`replace` / `relaunch` / `back` 不检测重复，可以跳转到当前位置。
:::

#### ROUTE_NOT_FOUND

```ts
// 严格模式下
const router = createRouter({ routes, strict: true })
await router.push({ name: 'not-exist' }) // 抛出 ROUTE_NOT_FOUND
```

#### NAVIGATION_API_ERROR

```ts
// uni API 调用失败（如页面栈溢出）
await router.push({ name: 'page11' }) // 小程序页面栈已达 10 层
// 抛出 NAVIGATION_API_ERROR，cause 携带失败的 API 信息
// err.cause.api === 'navigateTo'
// err.cause.cause.errMsg 包含 'limit exceed'
```

#### PLUGIN_REQUIRED

```ts
// 未注册 ParamsPlugin 时使用 params
await router.push({ path: '/detail', params: { id: 123 } })
// → 抛出 PLUGIN_REQUIRED: Plugin "params" is required to use params

// 未注册 AnimationPlugin 时使用 animation
await router.push({ path: '/detail', animation: { type: 'fade-in' } })
// → 抛出 PLUGIN_REQUIRED: Plugin "animation" is required to use animation

// 未注册 ChannelPlugin 时使用 events
await router.push({ path: '/detail', events: { update: fn } })
// → 抛出 PLUGIN_REQUIRED: Plugin "channel" is required to use events
```

## 错误处理方式

### 方式一：全局 onError

注册全局错误处理回调，所有导航错误都会触发：

```ts
const removeHandler = router.onError((error, to, from) => {
  console.error('[路由错误]', error.code, error.message)
  console.log('目标:', to.fullPath)
  console.log('来源:', from.fullPath)

  switch (error.code) {
    case 'NAVIGATION_ABORTED':
      // 守卫中止，通常无需处理
      break
    case 'NAVIGATION_DUPLICATED':
      // 重复导航，忽略
      break
    case 'NAVIGATION_CANCELLED':
      uni.showToast({ title: '导航取消', icon: 'none' })
      break
    case 'NAVIGATION_API_ERROR':
      uni.showToast({ title: '导航失败', icon: 'none' })
      console.error('原始错误:', error.cause)
      break
    case 'ROUTE_NOT_FOUND':
      uni.showToast({ title: '页面不存在', icon: 'none' })
      break
    case 'PLUGIN_REQUIRED':
      console.error('使用了插件功能但未注册插件:', error.message)
      break
  }
})

// 移除处理器
removeHandler()
```

::: tip onError 特性
- 多个 `onError` 回调按注册顺序执行
- 某个回调抛异常不影响其他回调执行
- `onError` 与 `try-catch` 互不冲突，都会触发
:::

### 方式二：try-catch

在调用处捕获错误，适合需要局部处理的场景：

```ts
async function navigate() {
  try {
    await router.push({ name: 'about' })
    console.log('导航成功')
  } catch (error) {
    if (error.code === 'NAVIGATION_DUPLICATED') {
      // 忽略重复导航
      return
    }
    if (error.code === 'NAVIGATION_ABORTED') {
      console.log('导航被守卫中止')
      return
    }
    if (error.code === 'PLUGIN_REQUIRED') {
      console.error('请先注册对应插件:', error.message)
      return
    }
    // 其他错误重新抛出或处理
    uni.showToast({ title: '导航失败', icon: 'none' })
    console.error(error)
  }
}
```

### 两种方式的协作

```
导航错误产生
  ├─ triggerErrorHandlers(error, to, from)
  │   └─ 通知所有 onError 注册的回调（全局处理）
  │
  └─ Promise.reject(error)
      └─ 调用方 catch 捕获（局部处理）
```

**推荐分工**：

- `onError`：全局日志、埋点、通用提示
- `catch`：局部 UI 反馈（如按钮 loading 状态）

```ts
// 全局：日志和埋点
router.onError((error, to, from) => {
  analytics.report({
    event: 'navigation_error',
    code: error.code,
    from: from.path,
    to: to.path
  })
})

// 局部：按钮状态
async function handleLogin() {
  loading.value = true
  try {
    await router.push({ name: 'home' })
  } catch {
    loading.value = false
  }
}
```

## 常见错误处理场景

### 忽略重复导航

```ts
// 全局忽略
router.onError((error) => {
  if (error.code === 'NAVIGATION_DUPLICATED') return
  console.error(error)
})

// 或封装安全 push
async function safePush(location) {
  try {
    await router.push(location)
  } catch (err) {
    if (err.code === 'NAVIGATION_DUPLICATED') return
    throw err
  }
}
```

### 守卫中止后跳转登录

```ts
router.onError((error, to) => {
  if (error.code === 'NAVIGATION_ABORTED' && to.meta.requireAuth) {
    // 守卫因未登录中止，跳转登录页
    router.replace({ name: 'login', query: { redirect: to.fullPath } })
  }
})
```

### API 失败重试

```ts
router.onError(async (error, to) => {
  if (error.code === 'NAVIGATION_API_ERROR') {
    console.error('导航失败，目标:', to.fullPath)
    console.error('失败 API:', error.cause?.api)
    console.error('原始错误:', error.cause?.cause.errMsg)

    // 页面栈溢出时，改用 relaunch
    if (String(error.cause?.cause.errMsg).includes('limit')) {
      await router.relaunch(to)
    }
  }
})
```

### 守卫超时处理

```ts
router.onError((error, to, from) => {
  if (error.code === 'NAVIGATION_CANCELLED') {
    // 检查是否为超时（守卫中有网络请求）
    console.warn('导航取消，可能因守卫超时')
    console.log('从', from.path, '到', to.path)
  }
})
```

## 错误传播机制

### 完整传播路径

```
1. 错误产生（守卫/API/检测等）
   │
   ├─ 2a. triggerErrorHandlers(error, to, from)
   │      └─ 通知所有 onError 回调
   │
   └─ 2b. Promise.reject(error)
          └─ 调用方 catch 捕获
             └─ 未捕获 → Unhandled Promise Rejection
```

### 守卫中的错误

```ts
router.beforeEach((to, from, next) => {
  try {
    // 同步错误
    throw new Error('同步错误')
  } catch (err) {
    // 守卫内捕获，导航继续
    next()
  }
})

router.beforeEach(async (to, from, next) => {
  // 异步错误未捕获 → 转为 NAVIGATION_CANCELLED
  await someAsyncOperation() // 抛出异常
  next()
})
```

::: warning 守卫异常处理
守卫中未捕获的异常会被转为 `NAVIGATION_CANCELLED` 错误。建议在守卫中用 try-catch 处理异常：

```ts
router.beforeEach(async (to, from, next) => {
  try {
    const user = await fetchUser()
    if (!user) {
      next({ name: 'login' })
    } else {
      next()
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    next(false) // 显式中止，而非让异常传播
  }
})
```
:::

## 调试技巧

### 1. 打印完整错误信息

```ts
router.onError((error, to, from) => {
  console.group(`[路由错误] ${error.code}`)
  console.log('错误码:', error.code)
  console.log('错误信息:', error.message)
  console.log('目标路由:', to)
  console.log('来源路由:', from)
  console.log('原始错误:', error.cause)
  console.log('错误堆栈:', error.stack)
  console.groupEnd()
})
```

### 2. 区分错误类型

```ts
import { isNavigationFailure, RouterErrorCodes } from '@meng-xi/uni-router'

router.onError((error) => {
  if (isNavigationFailure(error)) {
    // 导航失败错误
    if (error.code === RouterErrorCodes.NAVIGATION_ABORTED) {
      // 守卫中止
    }
  } else {
    // 其他错误
    console.error('非导航错误:', error)
  }
})
```

### 3. 开发环境详细日志

```ts
// 仅开发环境启用详细日志
if (import.meta.env.DEV) {
  router.onError((error, to, from) => {
    console.warn(`
      导航失败
      错误码: ${error.code}
      从: ${from.fullPath}
      到: ${to.fullPath}
      原因: ${error.message}
      ${error.cause ? `原始错误: ${error.cause}` : ''}
    `)
  })
}
```

### 4. 守卫执行追踪

```ts
router.beforeEach((to, from, next) => {
  console.log(`[beforeEach] ${from.path} → ${to.path}`)
  next()
})

router.beforeResolve((to, from, next) => {
  console.log(`[beforeResolve] ${from.path} → ${to.path}`)
  next()
})

router.afterEach((to, from) => {
  console.log(`[afterEach] ${from.path} → ${to.path} ✓`)
})
```

## 错误码常量

使用 `RouterErrorCodes` 常量避免硬编码字符串：

```ts
import { RouterErrorCodes } from '@meng-xi/uni-router'

router.onError((error) => {
  switch (error.code) {
    case RouterErrorCodes.NAVIGATION_ABORTED:
      // ...
      break
    case RouterErrorCodes.NAVIGATION_DUPLICATED:
      // ...
      break
    case RouterErrorCodes.PLUGIN_REQUIRED:
      // 插件未注册
      break
    // ...
  }
})
```

## 下一步

- [常见问题](./faq) — 排查具体问题
- [导航流程原理](./navigation-flow) — 理解错误产生的时机
- [实战指南](./recipes) — 完整业务方案
- [插件系统](./plugins) — 了解插件注册机制
