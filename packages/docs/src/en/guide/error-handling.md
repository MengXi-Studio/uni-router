# Error Handling

Uni Router provides a unified error handling mechanism. All navigation errors are wrapped in the `NavigationFailure` class with structured error codes.

## Error Types

### RouterError

Base route error class, containing error code and message:

```ts
class RouterError extends Error {
	readonly code: RouterErrorCode
	readonly message: string
}
```

### NavigationFailure

Navigation failure class, extending `RouterError`, with additional source and target route information:

```ts
class NavigationFailure extends RouterError {
	readonly to: RouteLocation
	readonly from: RouteLocation
	readonly cause?: UniApiError
}
```

The `cause` type is `UniApiError`, encapsulating the failed uni-app API information:

```ts
interface UniApiError {
	readonly api: string          // Name of the failed API (e.g., 'navigateTo')
	readonly cause: UniApiCause    // Original error cause
}

interface UniApiCause {
	errMsg: string                // Error description message
}
```

## Error Codes

| Error Code              | Description                 | Trigger                                           |
| ----------------------- | --------------------------- | ------------------------------------------------- |
| `NAVIGATION_ABORTED`    | Navigation aborted by guard | Guard `return false`                         |
| `NAVIGATION_CANCELLED`  | Navigation cancelled        | Guard exception, redirect limit exceeded, or insufficient page stack (`back()`) |
| `NAVIGATION_DUPLICATED` | Duplicate navigation        | `push()` to a page already at                     |
| `ROUTE_NOT_FOUND`       | Route not found             | Using undefined named route in strict mode        |
| `NAVIGATION_API_ERROR`  | uni API call failed         | `uni.navigateTo` etc. call failed                 |
| `PLUGIN_REQUIRED`       | Plugin feature not registered | Using `params`/`events`/`animation` etc. plugin-dependent features without registering the corresponding plugin |
| `SETUP_ERROR`           | Setup error                 | `useRouter()` called outside setup                |

## router.onError()

Register a global error handler callback. All navigation errors trigger it:

```ts
const removeHandler = router.onError((error, to, from) => {
	switch (error.code) {
		case 'NAVIGATION_ABORTED':
			console.log('Navigation aborted')
			break
		case 'NAVIGATION_DUPLICATED':
			console.log('Duplicate navigation, ignoring')
			break
		case 'NAVIGATION_API_ERROR':
			console.error('uni API call failed', error.cause)
			break
		case 'PLUGIN_REQUIRED':
			console.error('Used plugin feature without registering plugin:', error.message)
			break
	}
})

// Remove the handler
removeHandler()
```

::: tip
Exceptions in `onError` do not affect the execution of other error handlers.
:::

## try-catch Handling

You can also use try-catch when calling navigation methods:

```ts
try {
	await router.push({ name: 'about' })
} catch (error) {
	if (error.code === 'NAVIGATION_DUPLICATED') {
		// Ignore duplicate navigation
		return
	}
	if (error.code === 'NAVIGATION_ABORTED') {
		console.log('Navigation aborted by guard')
		return
	}
	if (error.code === 'PLUGIN_REQUIRED') {
		console.error('Please register the corresponding plugin first:', error.message)
		return
	}
	throw error
}
```

## Common Error Handling Scenarios

### Ignore Duplicate Navigation

```ts
router.onError(error => {
	if (error.code === 'NAVIGATION_DUPLICATED') return
	console.error(error)
})
```

### Login Redirect

```ts
router.onError((error, to) => {
	if (error.code === 'NAVIGATION_ABORTED' && to.meta.requireAuth) {
		router.push({ name: 'login' })
	}
})
```

### uni API Failure Retry

```ts
router.onError(async (error, to) => {
	if (error.code === 'NAVIGATION_API_ERROR') {
		console.error('Navigation failed, target:', to.fullPath)
	}
})
```

## isNavigationFailure()

`isNavigationFailure()` is a type-checking utility for navigation failures. It allows you to precisely identify the type of navigation failure in `catch` blocks, replacing manual `instanceof` + `code` checks.

### Type

```ts
function isNavigationFailure(error: unknown, code?: RouterErrorCode): error is NavigationFailure
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `error` | `unknown` | The caught error object |
| `code` | `RouterErrorCode` (optional) | Error code to check against |

### Return Value

Returns `boolean` and narrows the type of `error` to `NavigationFailure` (TypeScript type guard).

### Usage

#### Without code: check if it's any navigation failure

```ts
import { isNavigationFailure } from '@meng-xi/uni-router'

try {
  await router.push({ name: 'about' })
} catch (error) {
  if (isNavigationFailure(error)) {
    console.log('Navigation failed:', error.code)
  }
}
```

#### With code: check for a specific type

```ts
import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

try {
  await router.push({ name: 'about' })
} catch (error) {
  if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED)) {
    // Ignore duplicated navigation
    return
  }
  if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_ABORTED)) {
    // Guard aborted, no action needed
    return
  }
  // Other errors
  uni.showToast({ title: 'Navigation failed', icon: 'none' })
}
```

### Comparison with Manual Checks

```ts
// Manual check (verbose)
if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_DUPLICATED)

// Using isNavigationFailure (concise)
if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED))
```

## Next Steps

- [FAQ](./faq) — Troubleshoot specific issues
- [Navigation Flow](./navigation-flow) — Understand when errors occur
- [Recipes](./recipes) — Complete business solutions
- [Plugin System](./plugins) — Learn about plugin registration
