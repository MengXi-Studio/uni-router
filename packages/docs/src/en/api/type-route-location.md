# RouteLocation

Route location type, describing the target of navigation. It is the core type of navigation methods like `router.push()` / `router.replace()` / `router.relaunch()` and the `to` prop of the `RouterLink` component.

## Input Type: RouteLocationRaw

Navigation methods accept `RouteLocationRaw`, which supports string paths, path objects, or named objects:

```ts
type RouteLocationRaw =
  | string
  | RouteLocationPathRaw
  | RouteLocationNamedRaw
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

## String Path

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
- Cannot specify advanced options like `animation` / `events`
- Recommend using object form for full capabilities
:::

## RouteLocationPathRaw

Specify the target path via `path`:

```ts
interface RouteLocationPathRaw {
  path: RoutePath
  query?: Record<string, QueryValue>
  params?: ParamsInput                        // (requires ParamsPlugin)
  persistent?: boolean                        // (requires ParamsPlugin)
  animation?: NavigationAnimation             // (requires AnimationPlugin)
  events?: EventListeners                     // (requires ChannelPlugin, push only)
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

## RouteLocationNamedRaw

Specify a named route via `name`:

```ts
interface RouteLocationNamedRaw {
  name: RouteName
  query?: Record<string, QueryValue>
  params?: ParamsInput                        // (requires ParamsPlugin)
  persistent?: boolean                        // (requires ParamsPlugin)
  animation?: NavigationAnimation             // (requires AnimationPlugin)
  events?: EventListeners                     // (requires ChannelPlugin, push only)
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

::: info Plugin dependencies
The `params`, `persistent`, `animation`, and `events` field types are always available (providing complete type hints), but at runtime they require the corresponding plugin to be registered to take effect. Using them without registering the plugin will throw a `PLUGIN_REQUIRED` error. See [Plugin System](../guide/plugins) for details.
:::

### path / name

Choose one to specify the target route. `name` takes priority over `path`.

### query

- **Type**: `Record<string, QueryValue>`
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

- **Type**: `ParamsInput`
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

### animation

- **Type**: `NavigationAnimation`
- **Description**: Animation config for this navigation, overrides `meta.animation`. Native window animation on App, CSS transition on H5 (only `push` / `back`)

```ts
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 500 }
})
```

### events

- **Type**: `EventListeners`
- **Description**: EventChannel event listeners, for target page to source page communication (push only)

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

## Resolved Type: RouteLocation

After navigation completes, `useRoute()` returns the resolved `RouteLocation` object:

```ts
interface RouteLocation {
  path: string
  name?: string
  meta: RouteMeta
  query: Record<string, string>
  params: Readonly<ParamObject>
  fullPath: string
  _synced?: boolean
  queryInt(key: string, defaultValue?: number): number | undefined
  queryNumber(key: string, defaultValue?: number): number | undefined
  queryBool(key: string, defaultValue?: boolean): boolean | undefined
}
```

### Special Fields

#### fullPath

Full path, including query:

```ts
const route = useRoute()
console.log(route.value.fullPath)
// /pages/detail/detail?id=1&tab=info
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

`RouteLocation` provides three type-parsing methods — `queryInt` / `queryNumber` / `queryBool` — to get typed data from query.

### queryInt

Parse a query parameter as an integer:

```ts
const route = useRoute()

const id = route.value.queryInt('id')          // 123
const invalid = route.value.queryInt('name')    // undefined (when parse fails or no default)
const page = route.value.queryInt('page', 1)    // With default, returns 1 when parse fails
```

### queryNumber

Parse a query parameter as a number (supports floats):

```ts
const route = useRoute()

const price = route.value.queryNumber('price')  // 99.99
```

### queryBool

Parse a query parameter as a boolean:

```ts
const route = useRoute()

// Only recognizes strings 'true' / '1' → true, 'false' / '0' → false
// Other values (including number 1 / 0, boolean true / false) return defaultValue
const enabled = route.value.queryBool('enabled')          // true
const debug = route.value.queryBool('debug')              // false
const unknown = route.value.queryBool('other', false)     // false (returns default when unrecognized)
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

// Safe access (with defaults)
const page = route.value.queryInt('page', 1)
const size = route.value.queryInt('size', 20)
</script>
```

## Related Types

### NavigationResult

The return type of `push()`, extends `RouteLocation` with an additional `eventChannel` for page communication:

```ts
interface NavigationResult extends RouteLocation {
  eventChannel?: EventChannel
}
```

- **eventChannel**: Page communication event channel. Available by default in `push` mode; `replace` / `relaunch` return `undefined` for this field by default. With `useUniEventChannel: true` enabled, all navigation methods return an available `eventChannel`.

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

// Reverse animation on back (animation passed as the second argument)
await router.back(1, {
  animation: { type: 'slide-out-bottom', duration: 300 }
})
```

### Navigation Mode Control

The navigation mode is determined by the called method: `router.replace()` replaces the current page, `router.relaunch()` clears the page stack. To specify the mode when redirecting in guards, use controllable redirect:

```ts
// Replace login page after successful login (avoid going back to login)
await router.replace({ name: 'home' })

// Restart app after logout (clear page stack)
await router.relaunch({ name: 'login' })

// Specify mode when redirecting in guards (controllable redirect)
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // Use replace to go to login, avoiding leaving login in the page stack
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  }
})
```

::: warning Navigation mode is not part of RouteLocationRaw
`RouteLocationRaw` does not include `mode` / `hash` fields. To force replace or clear the stack, call `router.replace()` / `router.relaunch()`; to specify the mode when redirecting in guards, use controllable redirect (`{ location, mode }`). See [Route Guards - Controllable Redirect](../guide/guards#controllable-redirect).
:::

## Next Steps

- [useRoute()](./use-route) — Get route info in components
- [Router Instance](./router-instance) — Navigation methods in detail
- [RouterLink Component](../component/router-link) — Declarative navigation
