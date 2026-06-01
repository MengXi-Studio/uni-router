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

### back()

Go back to the previous page or multiple pages.

```ts
back(delta?: number): Promise<void>
```

- **delta**: Number of pages to go back, defaults to 1
- Outputs warning and resolves immediately if page stack is insufficient

```ts
await router.back()
await router.back(2)
```

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

### install()

Install the router to a Vue app instance (called internally by `app.use(router)`).

```ts
install(app: unknown): void
```

The installation registers the following:

- **`$router`** — Global property, accessible via `this.$router`
- **`$route`** — Global property (computed), accessible via `this.$route` for current route location
- **provide** — Injects the router instance via `provide(ROUTER_SYMBOL, router)`, enabling `useRouter()` / `useRoute()`
