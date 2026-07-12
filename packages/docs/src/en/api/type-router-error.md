# RouterError

Router error type, encapsulating various errors that occur during routing/navigation. Can be caught globally via `router.onError`, or handled locally via `try-catch`.

## Type Definition

```ts
class RouterError extends Error {
  readonly code: RouterErrorCode
  readonly message: string
}
```

- All error messages are automatically prefixed with `[uni-router]`
- The `name` property is `'RouterError'`

## Properties

### code

- **Type**: [`RouterErrorCode`](#routererrorcode)
- **Description**: Error code identifying the error type

```ts
import { RouterErrorCode } from '@meng-xi/uni-router'

router.onError((err) => {
  switch (err.code) {
    case RouterErrorCode.ROUTE_NOT_FOUND:
      uni.showToast({ title: 'Page does not exist', icon: 'none' })
      break
    case RouterErrorCode.NAVIGATION_ABORTED:
      // Guard aborted, usually no need to prompt
      break
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: 'Navigation failed', icon: 'none' })
      break
  }
})
```

### message

- **Type**: `string`
- **Description**: Error description message (with `[uni-router]` prefix)

## NavigationFailure

`NavigationFailure` extends `RouterError`, carrying navigation context (source/target route and original error cause):

```ts
class NavigationFailure extends RouterError {
  readonly to: RouteLocation
  readonly from: RouteLocation
  readonly cause?: UniApiError
}
```

| Property | Type | Description |
| --- | --- | --- |
| `to` | `RouteLocation` | Target route |
| `from` | `RouteLocation` | Source route |
| `cause` | `UniApiError \| undefined` | Original error cause, only present for `NAVIGATION_API_ERROR` |

```ts
router.onError((err) => {
  if (err.code === RouterErrorCode.NAVIGATION_API_ERROR) {
    // err is a NavigationFailure, can access to/from/cause
    console.error(`Failed from ${err.from.fullPath} to ${err.to.fullPath}`)
    console.error('Failed API:', err.cause?.api)
    console.error('Original error:', err.cause?.cause.errMsg)
  }
})
```

## UniApiError / UniApiCause

The type of `NavigationFailure.cause`, encapsulating details of a failed uni-app navigation API call.

### UniApiCause

The error cause when a uni-app API fails (the object received by the `fail` callback):

```ts
interface UniApiCause {
  errMsg: string
}
```

### UniApiError

Error information for a failed uni-app API call:

```ts
interface UniApiError {
  readonly api: string          // Name of the failed API (e.g., 'navigateTo')
  readonly cause: UniApiCause   // Original error cause
}
```

```ts
router.onError((err) => {
  if (err.cause) {
    console.error(`API ${err.cause.api} call failed`)
    console.error(`Reason: ${err.cause.cause.errMsg}`)
  }
})
```

## RouterErrorCode

Error code enum, 7 in total:

| Error Code | Description | Trigger Scenario | Recoverable |
| --- | --- | --- | --- |
| `NAVIGATION_ABORTED` | Navigation aborted by guard | Guard called `next(false)` | Yes |
| `NAVIGATION_CANCELLED` | Navigation cancelled | Guard timeout/exception, redirect limit, insufficient stack | Yes |
| `NAVIGATION_DUPLICATED` | Duplicate navigation | `push` to the page already on | Yes |
| `ROUTE_NOT_FOUND` | Route not found | Using an undefined named route in strict mode | Yes |
| `NAVIGATION_API_ERROR` | uni API call failed | `uni.navigateTo` etc. failed (e.g., stack overflow) | Yes |
| `PLUGIN_REQUIRED` | Plugin not registered | Using a plugin-provided feature without registering the corresponding plugin | Yes |
| `SETUP_ERROR` | Initialization/usage error | `useRouter()` called outside setup | No |

::: tip Error Code Checking
It's recommended to use `RouterErrorCode` constants instead of hardcoded strings to avoid typos:

```ts
import { RouterErrorCode } from '@meng-xi/uni-router'

if (err.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
  // Ignore duplicate navigation
}
```
:::

## Error Catching Methods

### router.onError (Global)

Register a global error handler to catch all navigation errors:

```ts
const remove = router.onError((err, to, from) => {
  console.error('[Navigation Error]', {
    code: err.code,
    message: err.message,
    from: from?.path,
    to: to?.path
  })

  switch (err.code) {
    case RouterErrorCode.ROUTE_NOT_FOUND:
      uni.showToast({ title: 'Page does not exist', icon: 'none' })
      break
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: 'Navigation failed', icon: 'none' })
      console.error('Original error:', err.cause)
      break
    case RouterErrorCode.NAVIGATION_ABORTED:
      // Guard aborted, usually no need to prompt
      break
  }
})

// Remove handler
remove()
```

### try-catch (Local)

`router.push()` / `replace()` / `relaunch()` / `back()` return Promises that can be caught via `try-catch`:

```ts
try {
  await router.push({ name: 'detail', query: { id: '1' } })
} catch (err) {
  if (err.code === RouterErrorCode.ROUTE_NOT_FOUND) {
    uni.showToast({ title: 'Page does not exist', icon: 'none' })
  } else if (err.code === RouterErrorCode.NAVIGATION_ABORTED) {
    // Guard aborted, no need to handle
  } else {
    console.error('Navigation failed:', err)
  }
}
```

::: tip onError vs try-catch
- `onError`: Global catch, suitable for unified handling (e.g., analytics, default prompts)
- `try-catch`: Local catch, suitable for scenario-specific handling

They **do not conflict**; after `onError` fires, the Promise still rejects and can be caught by `try-catch`.
:::

## Common Error Scenarios

### NAVIGATION_ABORTED

Guard calls `next(false)` to abort navigation:

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(false) // Throws NAVIGATION_ABORTED
  } else {
    next()
  }
})
```

### NAVIGATION_CANCELLED

Triggered by multiple scenarios:

```ts
// 1. Guard timeout (exceeds guardTimeout)
router.beforeEach(async (to, from, next) => {
  await verySlowOperation() // timeout
  next()
})

// 2. Guard throws an uncaught exception
router.beforeEach(() => {
  throw new Error('Guard exception') // Converted to NAVIGATION_CANCELLED
})

// 3. Redirect limit exceeded (>10 times)
router.beforeEach((to, from, next) => {
  next({ name: 'a' }) // a → b → a → b ... exceeds 10 times
})

// 4. Insufficient stack when calling back()
router.back(10) // Current stack only has 3 levels
```

### NAVIGATION_DUPLICATED

`push` to the page already on (path, name, and query all identical):

```ts
// Currently on /pages/about/about
await router.push({ name: 'about' }) // Throws NAVIGATION_DUPLICATED
```

::: tip Only push checks duplicates
`replace` / `relaunch` / `back` do not check duplicates and can navigate to the current position.
:::

### ROUTE_NOT_FOUND

Using an undefined named route in strict mode:

```ts
const router = createRouter({ routes, strict: true })
await router.push({ name: 'not-exist' }) // Throws ROUTE_NOT_FOUND
```

### NAVIGATION_API_ERROR

uni navigation API call failed, `cause` carries the original error:

```ts
// Mini-program page stack has reached the 10-level limit
await router.push({ name: 'page11' })
// Throws NAVIGATION_API_ERROR
// err.cause.api === 'navigateTo'
// err.cause.cause.errMsg contains 'limit exceed'

router.onError((err) => {
  if (err.code === RouterErrorCode.NAVIGATION_API_ERROR) {
    if (String(err.cause?.cause.errMsg).includes('limit')) {
      // Page stack overflow, use relaunch to reset the stack
      await router.relaunch(err.to)
    }
  }
})
```

### PLUGIN_REQUIRED

Using a plugin-provided feature without registering the corresponding plugin.

```ts
// Using params without registering ParamsPlugin
await router.push({ path: '/detail', params: { id: 123 } })
// → PLUGIN_REQUIRED

// Using animation without registering AnimationPlugin
await router.push({ path: '/detail', animation: { type: 'fade-in' } })
// → PLUGIN_REQUIRED
```

**Trigger scenarios**:

| Feature | Required Plugin |
| --- | --- |
| `params` / `persistent` | `ParamsPlugin` |
| `animation` | `AnimationPlugin` |
| `events` | `ChannelPlugin` |

**Resolution**: Register the corresponding plugin or use `router.hasPlugin()` to check before using. See [Plugin System](../guide/plugins) for details.

### SETUP_ERROR

Router initialization or usage error, not recoverable:

```ts
// useRouter() called outside setup
const router = useRouter() // Throws SETUP_ERROR
```

## Error Handling Strategies

### Tiered Handling

```ts
router.onError((err) => {
  switch (err.code) {
    // Silent errors: don't prompt user
    case RouterErrorCode.NAVIGATION_ABORTED:
    case RouterErrorCode.NAVIGATION_DUPLICATED:
      return

    // Recoverable errors: light prompt
    case RouterErrorCode.NAVIGATION_CANCELLED:
      uni.showToast({ title: 'Navigation cancelled', icon: 'none' })
      return

    // Severe errors: modal prompt
    case RouterErrorCode.ROUTE_NOT_FOUND:
    case RouterErrorCode.NAVIGATION_API_ERROR:
    case RouterErrorCode.PLUGIN_REQUIRED:
      uni.showModal({
        title: 'Error',
        content: err.message,
        showCancel: false
      })
      return

    // Initialization error
    case RouterErrorCode.SETUP_ERROR:
      console.error('[Initialization Error]', err)
      return
  }
})
```

### Global + Local Cooperation

```ts
// Global: logging and analytics
router.onError((err, to, from) => {
  analytics.report({
    event: 'navigation_error',
    code: err.code,
    from: from?.path,
    to: to?.path
  })
})

// Local: button loading state
async function handleNavigate() {
  loading.value = true
  try {
    await router.push({ name: 'home' })
  } catch (err) {
    if (err.code === RouterErrorCode.NAVIGATION_DUPLICATED) return
  } finally {
    loading.value = false
  }
}
```

## Next Steps

- [Error Handling Guide](../guide/error-handling) — In-depth error handling
- [Router Instance](./router-instance) — `onError` method
- [NavigationGuard Type](./type-navigation-guard) — Throwing errors in guards
