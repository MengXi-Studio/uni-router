# 一条流水线：页面 + 路由配置

`generateUni` 是 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 提供的**组合入口插件**（`1.3.0` 新增）：将「扫描页面 → 生成 `pages.json`」与「读 `pages.json` → 生成路由配置」编排为一条流水线，一条流水线同时完成 uni-app 的**页面配置**与**路由配置**生成，**内存数据直传、不重复读盘**。

## 与两个独立插件的关系

`generateUni` 等价于 `generatePages` + `generateRouter` 连用，但两阶段通过**内存中的 pages 数据**串联，避免「先写盘再读盘」的中间产物往返：

| 插件 | 作用 |
| --- | --- |
| `generatePages` | 扫描 Vue 文件 → 生成 pages.json（见[自动生成页面配置](./generate-pages)） |
| `generateRouter` | 读 pages.json → 生成路由配置（见[自动生成路由配置](./auto-generate)） |
| `generateUni` | **两者合一**，一条流水线完成，内存直传 |

原有两个插件保持不变，仍可单独使用。若只用到其中一阶段，直接使用对应插件即可。

## 安装

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

## 基本使用

顶层配置两阶段共用的 `pagesJsonPath` 与 `watch`；`pages` 子对象为阶段一（页面生成）参数，`router` 子对象为阶段二（路由生成）参数：

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

页面配置通过 `defineUniPage` 宏或 `<route-config>` 自定义块就近声明（与 `generatePages` 完全一致）：

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
defineUniPage({
	title: '首页',
	isTab: true,
	tab: { order: 0 }
})
</script>
```

```vue
<!-- src/pages/about/about.vue -->
<route-config lang="jsonc">
{
	"title": "关于",
	"isTab": true,
	"meta": { "requireAuth": true }
}
</route-config>
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pagesJsonPath` | `string` | `'src/pages.json'` | pages.json 文件路径（两阶段共用） |
| `watch` | `boolean` | `true` | 监听页面目录变更自动重新执行整条流水线 |
| `pages` | [`GeneratePagesOptions`](./generate-pages#配置选项) | `{ pagesDir: 'src/pages', subPackages: [{ root: 'pages-sub', dir: 'src/pages-sub' }] }` | 阶段一参数：扫描页面生成 pages.json |
| `router` | [`GenerateRouterOptions`](./auto-generate#配置选项) | `{ outputPath: 'src/router.config.ts' }` | 阶段二参数：基于 pages.json 生成路由配置 |

::: info
`pages` / `router` 两个子对象支持对应独立插件的**全部配置项**（`pages` 含 `defineUniPage` 宏 / `<route-config>` / tabBar / dts 等；`router` 含 `nameStrategy` / `metaMapping` / `preserveRouteChanges` / `headerTemplate` / `dts` 等）。顶层 `pagesJsonPath` / `watch` 会覆盖子对象中的同名配置。
:::

## 流水线说明

```
generateUni(options)
│
├─ Phase 1（页面阶段）
│  扫描页面目录 + <route-config> ──► 内存 pages 数据（pages/subPackages/tabBar）
│  合并现有 pages.json（保留 globalStyle 等非页面字段）──► 写入 pages.json
│      │
│      └──► 内存 pages 对象（直传，不重新读盘）
│
▼
├─ Phase 2（路由阶段）
│  parsePagesJson(pages 对象) ──► routes
│  mergeRoutes（保留用户修改）──► router.config.ts（+ 可选 dts）
```

- `pages.json` 仍会写盘（`uni()` 与构建流程需要该文件），但路由阶段直接消费内存中的 pages 对象，不再读盘回灌
- 只用一个 `watch` 监听页面目录，变更时**串行**重跑「阶段一 + 阶段二」，避免并发读写竞态
- 阶段二的路由合并、类型声明等行为与 `generateRouter` 完全一致（含 `preserveRouteChanges` 保留用户修改）

## 从两个插件迁移

原使用 `generatePages` + `generateRouter` 的配置，等价替换为 `generateUni`：

```ts
// 之前
generatePages({ pagesDir: 'src/pages', entryPage: 'pages/index/index', tabBar: {...} }),
generateRouter({ outputPath: 'src/router.config.ts', nameStrategy: 'camelCase', dts: true })

// 之后
generateUni({
	pages: { pagesDir: 'src/pages', entryPage: 'pages/index/index', tabBar: {...} },
	router: { outputPath: 'src/router.config.ts', nameStrategy: 'camelCase', dts: true }
})
```

## 与路由配合

`generateUni` 生成的 `router.config.ts` 与 `generateRouter` 产出完全一致，直接配合 `createRouter` 使用：

```ts
// main.ts
import { createRouter } from '@meng-xi/uni-router'
import routes from './router.config'

const router = createRouter({ routes })
```

页面中通过 `defineUniPage` / `<route-config>` 声明的 `name` / `meta` 会自动映射为路由的 `name` 与 `meta`，并通过 `router.d.ts` 获得路由名称/路径的类型提示与自动补全（见[类型提示](./auto-generate#类型提示)）。
