# RouterOptions

Router initialization options, passed to `createRouter()`.

## Type Definition

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
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

## Example

```ts
const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
  ],
  strict: true
})
```
