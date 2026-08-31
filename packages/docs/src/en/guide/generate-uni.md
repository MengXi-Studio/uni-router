# Pages + Routes in One Pipeline

`generateUni` is a **combined-entry plugin** (added in `1.3.0`) from [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin): it orchestrates "scan pages → generate `pages.json`" and "read `pages.json` → generate route configuration" into a single pipeline, generating both uni-app **page configuration** and **route configuration** in one pass, with **in-memory data passing and no redundant file reads**.

## Relationship with the Two Standalone Plugins

`generateUni` is equivalent to using `generatePages` + `generateRouter` together, but the two phases are connected via the **in-memory pages data**, avoiding the "write then re-read" round-trip of an intermediate artifact:

| Plugin | Role |
| --- | --- |
| `generatePages` | Scans Vue files → generates pages.json (see [Auto-Generating Page Config](./generate-pages)) |
| `generateRouter` | Reads pages.json → generates route configuration (see [Auto-Generating Route Config](./auto-generate)) |
| `generateUni` | **Combines both** in one pipeline with in-memory passing |

The two original plugins remain unchanged and can still be used independently. If you only need one phase, use the corresponding plugin directly.

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

Configure the top-level `pagesJsonPath` and `watch` shared by both phases; the `pages` sub-object holds phase-one (page generation) options and the `router` sub-object holds phase-two (route generation) options:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateUni } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateUni({
			pagesJsonPath: 'src/pages.json',
			pages: {
				pagesDir: 'src/pages',
				subPackages: [{ root: 'pages-sub', dir: 'src/pages-sub' }],
				entryPage: 'pages/index/index',
				tabBar: { color: '#999999', selectedColor: '#42b883' }
			},
			router: {
				outputPath: 'src/router.config.ts',
				nameStrategy: 'camelCase',
				dts: 'src/router.d.ts'
			}
		})
	]
})
```

Declare page configuration close to the page with the `defineUniPage` macro or the `<route-config>` custom block (identical to `generatePages`):

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
defineUniPage({
	title: 'Home',
	isTab: true,
	tab: { order: 0 }
})
</script>
```

```vue
<!-- src/pages/about/about.vue -->
<route-config lang="jsonc">
{
	"title": "About",
	"isTab": true,
	"meta": { "requireAuth": true }
}
</route-config>
```

## Configuration Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `pagesJsonPath` | `string` | `'src/pages.json'` | pages.json file path (shared by both phases) |
| `watch` | `boolean` | `true` | Watch page directories and re-run the whole pipeline automatically |
| `pages` | [`GeneratePagesOptions`](./generate-pages#configuration-options) | `{ pagesDir: 'src/pages', subPackages: [{ root: 'pages-sub', dir: 'src/pages-sub' }] }` | Phase-one options: scan pages to generate pages.json |
| `router` | [`GenerateRouterOptions`](./auto-generate#configuration-options) | `{ outputPath: 'src/router.config.ts' }` | Phase-two options: generate route configuration from pages.json |

::: info
The `pages` / `router` sub-objects support **all options** of the corresponding standalone plugins (`pages` includes the `defineUniPage` macro / `<route-config>` / tabBar / dts, etc.; `router` includes `nameStrategy` / `metaMapping` / `preserveRouteChanges` / `headerTemplate` / `dts`, etc.). Top-level `pagesJsonPath` / `watch` override the same-named options in the sub-objects.
:::

## Pipeline Overview

```
generateUni(options)
│
├─ Phase 1 (Pages)
│  scan page directories + <route-config> ──► in-memory pages data (pages/subPackages/tabBar)
│  merge existing pages.json (preserve non-page fields like globalStyle) ──► write pages.json
│      │
│      └──► in-memory pages object (passed directly, no re-read)
│
▼
├─ Phase 2 (Routes)
│  parsePagesJson(pages object) ──► routes
│  mergeRoutes (preserve user changes) ──► router.config.ts (+ optional dts)
```

- `pages.json` is still written to disk (`uni()` and the build flow need the file), but the route phase consumes the in-memory pages object directly instead of reading it back
- A single `watch` listens to the page directories; on changes the "phase one + phase two" pipeline is re-run **serially**, avoiding concurrent read/write races
- Phase-two route merging and type declaration behavior are identical to `generateRouter` (including `preserveRouteChanges` preserving user changes)

## Migrating from Two Plugins

The old `generatePages` + `generateRouter` setup can be replaced equivalently with `generateUni`:

```ts
// Before
generatePages({ pagesDir: 'src/pages', entryPage: 'pages/index/index', tabBar: {...} }),
generateRouter({ outputPath: 'src/router.config.ts', nameStrategy: 'camelCase', dts: true })

// After
generateUni({
	pages: { pagesDir: 'src/pages', entryPage: 'pages/index/index', tabBar: {...} },
	router: { outputPath: 'src/router.config.ts', nameStrategy: 'camelCase', dts: true }
})
```

## Working with the Router

The `router.config.ts` produced by `generateUni` is identical to `generateRouter`'s output and works directly with `createRouter`:

```ts
// main.ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

The `name` / `meta` declared in pages via `defineUniPage` / `<route-config>` are automatically mapped to the route's `name` and `meta`, and through `router.d.ts` you get type hints and autocomplete for route names / paths (see [Type Hints](./auto-generate#type-hints)).
