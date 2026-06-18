# RouterOptions

路由器初始化选项，传递给 `createRouter()`。

## 类型定义

```ts
interface RouterOptions {
	routes: RouteConfig[]
	strict?: boolean
	interceptUniApi?: boolean
	guardTimeout?: number
	readyTimeout?: number
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
- **说明**: 是否拦截 uni 原生导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）
  - `true`：直接调用 `uni.navigateTo()` 等方法将被拦截并转由路由器处理，确保路由守卫（`beforeEach` / `beforeResolve` / `afterEach`）始终生效
  - `false`：直接调用 uni 原生 API 将绕过路由守卫

::: warning
启用 `interceptUniApi` 后，直接调用 `uni.navigateTo()` 等方法的 `success` / `fail` 回调将不会被触发，因为原始调用被阻止后转由路由器执行。建议统一使用 `router.push()` / `router.replace()` / `router.back()`
进行导航。
:::

### guardTimeout

- **类型**: `number`
- **默认值**: `10000`（10 秒）
- **说明**: 守卫超时时间（毫秒）。当守卫函数在此时间内既未调用 `next()` 也未返回 rejected Promise 时，将输出警告并自动中止导航以防止永久挂起。
  - 适用于守卫中包含耗时异步操作（如网络请求）的场景
  - 设为 `0` 可禁用超时保护（不推荐）

```ts
const router = createRouter({
  routes: [...],
  guardTimeout: 30000 // 守卫中异步请求较慢时调大超时
})
```

### readyTimeout

- **类型**: `number`
- **默认值**: `0`（永不超时）
- **说明**: 路由器就绪超时时间（毫秒）。当路由器在此时间内未能完成初始化时，`await router.isReady()` 将被 reject，防止路由器初始化异常时 Promise 永久挂起。
  - 设为 `0` 可禁用超时保护（默认行为，即永不超时）

```ts
const router = createRouter({
  routes: [...],
  readyTimeout: 5000 // 5 秒内未就绪则 reject isReady() Promise
})
```

## 示例

```ts
const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
		{ path: 'pages/about/about', name: 'about', meta: { requireAuth: true } }
	],
	strict: true,
	interceptUniApi: true,
	guardTimeout: 15000,
	readyTimeout: 5000
})
```
