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
type NavigationGuardNext = (to?: RouteLocationRaw | false) => void
```

### 调用方式

| 调用 | 效果 |
|------|------|
| `next()` | 放行导航 |
| `next(false)` | 中止导航 |
| `next(location)` | 重定向到新位置 |

::: warning
每个守卫必须且只能调用一次 `next()`。
:::

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
