# RouterOptions

路由器初始化选项，传递给 `createRouter()`。

## 类型定义

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
}
```

## 属性

### routes

- **类型**: `RouteConfig[]`
- **必填**: 是
- **说明**: 路由配置列表，需与 `pages.json` 中的页面声明保持一致

### strict

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用严格模式
  - `true`：未匹配的命名路由将抛出 `ROUTE_NOT_FOUND` 错误
  - `false`：未匹配的命名路由仅输出警告，并使用名称作为路径回退

## 示例

```ts
const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
  ],
  strict: true
})
```
