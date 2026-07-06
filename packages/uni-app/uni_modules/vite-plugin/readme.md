# @meng-xi/vite-plugin

[![license](https://img.shields.io/github/license/MengXi-Studio/vite-plugin.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/vite-plugin?color=blue)](https://www.npmjs.com/package/@meng-xi/vite-plugin)
![npm](https://img.shields.io/npm/dt/@meng-xi/vite-plugin?color=green)

Vite 实用插件集与插件开发框架（uni-app 版本）。

📖 **完整文档：[https://mengxi-studio.github.io/vite-plugin/](https://mengxi-studio.github.io/vite-plugin/)**

---

## 特性

- **开箱即用** - 15 个实用插件，覆盖构建、产物、路由、版本、HTML、代理等场景
- **插件开发框架** - 导出 BasePlugin、Logger、Validator，快速构建自定义插件
- **通用工具库** - 内置 14 大 Common 工具模块，支持子路径按需导入
- **uni-app 适配** - 通过 uni_modules 集成，无需 npm 安装

## 安装

### uni_modules（推荐）

将 `vite-plugin` 目录复制到项目的 `uni_modules` 目录下：

```
src/
  └── uni_modules/
        └── vite-plugin/
              └── js_sdk/
                    └── index.mjs
```

### npm

```bash
pnpm add @meng-xi/vite-plugin -D
```

> npm 方式需将导入路径改为 `@meng-xi/vite-plugin`。

## 快速开始

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import {
	assetManifest,
	autoImport,
	buildProgress,
	compressAssets,
	copyFile,
	envGuard,
	faviconManager,
	generateRouter,
	generateVersion,
	htmlInject,
	imageOptimizer,
	loadingManager,
	proxyManager,
	versionUpdateChecker
} from './uni_modules/vite-plugin/js_sdk/index.mjs'

export default defineConfig({
	plugins: [
		uni(),
		// 按需启用插件
		autoImport({ imports: { vue: ['*'] }, vueTemplate: true }),
		generateRouter({ dts: true }),
		generateVersion({ format: 'datetime', outputType: 'both' }),
		envGuard({ required: { VITE_API_URL: { type: 'url', required: true } } }),
		loadingManager({ defaultVisible: true, autoHideOn: 'DOMContentLoaded' }),
		proxyManager({ rules: [{ context: '/api', target: 'https://api.example.com', changeOrigin: true }] })
	]
})
```

## 内置插件

| 插件                 | 说明                        |
| -------------------- | --------------------------- |
| assetManifest        | 资源清单生成                |
| autoImport           | 自动导入                    |
| buildProgress        | 终端构建进度条              |
| bundleAnalyzer       | 构建产物体积分析            |
| compressAssets       | 构建产物压缩（gzip/brotli） |
| copyFile             | 文件复制                    |
| envGuard             | 环境变量校验                |
| faviconManager       | 网站图标管理                |
| generateRouter       | 路由配置生成（uni-app）     |
| generateVersion      | 版本号生成与注入            |
| htmlInject           | HTML 内容注入               |
| imageOptimizer       | 图片优化与格式转换          |
| loadingManager       | 全局 Loading 状态管理       |
| proxyManager         | 开发服务器代理管理          |
| versionUpdateChecker | 运行时版本更新检查          |

> 各插件详细配置与 API 请查阅 [官网插件文档](https://mengxi-studio.github.io/vite-plugin/plugins/)。

## 插件开发框架

导出完整的插件开发框架，帮助快速构建符合规范的自定义 Vite 插件。

```typescript
import { BasePlugin, createPluginFactory } from './uni_modules/vite-plugin/js_sdk/index.mjs'
import type { Plugin } from 'vite'

class MyPlugin extends BasePlugin<{ prefix?: string }> {
	protected getPluginName() {
		return 'my-plugin'
	}
	protected getDefaultOptions() {
		return { prefix: '[app]' }
	}
	protected validateOptions() {
		this.validator.field('prefix').string().notEmpty().validate()
	}
	protected addPluginHooks(plugin: Plugin) {
		plugin.writeBundle = {
			order: 'post',
			handler: async () => {
				await this.safeExecute(async () => {
					this.logger.info('插件执行中...')
				}, '执行自定义逻辑')
			}
		}
	}
}

export const myPlugin = createPluginFactory(MyPlugin)
```

**核心 API：** `BasePlugin`（插件基类）、`createPluginFactory`（转换为 Vite 插件函数）、`Logger`（日志管理器）、`Validator`（链式配置验证器）。

> 详细 API 请查阅 [官网框架文档](https://mengxi-studio.github.io/vite-plugin/factory/)。

## Common 工具模块

内置通用工具函数库，按功能模块组织，支持子路径按需导入。

```typescript
// 示例：按需导入
import { formatFileSize } from './uni_modules/vite-plugin/js_sdk/common/format/index.mjs'
import { scanDirectory } from './uni_modules/vite-plugin/js_sdk/common/fs/index.mjs'
import { deepMerge } from './uni_modules/vite-plugin/js_sdk/common/object/index.mjs'
import { normalizePath } from './uni_modules/vite-plugin/js_sdk/common/path/index.mjs'
```

| 子路径               | 描述                        |
| -------------------- | --------------------------- |
| `common/code`        | JS 关键字、注释与字符串移除 |
| `common/compress`    | gzip 压缩大小计算           |
| `common/concurrency` | 并发限制批量异步执行        |
| `common/env`         | `.env` 文件解析             |
| `common/format`      | 日期、模板、文件大小格式化  |
| `common/fs`          | 文件检查、复制、扫描、写入  |
| `common/hash`        | 随机哈希生成                |
| `common/html`        | HTML 注入、消毒、属性转义   |
| `common/object`      | 深度合并对象                |
| `common/path`        | 路径规范化、扩展名过滤      |
| `common/script`      | 回调函数体安全包装          |
| `common/string`      | 大小写转换、JSON 注释移除   |
| `common/ui`          | 终端 ANSI 颜色码            |
| `common/validation`  | 链式验证器、全局名称校验    |

> 各工具函数详细 API 请查阅 [官网工具文档](https://mengxi-studio.github.io/vite-plugin/common/)。

## 子路径导出

| 子路径                               | 描述               |
| ------------------------------------ | ------------------ |
| `./js_sdk/index.mjs`                 | 主入口（全部导出） |
| `./js_sdk/plugins/index.mjs`         | 所有插件           |
| `./js_sdk/factory/index.mjs`         | 插件开发框架       |
| `./js_sdk/logger/index.mjs`          | 日志管理器         |
| `./js_sdk/common/index.mjs`          | 所有工具函数       |
| `./js_sdk/common/<module>/index.mjs` | 各工具子模块       |
| `./js_sdk/plugins/<name>/index.mjs`  | 各插件子模块       |

## License

[MIT](LICENSE)
