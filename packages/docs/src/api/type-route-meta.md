# RouteMeta

路由元信息，用于描述路由的附加属性。

## 类型定义

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  [key: string]: unknown
}
```

## 内置属性

### title

- **类型**: `string | undefined`
- **说明**: 页面标题，可在 `afterEach` 钩子中用于设置导航栏标题

### isTab

- **类型**: `boolean | undefined`
- **说明**: 是否为 TabBar 页面。路由器根据此字段自动选择导航 API
  - `true` → `uni.switchTab`
  - `false` / 未设置 → `uni.navigateTo` / `uni.redirectTo`

::: important
必须与 `pages.json` 中的 `tabBar.list` 声明一致。
:::

### requireAuth

- **类型**: `boolean | undefined`
- **说明**: 是否需要登录认证，常与 `beforeEach` 守卫配合使用

## 自定义扩展

通过索引签名 `[key: string]: unknown` 支持任意自定义字段：

```ts
meta: {
  title: '文章详情',
  requireAuth: false,
  keepAlive: true,
  permissions: ['read', 'comment']
}
```

访问自定义字段时需要类型断言：

```ts
const permissions = to.meta.permissions as string[] | undefined
```
