# Router Instance

The router instance returned by `createRouter()`, providing route navigation, guard registration, and state query capabilities.

## Properties

### currentRoute

- **Type**: `Readonly<RouteLocation>`
- **Description**: Current route location (read-only)

```ts
router.currentRoute.path
router.currentRoute.query
router.currentRoute.meta
router.currentRoute.fullPath
```

## Methods

### push()

Navigate to a new page.

```ts
push(location: RouteLocationRaw): Promise<RouteLocation>
```

- Regular page → `uni.navigateTo`
- TabBar page → `uni.switchTab`
- Throws `NAVIGATION_DUPLICATED` on duplicate navigation

```ts
await router.push('pages/about/about')
await router.push({ path: 'pages/about/about', query: { id: '1' } })
await router.push({ name: 'about' })
```

### replace()

Replace the current page.

```ts
replace(location: RouteLocationRaw): Promise<RouteLocation>
```

- Regular page → `uni.redirectTo`
- TabBar page → `uni.switchTab`

```ts
await router.replace('pages/login/login')
await router.replace({ name: 'login' })
```

### relaunch()

Close all pages and open the target page.

```ts
relaunch(location: RouteLocationRaw): Promise<RouteLocation>
```

- Regular page → `uni.reLaunch`
- TabBar page → `uni.switchTab`
- No duplicate navigation detection (the target page may be the current page in stack-clearing scenarios)
- `uni.reLaunch` does not support animation parameters; a warning is output when provided

```ts
await router.relaunch('pages/index/index')
await router.relaunch({ name: 'home' })
await router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

### back()

Go back to the previous page or multiple pages, executing the full navigation guard chain.

```ts
back(delta?: number, animation?: NavigationAnimation): Promise<void>
```

- **delta**: Number of pages to go back, defaults to 1
- **animation**: Navigation animation (App only), overrides `meta.animation`. Falls back to the target page's `meta.animation` when not specified
- Executes `beforeEach` → `beforeResolve` guard chain; guards can abort or redirect the back operation
- Throws `NavigationFailure` (`NAVIGATION_CANCELLED`) when page stack is insufficient
- Throws `NavigationFailure` when guards abort the navigation

```ts
await router.back()
await router.back(2)
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

::: warning
`back()` only intercepts programmatic calls. Physical back button and browser back directly trigger
native `navigateBack`, bypassing the router, so guards cannot intercept them.
For native back, call `syncRoute()` in the page's `onShow` to sync state, and handle post-processing
in `afterEach`.
:::

### beforeEach()

Register a global before guard.

```ts
beforeEach(guard: NavigationGuard): () => void
```

- **Returns**: A function to remove this guard

```ts
const remove = router.beforeEach((to, from, next) => {
	next()
})
remove()
```

### beforeResolve()

Register a global resolve guard.

```ts
beforeResolve(guard: NavigationGuard): () => void
```

### afterEach()

Register a global after hook.

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
`afterEach` is only triggered after a complete navigation (through before guards).
State synchronization via `syncRoute()` / `syncCurrentRoute()` does not trigger `afterEach`,
but will notify `onRouteChange` listeners.
:::

### getRoutes()

Get all registered route configurations.

```ts
getRoutes(): RouteConfig[]
```

- **Returns**: Shallow copy of the route config array

### hasRoute()

Check if a route with the given name exists.

```ts
hasRoute(name: string): boolean
```

### resolve()

Resolve a route location to a full `RouteLocation` object without executing navigation.

```ts
resolve(location: RouteLocationRaw): RouteLocation
```

```ts
const location = router.resolve({ name: 'about', query: { id: '1' } })
console.log(location.fullPath)
```

### isReady()

Wait for the router to be initialized.

```ts
isReady(): Promise<void>
```

### onRouteChange()

Register a route change listener.

```ts
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void
```

- **Returns**: A function to remove this listener

The listener is called when the route state changes (including navigation completion and state synchronization). Unlike `afterEach`, this method subscribes to route state changes and does not participate in navigation
flow control.

```ts
const remove = router.onRouteChange((to, from) => {
	console.log('Route changed:', from.path, '→', to.path)
	// Can distinguish complete navigation from state sync via to._synced
	if (to._synced) {
		console.log('State sync (not a complete navigation)')
	}
})
remove()
```

### onError()

Register a route error handler callback.

```ts
onError(handler: RouterOnError): () => void
```

```ts
router.onError((error, to, from) => {
	console.error(error.code, error.message)
})
```

### syncRoute()

Synchronize route state with the actual page stack.

```ts
syncRoute(): void
```

When a page is switched via browser back, physical back button, or other non-router methods, the router's `currentRoute` may be out of sync with the actual page. Calling this method reads the current page info from the
uni-app page stack and updates the route state.

It is recommended to call this method in each page's `onShow` lifecycle.

```ts
// In a page
onShow(() => {
	router.syncRoute()
})
```

### install()

Install the router to a Vue app instance (called internally by `app.use(router)`).

```ts
install(app: App): void
```

The installation registers the following:

- **`$router`** — Global property, accessible via `this.$router`
- **`$route`** — Global property (computed), accessible via `this.$route` for current route location
- **provide** — Injects the router instance via `provide(ROUTER_SYMBOL, router)`, enabling `useRouter()` / `useRoute()`
