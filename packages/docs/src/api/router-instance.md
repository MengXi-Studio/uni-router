# Router 实例

`createRouter()` 返回的路由器实例，提供路由导航、守卫注册和状态查询能力。

## 属性

### currentRoute

- **类型**: `Readonly<RouteLocation>`
- **说明**: 当前路由位置（只读）

```ts
router.currentRoute.path
router.currentRoute.query
router.currentRoute.meta
router.currentRoute.fullPath
```

## 方法

### push()

导航到新页面。

```ts
push(location: RouteLocationRaw): Promise<RouteLocation>
```

- 普通页面 → `uni.navigateTo`
- TabBar 页面 → `uni.switchTab`
- 重复导航时抛出 `NAVIGATION_DUPLICATED`

```ts
await router.push('pages/about/about')
await router.push({ path: 'pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
```

### replace()

替换当前页面。

```ts
replace(location: RouteLocationRaw): Promise<RouteLocation>
```

- 普通页面 → `uni.redirectTo`
- TabBar 页面 → `uni.switchTab`

```ts
await router.replace('pages/login/login')
await router.replace({ name: 'login' })
```

### back()

返回上一页或多级页面。

```ts
back(delta?: number): Promise<void>
```

- **delta**: 返回的页面数，默认为 1
- 页面栈不足时输出警告并立即 resolve

```ts
await router.back()
await router.back(2)
```

### beforeEach()

注册全局前置守卫。

```ts
beforeEach(guard: NavigationGuard): () => void
```

- **返回值**: 用于移除此守卫的函数

```ts
const remove = router.beforeEach((to, from, next) => {
  next()
})
remove()
```

### beforeResolve()

注册全局解析守卫。

```ts
beforeResolve(guard: NavigationGuard): () => void
```

### afterEach()

注册全局后置钩子。

```ts
afterEach(guard: PostNavigationGuard): () => void
```

```ts
router.afterEach((to, from) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### getRoutes()

获取所有已注册的路由配置列表。

```ts
getRoutes(): RouteConfig[]
```

- **返回值**: 路由配置数组的浅拷贝

### hasRoute()

检查是否存在指定名称的路由。

```ts
hasRoute(name: string): boolean
```

### resolve()

解析路由位置为完整的 `RouteLocation` 对象，不执行导航。

```ts
resolve(location: RouteLocationRaw): RouteLocation
```

```ts
const location = router.resolve({ name: 'about', query: { id: '1' } })
console.log(location.fullPath)
```

### isReady()

等待路由器初始化完成。

```ts
isReady(): Promise<void>
```

### onError()

注册路由错误处理回调。

```ts
onError(handler: RouterOnError): () => void
```

```ts
router.onError((error, to, from) => {
  console.error(error.code, error.message)
})
```

### install()

安装路由器到 Vue 应用实例（由 `app.use(router)` 内部调用）。

```ts
install(app: unknown): void
```
