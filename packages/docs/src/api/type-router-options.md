# RouterOptions

路由器初始化选项，传递给 `createRouter()`。

## 类型定义

```ts
interface RouterOptions {
	routes: RouteConfig[]
	strict?: boolean
	interceptUniApi?: boolean
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

### interceptUniApi

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否拦截 uni 原生导航 API（`navigateTo` / `redirectTo` / `switchTab` / `navigateBack`）
  - `true`：直接调用 `uni.navigateTo()` 等方法将被拦截并转由路由器处理，确保路由守卫（`beforeEach` / `beforeResolve` / `afterEach`）始终生效
  - `false`：直接调用 uni 原生 API 将绕过路由守卫

::: warning启用 `interceptUniApi` 后，直接调用 `uni.navigateTo()` 等方法的 `success` / `fail` 回调将不会被触发，因为原始调用被阻止后转由路由器执行。建议统一使用 `router.push()` / `router.replace()` / `router.back()`
进行导航。:::

## 示例

```ts
const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
		{ path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
	],
	strict: true,
	interceptUniApi: true // 拦截 uni 原生导航 API，确保守卫生效
})
```
