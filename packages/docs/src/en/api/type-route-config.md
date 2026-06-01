# RouteConfig

Route configuration item, corresponding to a page declaration in `pages.json`.

## Type Definition

```ts
interface RouteConfig {
  path: string
  name?: string
  meta?: RouteMeta
  beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

## Properties

### path

- **Type**: `string`
- **Required**: Yes
- **Description**: Page path, must match the path in `pages.json` (without leading `/`)

### name

- **Type**: `string`
- **Required**: No
- **Description**: Route name for named route navigation. Duplicate names are overwritten with a warning

### meta

- **Type**: [`RouteMeta`](./type-route-meta)
- **Required**: No
- **Description**: Route meta information

### beforeEnter

- **Type**: [`NavigationGuard`](./type-navigation-guard) | [`NavigationGuard`](./type-navigation-guard)[]
- **Required**: No
- **Description**: Per-route guard, triggered only when entering this route. Supports a single guard or an array of guards

## Example

```ts
const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: 'Home' }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: 'About', requireAuth: true },
    beforeEnter: (to, from, next) => {
      if (isLoggedIn()) next()
      else next({ name: 'login' })
    }
  },
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { isTab: true }
  }
]
```
