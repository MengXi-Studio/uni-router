# RouterError

Router error type, encapsulating various errors that occur during navigation. Caught via `router.onError`, or handled via `try-catch`.

## Type Definition

```ts
class RouterError extends Error {
  code: RouterErrorCode
  message: string
  to?: RouteLocationNormalized
  from?: RouteLocationNormalized
  cause?: unknown
}
```

## Properties

### code

- **Type**: [`RouterErrorCode`](#routererrorcode)
- **Description**: Error code identifying the error type

```ts
router.onError((err) => {
  switch (err.code) {
    case 'ROUTE_NOT_FOUND':
      uni.showToast({ title: 'Page does not exist', icon: 'none' })
      break
    case 'GUARD_TIMEOUT':
      uni.showToast({ title: 'Page load timeout', icon: 'none' })
      break
    case 'NAVIGATION_ABORTED':
      // User actively aborted, no need to prompt
      break
  }
})
```

### message

- **Type**: `string`
- **Description**: Error description message

### to / from

- **Type**: `RouteLocationNormalized | undefined`
- **Description**: The target route and source route when the error occurred

```ts
router.onError((err) => {
  console.error(`Navigation error: ${err.from?.path} → ${err.to?.path}`)
  console.error(`Error code: ${err.code}`)
  console.error(`Error message: ${err.message}`)
})
```

### cause

- **Type**: `unknown`
- **Description**: Original error object (e.g., network request error, JSON parsing error, etc.)

```ts
router.onError((err) => {
  if (err.cause instanceof Error) {
    console.error('Original error:', err.cause.message)
  }
})
```

## RouterErrorCode

Error code enum:

| Error Code | Description | Trigger Scenario |
| --- | --- | --- |
| `ROUTE_NOT_FOUND` | Route not found | Named route doesn't exist, and `strict: true` |
| `ROUTE_DUPLICATE` | Route duplicate | Same named route registered multiple times |
| `GUARD_TIMEOUT` | Guard timeout | Guard didn't complete within `guardTimeout` |
| `GUARD_ABORTED` | Guard aborted | Guard returned `false` or threw an error |
| `NAVIGATION_ABORTED` | Navigation aborted | Caller actively aborted or intercepted by other guards |
| `NAVIGATION_DUPLICATE` | Duplicate navigation | Same target is already navigating |
| `PARAMS_INVALID` | Invalid params | params cannot be serialized |
| `READY_TIMEOUT` | Ready timeout | Router didn't become ready within `readyTimeout` |
| `INTERCEPT_ERROR` | Interceptor error | Error occurred while intercepting uni native API |
| `UNKNOWN` | Unknown error | Other unclassified errors |

## Error Catching Methods

### router.onError (Global)

Register a global error handler to catch all navigation errors:

```ts
router.onError((err, to, from) => {
  console.error('[Navigation Error]', {
    code: err.code,
    message: err.message,
    from: from?.path,
    to: to?.path
  })

  // Handle by error code
  switch (err.code) {
    case 'ROUTE_NOT_FOUND':
      uni.showToast({ title: 'Page does not exist', icon: 'none' })
      break
    case 'GUARD_TIMEOUT':
      uni.showToast({ title: 'Page load timeout, please retry', icon: 'none' })
      break
    case 'NAVIGATION_ABORTED':
      // User actively aborted, no prompt
      break
    default:
      uni.showToast({ title: 'Page jump failed', icon: 'none' })
  }
})
```

### try-catch (Local)

`router.push()` / `router.replace()` / `router.back()` return Promises, which can be caught via `try-catch`:

```ts
try {
  await router.push({ name: 'detail', query: { id: '1' } })
  // Navigation successful
} catch (err) {
  // Navigation failed
  if (err.code === 'ROUTE_NOT_FOUND') {
    uni.showToast({ title: 'Page does not exist', icon: 'none' })
  } else if (err.code === 'NAVIGATION_ABORTED') {
    // User actively aborted, no need to handle
  } else {
    console.error('Navigation failed:', err)
  }
}
```

::: tip onError vs try-catch
- `onError`: Global catch, suitable for unified handling (e.g., analytics, default prompts)
- `try-catch`: Local catch, suitable for differentiated handling in specific scenarios

The two **do not conflict**. After `onError` triggers, the Promise still rejects and can be caught by `try-catch`.
:::

## Error Handling Strategies

### Unified Error Handling

```ts
// main.ts
router.onError((err) => {
  // Analytics reporting
  trackError({
    code: err.code,
    message: err.message,
    path: err.to?.path
  })

  // Default prompts
  const messages: Record<string, string> = {
    ROUTE_NOT_FOUND: 'Page does not exist',
    GUARD_TIMEOUT: 'Page load timeout',
    NAVIGATION_DUPLICATE: 'Please do not click repeatedly',
    PARAMS_INVALID: 'Parameter error'
  }

  const msg = messages[err.code] || 'Page jump failed'
  if (err.code !== 'NAVIGATION_ABORTED') {
    uni.showToast({ title: msg, icon: 'none' })
  }
})
```

### Tiered Error Handling

```ts
router.onError((err) => {
  // Severe errors: affect user flow
  const severeErrors = ['ROUTE_NOT_FOUND', 'PARAMS_INVALID', 'INTERCEPT_ERROR']
  if (severeErrors.includes(err.code)) {
    uni.showModal({
      title: 'Error',
      content: err.message,
      showCancel: false
    })
    return
  }

  // Recoverable errors: prompt and continue
  const recoverableErrors = ['GUARD_TIMEOUT', 'NAVIGATION_DUPLICATE']
  if (recoverableErrors.includes(err.code)) {
    uni.showToast({ title: err.message, icon: 'none' })
    return
  }

  // Silent errors: no prompt
  const silentErrors = ['NAVIGATION_ABORTED', 'GUARD_ABORTED']
  if (silentErrors.includes(err.code)) {
    return
  }

  // Unknown errors: default prompt
  console.error('[RouterError]', err)
  uni.showToast({ title: 'Unknown error', icon: 'none' })
})
```

### Specific Scenario Handling

```ts
// Page jump button
async function handleNavigate() {
  try {
    await router.push({ name: 'detail', query: { id: '1' } })
  } catch (err) {
    if (err.code === 'NAVIGATION_ABORTED') {
      // Guard aborted, may have redirected to login page, no need to handle
      return
    }
    if (err.code === 'NAVIGATION_DUPLICATE') {
      uni.showToast({ title: 'Navigating...', icon: 'none' })
      return
    }
    // Other errors handled by global onError
  }
}
```

## Common Error Scenarios

### ROUTE_NOT_FOUND

```ts
// Named route not registered
await router.push({ name: 'non-existent' })
// Throws: { code: 'ROUTE_NOT_FOUND', message: 'Route "non-existent" not found' }

// When strict: false, only warns without throwing
const router = createRouter({ routes, strict: false })
await router.push({ name: 'non-existent' })
// Warning: [uni-router] Route "non-existent" not found, fallback to path
```

### GUARD_TIMEOUT

```ts
const router = createRouter({ routes, guardTimeout: 3000 })

router.beforeEach(async (to, from, next) => {
  // Simulate slow request
  await new Promise(resolve => setTimeout(resolve, 5000))
  next()
})

await router.push({ name: 'about' })
// After 3 seconds throws: { code: 'GUARD_TIMEOUT', message: 'Guard timeout after 3000ms' }
```

### NAVIGATION_ABORTED

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(false)  // Abort navigation
  } else {
    next()
  }
})

try {
  await router.push({ name: 'admin' })
} catch (err) {
  // err.code === 'NAVIGATION_ABORTED'
  console.log('Navigation aborted by guard')
}
```

### NAVIGATION_DUPLICATE

```ts
// Quick consecutive clicks
async function handleClick() {
  try {
    await router.push({ name: 'detail' })
  } catch (err) {
    if (err.code === 'NAVIGATION_DUPLICATE') {
      // Same target is already navigating, ignore
      return
    }
    throw err
  }
}

// Simulate quick clicks
handleClick()  // Start navigation
handleClick()  // Throws NAVIGATION_DUPLICATE
```

### PARAMS_INVALID

```ts
// Pass non-serializable data
const circular = { a: 1 }
circular.self = circular

try {
  await router.push({ name: 'detail', params: { data: circular } })
} catch (err) {
  // err.code === 'PARAMS_INVALID'
  console.error('Parameter cannot be serialized:', err.cause)
}
```

## Custom Errors

Throw custom errors in guards:

```ts
class PermissionError extends Error {
  constructor(public requiredRole: string) {
    super(`Requires ${requiredRole} permission`)
    this.name = 'PermissionError'
  }
}

router.beforeEach((to, from, next) => {
  if (to.meta.roles && !hasRole(to.meta.roles)) {
    next(new PermissionError(to.meta.roles[0]))
    return
  }
  next()
})

router.onError((err) => {
  if (err.cause instanceof PermissionError) {
    uni.showModal({
      title: 'Insufficient Permissions',
      content: err.cause.message,
      showCancel: false
    })
  }
})
```

## Error Code Quick Reference

| Error Code | Severity | Prompt User | Common Cause |
| --- | --- | --- | --- |
| `ROUTE_NOT_FOUND` | High | Yes | Route name typo, route not registered |
| `ROUTE_DUPLICATE` | Medium | No | Duplicate route configuration |
| `GUARD_TIMEOUT` | Medium | Yes | Async operations in guard too slow |
| `GUARD_ABORTED` | Low | No | Guard actively aborted (normal behavior) |
| `NAVIGATION_ABORTED` | Low | No | Guard aborted or redirected |
| `NAVIGATION_DUPLICATE` | Low | No | Repeatedly clicking navigation button |
| `PARAMS_INVALID` | High | Yes | params contains circular references, etc. |
| `READY_TIMEOUT` | High | Yes | Router initialization failed |
| `INTERCEPT_ERROR` | High | Yes | Interceptor configuration error |
| `UNKNOWN` | High | Yes | Unclassified errors |

## Next Steps

- [Error Handling Guide](../guide/error-handling) — In-depth explanation of error handling
- [Router Instance](./router-instance) — `onError` method
- [NavigationGuard Type](./type-navigation-guard) — Throwing errors in guards
