# Navigation

Uni Router provides three navigation methods, corresponding to uni-app's native navigation APIs.

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

::: tip You can use `router.onError()` to globally catch such errors, avoiding the need for try-catch on every call. :::

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

::: warning When replacing to a TabBar page, `uni.switchTab` closes all non-tab pages instead of just replacing the current page. This behavior is determined by the uni-app framework. :::

## back()

Go back to the previous page or multiple pages, corresponding to `uni.navigateBack`:

```ts
router.back() // Go back one page
router.back(2) // Go back two pages
```

If there are not enough pages in the stack for `delta`, a warning is output and the promise resolves immediately without throwing an error:

```ts
await router.back(5)
// ⚠️ Warning: Cannot go back: no previous page in the navigation stack
```

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
