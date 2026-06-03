# RouterOptions

Router initialization options, passed to `createRouter()`.

## Type Definition

```ts
interface RouterOptions {
	routes: RouteConfig[]
	strict?: boolean
	interceptUniApi?: boolean
}
```

## Properties

### routes

- **Type**: `RouteConfig[]`
- **Required**: Yes
- **Description**: Route configuration list, must be consistent with page declarations in `pages.json`

### strict

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to enable strict mode
  - `true`: Unmatched named routes throw `ROUTE_NOT_FOUND` error
  - `false`: Unmatched named routes only output a warning and use the name as a path fallback

### interceptUniApi

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to intercept uni native navigation APIs (`navigateTo` / `redirectTo` / `switchTab` / `navigateBack`)
  - `true`: Direct calls to `uni.navigateTo()` etc. will be intercepted and redirected through the router, ensuring route guards (`beforeEach` / `beforeResolve` / `afterEach`) are always triggered
  - `false`: Direct calls to uni native APIs bypass route guards

::: warning When `interceptUniApi` is enabled, `success` / `fail` callbacks of direct `uni.navigateTo()` calls will not be triggered, since the original call is blocked and redirected through the router. It is
recommended to use `router.push()` / `router.replace()` / `router.back()` for navigation consistently. :::

## Example

```ts
const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
		{ path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
	],
	strict: true,
	interceptUniApi: true // Intercept uni native navigation APIs to ensure guards work
})
```
