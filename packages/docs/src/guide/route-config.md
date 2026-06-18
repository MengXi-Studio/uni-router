# 路由配置

Uni Router 的路由配置需与 uni-app 的 `pages.json` 保持一致。本节介绍如何定义路由配置和元信息，以及如何使用 `@meng-xi/vite-plugin` 自动生成路由配置和类型声明。

## 自动生成路由配置

手动编写路由配置容易出错且难以与 `pages.json` 保持同步。推荐使用 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 提供的 `generateRouter` 插件，根据 `pages.json` 自动生成路由配置文件。

### 安装

::: code-group

```bash [pnpm]
pnpm add @meng-xi/vite-plugin@^0.1.6 -D
```

```bash [npm]
npm install @meng-xi/vite-plugin@^0.1.6 -D
```

```bash [yarn]
yarn add @meng-xi/vite-plugin@^0.1.6 -D
```

:::

### 基本使用

在 `vite.config.ts` 中配置插件：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts'
		})
	]
})
```

插件会在 Vite 启动时读取 `pages.json`，自动生成 `src/router.config.ts`：

```ts
// src/router.config.ts（自动生成，请勿手动修改）
export interface RouteMeta {
	title?: string
	isTab?: boolean
	requireAuth?: boolean
	[key: string]: unknown
}

export interface RouteConfig {
	path: string
	name?: string
	meta?: RouteMeta
}

export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '首页', isTab: true }
	},
	{
		path: '/pages/about/about',
		name: 'pagesAboutAbout',
		meta: { title: '关于', isTab: true }
	},
	{
		path: '/pages/user/user',
		name: 'pagesUserUser',
		meta: { title: '我的', requireAuth: true }
	}
]

export default routes
```

然后在 `main.ts` 中导入生成的路由配置：

```ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

### 配置选项

| 选项                   | 类型                                                | 默认值                   | 描述                                                          |
| ---------------------- | --------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `pagesJsonPath`        | `string`                                            | `'src/pages.json'`       | pages.json 文件路径（相对于项目根目录）                       |
| `outputPath`           | `string`                                            | `'src/router.config.ts'` | 路由配置输出路径（相对于项目根目录）                          |
| `outputFormat`         | `'ts' \| 'js'`                                      | `'ts'`                   | 输出文件格式                                                  |
| `nameStrategy`         | `'path' \| 'camelCase' \| 'pascalCase' \| 'custom'` | `'camelCase'`            | 路由名称生成策略                                              |
| `customNameGenerator`  | `(path: string) => string`                          | -                        | 自定义路由名称生成函数（`nameStrategy` 为 `'custom'` 时生效） |
| `includeSubPackages`   | `boolean`                                           | `true`                   | 是否包含子包路由                                              |
| `watch`                | `boolean`                                           | `true`                   | 是否监听 pages.json 变化并自动重新生成                        |
| `metaMapping`          | `Record<string, string>`                            | -                        | pages.json style 字段到 meta 的映射                           |
| `exportTypes`          | `boolean`                                           | `true`                   | 是否在输出文件中导出类型定义                                  |
| `preserveRouteChanges` | `boolean`                                           | `true`                   | 是否保留用户对 routes 配置的手动修改                          |
| `dts`                  | `string \| boolean`                                 | `false`                  | 类型声明文件输出路径，详见[类型提示](#类型提示)               |

### 路由名称生成策略

`nameStrategy` 选项控制路由名称的生成方式：

| 策略                  | 路径示例             | 生成名称                          |
| --------------------- | -------------------- | --------------------------------- |
| `'camelCase'`（默认） | `/pages/index/index` | `pagesIndexIndex`                 |
| `'pascalCase'`        | `/pages/about/about` | `PagesAboutAbout`                 |
| `'path'`              | `/pages/user/user`   | `pages_user_user`                 |
| `'custom'`            | 自定义               | 由 `customNameGenerator` 函数返回 |

### meta 字段映射

`metaMapping` 选项将 `pages.json` 中 `style` 对象的字段映射到路由 `meta` 中：

```ts
generateRouter({
	metaMapping: {
		navigationBarTitleText: 'title', // style.navigationBarTitleText → meta.title
		requireAuth: 'requireAuth' // style.requireAuth → meta.requireAuth
	}
})
```

插件还会自动推断以下 meta 字段：

- **`isTab`**：根据 `pages.json` 中的 `tabBar.list` 自动标记
- **`requireAuth`**：如果 `style.requireAuth` 为 `true`，自动映射到 `meta.requireAuth`

## 类型提示

从 `@meng-xi/vite-plugin@0.1.6` 开始，`generateRouter` 插件支持自动生成 TypeScript 类型声明文件，为路由导航提供类型安全的自动补全。

### 启用类型生成

通过 `dts` 选项启用：

```ts
generateRouter({
	// 使用默认路径 src/router.d.ts
	dts: true,

	// 或自定义路径
	dts: 'src/types/router.d.ts'
})
```

### 生成的类型文件

启用后，插件会在指定路径生成类型声明文件：

```ts
// src/router.d.ts（自动生成，请勿手动修改）
/* eslint-disable */
// @ts-nocheck
// Generated by @meng-xi/vite-plugin. Do not edit.

import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
	interface RouteNameMap {
		pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
		pagesAboutAbout: { path: '/pages/about/about'; meta: { title: string; isTab: true } }
		pagesUserUser: { path: '/pages/user/user'; meta: { title: string; requireAuth: true } }
	}
}
```

### 类型提示效果

类型声明文件通过模块增强（Module Augmentation）扩展了 `@meng-xi/uni-router` 的 `RouteNameMap` 接口，实现以下类型提示：

**路由名称自动补全：**

```ts
router.push({ name: 'pagesIndexIndex' }) // ✅ 自动补全所有路由名称
router.push({ name: 'nonExistent' }) // ❌ TypeScript 类型错误
```

**路径自动补全：**

```ts
router.push({ path: '/pages/index/index' }) // ✅ 自动补全所有路由路径
router.push({ path: '/invalid/path' }) // ❌ TypeScript 类型错误
```

::: info
未启用 `dts` 时，`name` 和 `path` 的类型为 `string`，不会提供自动补全或类型检查。
:::

### 完整配置示例

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			outputFormat: 'ts',
			nameStrategy: 'camelCase',
			includeSubPackages: true,
			watch: true,
			dts: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

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

::: warning
`path` 字段必须与 `pages.json` 中声明的页面路径完全一致，否则路由匹配将失败。
:::

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
	strict: true,
	interceptUniApi: true,
	guardTimeout: 15000,
	readyTimeout: 5000
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

::: warning
`pages.json` 中的页面声明是 uni-app 框架的基础，Uni Router 的路由配置必须与之保持一致。
`pages.json` 中未声明的页面无法被导航到。
:::
