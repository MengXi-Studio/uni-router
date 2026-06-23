# Auto-Generating Route Configuration

Writing route configurations manually is error-prone and difficult to keep in sync with `pages.json`. The `generateRouter` plugin from [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) can automatically generate route configuration files and type declarations from `pages.json`, significantly reducing manual maintenance effort.

## Installation

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

## Basic Usage

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
import type { RouteConfig } from '@meng-xi/uni-router'

/**
 * Route configuration list
 * @description Auto-generated from pages.json
 */
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

::: info
- When `exportTypes` is `true` (default) and `outputFormat` is `'ts'`, the generated file includes an `import type { RouteConfig } from '@meng-xi/uni-router'` statement at the top
- When `outputFormat` is `'js'`, no type import or type annotation is generated
:::

Then import the generated route configuration in `main.ts`:

```ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

## Configuration Options

| Option                 | Type                                                | Default                                              | Description                                                                                         |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pagesJsonPath`        | `string`                                            | `'src/pages.json'`                                  | Path to pages.json (relative to project root)                                                      |
| `outputPath`           | `string`                                            | `'src/router.config.ts'`                            | Route config output path (relative to project root)                                                |
| `outputFormat`         | `'ts' \| 'js'`                                      | `'ts'`                                              | Output file format                                                                                  |
| `nameStrategy`         | `'path' \| 'camelCase' \| 'pascalCase' \| 'custom'` | `'camelCase'`                                       | Route name generation strategy                                                                      |
| `customNameGenerator`  | `(path: string) => string`                          | -                                                   | Custom route name generator function (required when `nameStrategy` is `'custom'`)                   |
| `includeSubPackages`   | `boolean`                                           | `true`                                              | Whether to include sub-package routes                                                               |
| `watch`                | `boolean`                                           | `true`                                              | Whether to watch pages.json changes and auto-regenerate (only effective in dev mode)                |
| `metaMapping`          | `Record<string, string>`                            | `{ navigationBarTitleText: 'title', requireAuth: 'requireAuth' }` | Mapping from pages.json style fields to meta                         |
| `exportTypes`          | `boolean`                                           | `true`                                              | Whether to export type definitions in the output file (`import type` statement)                     |
| `preserveRouteChanges` | `boolean`                                           | `true`                                              | Whether to preserve user modifications to routes                                                    |
| `dts`                  | `string \| boolean`                                 | `false`                                             | Type declaration file output path, see [Type Hints](#type-hints)                                    |
| `headerTemplate`       | `boolean \| string`                                 | `false`                                             | File comment header template, `true` for default header, `string` for custom template, see [File Comment Header](#file-comment-header) |
| `customFields`         | `Record<string, string>`                            | `{}`                                                | Custom field key-value pairs for `{custom:key}` placeholders                                        |

## Route Name Generation Strategy

The `nameStrategy` option controls how route names are generated:

| Strategy                | Path Example         | Generated Name                             |
| ----------------------- | -------------------- | ------------------------------------------ |
| `'camelCase'` (default) | `/pages/index/index` | `pagesIndexIndex`                          |
| `'pascalCase'`          | `/pages/about/about` | `PagesAboutAbout`                          |
| `'path'`                | `/pages/user/user`   | `pages_user_user`                          |
| `'custom'`              | Custom               | Returned by `customNameGenerator` function |

## Meta Field Mapping

The `metaMapping` option maps fields from the `style` object in `pages.json` to route `meta`. By default, `navigationBarTitleText → title` and `requireAuth → requireAuth` mappings are already configured:

```ts
// Default metaMapping (effective without manual configuration)
{
	navigationBarTitleText: 'title', // style.navigationBarTitleText → meta.title
	requireAuth: 'requireAuth'       // style.requireAuth → meta.requireAuth
}
```

Custom `metaMapping` **overrides** the default mappings. To preserve default behavior, include them in your custom mapping:

```ts
generateRouter({
	metaMapping: {
		navigationBarTitleText: 'title', // Preserve default
		requireAuth: 'requireAuth',       // Preserve default
		customFlag: 'customFlag'          // Add custom mapping
	}
})
```

Additionally, the plugin automatically infers the following meta fields (not affected by `metaMapping`):

- **`isTab`**: Automatically marked based on `tabBar.list` in `pages.json`, no manual configuration needed

## Page-Level Name Configuration

Starting from `@meng-xi/vite-plugin@0.2.4`, you can directly configure the `name` field for pages in `pages.json`, which takes priority over `nameStrategy` auto-generation:

```json
{
	"pages": [
		{
			"path": "pages/user/profile",
			"name": "UserProfile",
			"style": { "navigationBarTitleText": "Profile" }
		}
	]
}
```

In the above configuration, the route name is `'UserProfile'`, not `'pagesUserProfile'` as auto-generated by `nameStrategy`.

## Page-Level Meta Configuration

Starting from `@meng-xi/vite-plugin@0.2.3`, you can directly configure the `meta` field for pages in `pages.json`, without relying on `metaMapping`:

```json
{
	"pages": [
		{
			"path": "pages/index/index",
			"style": { "navigationBarTitleText": "Home" },
			"meta": { "requireAuth": true, "customField": "value" }
		}
	]
}
```

::: info
The `meta` field takes priority over `metaMapping`, allowing page-level overrides.
:::

**Meta extraction priority:**

| Priority | Source              | Description                                                        |
| -------- | ------------------- | ------------------------------------------------------------------ |
| 1 (high) | `pageConfig.name`   | Name field directly configured in pages.json (0.2.4+)             |
| 1 (high) | `pageConfig.meta`   | Meta field directly configured in pages.json                      |
| 2        | `nameStrategy`      | Auto-generated route name based on nameStrategy                    |
| 2        | `metaMapping`       | Extracted from style field mapping                                |
| 3 (low)  | TabBar inference    | Automatically identifies tabBar pages and sets `isTab: true`      |

## Type Hints

Starting from `@meng-xi/vite-plugin@0.2.2`, the `generateRouter` plugin supports auto-generating TypeScript type declaration files, providing type-safe autocompletion for route navigation.

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
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
	interface RouteNameMap {
		/** Home */
		pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
		/** About */
		pagesAboutAbout: { path: '/pages/about/about'; meta: { title: string; isTab: true } }
		/** Profile */
		pagesUserUser: { path: '/pages/user/user'; meta: { title: string; requireAuth: boolean } }
	}
}
```

::: info
- Each route generates a TSDoc comment with the value of `meta.title`
- String fields in `meta` are typed as `string`, boolean `true` fields as literal `true`, number fields as `number`
- Routes without a `name` will use `path` as the key
:::

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

## File Comment Header

The `headerTemplate` option controls the comment header at the top of the generated file, supporting boolean and string template:

- **`false`** / omitted: No comment header
- **`true`**: Generate default header (`{name} {date} {version}`)
- **`string`**: Generate header from template string with placeholder combination

**Placeholder reference:**

| Placeholder        | Replacement                                      | Example                              |
| ------------------ | ------------------------------------------------ | ------------------------------------ |
| `{name}`           | Plugin name                                      | `generate-router`                    |
| `{date}`           | Generation datetime (default format `YYYY-MM-DD HH:mm:ss`) | `2026-06-24 14:30:00` |
| `{date:format}`    | Datetime in specified format                     | `{date:YYYY-MM-DD}` → `2026-06-24`  |
| `{version}`        | Plugin version                                   | `0.2.5`                              |
| `{custom:key}`     | Custom field, value from `customFields`          | `{custom:author}` → `MengXi Studio`  |

```ts
// Default header (headerTemplate: true)
generateRouter({ headerTemplate: true })
// Generated:
// /**
//  * generate-router 2026-06-24 14:30:00 0.2.5
//  */

// Custom date format
generateRouter({ headerTemplate: '{name} {date:YYYY-MM-DD} {version}' })
// Generated:
// /**
//  * generate-router 2026-06-24 0.2.5
//  */

// Custom fields
generateRouter({
	headerTemplate: '{name} {custom:author} {date} {version}',
	customFields: { author: 'MengXi Studio' }
})
// Generated:
// /**
//  * generate-router MengXi Studio 2026-06-24 14:30:00 0.2.5
//  */
```

::: info
`{date:format}` supports format tokens: `YYYY` (year), `MM` (month), `DD` (day), `HH` (hour), `mm` (minute), `ss` (second).
If the key in `{custom:key}` does not exist in `customFields`, the placeholder is preserved as-is.
:::

## Preserving User Modifications

When `preserveRouteChanges` is enabled (default), the plugin preserves user modifications to the `routes` array when regenerating route configurations:

**Merge strategy:**

| Field | Merge behavior |
|-------|---------------|
| `path` | Always uses the new value generated from pages.json |
| `name` | Always uses the new value from pages.json (`pageConfig.name` or `nameStrategy` auto-generation) |
| `meta` | Fields sourced from pages.json always use the new value; user custom fields (not in new meta) are preserved |
| Other properties (e.g. `beforeEnter`) | Fully preserved |

```ts
// First generation
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true }
}

// User manually adds beforeEnter and custom meta field
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true, role: 'admin' },
	beforeEnter: (to, from, next) => { /* ... */ }
}

// Regenerated after pages.json changes — user modifications preserved
{
	path: '/pages/admin/admin',
	name: 'pagesAdminAdmin',
	meta: { requireAuth: true, role: 'admin' },  // role preserved
	beforeEnter: (to, from, next) => { /* ... */ }  // beforeEnter preserved
}
```

## Full Configuration Example

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
