# RouteMeta

Route meta information, used to describe additional properties of a route.

## Type Definition

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  [key: string]: unknown
}
```

## Built-in Properties

### title

- **Type**: `string | undefined`
- **Description**: Page title, can be used in `afterEach` hooks to set the navigation bar title

### isTab

- **Type**: `boolean | undefined`
- **Description**: Whether the page is a TabBar page. The router automatically selects the navigation API based on this field
  - `true` → `uni.switchTab`
  - `false` / not set → `uni.navigateTo` / `uni.redirectTo`

::: important
Must be consistent with the `tabBar.list` declaration in `pages.json`.
:::

### requireAuth

- **Type**: `boolean | undefined`
- **Description**: Whether login authentication is required, commonly used with `beforeEach` guards

## Custom Extensions

Arbitrary custom fields are supported through the index signature `[key: string]: unknown`:

```ts
meta: {
  title: 'Article Detail',
  requireAuth: false,
  keepAlive: true,
  permissions: ['read', 'comment']
}
```

Type assertions are needed when accessing custom fields:

```ts
const permissions = to.meta.permissions as string[] | undefined
```
