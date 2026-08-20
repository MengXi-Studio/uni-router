# NavigationGuard

导航守卫函数类型，用于在导航发生前/后执行校验、重定向、埋点等逻辑。

## 类型定义

```ts
type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | Error | null

type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => NavigationGuardReturn | Promise<NavigationGuardReturn>
```

### 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `to` | `RouteLocationNormalized` | 即将进入的目标路由 |
| `from` | `RouteLocationNormalized` | 当前离开的路由 |

### 返回值

守卫通过返回值控制导航流向：

```ts
router.beforeEach(async (to, from) => {
  if (isLoggedIn()) return true
  return { name: 'login' }
})
```

### 抛出错误

```ts
// 抛出错误
throw new Error('权限不足')
// 或
return new Error('权限不足')
```

错误会被 `router.onError` 捕获，并中止导航。

## 守卫类型分类

### 全局前置守卫

```ts
const removeGuard = router.beforeEach((to, from) => {
  // 权限校验、登录检查、埋点等
  if (to.meta.requireAuth && !isLoggedIn()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
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
    beforeEnter: (to, from) => {
      if (hasRole('admin')) return true
      return { name: '403' }
    }
  }
]
```

详见 [RouteConfig.beforeEnter](./type-route-config#beforeenter)。

### 组件内离开守卫

通过 `onBeforeRouteLeave` 在组件 `<script setup>` 中注册离开守卫，组件卸载时自动移除：

```ts
type RouteLeaveGuard = (to: RouteLocation, from: RouteLocation) => NavigationGuardReturn | Promise<NavigationGuardReturn>
```

```ts
import { onBeforeRouteLeave } from '@meng-xi/uni-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges()) {
    uni.showModal({
      title: '提示',
      content: '有未保存的修改，确定离开吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户确认离开，放行
          return true
        }
      }
    })
    return false // 中止导航
  }
  return true
})
```

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
type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | Error | null
```

| 返回值 | 说明 |
| --- | --- |
| `undefined` / `void` | 放行 |
| `null` | 放行 |
| `true` | 放行 |
| `false` | 中止 |
| `RouteLocationRaw` | 重定向 |
| `Error` | 抛出错误，中止导航 |

```ts
// 放行
router.beforeEach(() => {})

// 中止
router.beforeEach(() => false)

// 重定向（push）
router.beforeEach(() => ({ name: 'login' }))

// 重定向（replace）
router.beforeEach(() => ({ name: 'login' }))

// 抛出错误
router.beforeEach(() => {
  return new Error('权限不足')
})
```

## 实战示例

### 登录校验

```ts
router.beforeEach((to, from) => {
  const isLoggedIn = !!uni.getStorageSync('token')

  if (to.meta.requireAuth && !isLoggedIn) {
    // 重定向到登录页，使用 replace 避免返回到受保护页
    return { name: 'login', query: { redirect: to.fullPath } }
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

router.beforeEach((to, from) => {
  if (isNavigating) {
    return false
  }
  isNavigating = true
  return true
})

router.afterEach(() => {
  isNavigating = false
})
```

## 常见问题

### 守卫中可以访问组件实例吗？

- `beforeEach` / `beforeResolve`：**不可以**，此时目标组件尚未创建
- `afterEach`：**不可以**，但可以通过 `getCurrentPages()` 获取页面实例
- `beforeRouteEnter`：**不支持**，该守卫已从核心库中移除，请使用其他守卫替代

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