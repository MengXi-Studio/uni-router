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

返回上一页或多级页面，执行完整的导航守卫链。

```ts
back(delta?: number): Promise<void>
```

- **delta**: 返回的页面数，默认为 1
- 执行 `beforeEach` → `beforeResolve` 守卫链，守卫可中止或重定向返回操作
- 页面栈不足时抛出 `NavigationFailure`（`NAVIGATION_CANCELLED`）
- 守卫中止时抛出 `NavigationFailure`

```ts
await router.back()
await router.back(2)
```

::: warning
`back()` 仅拦截编程式调用。物理返回键和浏览器后退直接触发原生 `navigateBack`，
不经过路由器，因此守卫无法拦截。对于原生返回，需在页面 `onShow` 中调用 `syncRoute()` 同步状态，
并在 `afterEach` 中做事后处理。
:::

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

::: tip
`afterEach` 仅在完整导航（经过前置守卫）完成后触发。通过 `syncRoute()` / `syncCurrentRoute()`
进行的状态同步不会触发 `afterEach`，但会通知 `onRouteChange` 监听器。
:::

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

### onRouteChange()

注册路由变化监听器。

```ts
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void
```

- **返回值**: 用于移除此监听器的函数

当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。与 `afterEach` 不同，此方法用于订阅路由状态变化，不参与导航流程控制。

```ts
const remove = router.onRouteChange((to, from) => {
	console.log('路由变化:', from.path, '→', to.path)
	// 可通过 to._synced 区分完整导航和状态同步
	if (to._synced) {
		console.log('状态同步（非完整导航）')
	}
})
remove()
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

### syncRoute()

同步路由状态与实际页面栈。

```ts
syncRoute(): void
```

当页面通过浏览器后退、物理返回键等非路由器方式切换时，路由器的 `currentRoute` 可能与实际页面不同步。调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。

建议在每个页面的 `onShow` 生命周期中调用此方法。

```ts
// 页面中
onShow(() => {
	router.syncRoute()
})
```

### install()

安装路由器到 Vue 应用实例（由 `app.use(router)` 内部调用）。

```ts
install(app: App): void
```

安装时会注册以下内容：

- **`$router`** — 全局属性，可通过 `this.$router` 访问路由器实例
- **`$route`** — 全局属性（计算属性），可通过 `this.$route` 访问当前路由位置
- **provide** — 通过 `provide(ROUTER_SYMBOL, router)` 注入路由器实例，使 `useRouter()` / `useRoute()` 可用
