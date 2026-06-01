# RouteLocation

解析后的路由位置信息。

## 类型定义

```ts
interface RouteLocation {
  path: string
  name?: string
  meta: RouteMeta
  query: Record<string, string>
  fullPath: string
}
```

## 属性

### path

- **类型**: `string`
- **说明**: 规范化后的路径（以 `/` 开头）

### name

- **类型**: `string | undefined`
- **说明**: 路由名称，未配置名称的路由为 `undefined`

### meta

- **类型**: [`RouteMeta`](./type-route-meta)
- **说明**: 路由元信息，未配置时为空对象 `{}`

### query

- **类型**: `Record<string, string>`
- **说明**: 查询参数键值对，无参数时为空对象 `{}`

### fullPath

- **类型**: `string`
- **说明**: 完整路径（含查询参数），如 `/pages/about/about?id=1`

## 相关类型

### RouteLocationRaw

原始路由位置，导航方法接受的参数类型：

```ts
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
```

### RouteLocationPathRaw

基于路径的原始路由位置：

```ts
interface RouteLocationPathRaw {
  path: string
  query?: Record<string, string>
}
```

### RouteLocationNamedRaw

基于名称的原始路由位置：

```ts
interface RouteLocationNamedRaw {
  name: string
  query?: Record<string, string>
}
```

## 示例

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
