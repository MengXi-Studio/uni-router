# Navigation

Uni Router provides four navigation methods, corresponding to uni-app's native navigation APIs.

## push()

Navigate to a new page. Automatically selects the uni API based on the target page's `meta.isTab`:

- Regular page → `uni.navigateTo`
- TabBar page → `uni.switchTab`

```ts
router.push('pages/about/about')
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
router.push({ name: 'about' })
router.push({ name: 'about', query: { id: '1' } })
```

### Duplicate Navigation Detection

When `push()` navigates to the same path as the current page, a `NAVIGATION_DUPLICATED` error is thrown:

```ts
try {
	await router.push('/pages/index/index')
} catch (error) {
	if (error.code === 'NAVIGATION_DUPLICATED') {
		console.log('Already on this page')
	}
}
```

::: tip
You can use `router.onError()` to globally catch such errors, avoiding the need for try-catch on every call.
:::

### TabBar Page Notes

When navigating to a TabBar page, `uni.switchTab` does not support query parameters. If query params are provided, a warning is output and they are ignored:

```ts
router.push({ name: 'user', query: { tab: 'settings' } })
// ⚠️ Warning: uni.switchTab does not support query parameters. They will be ignored.
```

## replace()

Replace the current page. Automatically selects the uni API based on the target page's `meta.isTab`:

- Regular page → `uni.redirectTo`
- TabBar page → `uni.switchTab`

```ts
router.replace('pages/login/login')
router.replace({ name: 'login' })
router.replace({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: warning
When replacing to a TabBar page, `uni.switchTab` closes all non-tab pages instead of just replacing
the current page. This behavior is determined by the uni-app framework.
:::

## relaunch()

Close all pages and open the target page. Automatically selects the uni API based on the target page's `meta.isTab`:

- Regular page → `uni.reLaunch`
- TabBar page → `uni.switchTab`

Commonly used for scenarios like redirecting to the login page after logout, returning to the home page from a deep page, or resetting the entire page stack.

```ts
router.relaunch('pages/index/index')
router.relaunch({ name: 'home' })
router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: info
`relaunch()` does not perform duplicate navigation detection. In stack-clearing scenarios, the target page may be the current page (e.g., "return to home"), so it should not be rejected.
:::

::: warning
`uni.reLaunch` does not support animation parameters. If an animation parameter is provided, a warning is output and it is ignored:

```ts
router.relaunch({ path: 'pages/index/index', animation: { type: 'fade-in' } })
// ⚠️ Warning: uni.reLaunch does not support animation parameters. The animation option will be ignored.
```
:::

## back()

Go back to the previous page or multiple pages, executing the full navigation guard chain, corresponding to `uni.navigateBack`:

```ts
router.back() // Go back one page
router.back(2) // Go back two pages
router.back(1, { type: 'slide-out-right', duration: 500 }) // Go back with animation
```

### Guard Execution

`back()` executes the full guard chain (`beforeEach` → `beforeResolve`), guards can abort or redirect the back operation:

```ts
router.beforeEach((to, from, next) => {
	// Guards are also triggered on back
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' }) // Redirect to login page
	} else {
		next()
	}
})
```

### Error Handling

- Throws `NavigationFailure` (`NAVIGATION_CANCELLED`) when page stack is insufficient
- Throws `NavigationFailure` when guards abort the navigation

```ts
try {
	await router.back()
} catch (error) {
	if (error.code === 'NAVIGATION_ABORTED') {
		console.log('Back aborted')
	}
}
```

::: warning
`back()` only intercepts programmatic calls. Physical back button and browser back directly trigger
native `navigateBack`, bypassing the router, so guards cannot intercept them.
For native back, call `router.syncRoute()` in the page's `onShow` to sync state.
:::

## RouteLocationRaw

Navigation methods accept three forms of route location parameters:

### String Path

```ts
router.push('pages/about/about')
router.push('pages/about/about?id=1')
```

### Path Object

```ts
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

### Named Object

```ts
router.push({ name: 'about', query: { id: '1' } })
```

## Concurrent Navigation

When there is an unfinished navigation, new navigation requests will wait for the previous one to complete before executing:

```ts
router.push('/about')
router.push('/user')
// The second push waits for the first to complete
```

## Navigation Animation

Navigation animation only takes effect on App, other platforms auto-ignore. Priority: `inline param` > `meta.animation` > `uni default`.

### Option 1: Pass animation when navigating

```ts
await router.push({ path: '/pages/about/about', animation: { type: 'slide-in-bottom' } })
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### Option 2: Route-level default animation

Set `meta.animation` in route config. All navigation to this route will use this animation as the default:

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]
```

### Option 3: RouterLink component

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom' }">
  <text>Slide In Bottom</text>
</RouterLink>
```

### NavigationAnimation

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // default 300ms
}
```

### UniAnimationType

Show animations (navigateTo):
- `slide-in-right` / `slide-in-left` / `slide-in-top` / `slide-in-bottom`
- `pop-in` / `fade-in` / `zoom-out` / `zoom-fade-out`
- `none` / `auto`

Close animations (navigateBack):
- `slide-out-right` / `slide-out-left` / `slide-out-top` / `slide-out-bottom`
- `pop-out` / `fade-out` / `zoom-in` / `zoom-fade-in`
- `none` / `auto`

::: info
Animation types correspond to uni-app's `animationType` parameter. See [uni-app navigation animation docs](https://uniapp.dcloud.net.cn/api/router.html#animation).
:::

## Navigation and Guards

Route guards are executed in sequence during navigation. See [Route Guards](./guards) for details. The complete navigation flow is:

1. Resolve route location
2. Duplicate navigation detection (push only)
3. Execute global beforeEach guards
4. Execute per-route beforeEnter guards
5. Execute global beforeResolve guards
6. Call uni navigation API
7. Update route state
8. Execute global afterEach hooks

::: info
`relaunch()` also goes through the full guard chain, but skips step 2 (duplicate navigation detection).
:::
