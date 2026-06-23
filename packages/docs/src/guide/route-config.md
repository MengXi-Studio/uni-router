# 路由配置

Uni Router 的路由配置需与 uni-app 的 `pages.json` 保持一致。本节介绍如何定义路由配置和元信息，以及如何使用 `@meng-xi/vite-plugin` 自动生成路由配置和类型声明。

## 自动生成路由配置

手动编写路由配置容易出错且难以与 `pages.json` 保持同步。推荐使用 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 提供的 `generateRouter` 插件，根据 `pages.json` 自动生成路由配置文件。

### 安装

::: code-group

```bash [pnpm]
pnpm add @meng-xi/vite-plugin@^0.2.4 -D
```

```bash [npm]
npm install @meng-xi/vite-plugin@^0.2.4 -D
```

```bash [yarn]
yarn add @meng-xi/vite-plugin@^0.2.4 -D
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
import type { RouteConfig } from '@meng-xi/uni-router'

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 */
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

::: info
- 当 `exportTypes` 为 `true`（默认）且 `outputFormat` 为 `'ts'` 时，生成的文件顶部会包含 `import type { RouteConfig } from '@meng-xi/uni-router'` 导入语句
- 当 `outputFormat` 为 `'js'` 时，不生成类型导入和类型注解
:::

然后在 `main.ts` 中导入生成的路由配置：

```ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

### 配置选项

| 选项                   | 类型                                                | 默认值                                              | 描述                                                          |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `pagesJsonPath`        | `string`                                            | `'src/pages.json'`                                  | pages.json 文件路径（相对于项目根目录）                       |
| `outputPath`           | `string`                                            | `'src/router.config.ts'`                            | 路由配置输出路径（相对于项目根目录）                          |
| `outputFormat`         | `'ts' \| 'js'`                                      | `'ts'`                                              | 输出文件格式                                                  |
| `nameStrategy`         | `'path' \| 'camelCase' \| 'pascalCase' \| 'custom'` | `'camelCase'`                                       | 路由名称生成策略                                              |
| `customNameGenerator`  | `(path: string) => string`                          | -                                                   | 自定义路由名称生成函数（`nameStrategy` 为 `'custom'` 时必须提供） |
| `includeSubPackages`   | `boolean`                                           | `true`                                              | 是否包含子包路由                                              |
| `watch`                | `boolean`                                           | `true`                                              | 是否监听 pages.json 变化并自动重新生成（仅开发模式生效）      |
| `metaMapping`          | `Record<string, string>`                            | `{ navigationBarTitleText: 'title', requireAuth: 'requireAuth' }` | pages.json style 字段到 meta 的映射            |
| `exportTypes`          | `boolean`                                           | `true`                                              | 是否在输出文件中导出类型定义（`import type` 语句）            |
| `preserveRouteChanges` | `boolean`                                           | `true`                                              | 是否保留用户对 routes 配置的手动修改                          |
| `dts`                  | `string \| boolean`                                 | `false`                                             | 类型声明文件输出路径，详见[类型提示](#类型提示)               |
| `fileHeader`           | `boolean`                                           | `false`                                             | 是否在生成文件顶部添加标准化注释头（含插件名称、日期、版本号） |

### 路由名称生成策略

`nameStrategy` 选项控制路由名称的生成方式：

| 策略                  | 路径示例             | 生成名称                          |
| --------------------- | -------------------- | --------------------------------- |
| `'camelCase'`（默认） | `/pages/index/index` | `pagesIndexIndex`                 |
| `'pascalCase'`        | `/pages/about/about` | `PagesAboutAbout`                 |
| `'path'`              | `/pages/user/user`   | `pages_user_user`                 |
| `'custom'`            | 自定义               | 由 `customNameGenerator` 函数返回 |

### meta 字段映射

`metaMapping` 选项将 `pages.json` 中 `style` 对象的字段映射到路由 `meta` 中。默认已配置 `navigationBarTitleText → title` 和 `requireAuth → requireAuth` 的映射：

```ts
// 默认的 metaMapping（无需手动配置即可生效）
{
	navigationBarTitleText: 'title', // style.navigationBarTitleText → meta.title
	requireAuth: 'requireAuth'       // style.requireAuth → meta.requireAuth
}
```

自定义 `metaMapping` 会**覆盖**默认映射，如需保留默认行为请一并写入：

```ts
generateRouter({
	metaMapping: {
		navigationBarTitleText: 'title', // 保留默认
		requireAuth: 'requireAuth',       // 保留默认
		customFlag: 'customFlag'          // 新增自定义映射
	}
})
```

此外，插件会自动推断以下 meta 字段（不受 `metaMapping` 影响）：

- **`isTab`**：根据 `pages.json` 中的 `tabBar.list` 自动标记，无需手动配置

### 页面级 name 配置

从 `@meng-xi/vite-plugin@0.2.4` 开始，支持在 `pages.json` 中直接为页面配置 `name` 字段，优先级高于 `nameStrategy` 自动生成：

```json
{
	"pages": [
		{
			"path": "pages/user/profile",
			"name": "UserProfile",
			"style": { "navigationBarTitleText": "个人中心" }
		}
	]
}
```

上述配置中，路由名称为 `'UserProfile'`，而非 `nameStrategy` 自动生成的 `'pagesUserProfile'`。

### 页面级 meta 配置

从 `@meng-xi/vite-plugin@0.2.3` 开始，支持在 `pages.json` 中直接为页面配置 `meta` 字段，无需依赖 `metaMapping` 映射：

```json
{
	"pages": [
		{
			"path": "pages/index/index",
			"style": { "navigationBarTitleText": "首页" },
			"meta": { "requireAuth": true, "customField": "value" }
		}
	]
}
```

::: info
`meta` 字段优先级高于 `metaMapping` 映射，允许页面级覆盖。
:::

**元信息提取优先级：**

| 优先级  | 来源               | 说明                                   |
| ------- | ------------------ | -------------------------------------- |
| 1（高） | `pageConfig.name`  | pages.json 中页面直接配置的 name 字段（0.2.4+） |
| 1（高） | `pageConfig.meta`  | pages.json 中页面直接配置的 meta 字段  |
| 2       | `nameStrategy`     | 根据 nameStrategy 自动生成的路由名称   |
| 2       | `metaMapping` 映射 | 从 style 字段映射提取                  |
| 3（低） | tabBar 推断        | 自动识别 tabBar 页面设置 `isTab: true` |

## 类型提示

从 `@meng-xi/vite-plugin@0.2.2` 开始，`generateRouter` 插件支持自动生成 TypeScript 类型声明文件，为路由导航提供类型安全的自动补全。

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
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
	interface RouteNameMap {
		/** 首页 */
		pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
		/** 关于 */
		pagesAboutAbout: { path: '/pages/about/about'; meta: { title: string; isTab: true } }
		/** 我的 */
		pagesUserUser: { path: '/pages/user/user'; meta: { title: string; requireAuth: boolean } }
	}
}
```

::: info
- 每个路由会生成 TSDoc 注释，内容为 `meta.title` 的值
- `meta` 中的字符串字段类型为 `string`，布尔 `true` 字段类型为字面量 `true`，数字字段类型为 `number`
- 未配置 `name` 的路由会使用 `path` 作为键名
:::

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
			fileHeader: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

### 文件注释头

启用 `fileHeader` 后，生成的路由配置文件顶部会添加标准化注释头：

```ts
/**
 * @plugin generate-router
 * @date 2026-06-18 14:30:00
 * @version 0.2.4
 */

import type { RouteConfig } from '@meng-xi/uni-router'
// ...
```

### 保留用户修改

启用 `preserveRouteChanges`（默认开启）后，插件在重新生成路由配置时会保留用户对 `routes` 数组的手动修改：

**合并策略：**

| 字段 | 合并行为 |
|------|---------|
| `path` | 始终使用 pages.json 生成的新值 |
| `name` | 始终使用 pages.json 生成的新值（`pageConfig.name` 或 `nameStrategy` 自动生成） |
| `meta` | pages.json 生成的字段始终使用新值，用户自定义字段（不在新 meta 中的字段）予以保留 |
| 其他属性（如 `beforeEnter`） | 完全保留 |

```ts
// 首次生成
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true }
}

// 用户手动添加 beforeEnter 和自定义 meta 字段
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true, role: 'admin' },
	beforeEnter: (to, from, next) => { /* ... */ }
}

// pages.json 变化后重新生成 — 用户修改被保留
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true, role: 'admin' },  // role 保留
	beforeEnter: (to, from, next) => { /* ... */ }  // beforeEnter 保留
}
```

## RouteConfig

每个路由配置项对应 `pages.json` 中的一个页面声明：

```ts
interface RouteConfig {
	path: string
	name?: string
	meta?: RouteMeta
	beforeEnter?: NavigationGuard | NavigationGuard[]
	[key: string]: any // 支持自定义扩展属性
}
```

::: info
`[key: string]: any` 索引签名允许在路由配置中添加自定义属性（如 `beforeEnter`、`component` 等），这些属性会被 `preserveRouteChanges` 机制保留。
:::

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
