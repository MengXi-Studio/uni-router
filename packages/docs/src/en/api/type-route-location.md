# RouteLocation

Route location type, describing the target of navigation. It is the core type of navigation methods like `router.push()` / `router.replace()` / `router.back()` and the `to` prop of the `RouterLink` component.

## Type Definition

```ts
type RouteLocation =
  | string
  | RouteLocationPath
  | RouteLocationName
  | RouteLocationRaw
```

Supports multiple forms:

```ts
// 1. String path
router.push('/pages/about/about')

// 2. Path object
router.push({ path: 'pages/about/about' })

// 3. Named route
router.push({ name: 'about' })

// 4. With parameters
router.push({ path: 'pages/detail/detail', query: { id: '1' } })
router.push({ name: 'detail', params: { info: { id: 1 } } })
```

## Path Forms

### String Path

The simplest form, directly passing a path string:

```ts
// Basic path
router.push('/pages/about/about')

// With query (auto-parsed)
router.push('/pages/detail/detail?id=1&name=Tom')

// Named route name (not recommended, use name form instead)
router.push('about')
```

::: warning String path limitations
- Path should start with `/` (auto-completed)
- Cannot pass `params` (only query strings)
- Cannot specify advanced options like `animation` / `events` / `mode`
- Recommend using object form for full capabilities
:::

### RouteLocationPath

Specify the target path via `path`:

```ts
interface RouteLocationPath {
  path: string
  query?: Record<string, any>
  params?: Record<string, any>
  hash?: string
  animation?: NavigationAnimation
  events?: Record<string, Function>
  mode?: NavigationMode
  persistent?: boolean
}
```

```ts
await router.push({
  path: 'pages/detail/detail',
  query: { id: '1', tab: 'info' },
  animation: { type: 'slide-in-right' },
  events: {
    onSelectAddress(data) {
      console.log('Address selected:', data)
    }
  }
})
```

### RouteLocationName

Specify a named route via `name`:

```ts
interface RouteLocationName {
  name: string
  query?: Record<string, any>
  params?: Record<string, any>
  hash?: string
  animation?: NavigationAnimation
  events?: Record<string, Function>
  mode?: NavigationMode
  persistent?: boolean
}
```

```ts
await router.push({
  name: 'detail',
  query: { id: '1' },
  params: { info: { id: 1, name: 'Tom' } }
})
```

::: tip Recommend using named routes
- **Decoupling**: Path changes don't affect calling code
- **Type safety**: With the `dts` feature of `@meng-xi/vite-plugin`, route names have type hints
- **Readability**: `{ name: 'detail' }` is clearer than `'/pages/detail/detail'`
:::

## Property Details

### path / name

Choose one to specify the target route. `name` takes priority over `path`.

### query

- **Type**: `Record<string, any>`
- **Description**: URL query parameters, serialized to strings and appended to the URL

::: warning query serialization limitations
Values in `query` are serialized to strings via `encodeURIComponent`:
- Simple types (string / number / boolean) pass through normally
- Complex objects are serialized to `[object Object]`, **cannot be restored**
- Arrays are serialized to comma-separated strings

Use `params` to pass complex objects.
:::

```ts
// ✅ Simple types
router.push({ name: 'detail', query: { id: 123, tab: 'info' } })
// URL: /pages/detail/detail?id=123&tab=info

// ❌ Complex object (cannot be restored)
router.push({ name: 'detail', query: { user: { name: 'Tom' } } })
// URL: /pages/detail/detail?user=%5Bobject%20Object%5D
// Receiver: route.value.query.user === '[object Object]'

// ✅ Array (serialized to string)
router.push({ name: 'detail', query: { ids: [1, 2, 3] } })
// URL: /pages/detail/detail?ids=1%2C2%2C3
// Receiver: route.value.query.ids === '1,2,3' (string)
```

### params

- **Type**: `Record<string, any>`
- **Description**: Page parameters, supports any serializable data (objects, arrays, nested structures)
- **Storage**:
  - Default in-memory (`persistent: false`)
  - When `persistent: true` is enabled, persisted via `uni.setStorageSync`

```ts
// Pass complex object
await router.push({
  name: 'detail',
  params: {
    user: { name: 'Tom', age: 20 },
    tags: ['a', 'b', 'c'],
    meta: { source: 'home', timestamp: Date.now() }
  }
})

// Receiver
const route = useRoute()
const user = route.value.params.user  // { name: 'Tom', age: 20 }
const tags = route.value.params.tags  // ['a', 'b', 'c']
```

::: tip params vs query
| Feature | query | params |
| --- | --- | --- |
| Type restriction | Simple types only | Any serializable data |
| URL visible | Yes | No |
| H5 refresh preserved | Yes | Only with `persistent: true` |
| Size limit | URL length limit | storage capacity |
| Use cases | Simple params, shareable | Complex data, page communication |
:::

### hash

- **Type**: `string`
- **Description**: URL hash fragment (H5 only)

```ts
router.push({ path: '/pages/about/about', hash: '#section-1' })
// URL: /pages/about/about#section-1
```

::: warning Platform limitations
`hash` is only supported on H5. Mini-programs and App will ignore this parameter.
:::

### animation

- **Type**: `NavigationAnimation`
- **Description**: Animation config for this navigation (App only), overrides `meta.animation`

```ts
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 500 }
})
```

### events

- **Type**: `Record<string, Function>`
- **Description**: EventChannel event listeners, for target page to source page communication

```ts
// Source page
await router.push({
  name: 'select-address',
  events: {
    onAddressSelected(address) {
      console.log('Received address:', address)
      // Update page data
      form.value.address = address
    }
  }
})

// Target page
const eventChannel = getCurrentInstance()?.proxy?.getOpenerEventChannel?.()
eventChannel?.emit('onAddressSelected', { city: 'Beijing', detail: 'Chaoyang' })
```

::: tip EventChannel advantages
- Cross-page communication without global state or event bus
- Auto cleanup: events auto-invalidate when source page closes
- Type safety: can define event types with TS
:::

### mode

- **Type**: `'push' | 'replace' | 'relaunch'`
- **Description**: Navigation mode (v1.7.0+), overrides default behavior

```ts
// Force replace (don't keep current page in stack)
await router.push({ name: 'login', mode: 'replace' })

// Restart app (clear page stack)
await router.push({ name: 'home', mode: 'relaunch' })
```

::: tip mode use cases
- `push` (default): Regular navigation, keep current page
- `replace`: Post-login redirect, post-form-submit redirect, avoid going back to form page
- `relaunch`: Logout, user switch, return to home, clear all history
:::

### persistent

- **Type**: `boolean`
- **Description**: Whether to persist params, overrides global `paramsPersistent` config

```ts
// Global paramsPersistent: false, persist per navigation
await router.push({
  name: 'detail',
  params: { id: 123 },
  persistent: true  // Persist this time
})

// Global paramsPersistent: true, don't persist per navigation
await router.push({
  name: 'detail',
  params: { id: 123 },
  persistent: false  // Don't persist this time
})
```

## RouteLocationNormalized

After navigation completes, the `route` object stores the normalized route location:

```ts
interface RouteLocationNormalized {
  path: string
  name?: string
  query: Record<string, string>
  params: Record<string, any>
  hash: string
  fullPath: string
  meta: RouteMeta
  matched: RouteConfig[]
  redirectedFrom?: RouteLocationNormalized
  _synced?: boolean
}
```

### Special Fields

#### fullPath

Full path, including query and hash:

```ts
const route = useRoute()
console.log(route.value.fullPath)
// /pages/detail/detail?id=1&tab=info#section-1
```

#### matched

Matched route config chain (multiple for nested routes):

```ts
const route = useRoute()
route.value.matched.forEach((config, index) => {
  console.log(`Match level ${index}:`, config.path)
})
```

#### redirectedFrom

If this navigation was triggered by a guard redirect, records the original target:

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.redirectedFrom) {
    console.log(`Redirected from ${to.redirectedFrom.fullPath} to ${to.fullPath}`)
  }
})
```

#### _synced

Marks whether this route change is a "state sync" (not a complete navigation):

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // State sync: e.g., physical back button, TabBar click
    console.log('State sync, not active navigation')
  } else {
    // Complete navigation: push / replace / back, etc.
    console.log('Complete navigation')
  }
})
```

::: tip _synced applications
- When physical back button is triggered, route state syncs but `_synced` is `true`
- When TabBar click switches, `_synced` is also `true`
- Can be used to distinguish active navigation from passive state changes, deciding whether to perform certain side effects
:::

## Type Parsing Methods

`RouteLocationNormalized` provides a series of type-parsing methods to conveniently get typed data from query / params:

### queryInt / paramInt

Parse a parameter as an integer:

```ts
const route = useRoute()

// Parse from query
const id = route.value.queryInt('id')        // 123
const invalid = route.value.queryInt('name')  // NaN (returns NaN when parsing fails)

// Parse from params
const count = route.value.paramInt('count')   // 10
```

### queryNumber / paramNumber

Parse a parameter as a number (supports floats):

```ts
const route = useRoute()

const price = route.value.queryNumber('price')    // 99.99
const discount = route.value.paramNumber('discount')  // 0.85
```

### queryBool / paramBool

Parse a parameter as a boolean:

```ts
const route = useRoute()

// Supported truthy values: 'true' / '1' / 1 / true
// Supported falsy values: 'false' / '0' / 0 / false / undefined / null
const enabled = route.value.queryBool('enabled')   // true
const debug = route.value.paramBool('debug')       // false
```

### queryJSON / paramJSON

Parse a parameter as a JSON object:

```ts
const route = useRoute()

// JSON string in query
const filter = route.value.queryJSON('filter')
// query: ?filter={"category":"book","price":{"min":10,"max":100}}
// After parsing: { category: 'book', price: { min: 10, max: 100 } }

// JSON string in params
const config = route.value.paramJSON('config')
```

### Practical Example

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// Parse multiple types from query
const id = route.value.queryInt('id')              // Integer ID
const price = route.value.queryNumber('price')     // Float price
const enabled = route.value.queryBool('enabled')   // Boolean switch
const filter = route.value.queryJSON('filter')     // Complex object

// Parse from params
const user = route.value.paramJSON('user')         // User object
const tags = route.value.paramJSON('tags')         // Tag array

// Safe access (with defaults)
const page = route.value.queryInt('page') || 1
const size = route.value.queryInt('size') || 20
</script>
```

## Related Types

### RouteLocationRaw

Raw route location, the parameter type accepted by navigation methods:

```ts
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
```

### NavigationResult

The return type of `push()`, extends `RouteLocation` with an additional `eventChannel` for page communication:

```ts
interface NavigationResult extends RouteLocation {
  eventChannel?: EventChannel
}
```

- **eventChannel**: Page communication event channel, only available in `push` mode. `replace` / `relaunch` return `undefined` for this field.

::: info
`NavigationResult` extends `RouteLocation`, so existing code like `const route = await router.push(...)` works without modification.
:::

### EventChannel

Page communication event channel, corresponding to uni-app's native `uni.navigateTo` EventChannel mechanism:

```ts
interface EventChannel {
  emit(event: string, ...args: any[]): EventChannel
  on(event: string, callback: (...args: any[]) => void): EventChannel
  once(event: string, callback: (...args: any[]) => void): EventChannel
  off(event: string, callback?: (...args: any[]) => void): EventChannel
}
```

- **emit**: Send an event to the peer page
- **on**: Listen for an event from the peer page
- **once**: Listen for an event from the peer page (fires only once)
- **off**: Unlisten an event

::: tip
All methods return the `EventChannel` instance, supporting method chaining.
:::

## Complete Examples

### Basic Navigation

```ts
// String path
await router.push('/pages/about/about')

// Named route
await router.push({ name: 'about' })

// With parameters
await router.push({ name: 'detail', query: { id: '1' } })
```

### Complex Data Passing

```ts
// Pass complex object
await router.push({
  name: 'detail',
  params: {
    user: { name: 'Tom', age: 20 },
    items: [
      { id: 1, name: 'Product A', price: 99.9 },
      { id: 2, name: 'Product B', price: 199.9 }
    ]
  },
  persistent: true  // Persist, still readable after H5 refresh
})
```

### Cross-Page Communication

```ts
// Source page: open selector and listen for result
await router.push({
  name: 'select-address',
  events: {
    onSelected(address) {
      form.value.address = address
    },
    onCancel() {
      console.log('User cancelled selection')
    }
  }
})

// Target page: send result
const instance = getCurrentInstance()
const channel = instance?.proxy?.getOpenerEventChannel?.()

function selectAddress(address) {
  channel?.emit('onSelected', address)
  router.back()
}

function cancel() {
  channel?.emit('onCancel')
  router.back()
}
```

### Custom Animation

```ts
// Slide in from bottom (common for detail pages)
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 300 }
})

// Fade in (for modal-style pages)
await router.push({
  name: 'modal',
  animation: { type: 'fade-in', duration: 200 }
})

// Reverse animation on back
await router.back({
  animation: { type: 'slide-out-bottom', duration: 300 }
})
```

### Navigation Mode Control

```ts
// Replace login page after successful login (avoid going back to login)
await router.push({ name: 'home', mode: 'replace' })

// Restart app after logout
await router.push({ name: 'login', mode: 'relaunch' })

// Specify mode when redirecting in guards
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }, { mode: 'replace' })  // Replace, avoid going back to protected page
  } else {
    next()
  }
})
```

## Next Steps

- [useRoute()](./use-route) — Get route info in components
- [Router Instance](./router-instance) — Navigation methods in detail
- [RouterLink Component](./router-link) — Declarative navigation
