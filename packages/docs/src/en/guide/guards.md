# Route Guards

Uni Router provides a complete route guard mechanism, allowing you to intercept, validate, and redirect during navigation.

## Guard Types

| Guard           | Registration             | Timing                     | Can Abort | Can Redirect |
| --------------- | ------------------------ | -------------------------- | --------- | ------------ |
| `beforeEach`    | `router.beforeEach()`    | Before navigation          | ✅        | ✅           |
| `beforeEnter`   | Defined in RouteConfig   | After beforeEach           | ✅        | ✅           |
| `beforeResolve` | `router.beforeResolve()` | After all before guards    | ✅        | ✅           |
| `afterEach`     | `router.afterEach()`     | After navigation completes | ❌        | ❌           |

## beforeEach

Global before guard, executed before each navigation. Commonly used for permission checks, login verification, etc.:

```ts
const removeGuard = router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' })
	} else {
		next()
	}
})

// Remove the guard
removeGuard()
```

### next() Usage

- `next()` — Allow navigation
- `next(false)` — Abort navigation
- `next(location)` — Redirect to a new location

::: warning
Each guard must call `next()` exactly once. Multiple calls or no call will cause navigation to hang.
If a guard neither calls `next()` nor returns a rejected Promise within the timeout period
(default 10 seconds, configurable via `guardTimeout`), the navigation will be automatically aborted
with a warning.
:::

### Async Guards

Guard functions support async operations:

```ts
router.beforeEach(async (to, from, next) => {
	const isAuth = await checkAuthStatus()
	if (to.meta.requireAuth && !isAuth) {
		next({ name: 'login' })
	} else {
		next()
	}
})
```

::: tip
If guards contain time-consuming async operations (e.g., network requests),
you can increase the timeout via the `guardTimeout` option to avoid false timeout detection.
:::

## beforeEnter

Per-route guard, defined in `RouteConfig`, triggered only when entering that route:

### Single Guard

```ts
const routes = [
	{
		path: 'pages/admin/admin',
		name: 'admin',
		beforeEnter: (to, from, next) => {
			if (isAdmin()) {
				next()
			} else {
				next(false)
			}
		}
	}
]
```

### Multiple Guards

```ts
const routes = [
	{
		path: 'pages/admin/admin',
		name: 'admin',
		beforeEnter: [checkAuthGuard, checkAdminGuard]
	}
]
```

Multiple guards execute in order. If any guard aborts or redirects, subsequent guards are skipped.

## beforeResolve

Global resolve guard, executed after all before guards and per-route guards have completed. Suitable for operations before navigation is finally confirmed:

```ts
router.beforeResolve((to, from, next) => {
	// All before guards have passed, navigation is about to execute
	next()
})
```

## afterEach

Global after hook, executed after navigation completes. Cannot abort navigation. Suitable for logging, page title setting, etc.:

```ts
router.afterEach((to, from) => {
	if (to.meta.title) {
		uni.setNavigationBarTitle({ title: to.meta.title as string })
	}
})
```

::: tip
Exceptions in `afterEach` do not affect navigation results, but you should avoid throwing errors in hooks.
:::

## Guard Execution Order

The guard execution order during a complete navigation flow:

```
push('/about')
  │
  ├─ 1. beforeEach (global before guards)
  │     ├─ Guard A → next()
  │     └─ Guard B → next()
  │
  ├─ 2. beforeEnter (per-route guards)
  │     ├─ Guard C → next()
  │     └─ Guard D → next()
  │
  ├─ 3. beforeResolve (global resolve guards)
  │     └─ Guard E → next()
  │
  ├─ 4. uni.navigateTo() / uni.switchTab()
  │
  └─ 5. afterEach (global after hooks)
        └─ Hook F
```

## Redirect

Calling `next(location)` in a guard redirects to a new location, triggering a new navigation flow:

```ts
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})
```

::: warning
Redirects trigger a new navigation flow, including re-executing all guards.
To prevent infinite loops, the maximum redirect depth is 10.
Exceeding this limit cancels the navigation and throws a `NAVIGATION_CANCELLED` error.
:::

## Aborting Navigation

Calling `next(false)` in a guard aborts the current navigation:

```ts
router.beforeEach((to, from, next) => {
	if (isMaintenanceMode()) {
		next(false)
	} else {
		next()
	}
})
```

When navigation is aborted, a `NAVIGATION_ABORTED` error is thrown, which can be caught via `router.onError()`.

## Intercepting uni Native Navigation APIs

By default, directly calling `uni.navigateTo()`, `uni.redirectTo()`, and other native APIs bypasses route guards. By enabling the `interceptUniApi` option, these calls are intercepted and redirected through the router:

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true
})
```

When enabled, the following calls will be intercepted and go through the full guard chain:

```ts
// Intercepted, converted to router.push({ path: '/pages/about/about', query: { id: '1' } })
uni.navigateTo({ url: '/pages/about/about?id=1' })

// Intercepted, converted to router.replace({ path: '/pages/about/about' })
uni.redirectTo({ url: '/pages/about/about' })

// Intercepted, converted to router.push('/pages/user/user')
uni.switchTab({ url: '/pages/user/user' })

// Intercepted, converted to router.relaunch({ path: '/pages/index/index' })
uni.reLaunch({ url: '/pages/index/index' })

// Intercepted, converted to router.back(1)
uni.navigateBack({ delta: 1 })
```

::: warning
When interception is enabled, `success` / `fail` callbacks of direct uni native API calls will not be triggered.
It is recommended to use `router.push()` / `router.replace()` / `router.back()` for navigation consistently.
:::

## Guard Error Handling

If a guard function throws an exception or returns a rejected Promise, the navigation is cancelled:

```ts
router.beforeEach(async (to, from, next) => {
	try {
		await someAsyncOperation()
		next()
	} catch (error) {
		// Exception causes navigation to be cancelled (NAVIGATION_CANCELLED)
		next(false)
	}
})
```
