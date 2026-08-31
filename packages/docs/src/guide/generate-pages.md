# 自动生成页面配置

手动维护 `pages.json` 的页面列表容易出错且难以与源码目录同步。[`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 提供的 `generatePages` 插件可**扫描 Vue 文件动态生成 `pages.json`**，配合页面内的 [`<route-config>` 自定义块](#route-config-自定义块) 或 [`defineUniPage` 宏](#defineunipage-宏) 就近声明页面配置，彻底解放手动配置。

## 与路由生成的关系

- `generateRouter`：**读 `pages.json` → 生成路由配置**（见[自动生成路由配置](./auto-generate)）
- `generatePages`：**反向**「扫描 Vue 文件 → 生成 `pages.json`」
- 二者方向互补，可配合使用（先 `generatePages` 生成 pages.json，再由 `generateRouter` 生成路由配置），也可单独使用

::: tip 一条流水线
若希望两个插件「一条流水线」完成页面 + 路由配置生成（内存直传、不重复读盘），推荐使用 [`generateUni`](./generate-uni) 组合入口。
:::

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

默认扫描 `src/pages` 为主包、`src/pages-sub` 为分包，自动生成 `src/pages.json`：

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

在页面中通过 `<route-config>` 自定义块就近声明标题、meta、tabBar 归属：

```vue
<!-- src/pages/index/index.vue -->
<route-config lang="jsonc">
{
	"title": "首页",
	"isTab": true,
	"tab": {
		"iconPath": "static/tab/home.png",
		"selectedIconPath": "static/tab/home-active.png"
	}
}
</route-config>
```

生成的 `pages.json` 片段：

```json
{
	"pages": [
		{ "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" }, "meta": { "isTab": true } }
	],
	"tabBar": {
		"color": "#999999",
		"list": [
			{ "pagePath": "pages/index/index", "text": "首页", "iconPath": "static/tab/home.png", "selectedIconPath": "static/tab/home-active.png" }
		]
	}
}
```

## defineUniPage 宏

`1.4.0` 起支持在 `<script setup>`（或 `<script>` 顶层）中通过 `defineUniPage` 宏声明页面配置，写法更贴近 JS/TS：

```vue
<script setup lang="ts">
defineUniPage({
	title: '详情',
	name: 'DetailPage',
	isTab: true,
	tab: { text: '详情', order: 0 }
})
</script>
```

- **优先级**：同一页面同时声明宏与 `<route-config>` 时，**以宏为准**（顶层字段按宏覆盖自定义块）
- 宏参数为 JS 对象字面量，支持注释、单引号、尾随逗号与嵌套对象（`tab` / `style` / `meta`）
- 宏在扫描时被消费，构建时自动移除调用，**运行时无需 import**
- 插件自动生成全局类型声明 `src/define-uni-page.d.ts`（`dts` 选项可自定义路径或 `false` 关闭），IDE 开箱识别并检查

## route-config 自定义块

页面中也可通过 `<route-config>` 自定义块声明配置（优先级低于宏），内容为 JSONC（支持注释与尾随逗号），建议添加 `lang="jsonc"` 获得 IDE 高亮。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 页面标题，映射为 `style.navigationBarTitleText` |
| `name` | `string` | 页面名称，写入 pages.json 的 `name` 字段 |
| `style` | `object` | 页面样式，原样写入 `style` 字段 |
| `meta` | `object` | 页面元信息，原样写入 `meta` 字段（会被 `generateRouter` 消费为路由 meta） |
| `isTab` | `boolean` | 是否为 tabBar 页面，自动归集到 `tabBar.list` |
| `tab` | `object` | tabBar 图标、文本与 `order` 排序权重 |

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pagesJsonPath` | `string` | `'src/pages.json'` | pages.json 文件路径 |
| `pagesDir` | `string` | `'src/pages'` | 主包页面目录 |
| `subPackages` | `SubPackageConfig[]` | `[{ root: 'pages-sub', dir: 'src/pages-sub' }]` | 分包配置列表（目录不存在时跳过） |
| `routeConfigBlock` | `string` | `'route-config'` | 页面配置自定义块名称 |
| `entryPage` | `string` | 现有 `pages[0]` | 主包入口页路径，固定为 `pages[0]` |
| `titleFallback` | `'filename' \| 'none'` | `'filename'` | 标题缺失时的兜底策略 |
| `tabBar` | `TabBarTemplate` | - | tabBar 模板（提供后才生成） |
| `includeExtensions` | `string[]` | `['.vue']` | 页面文件扩展名列表 |
| `excludePatterns` | `string[]` | `['node_modules']` | 排除的路径模式列表 |
| `watch` | `boolean` | `true` | 监听页面目录变化自动重新生成 |
| `dts` | `string \| false` | `'src/define-uni-page.d.ts'` | `defineUniPage` 宏的全局类型声明输出路径（`false` 关闭） |

## tabBar 生成

提供 `tabBar` 模板后，插件将所有 `isTab: true` 的主包页面（tabBar 仅允许主包）自动归集到 `list`：

```ts
generatePages({
	tabBar: {
		color: '#999999',
		selectedColor: '#42b883',
		iconPath: 'static/tab/home.png', // 全局默认图标，所有 tab 项继承
		selectedIconPath: 'static/tab/home-active.png',
		overrides: { // 按页面路径逐项覆盖（可选）
			'pages/about/about': {
				text: '关于我们',
				iconPath: 'static/tab/about.png',
				selectedIconPath: 'static/tab/about-active.png'
			}
		}
	}
})
```

**图标与文本优先级（从高到低）**：页面内 `<route-config>.tab` 声明 → `tabBar.overrides[pagePath]` → `tabBar.iconPath` / `selectedIconPath`（全局模板）→ 页面标题 / 文件名兜底。

## 与路由配合

`generatePages` 生成的 pages.json 中，页面级 `name` / `meta` 字段会被 `generateRouter` 直接消费为路由的 `name` 与 `meta`（优先级高于 `metaMapping` 映射）：

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
defineUniPage({
	title: '首页',
	isTab: true,
	meta: { requireAuth: true } // 生成的路由将携带 meta.requireAuth
})
</script>
```

```ts
// 生成的路由配置（generateRouter 产出）
{ path: '/pages/index/index', name: 'pagesIndexIndex', meta: { title: '首页', isTab: true, requireAuth: true } }
```

::: info 合并策略
插件「仅生成页面部分，其余保留」：始终覆盖 `pages`，有分包时覆盖 `subPackages`，提供模板时覆盖 `tabBar`；`globalStyle`、`condition`、`easycom` 等非页面字段原样保留。
:::
