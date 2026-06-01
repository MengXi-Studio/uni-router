# 路由配置

Uni Router 的路由配置需与 uni-app 的 `pages.json` 保持一致。本节介绍如何定义路由配置和元信息。

## RouteConfig

每个路由配置项对应 `pages.json` 中的一个页面声明：

```ts
interface RouteConfig {
	path: string
	name?: string
	meta?: RouteMeta
	beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

### path

页面路径，需与 `pages.json` 中的路径一致（不含前导 `/`）：

```ts
const routes = [
	{ path: 'pages/index/index', name: 'home' },
	{ path: 'pages/about/about', name: 'about' },
	{ path: 'pages/user/user', name: 'user' }
]
```

::: warning `path` 字段必须与 `pages.json` 中声明的页面路径完全一致，否则路由匹配将失败。:::

### name

路由名称，用于命名路由导航。建议为每个路由配置唯一的名称：

```ts
router.push({ name: 'about' })
```

如果定义了重复的名称，后定义的会覆盖先定义的，并输出警告信息。

### meta

路由元信息，详见 [路由元信息](./meta) 章节。

### beforeEnter

路由独享守卫，详见 [路由守卫](./guards#beforeenter) 章节。

## 创建路由器

使用 `createRouter()` 创建路由器实例：

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
	routes: [
		{
			path: 'pages/index/index',
			name: 'home',
			meta: { title: '首页' }
		},
		{
			path: 'pages/about/about',
			name: 'about',
			meta: { title: '关于', requireAuth: true }
		},
		{
			path: 'pages/user/user',
			name: 'user',
			meta: { isTab: true }
		}
	],
	strict: true
})
```

### strict 选项

- **`true`**（默认）：严格模式，未匹配的命名路由将抛出 `ROUTE_NOT_FOUND` 错误
- **`false`**：宽松模式，未匹配的命名路由仅输出警告，并使用名称作为路径回退

```ts
const router = createRouter({
	routes,
	strict: false
})
```

## 路由匹配

Uni Router 使用路径和名称两种方式进行路由匹配：

### 路径匹配

```ts
router.push('pages/about/about')
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

路径会自动规范化（补全前导 `/`），以下写法等价：

```ts
router.push('pages/about/about')
router.push('/pages/about/about')
```

### 名称匹配

```ts
router.push({ name: 'about' })
router.push({ name: 'about', query: { id: '1' } })
```

### 带查询参数的路径

```ts
router.push('pages/about/about?id=1&tab=info')
```

查询字符串会被自动解析为 `query` 对象。

## 与 pages.json 的关系

Uni Router **不替代** `pages.json`，而是与之配合使用：

| 职责       | pages.json        | Uni Router               |
| ---------- | ----------------- | ------------------------ |
| 页面注册   | ✅ 必须声明       | ❌ 不负责                |
| 路由导航   | uni.navigateTo 等 | ✅ push / replace / back |
| 路由守卫   | ❌ 不支持         | ✅ beforeEach 等         |
| 路由元信息 | ❌ 不支持         | ✅ meta 字段             |
| 命名路由   | ❌ 不支持         | ✅ name 字段             |

::: important `pages.json` 中的页面声明是 uni-app 框架的基础，Uni Router 的路由配置必须与之保持一致。`pages.json` 中未声明的页面无法被导航到。:::
