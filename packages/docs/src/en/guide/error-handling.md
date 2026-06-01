# Error Handling

MengXi UniRouter provides a unified error handling mechanism. All navigation errors are wrapped in the `NavigationFailure` class with structured error codes.

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
  readonly cause?: unknown
}
```

## Error Codes

| Error Code | Description | Trigger |
|-----------|-------------|---------|
| `NAVIGATION_ABORTED` | Navigation aborted by guard | Guard calls `next(false)` |
| `NAVIGATION_CANCELLED` | Navigation cancelled | Guard throws exception or redirect limit exceeded |
| `NAVIGATION_DUPLICATED` | Duplicate navigation | `push()` to a page already at |
| `ROUTE_NOT_FOUND` | Route not found | Using undefined named route in strict mode |
| `NAVIGATION_API_ERROR` | uni API call failed | `uni.navigateTo` etc. call failed |
| `SETUP_ERROR` | Setup error | `useRouter()` called outside setup |

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
  throw error
}
```

## Common Error Handling Scenarios

### Ignore Duplicate Navigation

```ts
router.onError((error) => {
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
