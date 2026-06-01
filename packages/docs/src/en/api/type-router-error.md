# Error Types

Route error related type definitions.

## RouterErrorCode

Route error code enum.

```ts
enum RouterErrorCode {
  NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
  NAVIGATION_DUPLICATED = 'NAVIGATION_DUPLICATED',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  NAVIGATION_API_ERROR = 'NAVIGATION_API_ERROR',
  SETUP_ERROR = 'SETUP_ERROR'
}
```

### Error Code Descriptions

| Error Code | Value | Description |
|-----------|-------|-------------|
| `NAVIGATION_ABORTED` | `'NAVIGATION_ABORTED'` | Navigation aborted by guard (`next(false)`) |
| `NAVIGATION_CANCELLED` | `'NAVIGATION_CANCELLED'` | Navigation cancelled (guard exception or redirect limit) |
| `NAVIGATION_DUPLICATED` | `'NAVIGATION_DUPLICATED'` | Duplicate navigation to current location |
| `ROUTE_NOT_FOUND` | `'ROUTE_NOT_FOUND'` | No matching route found |
| `NAVIGATION_API_ERROR` | `'NAVIGATION_API_ERROR'` | uni navigation API call failed |
| `SETUP_ERROR` | `'SETUP_ERROR'` | Router initialization or usage error |

## RouterError

Base route error class.

```ts
class RouterError extends Error {
  readonly code: RouterErrorCode
  readonly message: string
}
```

### Properties

- **code**: Error code
- **message**: Error message (automatically prefixed with `[uni-router]`)

## NavigationFailure

Navigation failure class, extending `RouterError`.

```ts
class NavigationFailure extends RouterError {
  readonly to: RouteLocation
  readonly from: RouteLocation
  readonly cause?: unknown
}
```

### Properties

- **to**: Target route
- **from**: Source route
- **cause**: Original error cause (only present for `NAVIGATION_API_ERROR`)

## RouterOnError

Route error handler callback type.

```ts
type RouterOnError = (
  error: RouterError,
  to: RouteLocation,
  from: RouteLocation
) => void
```

## Example

```ts
import { RouterErrorCode, NavigationFailure } from '@meng-xi/uni-router'

try {
  await router.push({ name: 'about' })
} catch (error) {
  if (error instanceof NavigationFailure) {
    switch (error.code) {
      case RouterErrorCode.NAVIGATION_ABORTED:
        console.log('Navigation aborted')
        break
      case RouterErrorCode.NAVIGATION_DUPLICATED:
        console.log('Duplicate navigation')
        break
      case RouterErrorCode.NAVIGATION_API_ERROR:
        console.error('API call failed', error.cause)
        break
    }
  }
}
```
