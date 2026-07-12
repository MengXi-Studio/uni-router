# RouterError

路由器错误类型，封装路由/导航过程中发生的各种错误。可通过 `router.onError` 全局捕获，或通过 `try-catch` 局部处理。

## 类型定义

```ts
class RouterError extends Error {
  readonly code: RouterErrorCode
  readonly message: string
}
```

- 所有错误信息会自动添加 `[uni-router]` 前缀
- `name` 属性为 `'RouterError'`

## 属性

### code

- **类型**: [`RouterErrorCode`](#routererrorcode)
- **说明**: 错误码，标识错误类型

```ts
import { RouterErrorCode } from '@meng-xi/uni-router'

router.onError((err) => {
  switch (err.code) {
    case RouterErrorCode.ROUTE_NOT_FOUND:
      uni.showToast({ title: '页面不存在', icon: 'none' })
      break
    case RouterErrorCode.NAVIGATION_ABORTED:
      // 守卫中止，通常无需提示
      break
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: '导航失败', icon: 'none' })
      break
  }
})
```

### message

- **类型**: `string`
- **说明**: 错误描述信息（含 `[uni-router]` 前缀）

## NavigationFailure

`NavigationFailure` 继承自 `RouterError`，携带导航上下文信息（来源/目标路由与原始错误原因）：

```ts
class NavigationFailure extends RouterError {
  readonly to: RouteLocation
  readonly from: RouteLocation
  readonly cause?: UniApiError
}
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `to` | `RouteLocation` | 目标路由 |
| `from` | `RouteLocation` | 来源路由 |
| `cause` | `UniApiError \| undefined` | 原始错误原因，仅 `NAVIGATION_API_ERROR` 时存在 |

```ts
router.onError((err) => {
  if (err.code === RouterErrorCode.NAVIGATION_API_ERROR) {
    // err 是 NavigationFailure，可访问 to/from/cause
    console.error(`从 ${err.from.fullPath} 到 ${err.to.fullPath} 失败`)
    console.error('失败的 API:', err.cause?.api)
    console.error('原始错误:', err.cause?.cause.errMsg)
  }
})
```

## UniApiError / UniApiCause

`NavigationFailure.cause` 的类型，封装 uni-app 导航 API 失败的详细信息。

### UniApiCause

uni-app API 失败时的错误原因（即 `fail` 回调接收的对象）：

```ts
interface UniApiCause {
  errMsg: string
}
```

### UniApiError

uni-app API 调用失败的错误信息：

```ts
interface UniApiError {
  readonly api: string          // 调用失败的 API 名称（如 'navigateTo'）
  readonly cause: UniApiCause   // 原始错误原因
}
```

```ts
router.onError((err) => {
  if (err.cause) {
    console.error(`API ${err.cause.api} 调用失败`)
    console.error(`原因: ${err.cause.cause.errMsg}`)
  }
})
```

## RouterErrorCode

错误码枚举，共 7 种：

| 错误码 | 说明 | 触发场景 | 是否可恢复 |
| --- | --- | --- | --- |
| `NAVIGATION_ABORTED` | 导航被守卫中止 | 守卫调用 `next(false)` | 是 |
| `NAVIGATION_CANCELLED` | 导航被取消 | 守卫超时/异常、重定向超限、栈不足 | 是 |
| `NAVIGATION_DUPLICATED` | 重复导航 | `push` 到当前已处于的页面 | 是 |
| `ROUTE_NOT_FOUND` | 路由未找到 | 严格模式下使用未定义的命名路由 | 是 |
| `NAVIGATION_API_ERROR` | uni API 调用失败 | `uni.navigateTo` 等调用失败（如栈溢出） | 是 |
| `PLUGIN_REQUIRED` | 插件未注册 | 使用了插件提供的功能但对应插件未注册 | 是 |
| `SETUP_ERROR` | 初始化/使用错误 | `useRouter()` 在 setup 外调用 | 否 |

::: tip 错误码判断
推荐使用 `RouterErrorCode` 常量而非硬编码字符串，避免拼写错误：

```ts
import { RouterErrorCode } from '@meng-xi/uni-router'

if (err.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
  // 忽略重复导航
}
```
:::

## 错误捕获方式

### router.onError（全局）

注册全局错误处理器，捕获所有导航错误：

```ts
const remove = router.onError((err, to, from) => {
  console.error('[导航错误]', {
    code: err.code,
    message: err.message,
    from: from?.path,
    to: to?.path
  })

  switch (err.code) {
    case RouterErrorCode.ROUTE_NOT_FOUND:
      uni.showToast({ title: '页面不存在', icon: 'none' })
      break
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: '导航失败', icon: 'none' })
      console.error('原始错误:', err.cause)
      break
    case RouterErrorCode.NAVIGATION_ABORTED:
      // 守卫中止，通常无需提示
      break
  }
})

// 移除处理器
remove()
```

### try-catch（局部）

`router.push()` / `replace()` / `relaunch()` / `back()` 返回 Promise，可通过 `try-catch` 捕获：

```ts
try {
  await router.push({ name: 'detail', query: { id: '1' } })
} catch (err) {
  if (err.code === RouterErrorCode.ROUTE_NOT_FOUND) {
    uni.showToast({ title: '页面不存在', icon: 'none' })
  } else if (err.code === RouterErrorCode.NAVIGATION_ABORTED) {
    // 守卫中止，无需处理
  } else {
    console.error('导航失败:', err)
  }
}
```

::: tip onError vs try-catch
- `onError`：全局捕获，适合统一处理（如埋点、默认提示）
- `try-catch`：局部捕获，适合特定场景的差异化处理

两者**不冲突**，`onError` 触发后 Promise 仍会 reject，可被 `try-catch` 捕获。
:::

## 常见错误场景

### NAVIGATION_ABORTED

守卫调用 `next(false)` 中止导航：

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(false) // 抛出 NAVIGATION_ABORTED
  } else {
    next()
  }
})
```

### NAVIGATION_CANCELLED

多种场景触发：

```ts
// 1. 守卫超时（超过 guardTimeout）
router.beforeEach(async (to, from, next) => {
  await verySlowOperation() // 超时
  next()
})

// 2. 守卫抛出未捕获异常
router.beforeEach(() => {
  throw new Error('守卫异常') // 转为 NAVIGATION_CANCELLED
})

// 3. 重定向超限（>10 次）
router.beforeEach((to, from, next) => {
  next({ name: 'a' }) // a → b → a → b ... 超过 10 次
})

// 4. back() 时栈不足
router.back(10) // 当前栈只有 3 层
```

### NAVIGATION_DUPLICATED

`push` 到当前已处于的页面（路径、名称、查询参数均相同）：

```ts
// 当前在 /pages/about/about
await router.push({ name: 'about' }) // 抛出 NAVIGATION_DUPLICATED
```

::: tip 仅 push 检测
`replace` / `relaunch` / `back` 不检测重复，可以跳转到当前位置。
:::

### ROUTE_NOT_FOUND

严格模式下使用未定义的命名路由：

```ts
const router = createRouter({ routes, strict: true })
await router.push({ name: 'not-exist' }) // 抛出 ROUTE_NOT_FOUND
```

### NAVIGATION_API_ERROR

uni 导航 API 调用失败，`cause` 携带原始错误信息：

```ts
// 小程序页面栈已达 10 层上限
await router.push({ name: 'page11' })
// 抛出 NAVIGATION_API_ERROR
// err.cause.api === 'navigateTo'
// err.cause.cause.errMsg 包含 'limit exceed'

router.onError((err) => {
  if (err.code === RouterErrorCode.NAVIGATION_API_ERROR) {
    if (String(err.cause?.cause.errMsg).includes('limit')) {
      // 页面栈溢出，改用 relaunch 重置栈
      await router.relaunch(err.to)
    }
  }
})
```

### PLUGIN_REQUIRED

使用了插件提供的功能但对应插件未注册。

```ts
// 未注册 ParamsPlugin 时使用 params
await router.push({ path: '/detail', params: { id: 123 } })
// → PLUGIN_REQUIRED

// 未注册 AnimationPlugin 时使用 animation
await router.push({ path: '/detail', animation: { type: 'fade-in' } })
// → PLUGIN_REQUIRED
```

**触发场景**：

| 功能 | 所需插件 |
| --- | --- |
| `params` / `persistent` | `ParamsPlugin` |
| `animation` | `AnimationPlugin` |
| `events` | `ChannelPlugin` |

**处理方式**：注册对应插件或使用 `router.hasPlugin()` 检查后再使用。详见[插件系统](../guide/plugins)。

### SETUP_ERROR

路由器初始化或使用方式错误，不可恢复：

```ts
// useRouter() 在 setup 外调用
const router = useRouter() // 抛出 SETUP_ERROR
```

## 错误处理策略

### 分级处理

```ts
router.onError((err) => {
  switch (err.code) {
    // 静默错误：不提示用户
    case RouterErrorCode.NAVIGATION_ABORTED:
    case RouterErrorCode.NAVIGATION_DUPLICATED:
      return

    // 可恢复错误：轻提示
    case RouterErrorCode.NAVIGATION_CANCELLED:
      uni.showToast({ title: '导航取消', icon: 'none' })
      return

    // 严重错误：弹窗提示
    case RouterErrorCode.ROUTE_NOT_FOUND:
    case RouterErrorCode.NAVIGATION_API_ERROR:
    case RouterErrorCode.PLUGIN_REQUIRED:
      uni.showModal({
        title: '出错了',
        content: err.message,
        showCancel: false
      })
      return

    // 初始化错误
    case RouterErrorCode.SETUP_ERROR:
      console.error('[初始化错误]', err)
      return
  }
})
```

### 全局 + 局部协作

```ts
// 全局：日志和埋点
router.onError((err, to, from) => {
  analytics.report({
    event: 'navigation_error',
    code: err.code,
    from: from?.path,
    to: to?.path
  })
})

// 局部：按钮 loading 状态
async function handleNavigate() {
  loading.value = true
  try {
    await router.push({ name: 'home' })
  } catch (err) {
    if (err.code === RouterErrorCode.NAVIGATION_DUPLICATED) return
  } finally {
    loading.value = false
  }
}
```

## 下一步

- [错误处理指南](../guide/error-handling) — 错误处理的深入讲解
- [Router 实例](./router-instance) — `onError` 方法
- [NavigationGuard 类型](./type-navigation-guard) — 守卫中抛出错误
