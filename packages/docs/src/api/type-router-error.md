# RouterError

路由器错误类型，封装导航过程中发生的各种错误。通过 `router.onError` 捕获，或通过 `try-catch` 处理。

## 类型定义

```ts
class RouterError extends Error {
  code: RouterErrorCode
  message: string
  to?: RouteLocationNormalized
  from?: RouteLocationNormalized
  cause?: unknown
}
```

## 属性

### code

- **类型**: [`RouterErrorCode`](#routererrorcode)
- **说明**: 错误码，标识错误类型

```ts
router.onError((err) => {
  switch (err.code) {
    case 'ROUTE_NOT_FOUND':
      uni.showToast({ title: '页面不存在', icon: 'none' })
      break
    case 'GUARD_TIMEOUT':
      uni.showToast({ title: '页面加载超时', icon: 'none' })
      break
    case 'NAVIGATION_ABORTED':
      // 用户主动中止，无需提示
      break
  }
})
```

### message

- **类型**: `string`
- **说明**: 错误描述信息

### to / from

- **类型**: `RouteLocationNormalized | undefined`
- **说明**: 发生错误时的目标路由和来源路由

```ts
router.onError((err) => {
  console.error(`导航错误: ${err.from?.path} → ${err.to?.path}`)
  console.error(`错误码: ${err.code}`)
  console.error(`错误信息: ${err.message}`)
})
```

### cause

- **类型**: `unknown`
- **说明**: 原始错误对象（如网络请求错误、JSON 解析错误等）

```ts
router.onError((err) => {
  if (err.cause instanceof Error) {
    console.error('原始错误:', err.cause.message)
  }
})
```

## RouterErrorCode

错误码枚举：

| 错误码 | 说明 | 触发场景 |
| --- | --- | --- |
| `ROUTE_NOT_FOUND` | 路由未找到 | 命名路由不存在，且 `strict: true` |
| `ROUTE_DUPLICATE` | 路由重复 | 同一命名路由被多次注册 |
| `GUARD_TIMEOUT` | 守卫超时 | 守卫在 `guardTimeout` 内未完成 |
| `GUARD_ABORTED` | 守卫中止 | 守卫返回 `false` 或抛出错误 |
| `NAVIGATION_ABORTED` | 导航中止 | 调用方主动中止或被其他守卫拦截 |
| `NAVIGATION_DUPLICATE` | 重复导航 | 同一目标正在导航中 |
| `PARAMS_INVALID` | 参数无效 | params 无法序列化 |
| `READY_TIMEOUT` | 就绪超时 | 路由器在 `readyTimeout` 内未就绪 |
| `INTERCEPT_ERROR` | 拦截器错误 | 拦截 uni 原生 API 时出错 |
| `UNKNOWN` | 未知错误 | 其他未分类错误 |

## 错误捕获方式

### router.onError（全局）

注册全局错误处理器，捕获所有导航错误：

```ts
router.onError((err, to, from) => {
  console.error('[导航错误]', {
    code: err.code,
    message: err.message,
    from: from?.path,
    to: to?.path
  })

  // 根据错误码处理
  switch (err.code) {
    case 'ROUTE_NOT_FOUND':
      uni.showToast({ title: '页面不存在', icon: 'none' })
      break
    case 'GUARD_TIMEOUT':
      uni.showToast({ title: '页面加载超时，请重试', icon: 'none' })
      break
    case 'NAVIGATION_ABORTED':
      // 用户主动中止，不提示
      break
    default:
      uni.showToast({ title: '页面跳转失败', icon: 'none' })
  }
})
```

### try-catch（局部）

`router.push()` / `router.replace()` / `router.back()` 返回 Promise，可通过 `try-catch` 捕获：

```ts
try {
  await router.push({ name: 'detail', query: { id: '1' } })
  // 导航成功
} catch (err) {
  // 导航失败
  if (err.code === 'ROUTE_NOT_FOUND') {
    uni.showToast({ title: '页面不存在', icon: 'none' })
  } else if (err.code === 'NAVIGATION_ABORTED') {
    // 用户主动中止，无需处理
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

## 错误处理策略

### 统一错误处理

```ts
// main.ts
router.onError((err) => {
  // 埋点上报
  trackError({
    code: err.code,
    message: err.message,
    path: err.to?.path
  })

  // 默认提示
  const messages: Record<string, string> = {
    ROUTE_NOT_FOUND: '页面不存在',
    GUARD_TIMEOUT: '页面加载超时',
    NAVIGATION_DUPLICATE: '请勿重复点击',
    PARAMS_INVALID: '参数错误'
  }

  const msg = messages[err.code] || '页面跳转失败'
  if (err.code !== 'NAVIGATION_ABORTED') {
    uni.showToast({ title: msg, icon: 'none' })
  }
})
```

### 分级错误处理

```ts
router.onError((err) => {
  // 严重错误：影响用户流程
  const severeErrors = ['ROUTE_NOT_FOUND', 'PARAMS_INVALID', 'INTERCEPT_ERROR']
  if (severeErrors.includes(err.code)) {
    uni.showModal({
      title: '出错了',
      content: err.message,
      showCancel: false
    })
    return
  }

  // 可恢复错误：提示后继续
  const recoverableErrors = ['GUARD_TIMEOUT', 'NAVIGATION_DUPLICATE']
  if (recoverableErrors.includes(err.code)) {
    uni.showToast({ title: err.message, icon: 'none' })
    return
  }

  // 静默错误：不提示
  const silentErrors = ['NAVIGATION_ABORTED', 'GUARD_ABORTED']
  if (silentErrors.includes(err.code)) {
    return
  }

  // 未知错误：默认提示
  console.error('[RouterError]', err)
  uni.showToast({ title: '未知错误', icon: 'none' })
})
```

### 特定场景处理

```ts
// 页面跳转按钮
async function handleNavigate() {
  try {
    await router.push({ name: 'detail', query: { id: '1' } })
  } catch (err) {
    if (err.code === 'NAVIGATION_ABORTED') {
      // 守卫中止，可能已重定向到登录页，无需处理
      return
    }
    if (err.code === 'NAVIGATION_DUPLICATE') {
      uni.showToast({ title: '正在跳转中...', icon: 'none' })
      return
    }
    // 其他错误已由全局 onError 处理
  }
}
```

## 常见错误场景

### ROUTE_NOT_FOUND

```ts
// 命名路由未注册
await router.push({ name: 'non-existent' })
// 抛出: { code: 'ROUTE_NOT_FOUND', message: 'Route "non-existent" not found' }

// strict: false 时仅警告，不抛错
const router = createRouter({ routes, strict: false })
await router.push({ name: 'non-existent' })
// 警告: [uni-router] Route "non-existent" not found, fallback to path
```

### GUARD_TIMEOUT

```ts
const router = createRouter({ routes, guardTimeout: 3000 })

router.beforeEach(async (to, from, next) => {
  // 模拟慢请求
  await new Promise(resolve => setTimeout(resolve, 5000))
  next()
})

await router.push({ name: 'about' })
// 3 秒后抛出: { code: 'GUARD_TIMEOUT', message: 'Guard timeout after 3000ms' }
```

### NAVIGATION_ABORTED

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(false)  // 中止导航
  } else {
    next()
  }
})

try {
  await router.push({ name: 'admin' })
} catch (err) {
  // err.code === 'NAVIGATION_ABORTED'
  console.log('导航被守卫中止')
}
```

### NAVIGATION_DUPLICATE

```ts
// 快速连续点击
async function handleClick() {
  try {
    await router.push({ name: 'detail' })
  } catch (err) {
    if (err.code === 'NAVIGATION_DUPLICATE') {
      // 同一目标正在导航中，忽略
      return
    }
    throw err
  }
}

// 模拟快速点击
handleClick()  // 开始导航
handleClick()  // 抛出 NAVIGATION_DUPLICATE
```

### PARAMS_INVALID

```ts
// 传递无法序列化的数据
const circular = { a: 1 }
circular.self = circular

try {
  await router.push({ name: 'detail', params: { data: circular } })
} catch (err) {
  // err.code === 'PARAMS_INVALID'
  console.error('参数无法序列化:', err.cause)
}
```

## 自定义错误

在守卫中抛出自定义错误：

```ts
class PermissionError extends Error {
  constructor(public requiredRole: string) {
    super(`需要 ${requiredRole} 权限`)
    this.name = 'PermissionError'
  }
}

router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    next(new PermissionError(to.meta.roles[0]))
    return
  }
  next()
})

router.onError((err) => {
  if (err.cause instanceof PermissionError) {
    uni.showModal({
      title: '权限不足',
      content: err.cause.message,
      showCancel: false
    })
  }
})
```

## 错误码速查表

| 错误码 | 严重程度 | 是否提示用户 | 常见原因 |
| --- | --- | --- | --- |
| `ROUTE_NOT_FOUND` | 高 | 是 | 路由名拼写错误、路由未注册 |
| `ROUTE_DUPLICATE` | 中 | 否 | 路由配置重复 |
| `GUARD_TIMEOUT` | 中 | 是 | 守卫中异步操作过慢 |
| `GUARD_ABORTED` | 低 | 否 | 守卫主动中止（正常行为） |
| `NAVIGATION_ABORTED` | 低 | 否 | 守卫中止或重定向 |
| `NAVIGATION_DUPLICATE` | 低 | 否 | 重复点击导航按钮 |
| `PARAMS_INVALID` | 高 | 是 | params 含循环引用等 |
| `READY_TIMEOUT` | 高 | 是 | 路由器初始化失败 |
| `INTERCEPT_ERROR` | 高 | 是 | 拦截器配置错误 |
| `UNKNOWN` | 高 | 是 | 未分类错误 |

## 下一步

- [错误处理指南](../guide/error-handling) — 错误处理的深入讲解
- [Router 实例](./router-instance) — `onError` 方法
- [NavigationGuard 类型](./type-navigation-guard) — 守卫中抛出错误
