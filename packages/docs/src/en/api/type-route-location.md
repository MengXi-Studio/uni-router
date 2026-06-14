# RouteLocation

Resolved route location information.

## Type Definition

```ts
interface RouteLocation {
	path: string
	name?: string
	meta: RouteMeta
	query: Record<string, string>
	fullPath: string
	_synced?: boolean
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

### \_synced

- **Type**: `boolean | undefined`
- **Description**: Whether this is a state sync (not a complete navigation). Set to `true` when route state is synchronized from the page stack via `syncRoute()` / `syncCurrentRoute()`. For normal navigation completions,
  this field is `undefined` or `false`.

::: warning
`_synced` is an internal marker and should not be relied upon in application code.
If you need to distinguish complete navigation from state synchronization, check this field in
`onRouteChange` listeners.
:::

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
	query?: Record<string, string>
	animation?: NavigationAnimation
	events?: EventListeners
}
```

### RouteLocationNamedRaw

Name-based raw route location:

```ts
interface RouteLocationNamedRaw {
	name: string
	query?: Record<string, string>
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
//   fullPath: '/pages/about/about?id=1'
// }
```
