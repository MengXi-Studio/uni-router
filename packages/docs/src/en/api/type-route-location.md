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

::: warning `_synced` is an internal marker and should not be relied upon in application code. If you need to distinguish complete navigation from state synchronization, check this field in `onRouteChange` listeners. :::

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
}
```

### RouteLocationNamedRaw

Name-based raw route location:

```ts
interface RouteLocationNamedRaw {
	name: string
	query?: Record<string, string>
}
```

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
