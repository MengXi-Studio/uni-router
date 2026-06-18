# Route Configuration

Uni Router's route configuration must be consistent with uni-app's `pages.json`. This section covers how to define route configurations and meta information, as well as how to use `@meng-xi/vite-plugin` to auto-generate
route configurations and type declarations.

## Auto-Generating Route Configuration

Writing route configurations manually is error-prone and difficult to keep in sync with `pages.json`. It's recommended to use the `generateRouter` plugin from
[`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) to automatically generate route configuration files from `pages.json`.

### Installation

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

### Basic Usage

Configure the plugin in `vite.config.ts`:

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

The plugin reads `pages.json` when Vite starts and automatically generates `src/router.config.ts`:

```ts
// src/router.config.ts (auto-generated, do not edit manually)
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
		meta: { title: 'Home', isTab: true }
	},
	{
		path: '/pages/about/about',
		name: 'pagesAboutAbout',
		meta: { title: 'About', isTab: true }
	},
	{
		path: '/pages/user/user',
		name: 'pagesUserUser',
		meta: { title: 'Profile', requireAuth: true }
	}
]

export default routes
```

Then import the generated route configuration in `main.ts`:

```ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

### Configuration Options

| Option                 | Type                                                | Default                  | Description                                                                        |
| ---------------------- | --------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `pagesJsonPath`        | `string`                                            | `'src/pages.json'`       | Path to pages.json (relative to project root)                                      |
| `outputPath`           | `string`                                            | `'src/router.config.ts'` | Route config output path (relative to project root)                                |
| `outputFormat`         | `'ts' \| 'js'`                                      | `'ts'`                   | Output file format                                                                 |
| `nameStrategy`         | `'path' \| 'camelCase' \| 'pascalCase' \| 'custom'` | `'camelCase'`            | Route name generation strategy                                                     |
| `customNameGenerator`  | `(path: string) => string`                          | -                        | Custom route name generator function (effective when `nameStrategy` is `'custom'`) |
| `includeSubPackages`   | `boolean`                                           | `true`                   | Whether to include sub-package routes                                              |
| `watch`                | `boolean`                                           | `true`                   | Whether to watch pages.json changes and auto-regenerate                            |
| `metaMapping`          | `Record<string, string>`                            | -                        | Mapping from pages.json style fields to meta                                       |
| `exportTypes`          | `boolean`                                           | `true`                   | Whether to export type definitions in the output file                              |
| `preserveRouteChanges` | `boolean`                                           | `true`                   | Whether to preserve user modifications to routes                                   |
| `dts`                  | `string \| boolean`                                 | `false`                  | Type declaration file output path, see [Type Hints](#type-hints)                   |

### Route Name Generation Strategy

The `nameStrategy` option controls how route names are generated:

| Strategy                | Path Example         | Generated Name                             |
| ----------------------- | -------------------- | ------------------------------------------ |
| `'camelCase'` (default) | `/pages/index/index` | `pagesIndexIndex`                          |
| `'pascalCase'`          | `/pages/about/about` | `PagesAboutAbout`                          |
| `'path'`                | `/pages/user/user`   | `pages_user_user`                          |
| `'custom'`              | Custom               | Returned by `customNameGenerator` function |

### Meta Field Mapping

The `metaMapping` option maps fields from the `style` object in `pages.json` to route `meta`:

```ts
generateRouter({
	metaMapping: {
		navigationBarTitleText: 'title', // style.navigationBarTitleText → meta.title
		requireAuth: 'requireAuth' // style.requireAuth → meta.requireAuth
	}
})
```

The plugin also automatically infers the following meta fields:

- **`isTab`**: Automatically marked based on `tabBar.list` in `pages.json`
- **`requireAuth`**: If `style.requireAuth` is `true`, automatically mapped to `meta.requireAuth`

## Type Hints

Starting from `@meng-xi/vite-plugin@0.1.6`, the `generateRouter` plugin supports auto-generating TypeScript type declaration files, providing type-safe autocompletion for route navigation.

### Enabling Type Generation

Enable it via the `dts` option:

```ts
generateRouter({
	// Use default path src/router.d.ts
	dts: true,

	// Or custom path
	dts: 'src/types/router.d.ts'
})
```

### Generated Type File

When enabled, the plugin generates a type declaration file at the specified path:

```ts
// src/router.d.ts (auto-generated, do not edit manually)
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

### Type Hint Effects

The type declaration file extends the `RouteNameMap` interface of `@meng-xi/uni-router` through Module Augmentation, providing the following type hints:

**Route name autocompletion:**

```ts
router.push({ name: 'pagesIndexIndex' }) // ✅ Autocompletes all route names
router.push({ name: 'nonExistent' }) // ❌ TypeScript type error
```

**Path autocompletion:**

```ts
router.push({ path: '/pages/index/index' }) // ✅ Autocompletes all route paths
router.push({ path: '/invalid/path' }) // ❌ TypeScript type error
```

::: info
When `dts` is not enabled, the types of `name` and `path` are `string`,
which does not provide autocompletion or type checking.
:::

### Full Configuration Example

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

Each route configuration item corresponds to a page declaration in `pages.json`:

```ts
interface RouteConfig {
	path: string
	name?: string
	meta?: RouteMeta
	beforeEnter?: NavigationGuard | NavigationGuard[]
}
```

### path

Page path, must match the path in `pages.json` (without leading `/`):

```ts
const routes = [
	{ path: 'pages/index/index', name: 'home' },
	{ path: 'pages/about/about', name: 'about' },
	{ path: 'pages/user/user', name: 'user' }
]
```

::: warning
The `path` field must exactly match the page path declared in `pages.json`, otherwise route matching will fail.
:::

### name

Route name for named route navigation. It's recommended to configure a unique name for each route:

```ts
router.push({ name: 'about' })
```

If duplicate names are defined, the later one overwrites the earlier one with a warning.

### meta

Route meta information. See [Route Meta](./meta) chapter for details.

### beforeEnter

Per-route guard. See [Route Guards](./guards#beforeenter) chapter for details.

## Creating a Router

Use `createRouter()` to create a router instance:

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
	routes: [
		{
			path: 'pages/index/index',
			name: 'home',
			meta: { title: 'Home' }
		},
		{
			path: 'pages/about/about',
			name: 'about',
			meta: { title: 'About', requireAuth: true }
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

### strict Option

- **`true`** (default): Strict mode, unmatched named routes will throw `ROUTE_NOT_FOUND` error
- **`false`**: Lenient mode, unmatched named routes only output a warning and fall back to using the name as path

```ts
const router = createRouter({
	routes,
	strict: false
})
```

## Route Matching

Uni Router supports both path and name matching:

### Path Matching

```ts
router.push('pages/about/about')
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

Paths are automatically normalized (adding leading `/`), so the following are equivalent:

```ts
router.push('pages/about/about')
router.push('/pages/about/about')
```

### Name Matching

```ts
router.push({ name: 'about' })
router.push({ name: 'about', query: { id: '1' } })
```

### Path with Query String

```ts
router.push('pages/about/about?id=1&tab=info')
```

The query string is automatically parsed into a `query` object.

## Relationship with pages.json

Uni Router does **not replace** `pages.json`, but works alongside it:

| Responsibility    | pages.json          | Uni Router               |
| ----------------- | ------------------- | ------------------------ |
| Page registration | ✅ Required         | ❌ Not responsible       |
| Route navigation  | uni.navigateTo etc. | ✅ push / replace / back |
| Route guards      | ❌ Not supported    | ✅ beforeEach etc.       |
| Route meta        | ❌ Not supported    | ✅ meta field            |
| Named routes      | ❌ Not supported    | ✅ name field            |

::: warning
Page declarations in `pages.json` are the foundation of the uni-app framework.
Uni Router's route configurations must be consistent with them.
Pages not declared in `pages.json` cannot be navigated to.
:::
