# RouteLocation

Resolved route location information.

## Type Definition

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

## Properties

### path

- **Type**: `string`
- **Description**: Normalized path (starts with `/`)

### name

- **Type**: `string | undefined`
- **Description**: Route name, `undefined` for routes without a name configured

### meta

- **Type**: [`RouteMeta`](./type-route-meta)
- **Description**: Route meta information, empty object `{}` when not configured

### query

- **Type**: `Record<string, string>`
- **Description**: Query parameter key-value pairs, empty object `{}` when no parameters

### fullPath

- **Type**: `string`
- **Description**: Full path (including query parameters), e.g. `/pages/about/about?id=1`. Query parameters are sorted alphabetically by key to ensure consistent fullPath generation.

### params

- **Type**: `Readonly<ParamObject>`
- **Description**: Page parameters (read from memory or storage, read-only). Passed in via the `params` option during navigation, not exposed in the URL, supports complex data (objects, arrays, and other JSON-serializable values). Empty object `{}` when no params are passed.

```ts
// Pass params when navigating
await router.push({ path: '/pages/detail/detail', params: { id: 123, info: { name: 'Tom' } } })

// Read in target page
const route = useRoute()
console.log(route.params.id)    // 123
console.log(route.params.info)  // { name: 'Tom' }
```

### \_synced

- **Type**: `boolean | undefined`
- **Description**: Whether this is a state sync (not a complete navigation). Set to `true` when route state is synchronized from the page stack via `syncRoute()` / `syncCurrentRoute()`. For normal navigation completions,
  this field is `undefined` or `false`.

::: warning
`_synced` is an internal marker and should not be relied upon in application code.
If you need to distinguish complete navigation from state synchronization, check this field in
`onRouteChange` listeners.
:::

## Methods

### queryInt()

Parse a query parameter as an integer.

```ts
queryInt(key: string, defaultValue?: number): number | undefined
```

- **key**: Query parameter key name
- **defaultValue**: Default value when the parameter doesn't exist or fails to parse
- **Returns**: Parsed integer value, or `defaultValue` when the parameter doesn't exist or fails to parse (or `undefined` if no default provided)

```ts
// URL: /pages/detail/detail?id=123
route.queryInt('id')           // 123
route.queryInt('page', 1)      // 1 (default value)
route.queryInt('invalid', 0)   // 0 (default value on parse failure)
```

### queryNumber()

Parse a query parameter as a number (supports floating point).

```ts
queryNumber(key: string, defaultValue?: number): number | undefined
```

- **key**: Query parameter key name
- **defaultValue**: Default value when the parameter doesn't exist or fails to parse
- **Returns**: Parsed number value, or `defaultValue` when the parameter doesn't exist or fails to parse (or `undefined` if no default provided)

```ts
// URL: /pages/detail/detail?price=19.99
route.queryNumber('price')         // 19.99
route.queryNumber('price', 0)      // 19.99
route.queryNumber('missing', 0)    // 0 (default value)
```

### queryBool()

Parse a query parameter as a boolean.

```ts
queryBool(key: string, defaultValue?: boolean): boolean | undefined
```

- **key**: Query parameter key name
- **defaultValue**: Default value when the parameter doesn't exist or is unrecognized
- **Returns**: Parsed boolean value, or `defaultValue` when the parameter doesn't exist or is unrecognized (or `undefined` if no default provided)

Recognition rules:
- `'true'` / `'1'` → `true`
- `'false'` / `'0'` → `false`
- Other values → returns `defaultValue`

```ts
// URL: /pages/detail/detail?enabled=true
route.queryBool('enabled')         // true
route.queryBool('visible', false)  // false (default value)
```

## Related Types

### RouteLocationRaw

Raw route location, the parameter type accepted by navigation methods:

```ts
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
```

### RouteLocationPathRaw

Path-based raw route location:

```ts
interface RouteLocationPathRaw {
	path: string
	query?: Record<string, QueryValue>
	params?: ParamObject
	persistent?: boolean
	animation?: NavigationAnimation
	events?: EventListeners
}
```

### RouteLocationNamedRaw

Name-based raw route location:

```ts
interface RouteLocationNamedRaw {
	name: string
	query?: Record<string, QueryValue>
	params?: ParamObject
	persistent?: boolean
	animation?: NavigationAnimation
	events?: EventListeners
}
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

### EventListeners

Event listener collection, used for the `events` field in `RouteLocationPathRaw` and `RouteLocationNamedRaw`:

```ts
type EventListeners = Record<string, (...args: any[]) => void>
```

### QueryValue

Query parameter value type (supports `string` / `number` / `boolean` on input, internally converted to `string`):

```ts
type QueryValue = string | number | boolean
```

### ParamValue

Page parameter value type (supports JSON-serializable data only):

```ts
type ParamValue = string | number | boolean | null | ParamObject | ParamValue[]
```

### ParamObject

Page parameter object type:

```ts
interface ParamObject {
	[key: string]: ParamValue
}
```

::: info
In the source code, the type of `path` is `RoutePath` and the type of `name` is `RouteName`, which provide type hints through the `RouteNameMap` interface.
When using the `dts` feature of `@meng-xi/vite-plugin` to generate type declarations, `name` and `path` will have autocompletion and type checking.
Without augmentation, both fall back to `string`.
:::

## Example

```ts
const location = router.resolve({ name: 'about', query: { id: '1' } })
// {
//   path: '/pages/about/about',
//   name: 'about',
//   meta: { requireAuth: true },
//   query: { id: '1' },
//   params: {},
//   fullPath: '/pages/about/about?id=1'
// }
```
