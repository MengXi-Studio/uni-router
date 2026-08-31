# Auto-Generating Page Configuration

Maintaining the page list in `pages.json` manually is error-prone and difficult to keep in sync with the source directory. The `generatePages` plugin from [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) can **scan Vue files and dynamically generate `pages.json`**, and with the in-page [`<route-config>` custom block](#route-config-custom-block) or the [`defineUniPage` macro](#defineunipage-macro), you can declare page configuration close to where it belongs — eliminating manual page configuration entirely.

## Relationship with Route Generation

- `generateRouter`: **reads `pages.json` → generates route configuration** (see [Auto-Generating Route Configuration](./auto-generate))
- `generatePages`: the **reverse** direction — "scans Vue files → generates `pages.json`"
- The two are complementary and can be used together (first `generatePages` produces `pages.json`, then `generateRouter` produces the route configuration), or independently

::: tip One-pipeline option
If you prefer both plugins to run as a **single pipeline** for pages + route configuration (in-memory pass, no redundant file reads), use the [`generateUni`](./generate-uni) combined entry.
:::

## Installation

::: code-group

```bash [pnpm]
pnpm add @meng-xi/vite-plugin@^1.4.0 -D
```

```bash [npm]
npm install @meng-xi/vite-plugin@^1.4.0 -D
```

```bash [yarn]
yarn add @meng-xi/vite-plugin@^1.4.0 -D
```

:::

## Basic Usage

By default it scans `src/pages` as the main package and `src/pages-sub` as a subpackage, generating `src/pages.json`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generatePages } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generatePages()
	]
})
```

Declare titles, meta, and tabBar membership close to the page with the `<route-config>` custom block:

```vue
<!-- src/pages/index/index.vue -->
<route-config lang="jsonc">
{
	"title": "Home",
	"isTab": true,
	"tab": {
		"iconPath": "static/tab/home.png",
		"selectedIconPath": "static/tab/home-active.png"
	}
}
</route-config>
```

Generated `pages.json` snippet:

```json
{
	"pages": [
		{ "path": "pages/index/index", "style": { "navigationBarTitleText": "Home" }, "meta": { "isTab": true } }
	],
	"tabBar": {
		"color": "#999999",
		"list": [
			{ "pagePath": "pages/index/index", "text": "Home", "iconPath": "static/tab/home.png", "selectedIconPath": "static/tab/home-active.png" }
		]
	}
}
```

## defineUniPage Macro

Since `1.4.0`, you can declare page configuration in `<script setup>` (or the top level of `<script>`) with the `defineUniPage` macro, with a JS/TS-like syntax:

```vue
<script setup lang="ts">
defineUniPage({
	title: 'Detail',
	name: 'DetailPage',
	isTab: true,
	tab: { text: 'Detail', order: 0 }
})
</script>
```

- **Priority**: when both the macro and `<route-config>` are declared on the same page, **the macro wins** (top-level fields are overridden by the macro)
- The macro argument is a JS object literal, supporting comments, single quotes, trailing commas, and nested objects (`tab` / `style` / `meta`)
- The macro is consumed during scanning and the call is removed at build time — **no import needed at runtime**
- The plugin auto-generates a global type declaration `src/define-uni-page.d.ts` (customizable via the `dts` option, or disabled with `false`), giving IDEs out-of-the-box recognition and checking

## route-config Custom Block

You can also declare configuration with the `<route-config>` custom block (lower priority than the macro). The content is JSONC (comments and trailing commas supported). Adding `lang="jsonc"` is recommended for IDE highlighting.

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Page title, mapped to `style.navigationBarTitleText` |
| `name` | `string` | Page name, written to the `name` field of pages.json |
| `style` | `object` | Page style, written verbatim to the `style` field |
| `meta` | `object` | Page meta, written verbatim to the `meta` field (consumed by `generateRouter` as route meta) |
| `isTab` | `boolean` | Whether it is a tabBar page; automatically collected into `tabBar.list` |
| `tab` | `object` | tabBar icon, text, and `order` sort weight |

## Configuration Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `pagesJsonPath` | `string` | `'src/pages.json'` | pages.json file path |
| `pagesDir` | `string` | `'src/pages'` | Main package pages directory |
| `subPackages` | `SubPackageConfig[]` | `[{ root: 'pages-sub', dir: 'src/pages-sub' }]` | Subpackage config list (skipped when the directory does not exist) |
| `routeConfigBlock` | `string` | `'route-config'` | Name of the page config custom block |
| `entryPage` | `string` | existing `pages[0]` | Main package entry page path, fixed as `pages[0]` |
| `titleFallback` | `'filename' \| 'none'` | `'filename'` | Fallback strategy when the title is missing |
| `tabBar` | `TabBarTemplate` | - | tabBar template (generated only when provided) |
| `includeExtensions` | `string[]` | `['.vue']` | Page file extensions |
| `excludePatterns` | `string[]` | `['node_modules']` | Path patterns to exclude |
| `watch` | `boolean` | `true` | Watch page directories and regenerate automatically |
| `dts` | `string \| false` | `'src/define-uni-page.d.ts'` | Output path for the `defineUniPage` macro global type declaration (`false` disables) |

## tabBar Generation

When a `tabBar` template is provided, the plugin automatically collects all main-package pages with `isTab: true` (tabBar only allows main-package pages) into `list`:

```ts
generatePages({
	tabBar: {
		color: '#999999',
		selectedColor: '#42b883',
		iconPath: 'static/tab/home.png', // global default icon, inherited by all tab items
		selectedIconPath: 'static/tab/home-active.png',
		overrides: { // per-page-path overrides (optional)
			'pages/about/about': {
				text: 'About Us',
				iconPath: 'static/tab/about.png',
				selectedIconPath: 'static/tab/about-active.png'
			}
		}
	}
})
```

**Icon & text priority (highest to lowest)**: in-page `<route-config>.tab` declaration → `tabBar.overrides[pagePath]` → `tabBar.iconPath` / `selectedIconPath` (global template) → page title / filename fallback.

## Working with the Router

In the pages.json generated by `generatePages`, the page-level `name` / `meta` fields are consumed directly by `generateRouter` as the route's `name` and `meta` (higher priority than the `metaMapping` mapping):

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
defineUniPage({
	title: 'Home',
	isTab: true,
	meta: { requireAuth: true } // the generated route will carry meta.requireAuth
})
</script>
```

```ts
// Generated route configuration (produced by generateRouter)
{ path: '/pages/index/index', name: 'pagesIndexIndex', meta: { title: 'Home', isTab: true, requireAuth: true } }
```

::: info Merge strategy
The plugin "generates only the page parts and keeps the rest": `pages` is always overwritten, `subPackages` is overwritten when present, `tabBar` is overwritten when a template is provided; non-page fields such as `globalStyle`, `condition`, and `easycom` are preserved verbatim.
:::
