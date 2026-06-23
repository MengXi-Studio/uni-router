# 自动生成路由配置

手动编写路由配置容易出错且难以与 `pages.json` 保持同步。[`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 提供的 `generateRouter` 插件可根据 `pages.json` 自动生成路由配置文件和类型声明，大幅减少手动维护成本。

## 安装

::: code-group

```bash [pnpm]
pnpm add @meng-xi/vite-plugin@^0.2.5 -D
```

```bash [npm]
npm install @meng-xi/vite-plugin@^0.2.5 -D
```

```bash [yarn]
yarn add @meng-xi/vite-plugin@^0.2.5 -D
```

:::

## 基本使用

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

## 配置选项

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
| `headerTemplate`       | `boolean \| string`                                 | `false`                                             | 文件注释头模板，`true` 生成默认注释头，`string` 自定义模板，详见[文件注释头](#文件注释头) |
| `customFields`         | `Record<string, string>`                            | `{}`                                                | 自定义字段键值对，供 `{custom:键名}` 占位符引用                |

## 路由名称生成策略

`nameStrategy` 选项控制路由名称的生成方式：

| 策略                  | 路径示例             | 生成名称                          |
| --------------------- | -------------------- | --------------------------------- |
| `'camelCase'`（默认） | `/pages/index/index` | `pagesIndexIndex`                 |
| `'pascalCase'`        | `/pages/about/about` | `PagesAboutAbout`                 |
| `'path'`              | `/pages/user/user`   | `pages_user_user`                 |
| `'custom'`            | 自定义               | 由 `customNameGenerator` 函数返回 |

## meta 字段映射

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

## 页面级 name 配置

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

## 页面级 meta 配置

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

## 文件注释头

`headerTemplate` 选项控制生成文件顶部的注释头内容，支持布尔值和字符串模板：

- **`false`** / 不传：不生成注释头
- **`true`**：生成默认注释头（`{name} {date} {version}`）
- **`string`**：根据模板字符串生成注释头，支持占位符自由组合

**占位符一览：**

| 占位符          | 替换值                                         | 示例                                |
| --------------- | ---------------------------------------------- | ----------------------------------- |
| `{name}`        | 插件名称                                       | `generate-router`                   |
| `{date}`        | 生成日期时间（默认格式 `YYYY-MM-DD HH:mm:ss`） | `2026-06-24 14:30:00`               |
| `{date:格式}`   | 按指定格式输出日期时间                         | `{date:YYYY-MM-DD}` → `2026-06-24`  |
| `{version}`     | 插件版本号                                     | `0.2.5`                             |
| `{custom:键名}` | 自定义字段，值从 `customFields` 读取           | `{custom:author}` → `MengXi Studio` |

```ts
// 默认注释头（headerTemplate: true）
generateRouter({ headerTemplate: true })
// 生成：
// /**
//  * generate-router 2026-06-24 14:30:00 0.2.5
//  */

// 自定义日期格式
generateRouter({ headerTemplate: '{name} {date:YYYY-MM-DD} {version}' })
// 生成：
// /**
//  * generate-router 2026-06-24 0.2.5
//  */

// 自定义字段
generateRouter({
	headerTemplate: '{name} {custom:author} {date} {version}',
	customFields: { author: 'MengXi Studio' }
})
// 生成：
// /**
//  * generate-router MengXi Studio 2026-06-24 14:30:00 0.2.5
//  */
```

::: info
`{date:格式}` 支持的格式符：`YYYY`（年）、`MM`（月）、`DD`（日）、`HH`（时）、`mm`（分）、`ss`（秒）。
如果 `{custom:键名}` 对应的键在 `customFields` 中不存在，占位符将原样保留。
:::

## 保留用户修改

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

## 完整配置示例

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
			headerTemplate: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```
