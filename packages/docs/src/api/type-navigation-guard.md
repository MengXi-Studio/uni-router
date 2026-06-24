# NavigationGuard

导航守卫函数类型，用于在导航发生前/后执行校验、重定向、埋点等逻辑。

## 类型定义

```ts
type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void | boolean | RouteLocationRaw>
```

### 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `to` | `RouteLocationNormalized` | 即将进入的目标路由 |
| `from` | `RouteLocationNormalized` | 当前离开的路由 |
| `next` | `NavigationGuardNext` | 控制导航流向的回调函数 |

### 返回值

守卫支持两种写法：

1. **回调式**：通过 `next()` 控制
2. **Promise 式**：直接返回值，路由器自动处理

```ts
// 回调式
router.beforeEach((to, from, next) => {
  if (isLoggedIn()) next()
  else next({ name: 'login' })
})

// Promise 式（推荐）
router.beforeEach(async (to, from) => {
  if (isLoggedIn()) return true
  return { name: 'login' }
})
```

::: tip 推荐使用 Promise 式
- 更符合 async/await 风格，代码更清晰
- 避免忘记调用 `next()` 导致导航挂起
- 异常会自动转为 `next(false)`，无需 try-catch
:::

## NavigationGuardNext

控制导航流向的回调函数，支持多种调用形式：

```ts
type NavigationGuardNext = {
  (): void                                              // 放行
  (valid: boolean): void                                // true=放行，false=中止
  (location: RouteLocationRaw): void                    // 重定向
  (location: RouteLocationRaw, options: NavigationGuardNextOptions): void  // 重定向 + 选项
  (error: Error): void                                  // 抛出错误
  (cb: (vm: ComponentPublicInstance) => void): void     // 访问组件实例
}
```

### 放行

```ts
next()        // 回调式
return true   // Promise 式
```

### 中止

中止导航，停留在当前页面：

```ts
next(false)        // 回调式
return false       // Promise 式
```

### 重定向

重定向到其他路由：

```ts
// 基础重定向（默认使用 push 方式）
next({ name: 'login' })
next('/pages/login/login')
next({ path: '/pages/login/login', query: { redirect: to.fullPath } })

// Promise 式
return { name: 'login' }
```

### 重定向 + 选项（v1.7.0+）

通过 `NavigationGuardNextOptions` 控制重定向方式：

```ts
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode  // 'push' | 'replace' | 'relaunch'
}

type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

```ts
// 替换模式：重定向后不保留当前页在栈中
next({ name: 'login' }, { mode: 'replace' })

// 重启模式：清空页面栈
next({ name: 'home' }, { mode: 'relaunch' })

// Promise 式（通过返回对象）
return {
  location: { name: 'login' },
  mode: 'replace'
}
```

::: tip mode 的应用场景
- **`push`（默认）**：常规重定向，保留当前页在栈中
- **`replace`**：登录重定向（避免返回到受保护页）、表单提交后跳转
- **`relaunch`**：退出登录、切换用户、回到首页

详见 [守卫重定向方式](../guide/guards#重定向方式控制)。
:::

### 抛出错误

```ts
next(new Error('权限不足'))
// Promise 式
throw new Error('权限不足')
```

错误会被 `router.onError` 捕获，并中止导航。

### 访问组件实例

```ts
next((vm) => {
  // vm 是目标页面组件实例
  vm.fetchData()
})
```

::: warning 限制
此形式仅 `beforeRouteEnter` 守卫支持（uni-app 中较少使用，因为页面是独立组件）。`beforeEach` / `beforeResolve` / `afterEach` 不支持。
:::

## 守卫类型分类

### 全局前置守卫

```ts
const removeGuard = router.beforeEach((to, from, next) => {
  // 权限校验、登录检查、埋点等
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login', query: { redirect: to.fullPath } }, { mode: 'replace' })
  } else {
    next()
  }
})

// 移除守卫
removeGuard()
```

### 全局解析守卫

在 `beforeEach` 和 `beforeEnter` 之后执行，常用于等待异步数据加载完成：

```ts
router.beforeResolve(async (to) => {
  if (to.meta.preload) {
    await store.preloadData(to.meta.preload)
  }
  return true
})
```

### 全局后置钩子

导航完成后执行，**不接受 `next` 参数**，无法改变导航流向：

```ts
router.afterEach((to, from) => {
  // 设置标题
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
  // 页面埋点
  trackPageView(to.path)
})
```

### 路由独享守卫

通过 `RouteConfig.beforeEnter` 配置，仅对该路由生效：

```ts
const routes = [
  {
    path: 'pages/admin/admin',
    name: 'admin',
    beforeEnter: (to, from, next) => {
      if (hasRole('admin')) next()
      else next({ name: '403' })
    }
  }
]
```

详见 [RouteConfig.beforeEnter](./type-route-config#beforeenter)。

## 执行顺序

完整导航的守卫执行顺序：

```
1. beforeEach（全局前置守卫，按注册顺序）
   ↓
2. beforeEnter（路由独享守卫，按数组顺序）
   ↓
3. beforeResolve（全局解析守卫，按注册顺序）
   ↓
4. 导航确认，执行 uni 原生跳转
   ↓
5. afterEach（全局后置钩子，按注册顺序）
```

::: warning 守卫中止后的行为
- 任一守卫返回 `false` 或抛出错误：导航中止，后续守卫不执行
- 任一守卫返回重定向：重新走完整流程（从 `beforeEach` 开始）
- `afterEach` 不受影响：仅在导航确认后执行，无法中止
:::

## Promise 式返回值

```ts
type GuardResult = void | boolean | RouteLocationRaw | {
  location: RouteLocationRaw
  mode?: NavigationRedirectMode
}
```

| 返回值 | 等价于 next() | 说明 |
| --- | --- | --- |
| `undefined` / `void` | `next()` | 放行 |
| `true` | `next()` | 放行 |
| `false` | `next(false)` | 中止 |
| `RouteLocationRaw` | `next(RouteLocationRaw)` | 重定向（push） |
| `{ location, mode }` | `next(location, { mode })` | 重定向 + 方式控制 |

```ts
// 放行
router.beforeEach(() => {})

// 中止
router.beforeEach(() => false)

// 重定向（push）
router.beforeEach(() => ({ name: 'login' }))

// 重定向（replace）
router.beforeEach(() => ({
  location: { name: 'login' },
  mode: 'replace'
}))
```

## 实战示例

### 登录校验

```ts
router.beforeEach((to, from) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // 重定向到登录页，使用 replace 避免返回到受保护页
    return {
      location: { name: 'login', query: { redirect: to.fullPath } },
      mode: 'replace'
    }
  }

  return true
})
```

### 权限校验

```ts
// 类型增强
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

router.beforeEach((to) => {
  if (to.meta.roles) {
    const userRoles = getUserRoles()
    if (!to.meta.roles.some(r => userRoles.includes(r))) {
      uni.showToast({ title: '无权访问', icon: 'none' })
      return false
    }
  }
  return true
})
```

### 异步数据预加载

```ts
router.beforeResolve(async (to) => {
  if (to.name === 'detail') {
    try {
      await store.fetchDetail(to.query.id)
    } catch (err) {
      uni.showToast({ title: '加载失败', icon: 'none' })
      return false
    }
  }
  return true
})
```

### 页面埋点

```ts
declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    trackName?: string
  }
}

router.afterEach((to, from) => {
  if (to.meta.trackName) {
    trackPageView(to.meta.trackName, {
      from: from.path,
      to: to.path,
      duration: Date.now() - pageStartTime
    })
  }
  pageStartTime = Date.now()
})
```

### 动态标题

```ts
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  uni.setNavigationBarTitle({ title: title || '默认标题' })
})
```

### 防止重复导航

```ts
let isNavigating = false

router.beforeEach((to, from, next) => {
  if (isNavigating) {
    next(false)
    return
  }
  isNavigating = true
  next()
})

router.afterEach(() => {
  isNavigating = false
})
```

## 常见问题

### 忘记调用 next() 会怎样？

守卫超时后（默认 10 秒，可通过 `guardTimeout` 配置）会自动中止导航并输出警告：

```
[uni-router] Guard timeout after 10000ms, navigation aborted
```

::: tip 解决方案
- 使用 Promise 式，避免忘记调用 `next()`
- 调整 `guardTimeout` 适配异步操作
- 检查守卫中的所有分支是否都调用了 `next()`
:::

### 守卫中可以访问组件实例吗？

- `beforeEach` / `beforeResolve`：**不可以**，此时目标组件尚未创建
- `afterEach`：**不可以**，但可以通过 `getCurrentPages()` 获取页面实例
- `beforeRouteEnter`：可以通过 `next((vm) => {...})` 访问

### 守卫中抛出异常会怎样？

异常会被 `router.onError` 捕获，并中止当前导航：

```ts
router.onError((err, to, from) => {
  console.error('导航错误:', err)
  uni.showToast({ title: '页面加载失败', icon: 'none' })
})

router.beforeEach(async (to) => {
  if (to.meta.requireAuth) {
    const user = await fetchUser()  // 可能抛出网络错误
    if (!user) return { name: 'login' }
  }
  return true
})
```

## 下一步

- [路由守卫指南](../guide/guards) — 守卫的深入讲解
- [Router 实例](./router-instance) — 注册守卫的方法
- [RouterError 类型](./type-router-error) — 错误处理
