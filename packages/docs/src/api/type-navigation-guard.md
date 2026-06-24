# NavigationGuard

导航守卫相关类型定义。

## NavigationGuard

前置导航守卫函数类型。

```ts
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation,
  next: NavigationGuardNext
) => void | Promise<void>
```

### 参数

- **to**: 即将进入的目标路由
- **from**: 当前导航正要离开的路由
- **next**: 必须调用以 resolve 此守卫

### 示例

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## NavigationGuardNext

守卫的 `next` 回调函数类型。

```ts
type NavigationGuardNext = (
  to?: RouteLocationRaw | false,
  options?: NavigationGuardNextOptions
) => void
```

### 参数

- **to**: 传入 `false` 中断导航，传入路由位置重定向，不传参数则放行
- **options**: 重定向选项，仅在传入 `to`（路由位置）重定向时生效

### 调用方式

| 调用 | 效果 |
|------|------|
| `next()` | 放行导航 |
| `next(false)` | 中止导航 |
| `next(location)` | 重定向到新位置（沿用原始导航方式） |
| `next(location, { mode })` | 重定向到新位置，并指定导航方式 |

::: warning
每个守卫必须且只能调用一次 `next()`。
:::

## NavigationGuardNextOptions

`next()` 回调的可选参数类型，用于控制重定向行为。

```ts
interface NavigationGuardNextOptions {
  mode?: NavigationRedirectMode
}
```

### 属性

- **mode**: 重定向使用的导航方式。未指定时沿用触发守卫的原始导航方式（`push` / `replace` / `relaunch`）；原始导航为 `back` 时回退为 `relaunch`。

## NavigationRedirectMode

重定向方式类型，对应路由器的导航方法。

```ts
type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'
```

### 取值

| 值 | 对应方法 | uni API | 说明 |
|----|----------|---------|------|
| `'push'` | `router.push()` | `uni.navigateTo` | 保留当前页面，跳转到新页面 |
| `'replace'` | `router.replace()` | `uni.redirectTo` | 关闭当前页面，跳转到新页面 |
| `'relaunch'` | `router.relaunch()` | `uni.reLaunch` | 关闭所有页面，打开新页面 |

### 示例

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // 无论原导航是 push 还是 replace，强制用 replace 重定向到登录页
    // 避免登录页之后出现多余的历史页面
    next({ name: 'login' }, { mode: 'replace' })
  } else {
    next()
  }
})
```

## PostNavigationGuard

后置导航钩子函数类型。

```ts
type PostNavigationGuard = (
  to: RouteLocation,
  from: RouteLocation
) => void
```

### 参数

- **to**: 已进入的目标路由
- **from**: 离开的路由

### 示例

```ts
router.afterEach((to, from) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```
