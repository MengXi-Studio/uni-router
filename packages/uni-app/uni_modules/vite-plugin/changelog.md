## 1.0.0（2026-06-27）
首个稳定版本发布，API 稳定性承诺与生产就绪标志

### 里程碑说明

经过 0.x 系列（0.0.1 - 0.2.7）共 27 个版本的迭代，插件体系从最初的 2 个插件（copyFile、injectIco）发展到 15 个插件覆盖构建全生命周期，common 工具模块从零散函数发展为 14 个规范化子模块，插件开发框架（BasePlugin、Logger、Validator、createPluginFactory）趋于成熟。1.0.0 版本标记 API 稳定性，后续变更将严格遵循语义化版本规范。

### 与 0.x 的主要差异

| 维度         | 0.x（演进期）                | 1.0.0（稳定期）                                       |
| ------------ | ----------------------------- | ------------------------------------------------------ |
| API 稳定性   | 允许 Breaking Change          | 严格遵循 semver，破坏性变更需升主版本号                |
| 插件数量     | 从 2 个逐步增加到 15 个       | 15 个插件完整就绪                                      |
| 导出结构     | 单入口 `./plugins`            | 7 个分组子路径 + 15 个插件单独子路径 + 主入口向后兼容  |
| Common 工具  | 从零散函数到 14 个规范化子模块 | 14 个子模块稳定结构                                    |
| 类型安全     | 逐步补全                      | 完整 TypeScript 类型 + `global.d.ts` 全局声明          |
| 配置体验     | 部分参数必填                  | 所有插件零配置可用（参数可选化）                       |
| 版本号管理   | 手动同步                      | 构建时自动注入 `__PLUGIN_VERSION__`                    |
| 错误处理     | 各插件自行处理                | 统一 `errorStrategy` 策略（throw / log / ignore）      |
| 钩子注册     | 手动包裹 enabled 检查         | `registerHook` / `registerOrderedHook` 自动包裹       |

### 插件完整清单（15 个，7 个分组）

| 分组     | 插件                      | 功能描述                                   | 执行时机              |
| -------- | ------------------------- | ------------------------------------------ | --------------------- |
| analyze  | buildProgress             | 终端构建进度条，支持 bar/spinner/minimal    | 构建期                |
| analyze  | bundleAnalyzer            | 构建产物体积分析，生成 JSON/HTML 报告       | `enforce: 'post'`     |
| compress | compressAssets            | gzip / brotli 压缩，生成 .gz / .br 文件     | `enforce: 'post'`     |
| compress | imageOptimizer            | 图片压缩与格式转换（sharp + svgo）          | `enforce: 'post'`     |
| copy     | assetManifest             | 资源清单生成，支持 vite/webpack/custom 格式 | `enforce: 'post'`     |
| copy     | copyFile                  | 文件/目录复制，支持增量与并发               | `enforce: 'post'`     |
| generate | autoImport                | 自动导入，支持通配符 `'*'` 与目录扫描       | `enforce: 'pre'`      |
| generate | generateRouter            | 根据 pages.json 生成路由配置与类型声明      | `configResolved`      |
| generate | generateVersion           | 版本号生成，支持多种格式与占位符            | 构建期                |
| guard    | envGuard                  | 环境变量校验，支持多类型与运行时守卫        | `enforce: 'post'`     |
| inject   | faviconManager            | 网站图标管理，支持字符串简写配置            | `transformIndexHtml`  |
| inject   | htmlInject                | HTML 内容注入，7 种位置与条件注入           | `transformIndexHtml`  |
| inject   | loadingManager            | 全局 Loading 状态管理，请求自动拦截         | `transformIndexHtml`  |
| inject   | versionUpdateChecker      | 运行时版本更新检查，三种提示 UI             | `transformIndexHtml`  |
| proxy    | proxyManager              | 开发代理管理，支持路径匹配与延迟模拟        | `configureServer`     |

### Common 工具模块（14 个子模块）

| 子模块              | 核心导出                                                                                                   | 来源           |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- |
| `common/code`       | `JS_KEYWORDS`、`stripCommentsAndStrings`                                                                   | autoImport     |
| `common/compress`   | `calculateGzipSize`                                                                                        | bundleAnalyzer |
| `common/concurrency`| `runWithConcurrency`                                                                                       | imageOptimizer |
| `common/env`        | `parseEnvContent`                                                                                          | envGuard       |
| `common/format`     | `parseTemplate`、`parseTemplateWithDelimiter`、`parsePluginTemplate`、`formatDate`、`formatFileSize`、`calcRatio` | 多处复用       |
| `common/fs`         | `writeFileSyncSafely`、`shouldUpdateFileContent`、`scanAndMapFiles`、`deleteFiles`、`resolveReportPath` 等 | 多处复用       |
| `common/hash`       | `generateRandomHash`                                                                                       | generateVersion|
| `common/html`       | `injectBeforeTag`、`injectHeadAndBody`、`escapeHtmlAttr`                                                    | htmlInject     |
| `common/object`     | `deepMerge`                                                                                                | factory        |
| `common/path`       | `normalizePath`、`isExtensionIncluded`、`isPathExcluded`、`isPreCompressed`                                | 多处复用       |
| `common/script`     | `makeCallback`                                                                                             | loadingManager |
| `common/string`     | `toCamelCase`、`toPascalCase`、`stripJsonComments`、`escapeRegex`                                          | autoImport     |
| `common/ui`         | `ANSI`、`SPINNER_FRAMES`、`stripAnsi`                                                                      | buildProgress  |
| `common/validation` | `Validator`、`validateGlobalName`、`validateNoScriptInTemplate`、`validateCallbackFields` 等               | 全局           |

### 插件开发框架

**BasePlugin 抽象类**：所有插件的基类，提供完整的生命周期管理

| 能力                | 方法/属性                              | 说明                                             |
| ------------------- | -------------------------------------- | ------------------------------------------------ |
| 配置合并            | `mergeOptions`                         | 深度合并基础默认值、插件默认值与用户配置         |
| 日志记录            | `logger`                               | 每个实例独立的 PluginLogger 代理                 |
| 配置验证            | `validator` + `validateOptions`        | 泛型 Validator 流式验证                          |
| 生命周期            | `onConfigResolved` / `destroy`         | 配置解析完成回调 + 销毁清理                       |
| 错误处理            | `safeExecute` / `safeExecuteSync` / `handleError` | 按 `errorStrategy` 统一处理错误        |
| 钩子注册            | `registerHook` / `registerOrderedHook` / `registerTransformIndexHtml` | 自动包裹 enabled 检查与错误处理 |
| 插件转换            | `toPlugin`                             | 转换为 Vite 插件对象，自动注册 configResolved 与 closeBundle |

**createPluginFactory 工厂函数**：支持选项标准化器（OptionsNormalizer），允许插件接受非对象类型的简写配置

**Logger 单例日志系统**：以实例 ID 为 key 管理每个插件实例的日志配置，避免同类型多实例冲突，支持 `register` / `unregister` / `destroy` 生命周期

**Validator 泛型验证器**：链式 API（`required` / `enum` / `minValue` / `maxValue` / `custom` 等），编译时类型安全保障

### 子路径导出总览

```typescript
// 主入口（向后兼容）
import { compressAssets, generateRouter } from '@meng-xi/vite-plugin'

// 按分组导入（推荐，利于 Tree-shaking）
import { compressAssets } from '@meng-xi/vite-plugin/plugins/compress'
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate'
import { loadingManager } from '@meng-xi/vite-plugin/plugins/inject'

// 单插件导入
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate/generate-router'

// Common 工具
import { parsePluginTemplate } from '@meng-xi/vite-plugin/common/format'
import { deepMerge } from '@meng-xi/vite-plugin/common/object'

// 框架能力
import { BasePlugin, createPluginFactory } from '@meng-xi/vite-plugin/factory'
import { Logger } from '@meng-xi/vite-plugin/logger'
```

**完整子路径清单**：

- `.` — 主入口（导出全部）
- `./common` + 14 个 common 子模块（code/compress/concurrency/env/format/fs/hash/html/object/path/script/string/ui/validation）
- `./factory` — BasePlugin、createPluginFactory、类型定义
- `./logger` — Logger 单例、PluginLogger
- `./plugins` + 7 个分组子路径（analyze/compress/copy/generate/guard/inject/proxy）+ 15 个插件单独子路径

### 生产就绪声明

- **Vite 兼容性**：支持 Vite 5.x - 7.x（`peerDependencies: vite >=5.0.0 <8.0.0`）
- **TypeScript 支持**：完整类型定义，`types` 字段指向 `.d.ts` 文件
- **双格式输出**：同时提供 ESM（`.mjs`）与 CJS（`.cjs`）构建产物
- **可选依赖**：`sharp`、`svgo` 为可选依赖，不可用时优雅降级
- **零配置可用**：所有插件参数可选化，提供合理默认值
## 0.2.7（2026-06-26）

插件按功能分组导出，修复 generateRouter 类型注解生成缺陷

### 插件分组导出（新增）

**变更**：将 15 个插件按功能划分为 7 个分组，每个分组提供独立子路径导出，支持按需导入与 Tree-shaking

| 分组     | 包含插件                                                         | 子路径               |
| -------- | ---------------------------------------------------------------- | -------------------- |
| analyze  | buildProgress、bundleAnalyzer                                    | `./plugins/analyze`  |
| compress | compressAssets、imageOptimizer                                   | `./plugins/compress` |
| copy     | assetManifest、copyFile                                          | `./plugins/copy`     |
| generate | autoImport、generateRouter、generateVersion                      | `./plugins/generate` |
| guard    | envGuard                                                         | `./plugins/guard`    |
| inject   | faviconManager、htmlInject、loadingManager、versionUpdateChecker | `./plugins/inject`   |
| proxy    | proxyManager                                                     | `./plugins/proxy`    |

```typescript
// 0.2.6：单入口导入全部插件
import { compressAssets, generateRouter, loadingManager } from '@meng-xi/vite-plugin/plugins'

// 0.2.7：按组导入，利于 Tree-shaking
import { compressAssets } from '@meng-xi/vite-plugin/plugins/compress'
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate'
import { loadingManager } from '@meng-xi/vite-plugin/plugins/inject'
```

> `./plugins` 主入口仍保留，向后兼容；各插件单独子路径（如 `./plugins/analyze/build-progress`）同步开放

### generateRouter（修复）

**Bug 修复**：`exportTypes: false` 时生成的路由文件类型注解与 import 语句不一致

| 字段             | 0.2.6                           | 0.2.7                                                  | 说明                       |
| ---------------- | ------------------------------- | ------------------------------------------------------ | -------------------------- |
| `typeAnnotation` | `isTS ? ': RouteConfig[]' : ''` | `isTS && options.exportTypes ? ': RouteConfig[]' : ''` | 仅在启用类型导出时添加注解 |

```typescript
// 0.2.6：exportTypes: false 时仍生成类型注解，但无 import 语句，导致 RouteConfig 未定义错误
export const routes: RouteConfig[] = [
	// ❌ RouteConfig 未定义
	// ...
]

// 0.2.7：exportTypes: false 时不生成类型注解，与 import 逻辑保持一致
export const routes = [
	// ✅ 无类型注解，无错误
	// ...
]
```

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/plugins/analyze` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/compress` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/copy` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/generate` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/guard` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/inject` 子路径导出
- 新增 `@meng-xi/vite-plugin/plugins/proxy` 子路径导出
- 新增各插件单独子路径导出（如 `./plugins/analyze/build-progress`、`./plugins/compress/compress-assets` 等）

## 0.2.6（2026-06-25）

通用工具抽离与架构统一重构，版本号注入机制自动化

### Common 工具模块（增强 + 新增）

**新增 6 个子模块**：将各插件内部重复的工具函数提取到 `common` 目录统一管理，消除冗余代码

| 子路径            | 新增导出                                                                                                     | 来源            |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| `common/code`     | `JS_KEYWORDS`（JS 关键字集合）、`stripCommentsAndStrings`（移除注释与字符串）                                | autoImport      |
| `common/compress` | `calculateGzipSize`（gzip 压缩大小计算）                                                                     | bundleAnalyzer  |
| `common/env`      | `parseEnvContent`（`.env` 文件解析，支持前缀过滤）                                                           | envGuard        |
| `common/hash`     | `generateRandomHash`（加密级随机哈希生成）                                                                   | generateVersion |
| `common/object`   | `deepMerge`（深度合并对象，跳过 undefined）                                                                  | factory         |
| `common/string`   | `toCamelCase`、`toPascalCase`（大小写转换）、`stripJsonComments`（JSON 注释移除）、`escapeRegex`（正则转义） | autoImport      |

**common/format（增强）**：

| 新增函数              | 描述                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `parsePluginTemplate` | 插件专用模板解析函数，支持 `{name}`、`{date}`、`{date:FORMAT}`、`{version}`、`{custom:KEY}` 占位符，统一注释头模板处理 |

```typescript
import { parsePluginTemplate } from './uni_modules/vite-plugin/js_sdk/common/format/index.mjs'

// 支持自定义日期格式和自定义字段
parsePluginTemplate('{name} {custom:author} {date:YYYY-MM-DD} {version}', {
	name: 'generate-router',
	version: '0.2.6',
	customFields: { author: 'MengXi Studio' }
})
// 输出：'generate-router MengXi Studio 2026-06-25 0.2.6'
```

### 版本号注入机制（重构）

**变更**：移除手动版本同步逻辑，改为构建时自动注入

| 0.2.5                          | 0.2.6                          | 说明                                       |
| ------------------------------ | ------------------------------ | ------------------------------------------ |
| `generate-exports.ts` 手动同步 | unbuild `replace` 配置自动注入 | 版本号来源从脚本维护改为构建期注入         |
| 硬编码版本号字符串             | `__PLUGIN_VERSION__` 全局变量  | 插件内部统一使用全局变量，无需手动更新     |
| 无类型声明                     | `src/types/global.d.ts`        | 新增全局类型声明，提供 TypeScript 类型支持 |

**影响**：generateRouter 注释头中的 `{version}` 占位符现在通过 `__PLUGIN_VERSION__` 自动获取，版本号升级时无需修改插件源码

### versionUpdateChecker（优化）

**变更**：自定义提示模板解析改用通用工具函数

| 0.2.5                                  | 0.2.6                        | 说明                                |
| -------------------------------------- | ---------------------------- | ----------------------------------- |
| 多次链式 `.replace(/\{\{key\}\}/g, …)` | `parseTemplateWithDelimiter` | 统一使用 common/format 模板解析函数 |
| 手动拼接 5 个占位符替换                | 传入 values 对象一次解析     | 代码更简洁，支持键名自动转义        |

### 插件目录结构（重构）

**变更**：统一插件内部助手目录命名，提升代码可维护性

| 0.2.5                           | 0.2.6                     | 说明                                         |
| ------------------------------- | ------------------------- | -------------------------------------------- |
| `plugins/*/common/`             | `plugins/*/helpers/`      | 所有插件内部 `common` 目录重命名为 `helpers` |
| `faviconManager/common/type.ts` | `faviconManager/types.ts` | 类型文件统一到插件根目录                     |

> 此变更仅影响插件内部结构，对用户导入路径无影响

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/common/code` 子路径导出
- 新增 `@meng-xi/vite-plugin/common/compress` 子路径导出
- 新增 `@meng-xi/vite-plugin/common/env` 子路径导出
- 新增 `@meng-xi/vite-plugin/common/hash` 子路径导出
- 新增 `@meng-xi/vite-plugin/common/object` 子路径导出
- 新增 `@meng-xi/vite-plugin/common/string` 子路径导出
- `@meng-xi/vite-plugin/common/format` 新增导出：`parsePluginTemplate`
- `@meng-xi/vite-plugin/common/code` 新增导出：`JS_KEYWORDS`、`stripCommentsAndStrings`
- `@meng-xi/vite-plugin/common/compress` 新增导出：`calculateGzipSize`
- `@meng-xi/vite-plugin/common/env` 新增导出：`parseEnvContent`
- `@meng-xi/vite-plugin/common/hash` 新增导出：`generateRandomHash`
- `@meng-xi/vite-plugin/common/object` 新增导出：`deepMerge`
- `@meng-xi/vite-plugin/common/string` 新增导出：`toCamelCase`、`toPascalCase`、`stripJsonComments`、`escapeRegex`

## 0.2.5（2026-06-24）

generateRouter 注释头模板化升级，移除废弃函数

### generateRouter（增强 + Breaking）

**Breaking Changes**：

- **`fileHeader` 参数移除，替换为 `headerTemplate`**：参数从 `boolean` 升级为 `boolean | string`，核心能力从"开关"变为"模板"，`headerTemplate` 更准确描述字符串模板功能

| 0.2.4               | 0.2.5                                                  | 说明               |
| ------------------- | ------------------------------------------------------ | ------------------ |
| `fileHeader: true`  | `headerTemplate: true`                                 | 生成默认注释头     |
| `fileHeader: false` | `headerTemplate: false` / 不传                         | 不生成注释头       |
| -                   | `headerTemplate: '{name} {date:YYYY-MM-DD} {version}'` | 自定义模板（新增） |

**新增功能**：

- **注释头模板系统**：`headerTemplate` 支持字符串模板，通过占位符自由组合注释头内容，占位符顺序由模板中的位置决定

| 占位符          | 替换值                                         | 示例                                |
| --------------- | ---------------------------------------------- | ----------------------------------- |
| `{name}`        | 插件名称                                       | `generate-router`                   |
| `{date}`        | 生成日期时间（默认格式 `YYYY-MM-DD HH:mm:ss`） | `2026-06-24 14:30:00`               |
| `{date:格式}`   | 按指定格式输出日期时间                         | `{date:YYYY-MM-DD}` → `2026-06-24`  |
| `{version}`     | 插件版本号                                     | `0.2.5`                             |
| `{custom:键名}` | 自定义字段，值从 `customFields` 读取           | `{custom:author}` → `MengXi Studio` |

- **自定义字段 `customFields`**：供 `{custom:键名}` 占位符引用的自定义字段键值对

| 选项           | 类型                     | 默认值 | 说明             |
| -------------- | ------------------------ | ------ | ---------------- |
| `customFields` | `Record<string, string>` | `{}`   | 自定义字段键值对 |

```typescript
// 默认注释头（与 0.2.x fileHeader: true 输出一致）
generateRouter({ headerTemplate: true })

// 自定义日期格式
generateRouter({ headerTemplate: '{name} {date:YYYY-MM-DD} {version}' })

// 自定义字段
generateRouter({
	headerTemplate: '{name} {custom:author} {date} {version}',
	customFields: { author: 'MengXi Studio' }
})
```

### Common 工具模块（移除）

- 移除 `serializeValueCompact`（已废弃且无消费者），请使用 `serializeValue(value, true)` 替代

### 子路径导出（变更）

- `@meng-xi/vite-plugin/plugins/generate-router` 移除配置选项：`fileHeader`
- `@meng-xi/vite-plugin/plugins/generate-router` 新增配置选项：`headerTemplate`、`customFields`
- `@meng-xi/vite-plugin/common/code-manipulation` 移除导出函数：`serializeValueCompact`

## 0.2.4（2026-06-23）

generateRouter 新增页面名称配置，优化路由合并策略

### generateRouter（增强 + 优化）

**新增功能**：

- **页面名称 `name` 字段支持**：`UniAppPageConfig` 类型新增 `name` 属性，支持在 `pages.json` 中直接为页面配置路由名称。`name` 字段优先级高于 `nameStrategy` 自动生成

| 类型                    | 变更 | 说明                                |
| ----------------------- | ---- | ----------------------------------- |
| `UniAppPageConfig.name` | 新增 | 页面名称，优先级高于 `nameStrategy` |

```typescript
// pages.json 中可直接配置 name
{
  "path": "pages/user/profile",
  "name": "UserProfile",
  "style": { "navigationBarTitleText": "个人中心" }
}

// 生成的路由中 name 为 'UserProfile'，而非 nameStrategy 自动生成的 'pagesUserProfile'
```

**优化**：

- **`preserveRouteChanges` 合并策略优化**：`pages.json` 是自动生成字段的唯一来源，`name` 和 `meta` 中来自 `pages.json` 的字段始终使用新值，仅保留用户自定义的额外字段

| 字段                  | 优化前               | 优化后                                                          |
| --------------------- | -------------------- | --------------------------------------------------------------- |
| `name`                | 用户修改的值优先保留 | 始终以 `pages.json` 为准（`pageConfig.name` 或 `nameStrategy`） |
| `meta` 自动生成字段   | 用户修改的值优先保留 | `pages.json` 生成的字段始终使用新值                             |
| `meta` 用户自定义字段 | 保留                 | 保留（不变）                                                    |

```typescript
// pages.json 中修改了标题
{ "path": "pages/index/index", "style": { "navigationBarTitleText": "新标题" } }

// 用户在 router.config.ts 中添加了自定义字段
{
  path: '/pages/index/index',
  name: 'pagesIndexIndex',
  meta: { title: '旧标题', customField: 'value' }, // 用户修改了 title，并添加了 customField
  beforeEnter: (to, from, next) => { next() }
}

// 优化前：meta.title 保留 '旧标题'（用户修改优先）
// 优化后：meta.title 更新为 '新标题'（pages.json 为准），customField 保留
{
  path: '/pages/index/index',
  name: 'pagesIndexIndex',
  meta: { title: '新标题', customField: 'value' },
  beforeEnter: (to, from, next) => { next() }
}
```

### 子路径导出（变更）

- `@meng-xi/vite-plugin/plugins/generate-router` 新增类型属性：`UniAppPageConfig.name`

## 0.2.3（2026-06-23）

完善插件基类与路由生成插件功能

### BasePlugin（重构）

**变更**：

- **`addPluginHooks` 从抽象方法改为虚方法**：不再强制子类实现，默认提供空实现。不依赖 Vite 钩子的插件无需再写空的 `addPluginHooks` 方法

```typescript
// 0.2.2：子类必须实现
protected abstract addPluginHooks(plugin: Plugin): void

// 0.2.3：可选重写
protected addPluginHooks(_plugin: Plugin): void {}
```

### generateRouter（增强）

**新增功能**：

- **页面元信息 `meta` 字段支持**：`UniAppPageConfig` 类型新增 `meta` 属性，支持在 `pages.json` 中直接为页面配置元信息。`meta` 字段优先级高于 `metaMapping` 映射，允许页面级覆盖

| 类型                    | 变更 | 说明                                      |
| ----------------------- | ---- | ----------------------------------------- |
| `UniAppPageConfig.meta` | 新增 | 页面元信息，优先级高于 `metaMapping` 映射 |

**元信息提取优先级**：

| 优先级  | 来源               | 说明                                   |
| ------- | ------------------ | -------------------------------------- |
| 1（高） | `pageConfig.meta`  | pages.json 中页面直接配置的 meta 字段  |
| 2       | `metaMapping` 映射 | 从 style 字段映射提取                  |
| 3（低） | tabBar 推断        | 自动识别 tabBar 页面设置 `isTab: true` |

```typescript
// pages.json 中可直接配置 meta
{
  "path": "pages/index/index",
  "style": { "navigationBarTitleText": "首页" },
  "meta": { "requireAuth": true, "customField": "value" }
}
```

**重构**：

- **插件钩子迁移至 `onConfigResolved` 生命周期**：将路由生成逻辑从 `addPluginHooks` 中的 `configResolved` 钩子迁移至基类提供的 `onConfigResolved` 生命周期方法，统一生命周期管理

```typescript
// 0.2.2：手动在 addPluginHooks 中注册 configResolved
protected addPluginHooks(plugin: Plugin): void {
  plugin.configResolved = async config => {
    this.projectRoot = config.root
    await this.safeExecute(() => this.generateRouterConfig(), '生成路由配置')
    if (config.command === 'serve') {
      this.startWatching()
    }
  }
}

// 0.2.3：使用基类 onConfigResolved 生命周期
protected onConfigResolved(config: ResolvedConfig): void {
  super.onConfigResolved(config)
  this.projectRoot = config.root
  this.safeExecute(() => this.generateRouterConfig(), '生成路由配置')
  if (config.command === 'serve') {
    this.startWatching()
  }
}
```

### 子路径导出（变更）

- `@meng-xi/vite-plugin/plugins/generate-router` 新增类型属性：`UniAppPageConfig.meta`
- `@meng-xi/vite-plugin/factory` 变更：`addPluginHooks` 从抽象方法改为虚方法

## 0.2.2（2026-06-21）

generateRouter 修复多行格式输出属性间逗号缺失与缩进错误

### generateRouter（修复）

**Bug 修复**：

- **多行格式属性间逗号缺失**：路由对象属性之间未添加逗号分隔符，导致生成的 `router.config.ts` 语法错误

```typescript
// 修复前：属性间缺少逗号
{
	path: '/pages/index/index'
	name: 'pagesIndexIndex'
	meta: { title: '首页', isTab: true }
}

// 修复后：属性间正确添加逗号
{
	path: '/pages/index/index',
	name: 'pagesIndexIndex',
	meta: { title: '首页', isTab: true }
}
```

- **多行格式缩进多一层**：路由对象非首行属性缩进多了一个 tab，导致格式不统一

```typescript
// 修复前：非首行多一层缩进
{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '首页', isTab: true }
	},

// 修复后：缩进统一
{
	path: '/pages/index/index',
	name: 'pagesIndexIndex',
	meta: { title: '首页', isTab: true }
},
```

## 0.2.1（2026-06-21）

generateRouter 新增文件注释头、输出格式优化，修复 preserveRouteChanges 合并丢失，移除冗余类型定义

### generateRouter（增强 + 修复）

**新增功能**：

- **文件注释头**（`fileHeader`）：开启后在生成文件顶部添加标准化注释头，包含插件名称、生成日期时间（`YYYY-MM-DD HH:mm:ss`）和插件版本号，版本号随 npm 包版本自动更新

| 选项       | 类型      | 默认值  | 描述                                                                                   |
| ---------- | --------- | ------- | -------------------------------------------------------------------------------------- |
| fileHeader | `boolean` | `false` | 是否在生成文件顶部添加注释头，包含 `@plugin`、`@date`（含时分秒）、`@version` 三个标签 |

```typescript
generateRouter({ fileHeader: true })

// 生成的文件顶部：
/**
 * @plugin generate-router
 * @date 2026-06-19 14:30:00
 * @version 0.2.1
 */

import type { RouteConfig } from '@meng-xi/uni-router'
```

- **多行格式输出**：路由对象从单行紧凑格式改为多行格式，每个属性独占一行，提升可读性

```typescript
// 0.2.0 单行格式
{ path: '/pages/index/index', name: 'pagesIndexIndex', meta: { title: '首页', isTab: true } }

// 0.2.1 多行格式
{
	path: '/pages/index/index',
	name: 'pagesIndexIndex',
	meta: { title: '首页', isTab: true }
}
```

- **类型外部导入**：移除内联类型定义，改为 `import type { RouteConfig } from '@meng-xi/uni-router'`，类型由 `@meng-xi/uni-router` 统一提供

**Bug 修复**：

- **preserveRouteChanges 用户自定义 meta 字段丢失**：`meta` 从整体替换改为逐字段合并，仅更新/添加新字段，不删除用户自定义的 meta 字段
- **preserveRouteChanges 含函数属性时合并全部失败**：单条路由含 `beforeEnter` 等函数属性时不再导致所有路由合并跳过，仅跳过该条，其余正常合并

| 场景                               | 修复前           | 修复后                   |
| ---------------------------------- | ---------------- | ------------------------ |
| 用户修改 `meta.title`              | 可能丢失         | 保留                     |
| 用户添加自定义 meta 字段           | 丢失（整体替换） | 保留（逐字段合并）       |
| 用户添加 `beforeEnter` 函数        | 保留             | 保留                     |
| 某条路由有函数导致 JSON.parse 失败 | 所有路由合并跳过 | 仅该条跳过，其余正常合并 |

**Breaking Changes**：

- 移除 `UniAnimationType` 类型导出，改由 `@meng-xi/uni-router` 提供
- 移除 `NavigationAnimation` 类型导出，改由 `@meng-xi/uni-router` 提供
- 移除 `RouteMeta.animation` 字段，改由 `@meng-xi/uni-router` 提供

> 如果项目使用了上述类型，请从 `@meng-xi/uni-router` 导入替代。

### 子路径导出（变更）

- 移除导出类型：`UniAnimationType`、`NavigationAnimation`
- `@meng-xi/vite-plugin/plugins/generate-router` 新增配置选项：`fileHeader`

## 0.2.0（2026-06-18）

新增 proxyManager 开发代理管理插件，Common 工具模块提取多项通用函数，修复 proxyManager 四个关键缺陷

### proxyManager（新增）

开发服务器代理管理插件，在 Vite 开发服务器（`configureServer`）启动时注册代理中间件，支持路径匹配、目标转发、请求重写、响应修改、延迟模拟、环境变量覆盖等能力。

**功能特性**：

- **路径匹配**：支持字符串前缀和正则表达式两种匹配方式，满足精确与模糊场景
- **请求重写**：通过 `rewrite` 函数自由改写请求路径，适配后端路由差异
- **响应修改**：`modifyResponse` 回调可在代理响应返回客户端前修改 JSON 响应体
- **延迟模拟**：支持固定毫秒数和随机范围（`{ min, max }`）两种延迟配置，便于测试 Loading 与超时场景
- **环境变量覆盖**：通过 `envPrefix` 从 `process.env` 读取代理目标，实现一套代码多环境切换
- **规则文件**：支持 `.proxyrc.ts` / `.proxyrc.js` / `.proxyrc.mjs` 外部规则文件，兼容 ESM 与 CJS
- **请求日志**：`none` / `basic` / `verbose` 三级日志，`verbose` 模式输出方法、路径、状态码、耗时、目标地址
- **WebSocket 代理**：规则支持 `ws: true` 启用 WebSocket 代理
- **环境隔离**：规则可配置 `env` 字段限定生效环境，避免误代理生产请求

**配置选项**：

| 选项         | 类型                                 | 默认值          | 描述                                     |
| ------------ | ------------------------------------ | --------------- | ---------------------------------------- |
| rules        | `ProxyRule[]`                        | `[]`            | 代理规则列表                             |
| configFile   | `string` \| `false`                  | `'.proxyrc.ts'` | 规则配置文件路径，`false` 不加载外部文件 |
| logLevel     | `'none'` \| `'basic'` \| `'verbose'` | `'basic'`       | 日志级别                                 |
| defaultDelay | `DelayConfig`                        | `false`         | 全局默认延迟，对未配置 delay 的规则生效  |
| envPrefix    | `string`                             | `'PROXY_'`      | 环境变量前缀                             |

**ProxyRule 类型**：

| 属性           | 类型                                            | 描述                                |
| -------------- | ----------------------------------------------- | ----------------------------------- |
| context        | `string` \| `RegExp`                            | 匹配路径，字符串前缀或正则          |
| target         | `string`                                        | 代理目标地址                        |
| changeOrigin   | `boolean`                                       | 是否修改请求头 Origin，默认 true    |
| secure         | `boolean`                                       | 是否验证 SSL 证书，默认 false       |
| rewrite        | `(path: string) => string`                      | 请求路径重写函数                    |
| headers        | `Record<string, string>`                        | 自定义请求头                        |
| env            | `string[]`                                      | 限定生效的环境列表                  |
| delay          | `number` \| `{ min: number; max: number }`      | 延迟模拟配置                        |
| modifyResponse | `(body: any, proxyRes: IncomingMessage) => any` | 响应修改回调                        |
| ws             | `boolean`                                       | 是否启用 WebSocket 代理，默认 false |
| label          | `string`                                        | 规则备注                            |

### Common 工具模块（增强）

提取多个插件中重复出现的逻辑到 `common` 目录，消除冗余代码：

**common/format（增强）**：

| 新增函数                     | 描述                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `parseTemplateWithDelimiter` | 通用模板解析函数，支持自定义左右分隔符，键名与值中的正则特殊字符自动转义，从 envGuard 提取 |

**common/fs（增强）**：

| 新增函数          | 描述                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `scanAndMapFiles` | 递归扫描目录并将文件信息映射为自定义结构，封装"扫描 + 过滤 + 映射"模式 |
| `deleteFiles`     | 批量删除文件列表（自动去重，删除失败静默忽略），从 compressAssets 提取 |

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/plugins/proxy-manager` 子路径导出
- 新增导出函数：`proxyManager`
- 新增导出类型：`ProxyManagerOptions`、`ProxyRule`、`ProxyLogLevel`、`DelayConfig`、`ResolvedProxyRule`、`ProxyLogEntry`
- `@meng-xi/vite-plugin/common/format` 新增导出：`parseTemplateWithDelimiter`
- `@meng-xi/vite-plugin/common/fs` 新增导出：`scanAndMapFiles`、`deleteFiles`

## 0.1.9（2026-06-14）

generateRouter 新增导航动画支持与路由属性保留增强

### generateRouter（增强）

路由生成插件新增导航动画类型支持，增强 `preserveRouteChanges` 功能以保留用户自定义路由属性。

**新增功能**：

- **导航动画类型**：新增 `UniAnimationType` 和 `NavigationAnimation` 类型定义，支持 uni-app App 端的页面导航动画配置
- **路由元信息扩展**：`RouteMeta` 新增 `animation` 字段，可配置页面默认导航动画
- **路由配置扩展**：`RouteConfig` 新增索引签名 `[key: string]: unknown`，支持用户添加 `beforeEnter`、`component` 等自定义属性
- **原始文本保留**：`preserveRouteChanges` 增强为基于原始文本的合并策略，保留用户添加的函数属性（如 `beforeEnter` 守卫）和自定义属性，仅更新 `path`、`name`、`meta` 字段

**类型变更**：

| 类型                       | 变更 | 说明                                        |
| -------------------------- | ---- | ------------------------------------------- |
| `UniAnimationType`         | 新增 | uni-app 导航动画类型，支持 18 种动画值      |
| `NavigationAnimation`      | 新增 | 导航动画配置接口，包含 `type` 和 `duration` |
| `RouteMeta.animation`      | 新增 | 默认导航动画字段（仅 App 端生效）           |
| `RouteConfig[key: string]` | 新增 | 索引签名，支持用户自定义扩展属性            |

**preserveRouteChanges 增强说明**：

| 字段       | 行为                                                       |
| ---------- | ---------------------------------------------------------- |
| `path`     | 始终以 `pages.json` 为准，不可覆盖                         |
| `name`     | 用户修改的值优先保留                                       |
| `meta`     | 用户修改的值优先保留，`pages.json` 中新增的字段自动补充    |
| 非标准属性 | 用户添加的 `beforeEnter`、`component` 等自定义属性完整保留 |

**示例**：假设 `pages.json` 新增了一个页面，且用户在已有路由上添加了 `beforeEnter`：

```typescript
// 用户手动修改后的路由配置
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '自定义标题' },
		beforeEnter: (to, from, next) => {
			next()
		} // 用户添加的守卫
	}
]
```

重新生成后：

```typescript
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '自定义标题', isTab: true }, // 用户标题保留，新增 isTab 自动补充
		beforeEnter: (to, from, next) => {
			next()
		} // 自定义属性保留
	},
	{
		path: '/pages/new/page', // 新增页面自动生成
		name: 'pagesNewPage',
		meta: { title: '新页面' }
	}
]
```

### 子路径导出（变更）

- `@meng-xi/vite-plugin/plugins/generate-router` 新增导出类型：`UniAnimationType`、`NavigationAnimation`

## 0.1.8（2026-06-11）

新增 imageOptimizer 图片优化插件，新增 common/concurrency 并发控制模块，恢复 common/path 路径工具模块，Common 工具模块新增多项通用函数

### imageOptimizer（新增）

图片优化压缩与格式转换插件，在 Vite 构建（`writeBundle`）完成后自动扫描输出目录中的图片文件，使用 sharp 和 svgo 进行压缩优化和格式转换。`enforce: 'post'`。

**功能特性**：

- **多格式压缩**：支持 JPEG（mozjpeg）、PNG（palette）、WebP、AVIF、GIF、TIFF、SVG（svgo）七种格式的压缩优化
- **格式转换**：支持位图格式之间的相互转换（如 PNG → WebP、JPEG → AVIF），提供 `convertToWebp`、`convertToAvif` 简写配置和 `convertMapping` 自定义映射
- **SVG 优化**：通过 svgo 插件体系优化 SVG 文件，支持自定义插件列表和多进程优化
- **并发处理**：可配置 `parallelLimit` 并发数，充分利用多核 CPU
- **内存控制**：使用流式处理和临时文件，避免大图片导致内存溢出
- **原子写入**：先写临时文件再重命名，确保异常时原文件不损坏
- **体积守恒**：仅当优化后体积更小时才替换原文件
- **优雅降级**：sharp/svgo 不可用时提供清晰的错误提示，跳过对应格式的优化
- **压缩报告**：生成 JSON 格式的优化统计报告，包含按格式分组统计和 Top 5 压缩率排名
- **实例方法**：提供 `getStats()`、`getSummary()` 方法供外部访问优化统计数据

**配置选项**：

| 选项              | 类型                                                           | 默认值                                                                         | 描述                                   |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| quality           | `FormatQualityOptions`                                         | `{ jpeg: 80, png: 6, webp: 75, avif: 50, gif: true, tiff: 'deflate' }`         | 各格式的压缩质量参数                   |
| convertToWebp     | `Partial<Record<'jpeg' \| 'png' \| 'gif' \| 'tiff', boolean>>` | `{}`                                                                           | 需要转换为 WebP 的源格式映射           |
| convertToAvif     | `Partial<Record<'jpeg' \| 'png' \| 'gif' \| 'tiff', boolean>>` | `{}`                                                                           | 需要转换为 AVIF 的源格式映射           |
| convertMapping    | `ConvertMapping`                                               | `{}`                                                                           | 自定义格式转换映射，优先级高于上述简写 |
| svgo              | `SvgoOptions`                                                  | `{ plugins: [], multipass: false }`                                            | SVG 优化配置                           |
| includeExtensions | `string[]`                                                     | `['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff', '.tif', '.svg']` | 需要优化的文件扩展名列表               |
| excludePaths      | `string[]`                                                     | `[]`                                                                           | 需要排除的路径前缀列表                 |
| threshold         | `number`                                                       | `0`                                                                            | 最小优化阈值（字节），小于此值跳过     |
| keepOriginal      | `boolean`                                                      | `true`                                                                         | 格式转换时是否保留原始文件             |
| reportOutput      | `string` \| `false`                                            | `'image-optimize-report.json'`                                                 | 压缩报告输出路径，`false` 不生成       |
| parallelLimit     | `number`                                                       | `5`                                                                            | 并发优化的最大文件数                   |
| maxPixels         | `number`                                                       | `0`                                                                            | 单个图片最大像素数，超过则缩放，0 不限 |

**FormatQualityOptions 类型**：

| 属性 | 类型                                         | 默认值      | 描述                   |
| ---- | -------------------------------------------- | ----------- | ---------------------- |
| jpeg | `number`                                     | `80`        | JPEG 质量，范围 1-100  |
| png  | `number`                                     | `6`         | PNG 压缩级别，范围 1-9 |
| webp | `number`                                     | `75`        | WebP 质量，范围 1-100  |
| avif | `number`                                     | `50`        | AVIF 质量，范围 1-100  |
| gif  | `boolean`                                    | `true`      | GIF 是否尝试调色板优化 |
| tiff | `'none' \| 'lzw' \| 'deflate' \| 'packbits'` | `'deflate'` | TIFF 压缩算法          |

**ImageOptimizeStats 类型**：

| 属性          | 类型          | 描述                                           |
| ------------- | ------------- | ---------------------------------------------- |
| file          | `string`      | 原始文件路径                                   |
| relativePath  | `string`      | 相对于输出目录的相对路径                       |
| originalSize  | `number`      | 原始文件大小（字节）                           |
| optimizedSize | `number`      | 优化后文件大小（字节）                         |
| ratio         | `number`      | 压缩率百分比（0-100）                          |
| sourceFormat  | `ImageFormat` | 源图片格式                                     |
| outputFormat  | `ImageFormat` | 输出图片格式（与 sourceFormat 相同表示仅压缩） |
| converted     | `boolean`     | 是否发生了格式转换                             |
| duration      | `number`      | 优化耗时（毫秒）                               |

**ImageOptimizeSummary 类型**：

| 属性               | 类型                                                            | 描述                             |
| ------------------ | --------------------------------------------------------------- | -------------------------------- |
| totalFiles         | `number`                                                        | 优化的文件总数                   |
| skippedFiles       | `number`                                                        | 跳过的文件数量                   |
| failedFiles        | `number`                                                        | 失败的文件数量                   |
| totalOriginalSize  | `number`                                                        | 所有文件的原始大小总和（字节）   |
| totalOptimizedSize | `number`                                                        | 所有文件的优化后大小总和（字节） |
| totalRatio         | `number`                                                        | 总体压缩率百分比                 |
| byFormat           | `Record<string, { count, originalSize, optimizedSize, ratio }>` | 按格式分组的统计                 |
| convertedFiles     | `number`                                                        | 格式转换的文件数量               |
| executionTime      | `number`                                                        | 优化操作总耗时（毫秒）           |
| stats              | `ImageOptimizeStats[]`                                          | 每个文件的详细优化统计           |

### Common 工具模块（增强）

**common/concurrency（新增）**：

| 新增函数             | 描述                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| `runWithConcurrency` | 带并发限制的批量执行，使用工作池模式并发执行异步任务，结果顺序与输入项对应 |

**common/path（恢复）**：

0.1.5 版本中移除的 `common/path` 模块重新添加，提供更完善的路径工具函数：

| 函数                  | 描述                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `normalizePath`       | 将路径中的反斜杠转换为正斜杠，确保跨平台一致性                        |
| `isExtensionIncluded` | 检查文件扩展名是否通过包含/排除过滤条件                               |
| `isPathExcluded`      | 检查文件路径是否匹配排除路径列表，支持 simple 和 segment 两种匹配模式 |
| `isPreCompressed`     | 检查扩展名是否为已压缩格式（`.gz` 或 `.br`）                          |

**common/format（增强）**：

| 新增函数    | 描述                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| `calcRatio` | 计算压缩率百分比，公式 `(1 - compressedSize / originalSize) * 100`，保留一位小数 |

**common/fs（增强）**：

| 新增函数            | 描述                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| `resolveReportPath` | 解析报告输出路径，相对路径基于 outDir 解析，绝对路径直接使用，`false` 返回 `null` |

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/plugins/image-optimizer` 子路径导出
- 新增导出函数：`imageOptimizer`
- 新增导出类型：`ImageOptimizerOptions`、`ImageFormat`、`ConvertMapping`、`FormatQualityOptions`、`SvgoOptions`、`SvgoPlugin`、`ImageOptimizeStats`、`ImageOptimizeSummary`
- 新增 `@meng-xi/vite-plugin/common/concurrency` 子路径导出
- 新增导出函数：`runWithConcurrency`
- 恢复 `@meng-xi/vite-plugin/common/path` 子路径导出
- 恢复导出函数：`normalizePath`、`isExtensionIncluded`、`isPathExcluded`、`isPreCompressed`
- `@meng-xi/vite-plugin/common/format` 新增导出：`calcRatio`
- `@meng-xi/vite-plugin/common/fs` 新增导出：`resolveReportPath`

## 0.1.7（2026-06-08）

新增 assetManifest 资源清单生成插件

### assetManifest（新增）

资源清单生成插件，在 Vite 构建（`writeBundle`）完成后自动扫描输出目录中的文件，生成资源映射清单（`manifest.json`），支持 Vite 标准、Webpack 兼容和自定义三种输出格式。支持按入口分组、运行时注入、自定义格式化等功能。`enforce: 'post'`。

**功能特性**：

- **多种输出格式**：支持 `vite`（Vite 标准格式）、`webpack`（Webpack 兼容格式）和 `custom`（自定义格式化器）三种清单格式
- **按入口分组**：`groupByEntry` 开启后，将资源按入口点分组，区分 JS、CSS 和其他资源文件
- **运行时注入**：`injectRuntime` 将资源映射表以全局变量形式注入到 HTML 文件的 `</head>` 标签前
- **文件过滤**：支持 `includeExtensions` / `excludeExtensions` / `excludePaths` 灵活控制清单包含的文件
- **公共路径前缀**：`publicPath` 自动添加到所有资源路径前，适配 CDN 部署
- **冲突检测**：构建资源映射表时自动检测路径冲突并输出警告
- **实例方法**：提供 `getAssetMap()`、`getManifest()`、`getGroups()` 方法供外部访问清单数据

**配置选项**：

| 选项              | 类型                                  | 默认值                   | 描述                                   |
| ----------------- | ------------------------------------- | ------------------------ | -------------------------------------- |
| outputFormat      | `'vite'` \| `'webpack'` \| `'custom'` | `'vite'`                 | 清单输出格式                           |
| outputFile        | `string`                              | `'manifest.json'`        | 清单输出文件名，相对于构建输出目录     |
| includeExtensions | `string[]`                            | `[]`                     | 包含的文件扩展名，为空则包含所有       |
| publicPath        | `string`                              | `'/'`                    | 公共路径前缀                           |
| injectRuntime     | `boolean`                             | `false`                  | 是否将清单注入为运行时全局变量         |
| runtimeGlobalName | `string`                              | `'__ASSET_MANIFEST__'`   | 运行时全局变量名称                     |
| customFormatter   | `CustomFormatter` \| `null`           | `null`                   | 自定义格式化器，仅 `custom` 格式时生效 |
| groupByEntry      | `boolean`                             | `false`                  | 是否按入口分组资源                     |
| excludeExtensions | `string[]`                            | `['.map', '.gz', '.br']` | 排除的文件扩展名                       |
| excludePaths      | `string[]`                            | `[]`                     | 排除的路径模式列表                     |

**AssetMap 类型**：

| 属性 | 类型     | 描述                                   |
| ---- | -------- | -------------------------------------- |
| [key | `string` | 原始资源路径，值为带 hash 的输出路径 ] |

**AssetGroup 类型**：

| 属性         | 类型       | 描述                |
| ------------ | ---------- | ------------------- |
| entry        | `string`   | 入口名称            |
| assets       | `object`   | 入口关联的资源分类  |
| assets.js    | `string[]` | JavaScript 文件列表 |
| assets.css   | `string[]` | CSS 文件列表        |
| assets.other | `string[]` | 其他资源文件列表    |

**AssetManifestResult 类型**：

| 属性       | 类型           | 描述                         |
| ---------- | -------------- | ---------------------------- |
| version    | `string`       | 清单版本号                   |
| timestamp  | `string`       | 生成时间戳（ISO 8601 格式）  |
| publicPath | `string`       | 公共路径前缀                 |
| assets     | `AssetMap`     | 资源映射表                   |
| groups     | `AssetGroup[]` | 按入口分组的资源信息（可选） |

**WebpackManifestOutput 类型**：

| 属性    | 类型                  | 描述               |
| ------- | --------------------- | ------------------ |
| entries | `WebpackEntryAsset[]` | 所有入口的资源信息 |
| assets  | `AssetMap`            | 资源映射表         |

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/plugins/asset-manifest` 子路径导出
- 新增导出函数：`assetManifest`
- 新增导出类型：`AssetManifestOptions`、`AssetMap`、`AssetGroup`、`AssetManifestResult`、`ManifestOutputFormat`、`WebpackEntryAsset`、`WebpackManifestOutput`、`CustomFormatter`

## 0.1.6（2026-06-07）

autoImport 支持通配符自动导入，generateRouter 新增路由类型声明生成，Common 工具模块新增多项通用函数，插件代码规范化重构

### autoImport（增强）

自动导入插件新增通配符 `'*'` 支持，可自动导入模块的所有命名导出，无需逐一列举。修复了开发模式下与 uni-app 插件的协同问题，修正了默认文件过滤规则。

**新增功能**：

- **通配符导入**：`imports` 配置支持 `'*'` 通配符，自动解析模块的所有命名导出。解析策略优先从 `.d.ts` 类型声明文件提取导出（最准确），回退到运行时入口文件解析
- **Vue SFC 注入**：新增 `injectIntoScriptSetup` 函数，将 import 语句注入到 `<script setup>` 块内部，解决 `enforce: 'pre'` 时与 Vue SFC 编译器的协同问题

**修复**：

- 修复 `transform` 钩子 `enforce: 'post'` 导致裸模块标识符无法解析的问题，改回 `enforce: 'pre'`
- 修复默认 `fileFilter` 未排除 `node_modules`，导致库文件被错误处理并注入错误的 import 语句
- 修复 `resolveWildcardExports` 解析 `vue` 模块时走了运行时入口（仅含 `export { compile }`），导致 `vue: ['*']` 只解析出 `compile` 一个导出
- 修复 `for (const [mod, items] of moduleMap)` 中 `items` 变量声明后未使用的问题
- 修复 `makeCallback` 返回的匿名函数作为函数声明调用时的语法错误，改用 IIFE 形式

**配置选项变更**：

| 选项       | 变更前默认值                        | 变更后默认值                                             | 说明                             |
| ---------- | ----------------------------------- | -------------------------------------------------------- | -------------------------------- |
| imports    | -                                   | -                                                        | 新增支持 `'*'` 通配符格式        |
| fileFilter | `/\.(vue\|jsx\|tsx\|ts\|js\|mjs)$/` | `/^(?!.*node_modules).*\.(vue\|jsx\|tsx\|ts\|js\|mjs)$/` | 默认排除 `node_modules` 中的文件 |

**通配符用法**：

```typescript
autoImport({
	imports: {
		vue: ['*'], // 自动导入 vue 的所有命名导出
		'vue-router': ['*'] // 自动导入 vue-router 的所有命名导出
	}
})
```

### generateRouter（增强）

路由生成插件新增 TypeScript 类型声明文件生成功能，为 `@meng-xi/uni-router` 模块扩展 `RouteNameMap` 接口，实现类型安全的路由导航。

**新增功能**：

- **路由类型声明生成**：新增 `dts` 选项，控制是否生成 `router.d.ts` 类型声明文件
  - `false`：不生成类型声明文件（默认）
  - `true`：使用默认路径 `src/router.d.ts`
  - `string`：在指定路径生成类型声明文件
- 生成的类型声明包含 TSDoc 注释（页面标题）和完整的元信息类型映射

**生成的类型声明示例**：

```typescript
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
	interface RouteNameMap {
		/** 首页 */
		pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
		/** 个人中心 */
		pagesUserProfile: { path: '/pages/user/profile'; meta: { title: string; requireAuth: true } }
	}
}
```

**新增配置选项**：

| 选项 | 类型                  | 默认值  | 描述                                          |
| ---- | --------------------- | ------- | --------------------------------------------- |
| dts  | `string` \| `boolean` | `false` | 路由类型声明文件输出路径，`true` 使用默认路径 |

### Common 工具模块（增强）

新增多项通用函数，提升工具模块的实用性：

**common/format（增强）**：

| 新增函数        | 描述                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| `parseTemplate` | 替换模板字符串中的 `{{key}}` 占位符，键名特殊字符自动转义，值中 $ 安全处理 |
| `formatDate`    | 使用 `{YYYY}`、`{MM}` 等占位符格式化日期字符串                             |

**common/fs（增强）**：

| 新增函数                  | 描述                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| `writeFileSyncSafely`     | 同步写入文件，自动创建不存在的目录，适用于 `transform` 等同步钩子 |
| `shouldUpdateFileContent` | 对比文件内容是否需要更新，减少不必要的文件 IO 操作                |

**common/html（增强）**：

| 新增函数         | 描述                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `escapeHtmlAttr` | 转义 HTML 属性值中的特殊字符（`&`、`"`、`'`、`<`、`>`），防止属性注入攻击 |

### 插件代码规范化重构

按照 `autoImport/common` 目录规范，将各插件中不属于插件核心逻辑的函数、常量等提取到 `common/` 子目录，通过 `common/index.ts` 聚合导出：

- `buildProgress/common` — 提取常量和工具函数
- `generateRouter/common` — 提取路由工具函数和类型声明生成逻辑（`dts.ts`）
- `envGuard/common` — 提取运行时守卫、模板生成、校验逻辑
- `faviconManager/common` — 提取类型定义
- `htmlInject/common` — 提取代码生成器和校验器
- `loadingManager/common` — 提取常量、函数体生成器、代码生成器和校验器
- `versionUpdateChecker/common` — 提取代码生成器和校验器

### 子路径导出（变更）

- `@meng-xi/vite-plugin/common/format` 新增导出：`parseTemplate`、`formatDate`
- `@meng-xi/vite-plugin/common/fs` 新增导出：`writeFileSyncSafely`、`shouldUpdateFileContent`
- `@meng-xi/vite-plugin/common/html` 新增导出：`escapeHtmlAttr`

## 0.1.5（2026-06-06）

新增 autoImport 自动导入插件，精简 Common 工具模块（移除 compress、object、path），修复 dts 类型声明文件在开发模式下不生成的问题

### autoImport（新增）

自动导入插件，在 Vite 构建过程中自动检测代码中使用的标识符，并将对应的 import 语句注入到文件顶部，无需手动编写 import 声明。`enforce: 'post'`。

**功能特性**：

- 预设映射：通过 `imports` 配置常用库的自动导入规则，支持简写格式（`Record<string, string[]>`）和完整格式（`ImportMapping[]`，支持默认导入）
- 目录扫描：通过 `dirs` 配置自动扫描指定目录下的模块导出，递归扫描子目录，跳过 `node_modules` 和隐藏目录
- Vue 模板支持：`vueTemplate` 开启后，Vue SFC `<template>` 中使用的 API 也会被自动导入
- 类型声明生成：`dts` 选项自动生成 `.d.ts` 类型声明文件，提供 IDE 类型提示
- 标识符忽略：`ignore` 选项排除不需要自动导入的标识符
- 文件过滤：`fileFilter` 正则控制需要处理的文件范围
- 注入位置：`injectAtPosition` 支持 `'top'`（文件顶部）和 `'after-last-import'`（最后一个 import 之后）两种位置

**配置选项**：

| 选项             | 类型                                                            | 默认值                              | 描述                                 |
| ---------------- | --------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| imports          | `Record<string, string[]>` \| `ImportMapping[]` \| `Array<...>` | `{}`                                | 导入映射配置                         |
| dirs             | `string[]`                                                      | `[]`                                | 需要扫描的目录列表                   |
| dts              | `string` \| `boolean`                                           | `'auto-imports.d.ts'`               | 类型声明文件输出路径，`false` 不生成 |
| vueTemplate      | `boolean`                                                       | `false`                             | 是否为 Vue 模板启用自动导入          |
| ignore           | `string[]`                                                      | `[]`                                | 需要忽略的标识符列表                 |
| fileFilter       | `RegExp`                                                        | `/\.(vue\|jsx\|tsx\|ts\|js\|mjs)$/` | 文件过滤正则表达式                   |
| injectAtPosition | `'top'` \| `'after-last-import'`                                | `'top'`                             | import 语句注入位置                  |

**ImportMapping 类型**：

| 属性          | 类型       | 描述                         |
| ------------- | ---------- | ---------------------------- |
| module        | `string`   | 模块路径                     |
| names         | `string[]` | 要导入的名称列表             |
| defaultImport | `boolean`  | 是否为默认导入，默认 `false` |

**ResolvedImport 类型**：

| 属性      | 类型      | 描述           |
| --------- | --------- | -------------- |
| module    | `string`  | 模块路径       |
| name      | `string`  | 导入标识符名称 |
| isDefault | `boolean` | 是否为默认导入 |

**ScannedModule 类型**：

| 属性          | 类型               | 描述                        |
| ------------- | ------------------ | --------------------------- |
| filePath      | `string`           | 模块文件的绝对路径          |
| exports       | `string[]`         | 命名导出名称列表            |
| defaultExport | `string` \| `null` | 默认导出名称，无则为 `null` |

**TransformResult 类型**：

| 属性 | 类型     | 描述                    |
| ---- | -------- | ----------------------- |
| code | `string` | 转换后的代码字符串      |
| map  | `any`    | Source map 信息（可选） |

### Common 工具模块（精简）

移除使用次数不足 2 次的工具模块，仅保留在多处被复用的核心工具：

- **移除** `@common/compress` — `calculateGzipSize` 仅在 `bundleAnalyzer` 中使用，已内联
- **移除** `@common/object` — `deepMerge` 仅在 `loadingManager` 中使用，已内联
- **移除** `@common/path` — `isNodeModule` 仅在 `bundleAnalyzer` 中使用，已内联

保留的 6 个模块：

| 子路径              | 描述          | 导出内容                                                                                                     |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `common/format`     | 格式化工具    | `getDateFormatParams`、`formatFileSize`、`DateFormatOptions`                                                 |
| `common/fs`         | 文件系统工具  | `checkSourceExists`、`copySourceToTarget`、`writeFileContent`、`scanDirectory`、`writeJsonReport` 及相关类型 |
| `common/html`       | HTML 注入工具 | `injectBeforeTag`、`injectHeadAndBody`、`sanitizeContent` 及相关类型                                         |
| `common/script`     | 脚本生成工具  | `makeCallback`                                                                                               |
| `common/ui`         | 终端 UI 工具  | `ANSI`                                                                                                       |
| `common/validation` | 参数验证工具  | `Validator`、`validateGlobalName`、`validateNoScriptInTemplate`、`validateCallbackFields`                    |

### 子路径导出（变更）

- 新增 `@meng-xi/vite-plugin/plugins/auto-import` 子路径导出
- 新增导出函数：`autoImport`
- 新增导出类型：`AutoImportOptions`、`ImportMapping`、`ResolvedImport`、`ScannedModule`、`TransformResult`
- 移除 `@meng-xi/vite-plugin/common/compress` 子路径导出
- 移除 `@meng-xi/vite-plugin/common/object` 子路径导出
- 移除 `@meng-xi/vite-plugin/common/path` 子路径导出
- `@meng-xi/vite-plugin/common`
  移除导出：`calculateGzipSize`、`deepMerge`、`isNodeModule`、`SPINNER_FRAMES`、`stripAnsi`、`escapeHtmlAttr`、`getExtension`、`padNumber`、`generateRandomHash`、`formatDate`、`parseTemplate`、`toCamelCase`、`toPascalCase`、`stripJsonComments`
  及相关类型

## 0.1.4（2026-06-03）

新增 envGuard 环境变量校验插件，新增 @common/ui 终端 UI 工具模块

### envGuard（新增）

环境变量校验插件，在 Vite 构建前校验环境变量的存在性和合法性，支持多种值类型校验、正则匹配、自定义校验函数、范围约束和长度约束，可选生成 .env 模板文件和注入运行时守卫代码。`enforce: 'post'`（运行时守卫注入）。

**功能特性**：

- 多类型校验：`string`、`number`、`url`、`boolean`、`enum`、`json`、`semver`、`path`
- 范围验证：`minValue` / `maxValue` 数值范围约束（`number` 类型）
- 长度验证：`minLength` / `maxLength` 字符串长度约束（字符串类类型）
- 正则匹配：`pattern` 正则表达式校验
- 自定义校验：`validator` 函数，返回 `true` 或错误消息字符串
- 失败处理：`failAction` 支持 `error`（中断构建）、`warn`（警告继续）、`ignore`（静默忽略）
- .env 模板生成：`generateTemplate` 自动生成含注释、分组、敏感标记的模板文件
- 运行时守卫：`runtimeGuard` 注入 JavaScript 代码到 HTML，支持 `console`（控制台警告）、`throw`（抛出错误）、`overlay`（页面横幅）三种模式
- 自动加载 .env：`autoLoadEnv` 按配置路径自动加载环境变量到 `process.env`
- 校验报告：`reportOutput` 生成 JSON 格式的校验结果报告
- 校验摘要：`showSummary` 在终端输出通过/缺失/失败统计

**配置选项**：

| 选项                | 类型                                    | 默认值                                                          | 描述                                 |
| ------------------- | --------------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| required            | `Record<string, EnvFieldRule>`          | `{}`                                                            | 环境变量校验规则映射                 |
| failAction          | `'error'` \| `'warn'` \| `'ignore'`     | `'error'`                                                       | 校验失败时的处理动作                 |
| generateTemplate    | `boolean`                               | `true`                                                          | 是否自动生成 .env 模板文件           |
| templateOutput      | `string`                                | `'.env.template'`                                               | .env 模板文件的输出路径              |
| runtimeGuard        | `boolean`                               | `false`                                                         | 是否注入运行时环境变量守卫代码       |
| runtimeGlobalName   | `string`                                | `'__ENV_GUARD__'`                                               | 运行时守卫的全局变量名               |
| runtimeGuardMode    | `'console'` \| `'throw'` \| `'overlay'` | `'console'`                                                     | 运行时守卫的行为模式                 |
| envFiles            | `string[]`                              | `['.env', '.env.local', '.env.production', '.env.development']` | 需要加载的 .env 文件路径列表         |
| autoLoadEnv         | `boolean`                               | `true`                                                          | 是否自动加载 .env 文件到 process.env |
| reportOutput        | `string` \| `false`                     | `false`                                                         | 校验报告输出路径，`false` 不生成     |
| validateBeforeBuild | `boolean`                               | `true`                                                          | 是否在构建前执行校验                 |
| showSummary         | `boolean`                               | `true`                                                          | 是否输出校验摘要日志                 |

**EnvFieldRule 类型**：

| 属性        | 类型                                   | 描述                                   |
| ----------- | -------------------------------------- | -------------------------------------- |
| type        | `EnvType`                              | 值类型，默认 `'string'`                |
| required    | `boolean`                              | 是否为必需字段，默认 `true`            |
| pattern     | `RegExp`                               | 正则表达式，值必须匹配此模式           |
| validator   | `(value: string) => boolean \| string` | 自定义验证函数                         |
| message     | `string`                               | 自定义错误消息                         |
| default     | `string`                               | 当值为空时使用的默认值                 |
| enumValues  | `string[]`                             | 枚举值列表（仅 `enum` 类型）           |
| minValue    | `number`                               | 数值最小值（仅 `number` 类型）         |
| maxValue    | `number`                               | 数值最大值（仅 `number` 类型）         |
| minLength   | `number`                               | 字符串最小长度（仅字符串类类型）       |
| maxLength   | `number`                               | 字符串最大长度（仅字符串类类型）       |
| group       | `string`                               | 变量分组名称，用于模板生成时的分组显示 |
| description | `string`                               | 变量描述信息，用于模板生成时的说明文本 |
| sensitive   | `boolean`                              | 是否为敏感变量，模板中会隐藏实际值     |

**EnvValidationResult 类型**：

| 属性    | 类型                                                                                                                      | 描述             |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| key     | `string`                                                                                                                  | 环境变量名       |
| status  | `'pass'` \| `'missing'` \| `'type_error'` \| `'custom_error'` \| `'enum_mismatch'` \| `'range_error'` \| `'length_error'` | 验证状态         |
| message | `string`                                                                                                                  | 验证消息         |
| value   | `string` \| `undefined`                                                                                                   | 环境变量的有效值 |
| rule    | `EnvFieldRule`                                                                                                            | 应用的校验规则   |

**EnvGuardResult 类型**：

| 属性      | 类型                    | 描述                       |
| --------- | ----------------------- | -------------------------- |
| timestamp | `string`                | 校验时间戳（ISO 格式）     |
| total     | `number`                | 校验的环境变量总数         |
| passed    | `number`                | 校验通过的变量数量         |
| missing   | `number`                | 缺失的必需变量数量         |
| invalid   | `number`                | 校验失败的变量数量         |
| results   | `EnvValidationResult[]` | 所有变量的详细校验结果列表 |
| allPassed | `boolean`               | 是否所有变量均校验通过     |

### @common/ui（新增模块）

终端 UI 工具模块，提供 ANSI 转义码处理、Spinner 动画帧和字符串清理等工具函数。

- `ANSI` — ANSI 转义码工具集，包含光标控制（`reset`、`clearLine`、`hideCursor`、`showCursor`）和彩色文本包装（`green`、`cyan`、`gray`、`bold`、`red`、`yellow`、`magenta`）
- `SPINNER_FRAMES` — Spinner 动画帧序列，Windows 平台使用 ASCII 字符 `|`/`/`/`-`/`\`，其他平台使用 Unicode Braille 字符 `⠋`-`⠏`
- `stripAnsi(str)` — 移除字符串中的所有 ANSI 转义码，用于计算文本实际显示宽度或将彩色输出转为纯文本

### @common/validation（增强）

新增环境变量验证相关类型和函数：

- `EnvType` 类型 — 环境变量值类型，支持 `'string'` \| `'number'` \| `'url'` \| `'boolean'` \| `'enum'` \| `'json'` \| `'semver'` \| `'path'`
- `EnvFieldRule` 接口 — 环境变量字段校验规则，包含类型约束、范围限制、自定义验证函数和元数据信息
- `EnvValidationResult` 接口 — 环境变量验证结果，包含验证状态、错误消息和有效值
- `STRING_LIKE_TYPES` 常量 — 字符串类类型集合，用于长度验证时判断是否需要检查 `minLength`/`maxLength`
- `validateType(value, rule)` — 验证环境变量值的类型
- `validateRange(value, rule)` — 验证数值范围（仅 `number` 类型）
- `validateLength(value, rule)` — 验证字符串长度（仅字符串类类型）
- `validateValue(key, value, rule)` — 验证单个环境变量值（按顺序执行缺失检查、类型验证、范围验证、长度验证、正则验证、自定义验证）
- `validateEnvironment(env, rules)` — 批量验证环境变量

### 子路径导出（增强）

- `@meng-xi/vite-plugin/plugins` 新增导出类型：`EnvGuardOptions`、`EnvGuardResult`、`EnvFailAction`、`RuntimeGuardMode`
- `@meng-xi/vite-plugin/plugins` 新增导出函数：`envGuard`
- `@meng-xi/vite-plugin/common/ui` 新增子路径导出，包含 `ANSI`、`SPINNER_FRAMES`、`stripAnsi`
- `@meng-xi/vite-plugin/common`
  新增导出：`ANSI`、`SPINNER_FRAMES`、`stripAnsi`、`EnvType`、`EnvFieldRule`、`EnvValidationResult`、`STRING_LIKE_TYPES`、`validateType`、`validateRange`、`validateLength`、`validateValue`、`validateEnvironment`

## 0.1.3（2026-06-01）

新增 bundleAnalyzer 构建产物体积分析插件，新增 @common/compress 和 @common/path 工具模块，@common/format 和 @common/fs 新增通用函数

### bundleAnalyzer（新增）

构建产物体积分析插件，在 Vite 构建（writeBundle）完成后自动扫描输出目录，分析构建产物的体积分布、模块依赖、文件类型统计等关键指标，生成 JSON 报告和/或包含可视化图表的 HTML 报告，支持体积阈值告警和与上次构建的对比分析。`enforce: 'post'`。

**功能特性**：

- 多格式报告输出：`json`（JSON 格式）、`html`（含可视化图表的 HTML）、`both`（同时生成两种）
- 体积分析：计算原始大小和 gzip 压缩大小，使用最高压缩级别（level: 9）
- 阈值告警：超过 `sizeThreshold` 的 chunk 自动产生告警，超过 2 倍阈值标记为 critical
- 构建对比：与历史报告对比体积变化趋势，显示增大、减小、新增、移除的模块
- 可视化图表：HTML 报告支持 treemap（树状图）、sunburst（旭日图）和 list（列表）三种视图
- 模块排行：Top N 大模块排行，区分源码和 node_modules
- 文件类型分布：按扩展名统计体积占比
- 自动打开：`openAnalyzer` 支持跨平台自动在浏览器中打开 HTML 报告
- 分析摘要日志：构建完成后输出 chunk 数量、总体积、gzip 体积、Top 5 模块

**配置选项**：

| 选项               | 类型                                    | 默认值              | 描述                                     |
| ------------------ | --------------------------------------- | ------------------- | ---------------------------------------- |
| outputFormat       | `'json'` \| `'html'` \| `'both'`        | `'json'`            | 报告输出格式                             |
| outputFile         | `string`                                | `'bundle-analysis'` | 报告输出文件名（不含扩展名）             |
| openAnalyzer       | `boolean`                               | `false`             | 是否在生成 HTML 报告后自动打开浏览器     |
| sizeThreshold      | `number`                                | `100`               | 体积告警阈值（KB）                       |
| topModules         | `number`                                | `20`                | Top N 大模块排行数量                     |
| compareWith        | `string` \| `null`                      | `null`              | 用于对比的历史报告路径                   |
| gzipSize           | `boolean`                               | `true`              | 是否计算 gzip 大小                       |
| excludeNodeModules | `boolean`                               | `false`             | 是否排除 node_modules 中的模块           |
| excludePatterns    | `string[]`                              | `[]`                | 需要排除的文件路径模式列表               |
| includeExtensions  | `string[]`                              | `[]`                | 需要包含的文件扩展名列表，为空则包含所有 |
| defaultChartType   | `'treemap'` \| `'sunburst'` \| `'list'` | `'treemap'`         | HTML 报告中图表的默认展示形式            |

**BundleAnalysisResult 类型**：

| 属性                 | 类型                     | 描述                   |
| -------------------- | ------------------------ | ---------------------- |
| timestamp            | `string`                 | 分析时间戳（ISO 格式） |
| totalSize            | `number`                 | 构建产物总大小（字节） |
| totalGzipSize        | `number`                 | gzip 总大小（字节）    |
| chunks               | `ChunkStats[]`           | chunk 统计列表         |
| topModules           | `ModuleStats[]`          | Top N 大模块           |
| fileTypeDistribution | `FileTypeDistribution[]` | 文件类型分布统计       |
| warnings             | `SizeWarning[]`          | 体积阈值告警列表       |
| comparisonDiffs      | `ComparisonDiff[]`       | 构建对比差异列表       |
| analysisTime         | `number`                 | 分析耗时（毫秒）       |

**ChunkStats 类型**：

| 属性      | 类型                                | 描述                  |
| --------- | ----------------------------------- | --------------------- |
| name      | `string`                            | chunk 名称            |
| size      | `number`                            | 原始大小（字节）      |
| gzipSize  | `number`                            | gzip 压缩大小（字节） |
| modules   | `ModuleStats[]`                     | 包含的模块列表        |
| type      | `'entry'` \| `'chunk'` \| `'asset'` | chunk 类型            |
| fileCount | `number`                            | 包含的文件数量        |

**ModuleStats 类型**：

| 属性         | 类型       | 描述                              |
| ------------ | ---------- | --------------------------------- |
| id           | `string`   | 模块标识符（通常是模块路径或 ID） |
| size         | `number`   | 模块原始大小（字节）              |
| gzipSize     | `number`   | 模块 gzip 压缩后大小（字节）      |
| chunks       | `string[]` | 所属 chunk 名称列表               |
| imports      | `string[]` | 依赖模块 ID 列表                  |
| isEntry      | `boolean`  | 是否为入口模块                    |
| isNodeModule | `boolean`  | 是否来自 node_modules             |

**FileTypeDistribution 类型**：

| 属性       | 类型     | 描述                        |
| ---------- | -------- | --------------------------- |
| extension  | `string` | 文件扩展名（如 `.js`）      |
| count      | `number` | 该类型的文件数量            |
| totalSize  | `number` | 该类型的总大小（字节）      |
| percentage | `number` | 该类型的总体积占比（0-100） |

**SizeWarning 类型**：

| 属性        | 类型                    | 描述           |
| ----------- | ----------------------- | -------------- |
| level       | `'module'` \| `'chunk'` | 告警级别       |
| name        | `string`                | 告警目标名称   |
| sizeKB      | `number`                | 实际大小（KB） |
| thresholdKB | `number`                | 阈值大小（KB） |
| message     | `string`                | 告警消息       |

**ComparisonDiff 类型**：

| 属性           | 类型                                                                        | 描述            |
| -------------- | --------------------------------------------------------------------------- | --------------- |
| name           | `string`                                                                    | 模块/chunk 名称 |
| previousSize   | `number`                                                                    | 上次构建大小    |
| currentSize    | `number`                                                                    | 本次构建大小    |
| diff           | `number`                                                                    | 体积变化量      |
| diffPercentage | `number`                                                                    | 变化百分比      |
| trend          | `'increased'` \| `'decreased'` \| `'unchanged'` \| `'added'` \| `'removed'` | 变化趋势        |

### @common/compress（新增模块）

- `calculateGzipSize(data)` — 计算给定数据的 gzip 压缩后大小（异步），使用最高压缩级别（level: 9），用于估算网络传输体积。参数 `data` 支持 `Buffer` 和 `string` 类型

### @common/path（新增模块）

- `isNodeModule(moduleId)` — 判断模块 ID 是否来自 node_modules。检测规则：路径包含 `node_modules`、以 `\0` 开头（Rollup 内部虚拟模块）、以 `virtual:` 开头（虚拟模块前缀）

### @common/format（增强）

新增以下工具函数：

- `escapeHtmlAttr(str)` — 转义 HTML 属性值中的特殊字符，防止 XSS 注入。将 `&`、`"`、`<`、`>` 分别转义为 `&amp;`、`&quot;`、`&lt;`、`&gt;`
- `formatFileSize(bytes)` — 将字节数格式化为人类可读的文件大小字符串。小于 1KB 显示 `xB`，小于 1MB 显示 `x.xKB`，大于等于 1MB 显示 `x.xxMB`
- `getExtension(filePath)` — 获取文件扩展名，返回小写的扩展名（含点号，如 `.js`）

### @common/fs（增强）

新增以下工具函数和类型：

- `scanDirectory(dirPath, options?)` — 递归扫描目录，收集所有文件信息，支持按扩展名（`includeExtensions`）、路径模式（`excludePatterns`）和自定义过滤函数（`filter`）进行过滤
- `writeJsonReport(filePath, data, indent?)` — 将数据对象序列化为 JSON 格式并写入文件，默认缩进 2 个空格
- `ScannedFile` 类型 — 扫描文件信息接口，包含 `filePath`、`size`、`extension` 字段
- `ScanDirectoryOptions` 类型 — 目录扫描选项接口，包含 `includeExtensions`、`excludePatterns`、`filter` 字段

### 子路径导出（增强）

- `@meng-xi/vite-plugin/plugins` 新增导出类型：`BundleAnalyzerOptions`、`BundleAnalysisResult`、`BundleOutputFormat`、`ChunkStats`、`ModuleStats`、`FileTypeDistribution`、`SizeWarning`、`ComparisonDiff`
- `@meng-xi/vite-plugin/plugins` 新增导出函数：`bundleAnalyzer`
- `@meng-xi/vite-plugin/common/compress` 新增子路径导出，包含 `calculateGzipSize`
- `@meng-xi/vite-plugin/common/path` 新增子路径导出，包含 `isNodeModule`
- `@meng-xi/vite-plugin/common` 新增导出函数：`calculateGzipSize`、`isNodeModule`、`escapeHtmlAttr`、`formatFileSize`、`getExtension`、`scanDirectory`、`writeJsonReport`
- `@meng-xi/vite-plugin/common` 新增导出类型：`ScannedFile`、`ScanDirectoryOptions`

## 0.1.2（2026-05-31）

新增 compressAssets 构建产物压缩插件，所有插件参数可选化，新增 @common/object 和 @common/fs 完整工具函数

### compressAssets（新增）

构建产物压缩插件，在 Vite 构建（writeBundle）完成后自动扫描输出目录中的文件，使用 gzip 和/或 brotli 算法进行压缩，生成对应的 `.gz` / `.br` 文件。

**功能特性**：

- 三种压缩算法：`gzip`（输出 `.gz`）、`brotli`（输出 `.br`）、`both`（同时生成两种）
- 文件过滤：`includeExtensions` 包含扩展名、`excludeExtensions` 排除扩展名（优先级高于 include）、`excludePaths` 排除路径前缀
- 压缩阈值：`threshold` 小于指定字节的文件跳过压缩
- 并发压缩：`parallelLimit` 控制同时压缩的最大文件数
- 压缩报告：`reportOutput` 生成 JSON 格式的压缩统计报告，设为 `false` 不生成
- 原始文件删除：`deleteOriginalFile` 压缩后删除原始文件，仅保留压缩版本
- 压缩率 Top 5 日志：构建完成后输出压缩率最高的 5 个文件详情
- 执行时机：`enforce: 'post'`，确保在 Vite 构建完成后执行
- 路径跨平台兼容：路径比较时统一将反斜杠转换为正斜杠

**配置选项**：

| 选项               | 类型                               | 默认值                                                      | 描述                                     |
| ------------------ | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| algorithm          | `'gzip'` \| `'brotli'` \| `'both'` | `'gzip'`                                                    | 压缩算法                                 |
| threshold          | `number`                           | `1024`                                                      | 最小压缩阈值（字节），小于此大小跳过     |
| deleteOriginalFile | `boolean`                          | `false`                                                     | 压缩后是否删除原始文件                   |
| includeExtensions  | `string[]`                         | `['.js', '.css', '.html', '.svg', '.json', '.xml', '.txt']` | 需要压缩的文件扩展名列表                 |
| excludeExtensions  | `string[]`                         | `[]`                                                        | 排除的文件扩展名列表，优先级高于 include |
| excludePaths       | `string[]`                         | `[]`                                                        | 排除的路径前缀列表                       |
| compressionLevel   | `number`                           | `9`                                                         | gzip 压缩级别（1-9）                     |
| brotliQuality      | `number`                           | `11`                                                        | brotli 质量参数（1-11）                  |
| reportOutput       | `string` \| `false`                | `'compress-report.json'`                                    | 压缩报告输出路径，`false` 不生成         |
| parallelLimit      | `number`                           | `10`                                                        | 并发压缩的最大文件数                     |

**CompressStats 类型**：

| 属性           | 类型                   | 描述                  |
| -------------- | ---------------------- | --------------------- |
| file           | `string`               | 原始文件路径          |
| originalSize   | `number`               | 原始大小（字节）      |
| compressedSize | `number`               | 压缩后大小（字节）    |
| ratio          | `number`               | 压缩率百分比（0-100） |
| algorithm      | `'gzip'` \| `'brotli'` | 使用的压缩算法        |

**CompressSummary 类型**：

| 属性                | 类型              | 描述                   |
| ------------------- | ----------------- | ---------------------- |
| totalFiles          | `number`          | 压缩文件总数           |
| totalOriginalSize   | `number`          | 原始大小总和（字节）   |
| totalCompressedSize | `number`          | 压缩后大小总和（字节） |
| totalRatio          | `number`          | 总体压缩率百分比       |
| gzipFiles           | `number`          | gzip 压缩文件数        |
| brotliFiles         | `number`          | brotli 压缩文件数      |
| executionTime       | `number`          | 总耗时（毫秒）         |
| stats               | `CompressStats[]` | 每个文件的详细统计     |

### 所有插件参数可选化（增强）

所有插件的配置选项中，存在默认值的参数均改为**选填**（添加 `?`），用户只需传入需要覆盖的参数，零配置即可使用。

**受影响的插件类型**：

| 插件                          | 变更说明                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `BuildProgressOptions`        | `width`、`format`、`completeChar`、`incompleteChar`、`clearOnComplete`、`showModuleName`、`theme` 均改为选填 |
| `CompressAssetsOptions`       | 所有业务属性均改为选填，插件提供完整默认值                                                                   |
| `CopyFileOptions`             | `overwrite`、`recursive`、`incremental` 改为选填（`sourceDir`、`targetDir` 仍为必填）                        |
| `FaviconManagerOptions`       | `base`、`url`、`link`、`icons`、`copyOptions` 均改为选填                                                     |
| `GenerateRouterOptions`       | 所有属性均改为选填，插件提供完整默认值                                                                       |
| `GenerateVersionOptions`      | 所有属性均改为选填，插件提供完整默认值                                                                       |
| `VersionUpdateCheckerOptions` | 所有属性均改为选填，插件提供完整默认值                                                                       |
| `HtmlInjectOptions`           | `targetFile`、`security`、`templateVars`、`logInjection` 改为选填（`rules` 仍为必填）                        |
| `LoadingManagerOptions`       | 所有属性均改为选填，插件提供完整默认值                                                                       |

### @common/object（新增模块）

- `deepMerge(...sources)` — 深度合并对象，undefined 值不覆盖已有值，嵌套对象递归合并，数组直接覆盖。用于 BasePlugin 合并默认配置与用户配置

### @common/fs（增强）

新增以下工具函数：

- `checkSourceExists(sourcePath)` — 检查源文件是否存在，不存在时抛出含路径信息的错误
- `ensureTargetDir(targetPath)` — 确保目标目录存在，递归创建
- `fileExists(filePath)` — 异步检查文件是否存在，返回 `boolean`
- `copySourceToTarget(sourcePath, targetPath, options)` — 复制文件或目录，支持递归、覆盖、增量复制和并发控制
- `writeFileContent(filePath, content)` — 写入文件内容，权限错误时抛出含路径信息的错误
- `readFileContent(filePath)` — 异步读取文件内容，权限错误时抛出含路径信息的错误
- `readFileSync(filePath)` — 同步读取文件内容（已废弃，请使用异步版本）
- `CopyOptions` 类型 — 复制操作选项接口（`recursive`、`overwrite`、`incremental`、`parallelLimit`、`skipEmptyDirs`）
- `CopyResult` 类型 — 复制结果接口（`copiedFiles`、`skippedFiles`、`copiedDirs`、`executionTime`）

### @common/format（增强）

新增以下工具函数：

- `generateRandomHash(length)` — 生成随机哈希字符串，范围 1-64，用于版本号生成
- `formatDate(date, format)` — 格式化日期，支持 `{YYYY}`、`{MM}`、`{DD}` 等占位符
- `parseTemplate(template, values)` — 解析模板字符串，替换占位符
- `toCamelCase(str)` — 将字符串转换为 camelCase（如 `pages/user/profile` → `pagesUserProfile`）
- `toPascalCase(str)` — 将字符串转换为 PascalCase（如 `user-profile` → `UserProfile`）
- `stripJsonComments(jsonString)` — 移除 JSON 字符串中的单行和多行注释
- `DateFormatOptions` 类型 — 日期格式化参数接口

### BasePlugin（增强）

- `mergeOptions` 方法改用 `deepMerge` 合并基础默认值、插件默认值和用户配置，确保 undefined 不覆盖默认值
- 新增 `validator` 属性 — `Validator<T>` 实例，子类可在 `validateOptions` 中使用流式验证
- 新增 `getEnforce()` 方法 — 子类可覆盖以指定插件执行时机（如 `'post'`），默认 `undefined`
- 新增 `onConfigResolved(config)` 生命周期方法 — Vite 配置解析完成后调用，存储 `viteConfig`
- 新增 `handleError(error, context)` 方法 — 根据 `errorStrategy` 统一处理错误
- `toPlugin` 方法增强 — 自动注册 `configResolved` 和 `closeBundle` 钩子，`closeBundle` 时自动调用 `destroy`

### 子路径导出（增强）

- `@meng-xi/vite-plugin/plugins` 新增导出类型：`CompressAssetsOptions`、`CompressAlgorithm`、`CompressStats`、`CompressSummary`
- `@meng-xi/vite-plugin/plugins` 新增导出函数：`compressAssets`
- `@meng-xi/vite-plugin/common` 新增导出类型：`CopyOptions`、`CopyResult`、`DateFormatOptions`
- `@meng-xi/vite-plugin/common`
  新增导出函数：`deepMerge`、`checkSourceExists`、`ensureTargetDir`、`fileExists`、`copySourceToTarget`、`writeFileContent`、`readFileContent`、`generateRandomHash`、`formatDate`、`parseTemplate`、`toCamelCase`、`toPascalCase`、`stripJsonComments`

## 0.1.1（2026-05-30）

新增 htmlInject HTML 内容注入插件，新增通用工具函数和类型，Validator 新增枚举和数值范围验证

### htmlInject（新增）

HTML 内容注入插件，根据配置规则将自定义 HTML 内容注入到目标 HTML 文件中，支持多种注入位置、条件注入、模板变量替换和安全过滤。

**功能特性**：

- 7 种注入位置：`head-start`、`head-end`、`body-start`、`body-end`、`before-selector`、`after-selector`、`replace-selector`
- 条件注入：支持 `env`（环境变量）、`file-contains`（文件内容检测）、`custom`（自定义函数）三种条件类型，支持 `negate` 取反
- 选择器匹配：支持 `string`（字符串精确匹配）和 `regex`（正则表达式匹配）两种模式
- 模板变量替换：全局 `templateVars` + 规则级 `templateVars`，使用 `{{变量名}}` 语法，规则级变量优先级高于全局
- 规则优先级：`priority` 数值越小越先执行，默认 100
- 安全过滤：`SecurityConfig` 支持阻止危险标签（script、iframe、object 等）和危险属性（onclick、onerror 等事件处理器），支持白名单 `allowedTags` 和自定义阻止列表
- 脚本注入控制：`allowScriptInjection` 允许跳过安全检查，但输出警告日志
- 注入日志：`logInjection` 记录每条规则的执行结果，`getInjectionLogs()` 可获取日志副本
- 目标文件匹配：`targetFile` 支持文件名和相对路径匹配，默认匹配 `index.html`
- 注入时机：`transformIndexHtml` 钩子 `order: 'post'`，确保在其他插件之后执行

**配置选项**：

| 选项         | 类型                     | 默认值         | 描述                       |
| ------------ | ------------------------ | -------------- | -------------------------- |
| targetFile   | `string`                 | `'index.html'` | 目标 HTML 文件路径或文件名 |
| rules        | `InjectRule[]`           | -（必填）      | 注入规则数组               |
| security     | `SecurityConfig`         | -              | 安全配置                   |
| templateVars | `Record<string, string>` | -              | 全局模板变量               |
| logInjection | `boolean`                | `true`         | 是否在控制台输出注入日志   |

**InjectRule 接口**：

| 字段                 | 类型                     | 默认值     | 描述                              |
| -------------------- | ------------------------ | ---------- | --------------------------------- |
| id                   | `string`                 | -          | 规则唯一标识符                    |
| content              | `string`                 | -（必填）  | 要注入的 HTML 内容                |
| position             | `InjectPosition`         | -（必填）  | 注入位置                          |
| selector             | `string`                 | -          | 选择器（selector 相关位置时必填） |
| selectorMatch        | `'string' \| 'regex'`    | `'string'` | 选择器匹配模式                    |
| priority             | `number`                 | `100`      | 规则优先级，数值越小越先执行      |
| condition            | `InjectCondition`        | -          | 注入条件                          |
| templateVars         | `Record<string, string>` | -          | 规则级模板变量（覆盖全局）        |
| allowScriptInjection | `boolean`                | `false`    | 是否允许注入脚本等危险内容        |

**SecurityConfig 接口**：

| 字段                     | 类型       | 默认值 | 描述                 |
| ------------------------ | ---------- | ------ | -------------------- |
| blockDangerousTags       | `boolean`  | `true` | 是否阻止危险标签     |
| blockDangerousAttributes | `boolean`  | `true` | 是否阻止危险属性     |
| allowedTags              | `string[]` | -      | 允许通过的标签白名单 |
| blockedTags              | `string[]` | -      | 自定义阻止标签列表   |
| blockedAttributes        | `string[]` | -      | 自定义阻止属性列表   |

### 通用工具函数（新增）

**format 模块**（`@meng-xi/vite-plugin/common`）：

- `escapeHtmlAttr(str)` — 转义 HTML 属性值中的特殊字符（`&`、`"`、`<`、`>`），防止 XSS 注入
- `padNumber(num, length)` — 数字补零格式化（如 `padNumber(5, 2)` → `'05'`）
- `getDateFormatParams(date)` — 获取日期格式化参数对象，新增 `{SSS}` 三位毫秒占位符

**html 模块**（`@meng-xi/vite-plugin/common`）：

- `injectBeforeTagWithFallback(html, code, fallbackMessage?)` — 带回退策略的 HTML 注入，依次尝试 `</body>` → `</html>` → 末尾追加，返回 `HtmlInjectResult & { usedFallback: boolean }`
- `injectHeadAndBody(html, headCode, bodyCode)` — 双区域 HTML 注入（head + body），返回 `DualInjectResult`
- `DualInjectResult` 类型 — 双区域注入结果接口，包含 `html`、`headInjected`、`bodyInjected`、`usedFallback` 字段

**validation 模块**（`@meng-xi/vite-plugin/common`，新增模块）：

- `validateGlobalName(name, fieldName)` — 验证全局变量名的合法性（包装 `validateIdentifierName`，附加字段上下文信息）
- `validateNoScriptInTemplate(template, fieldName)` — 验证模板字符串不包含 script 标签（XSS 防护）
- `validateCallbackFields(callbacks, fields, objectName)` — 验证回调字段不包含 script 标签
- `validateNonNegativeNumber(value, fieldName)` — 验证数值为非负数
- `validateNestedDuration(config, errorMsg)` — 验证嵌套配置项的 duration 合法性
- `validateEnumValue(value, allowedValues, fieldName)` — 验证字符串值是否在允许的枚举列表中

### Validator（增强）

- 新增 `enum(allowedValues)` 方法 — 验证字段值是否在允许的枚举列表中
- 新增 `minValue(min)` 方法 — 验证数字字段值是否不小于指定最小值
- 新增 `maxValue(max)` 方法 — 验证数字字段值是否不大于指定最大值

### 子路径导出（增强）

- `@meng-xi/vite-plugin/plugins` 新增导出类型：`HtmlInjectOptions`、`InjectRule`、`InjectPosition`、`InjectCondition`、`ConditionType`、`SecurityConfig`、`InjectionLogEntry`、`SelectorMatch`
- `@meng-xi/vite-plugin/plugins` 新增导出函数：`htmlInject`
- `@meng-xi/vite-plugin/common` 新增导出类型：`DualInjectResult`
- `@meng-xi/vite-plugin/common`
  新增导出函数：`injectBeforeTagWithFallback`、`injectHeadAndBody`、`escapeHtmlAttr`、`padNumber`、`getDateFormatParams`、`validateGlobalName`、`validateNoScriptInTemplate`、`validateCallbackFields`、`validateNonNegativeNumber`、`validateNestedDuration`、`validateEnumValue`

## 0.1.0（2026-05-24）

新增 versionUpdateChecker 版本更新检查插件，插件重命名（injectIco → faviconManager，injectLoading → loadingManager），新增通用工具模块

### versionUpdateChecker（新增）

运行时版本更新检查器，定期检查版本号变更并向用户显示刷新提示，通常与 `generateVersion` 插件配合使用。

**功能特性**：

- 三种版本来源：`define`（全局变量）、`file`（version.json）、`auto`（自动检测，优先 define 回退 file）
- 三种提示 UI 样式：`modal`（居中弹窗）、`banner`（顶部横幅）、`toast`（底部轻提示）
- 自定义提示模板：`customPromptTemplate` 支持占位符 `{{message}}`、`{{currentVersion}}`、`{{newVersion}}`、`{{refreshButton}}`、`{{dismissButton}}`
- 自定义样式：`customStyle` 追加到内置样式之后
- 页面可见性变化时立即检查：`checkOnVisibilityChange`，用户从其他标签页切回时触发
- 开发模式控制：`enableInDev` 可选是否在开发环境启用
- 生命周期回调：`onUpdateAvailable`、`onRefresh`、`onDismiss`，以函数体字符串形式提供
- XSS 防护：`customPromptTemplate` 和回调字符串不允许包含 `<script>` 标签
- 标识符安全：`defineName` 通过 `validateIdentifierName` 验证，防止原型污染
- SSR 安全：注入的 JS 代码包含 `typeof window === 'undefined'` 检测
- 销毁清理：清理定时器、DOM 元素、全局函数

**配置选项**：

| 选项                    | 类型                             | 默认值                                     | 描述                         |
| ----------------------- | -------------------------------- | ------------------------------------------ | ---------------------------- |
| versionSource           | `'define' \| 'file' \| 'auto'`   | `'auto'`                                   | 当前版本号的来源             |
| defineName              | `string`                         | `'__APP_VERSION__'`                        | define 模式下的全局变量名    |
| checkUrl                | `string`                         | `'/version.json'`                          | 版本检查文件的 URL 路径      |
| checkInterval           | `number`                         | `300000`（5 分钟）                         | 版本检查间隔时间（毫秒）     |
| checkOnVisibilityChange | `boolean`                        | `true`                                     | 页面可见性变化时是否立即检查 |
| enableInDev             | `boolean`                        | `false`                                    | 是否在开发模式下启用         |
| promptStyle             | `'modal' \| 'banner' \| 'toast'` | `'modal'`                                  | 更新提示 UI 样式             |
| promptMessage           | `string`                         | `'发现新版本，是否立即刷新获取最新内容？'` | 更新提示消息文本             |
| refreshButtonText       | `string`                         | `'立即刷新'`                               | 刷新按钮文本                 |
| dismissButtonText       | `string`                         | `'稍后再说'`                               | 忽略按钮文本                 |
| customPromptTemplate    | `string`                         | -                                          | 自定义提示 UI 的 HTML 模板   |
| customStyle             | `string`                         | -                                          | 自定义样式字符串             |
| onUpdateAvailable       | `string`                         | -                                          | 发现新版本时的回调           |
| onRefresh               | `string`                         | -                                          | 用户选择刷新时的回调         |
| onDismiss               | `string`                         | -                                          | 用户选择忽略时的回调         |

### 插件重命名（Breaking Change）

- `injectIco` → `faviconManager`：网站图标管理插件，功能不变，名称更准确地反映职责
- `injectLoading` → `loadingManager`：全局 Loading 状态管理插件，功能不变，名称更准确地反映职责

### faviconManager（增强）

- 新增字符串简写配置：`faviconManager('/assets')` 等同于 `faviconManager({ base: '/assets' })`
- `url` 选项描述修正：明确覆盖 `base + favicon.ico` 而非仅覆盖 `base`

### loadingManager（增强）

- 新增运行时 API：
  - `toggle(text?)` — 切换 Loading 显示/隐藏状态
  - `enablePointerEvents()` — 启用遮罩层指针事件，拦截所有点击和滚动操作
  - `disablePointerEvents()` — 禁用遮罩层指针事件，允许交互穿透
  - `togglePointerEvents()` — 切换遮罩层指针事件状态
  - `isPointerEventsEnabled()` — 获取当前是否启用了指针事件

### 通用工具函数（新增模块）

**html 模块**（`@meng-xi/vite-plugin/common`）：

- `injectBeforeTag(html, tag, code)` — 在 HTML 中指定闭合标签前注入代码，返回 `{ html, injected }` 结果对象
- `injectHtmlByPriority(html, code, targets?)` — 按优先级向 HTML 中注入代码，默认依次尝试 `</head>`、`</body>`、`</html>`
- `HtmlInjectResult` 类型 — 注入结果接口，包含 `html` 和 `injected` 字段

**script 模块**（`@meng-xi/vite-plugin/common`）：

- `makeCallback(body?, context?, params?)` — 将回调函数体字符串包装为安全的函数表达式（包含 try-catch 保护）
- `containsScriptTag(str)` — 检测字符串是否包含 `<script>` 标签（XSS 防护）
- `validateIdentifierName(name)` — 验证字符串是否为合法的 JavaScript 标识符，排除可能导致原型污染的内置属性

### 子路径导出（增强）

- `@meng-xi/vite-plugin/plugins` 新增导出类型：`VersionUpdateCheckerOptions`、`VersionSource`、`PromptStyle`、`FaviconManagerOptions`、`LoadingManagerOptions`、`LoadingManager`
- `@meng-xi/vite-plugin/common` 新增导出类型：`HtmlInjectResult`
- `@meng-xi/vite-plugin/common` 新增导出函数：`injectBeforeTag`、`injectHtmlByPriority`、`makeCallback`、`containsScriptTag`、`validateIdentifierName`

## 0.0.9（2026-05-23）

修复 injectLoading 严重问题，新增 LoadingManager 运行时 API，优化插件开发框架

### injectLoading（修复 + 增强）

**修复**：

- 修复 `style.pointerEvents` 默认值错误，正确默认为 `true`（启用遮罩层指针事件，拦截交互），此前版本默认为 `false` 导致遮罩层无法阻止用户操作
- 修复 LoadingManager 运行时 API 不完整的问题，补充缺失的方法

**新增运行时 API**：

- `toggle(text?)` — 切换 Loading 显示/隐藏状态
- `enablePointerEvents()` — 启用遮罩层指针事件，拦截所有点击和滚动操作
- `disablePointerEvents()` — 禁用遮罩层指针事件，允许交互穿透
- `togglePointerEvents()` — 切换遮罩层指针事件状态
- `isPointerEventsEnabled()` — 获取当前是否启用了指针事件

### injectIco（增强）

- 新增字符串简写配置：`injectIco('/assets')` 等同于 `injectIco({ base: '/assets' })`
- `url` 选项描述修正：明确覆盖 `base + favicon.ico` 而非仅覆盖 `base`

### BasePlugin（增强）

- 新增 `safeExecute(fn, context)` 异步安全执行方法，根据 `errorStrategy` 策略自动处理错误
- 新增 `safeExecuteSync(fn, context)` 同步安全执行方法，根据 `errorStrategy` 策略自动处理错误
- 构造函数中自动使用 `safeExecuteSync` 包裹 `validateOptions()` 调用，验证失败不再导致构建崩溃（`errorStrategy` 为 `'log'` 或 `'ignore'` 时）

### createPluginFactory（增强）

- 新增选项标准化器（`OptionsNormalizer`）支持，允许插件接受非对象类型的简写配置
- 工厂函数泛型新增 `R` 参数，支持原始输入类型与标准化后类型不同

### 通用工具函数（新增）

- `readDirRecursive(dirPath, recursive)` — 递归读取目录内容，返回文件和目录条目信息，避免冗余 stat 调用
- `runWithConcurrency(items, handler, concurrency)` — 带并发限制的批量执行，控制异步操作并发数
- `shouldUpdateFile(sourceFile, targetFile)` — 检查文件是否需要更新（比较修改时间和文件大小），用于增量复制

### buildProgress（增强）

- 新增进度计算逻辑说明：config(5%) → resolve(10%) → transform(15%-85%) → bundle(+10%) → write(+5%) → done(100%)
- 非 TTY 终端环境（如 CI/CD）自动降级为日志输出模式

### copyFile（增强）

- 明确执行时机为 `enforce: 'post'`，确保在 Vite 构建完成后执行

### generateRouter（增强）

- 新增 `metaMapping` 默认值说明：默认为 `{ navigationBarTitleText: 'title', requireAuth: 'requireAuth' }`
- 新增 `nameStrategy` 为 `'custom'` 时必须提供 `customNameGenerator` 的约束说明

### generateVersion（增强）

- 新增 `customFormat` 占位符完整文档：`{YYYY}`、`{YY}`、`{MM}`、`{DD}`、`{HH}`、`{mm}`、`{ss}`、`{timestamp}`、`{hash}`、`{major}`、`{minor}`、`{patch}`

### 子路径导出（增强）

- 新增 `PluginFactory`、`OptionsNormalizer` 类型导出
- 新增 `DateFormatOptions` 类型导出
- 新增 `readDirRecursive`、`runWithConcurrency`、`shouldUpdateFile` 函数导出

## 0.0.8（2026-05-21）

新增 injectLoading 全局 Loading 状态管理插件，**此插件存在严重问题，请尽快升级到0.0.9版本**

### injectLoading（新增）

注入全局 Loading 状态管理，支持白屏 Loading、请求自动拦截、自定义样式与动画、生命周期回调。

**功能特性**：

- 白屏 Loading：`defaultVisible` 为 `true` 时，CSS 和 HTML 以静态标签注入到 `<head>`，HTML 解析即显示，无需等待 JS 执行
- 自动隐藏时机：支持 `DOMContentLoaded`、`load`、`manual` 三种策略，适配 SSR/MPA 和 SPA 场景
- 请求自动拦截：`autoBind` 支持 `fetch`、`xhr`、`all`、`none` 四种模式，自动管理 Loading 状态
- 请求过滤：`requestFilter` 支持 URL 正则排除/包含、HTTP 方法排除、URL 前缀排除，`includeUrls` 优先级高于 `excludeUrls`
- 四种内置图标：`spinner`（旋转圆环）、`dots`（三点跳动）、`pulse`（脉冲）、`bar`（进度条）
- 过渡动画：可配置 CSS 过渡效果（持续时间、缓动函数），CSS 与 JS 动画协同避免冲突
- 最小显示时间：防止 Loading 闪烁，确保至少显示指定时长
- 延迟显示：请求在短时间内完成时不显示 Loading，避免闪烁
- 防抖隐藏：频繁触发 hide 时延迟执行，避免闪烁
- 自定义样式：支持遮罩层颜色、图标颜色/大小、文本颜色/大小、z-index、点击穿透、背景模糊等
- 自定义模板：`customTemplate` 支持完全自定义 HTML 结构
- 生命周期回调：`onBeforeShow`、`onShow`、`onBeforeHide`、`onHide`、`onDestroy`，以函数体字符串形式提供
- 运行时 API：注入 `window.__LOADING_MANAGER__`（可通过 `globalName` 自定义），提供 `show`、`hide`、`forceHide`、`updateText`、`isVisible`、`getPendingCount`、`destroy` 方法
- SSR 安全：注入的 JS 代码包含 `typeof window === 'undefined'` 检测，SSR 环境自动跳过
- 销毁清理：`destroy()` 清理 DOM 元素、style 标签、定时器，并恢复原始 fetch/XHR 拦截

**配置选项**：

| 选项           | 类型                                       | 默认值                  | 描述                                                 |
| -------------- | ------------------------------------------ | ----------------------- | ---------------------------------------------------- |
| position       | `'center' \| 'top' \| 'bottom'`            | `'center'`              | Loading 显示位置                                     |
| defaultText    | `string`                                   | `'加载中...'`           | 默认显示文本                                         |
| spinnerType    | `'spinner' \| 'dots' \| 'pulse' \| 'bar'`  | `'spinner'`             | 旋转图标类型                                         |
| style          | `LoadingStyle`                             | 见下方                  | 自定义样式配置                                       |
| transition     | `TransitionConfig`                         | `{ enabled: true }`     | 过渡动画配置                                         |
| minDisplayTime | `MinDisplayTime`                           | `{ enabled: true }`     | 最小显示时间配置                                     |
| delayShow      | `DelayShow`                                | `{ enabled: true }`     | 延迟显示配置                                         |
| debounceHide   | `DebounceHide`                             | `{ enabled: false }`    | 防抖隐藏配置                                         |
| autoBind       | `'fetch' \| 'xhr' \| 'all' \| 'none'`      | `'none'`                | 自动绑定请求拦截模式                                 |
| requestFilter  | `RequestFilter`                            | -                       | 请求过滤配置                                         |
| globalName     | `string`                                   | `'__LOADING_MANAGER__'` | 注入到浏览器的全局变量名                             |
| customTemplate | `string`                                   | -                       | 自定义 Loading HTML 模板                             |
| defaultVisible | `boolean`                                  | `false`                 | DOM 初始可见状态（白屏 Loading）                     |
| autoHideOn     | `'DOMContentLoaded' \| 'load' \| 'manual'` | `'DOMContentLoaded'`    | 自动隐藏时机（仅 `defaultVisible` 为 `true` 时生效） |
| callbacks      | `LoadingCallbacks`                         | -                       | 生命周期回调                                         |

## 0.0.7（2026-05-19）

新增 buildProgress 构建进度条插件

### buildProgress（新增）

在终端实时显示 Vite 构建进度条，支持三种显示格式和自定义颜色主题。

**功能特性**：

- 支持三种进度显示格式：`bar`（完整进度条）、`spinner`（旋转动画）、`minimal`（精简模式）
- 基于构建生命周期计算进度：config(5%) → resolve(10%) → transform(15%-85%) → bundle(+10%) → write(+5%) → done(100%)
- 支持自定义进度条宽度、填充字符、颜色主题
- 可选显示当前处理的模块名称，超长自动截断
- 非 TTY 环境（如 CI/CD）自动降级为日志输出
- `destroy()` 生命周期中停止动画定时器并恢复终端光标，防止终端状态异常

**配置选项**：

| 选项            | 类型                                  | 默认值 | 描述                     |
| --------------- | ------------------------------------- | ------ | ------------------------ |
| width           | number                                | 30     | 进度条宽度（字符数）     |
| format          | `'bar'` \| `'spinner'` \| `'minimal'` | 'bar'  | 进度条显示格式           |
| completeChar    | string                                | '█'    | 已完成部分填充字符       |
| incompleteChar  | string                                | '░'    | 未完成部分填充字符       |
| clearOnComplete | boolean                               | true   | 构建完成后是否清除进度条 |
| showModuleName  | boolean                               | true   | 是否显示当前模块名称     |
| theme           | ProgressTheme                         | -      | 自定义颜色主题           |

## 0.0.6（2026-05-18）

新增插件销毁生命周期及子路径类型导出，优化日志系统

### BasePlugin

- 新增 `destroy()` 虚方法，插件销毁时自动调用，基类默认注销日志配置，子类可重写添加自定义清理逻辑
- `toPlugin()` 自动在 `closeBundle` 钩子末尾调用 `destroy()`，确保资源正确释放
- `viteConfig` 属性类型修正为 `ResolvedConfig | null`，初始值为 `null`

### Logger

- 新增 `Logger.unregister(pluginName)` 静态方法，注销指定插件的日志配置
- `Logger.destroy()` 清除所有已注册的插件配置并重置单例实例

### generateRouter

- 文件监听器清理逻辑迁移至 `destroy()` 生命周期，确保 `closeBundle` 时正确关闭 watcher

### 子路径导出（Sub-path Exports）

- `@meng-xi/vite-plugin/factory` 新增导出类型：`PluginFactory`、`OptionsNormalizer`、`PluginWithInstance`、`BasePluginOptions`
- `@meng-xi/vite-plugin/plugins`
  新增导出类型：`CopyFileOptions`、`GenerateRouterOptions`、`GenerateVersionOptions`、`InjectIcoOptions`、`Icon`、`VersionFormat`、`OutputType`、`NameStrategy`、`OutputFormat`、`RouteConfig`、`RouteMeta` 等
- `@meng-xi/vite-plugin/common` 新增导出类型：`CopyOptions`、`CopyResult`、`DateFormatOptions`

### injectIco

- 统一图标接口类型名称为 `Icon`（替代旧名 `IconConfig`）

### common/fs

- `readFileSync` 标记为已废弃，推荐使用异步版本 `readFileContent`
- `CopyOptions` 新增 `parallelLimit`（并发限制，默认 10）和 `skipEmptyDirs`（跳过空目录）选项

## 0.0.5（2026-03-05）

generateVersion 支持在构建过程中自动生成版本号，支持多种格式和输出方式

### generateRouter

根据 uni-app 项目的 `pages.json` 自动生成路由配置文件。

| 选项                 | 类型         | 默认值                 | 描述                          |
| -------------------- | ------------ | ---------------------- | ----------------------------- |
| pagesJsonPath        | string       | 'src/pages.json'       | pages.json 文件路径           |
| outputPath           | string       | 'src/router.config.ts' | 输出文件路径                  |
| outputFormat         | 'ts' \| 'js' | 'ts'                   | 输出文件格式                  |
| nameStrategy         | string       | 'camelCase'            | 路由名称策略                  |
| includeSubPackages   | boolean      | true                   | 是否包含子包路由              |
| watch                | boolean      | true                   | 是否监听变化自动重新生成      |
| metaMapping          | object       | -                      | 页面 style 字段到 meta 的映射 |
| preserveRouteChanges | boolean      | true                   | 是否保留用户对 routes 的修改  |

## 0.0.4（2026-02-28）

添加 generateVersion 插件及 format 工具导出

- 在 core 包的 common 模块中导出 format 工具
- 在 plugins 模块中添加并导出 generateVersion 插件

优化文件复制和对象合并逻辑，改进图标注入插件

- 重构 readDirRecursive 接口，返回文件/目录条目信息，减少冗余 stat 调用
- 引入并发限制机制，实现并行文件复制，提高 IO 效率
- 优化 copySourceToTarget 函数，支持并行复制及增量更新逻辑
- 深度合并函数 deepMerge 支持跳过 undefined，完善嵌套对象合并规则
- Logger 增加日志图标和颜色，提升控制台输出可读性
- injectIco 插件改用 Vite 官方 HtmlTagDescriptor 接口注入图标标签，增加自定义 link 标签的注入处理
- injectIco 插件 transformIndexHtml 钩子支持同时兼容字符串替换和官方标签注入两种方式

## 0.0.3（2026-02-04）

- 插件工厂新增safeExecuteSync同步函数
- 将日志系统从简单工具类升级为功能完善的单例模式框架
- 新增 PluginLogger 接口，实现插件级别独立日志代理与控制
- 统一日志输出格式，包含时间戳、命名空间、图标与颜色支持
- 通过插件配置映射管理插件日志开关，实现灵活的日志启用控制
- 优化 BasePlugin 中日志初始化流程，调用 createPluginLogger 注入日志代理
- 更新日志级别支持 success/info/warn/error 四种类型
- 改进日志系统性能及扩展性，支持附加数据和调试友好输出
- 完善日志故障排查指南及生产环境性能建议
- Validator 类升级为泛型设计，支持编译时类型安全保障
- BasePlugin 泛型化，集成泛型 Validator 实现类型安全的配置验证
- 增加泛型参数约束 T 和 K，确保字段与默认值类型匹配
- Validator 的 fluent API 支持链式类型推断，增强类型推导连续性
- 自定义验证函数和默认值方法支持类型安全参数
- 更新架构图及 API 文档反映泛型验证机制
- 提供示例及最佳实践，指导类型安全配置开发和错误定位
- 保持与工厂及插件体系兼容，实现泛型验证全链路支持

## 0.0.2（2026-01-26）

1.架构升级，封装插件工厂2.优化日志功能3.新增参数校验功能4.插件新增两个参数，如下所示：

### copyFile 插件

**新增配置选项**：

- `incremental`：是否启用增量复制，仅复制修改过的文件，提高构建效率，默认为 `true`
- `errorStrategy`：错误处理策略：'throw' 抛出错误，'log' 记录日志，'ignore' 忽略错误，默认为 'throw'

### injectIco 插件

**新增配置选项**：

- `incremental`：是否启用增量复制，仅复制修改过的文件，提高构建效率，默认为 `true`
- `errorStrategy`：错误处理策略：'throw' 抛出错误，'log' 记录日志，'ignore' 忽略错误，默认为 'throw'

## 0.0.1（2026-01-21）

### copyFile 插件

用于在 Vite 构建完成后复制文件或目录到指定位置。

**配置选项**：

- `sourceDir`：源目录路径（必填）
- `targetDir`：目标目录路径（必填）
- `overwrite`：是否覆盖已存在的文件，默认为 `true`
- `recursive`：是否递归复制子目录，默认为 `true`
- `verbose`：是否输出详细日志，默认为 `true`
- `enabled`：是否启用插件，默认为 `true`

### injectIco 插件

用于在 Vite 构建过程中注入网站图标链接到 HTML 文件的头部。

**配置选项**：

- `base`：图标文件的基础路径
- `url`：图标的完整 URL
- `link`：自定义的完整 link 标签 HTML
- `icons`：自定义图标数组
- `verbose`：是否输出详细日志，默认为 `true`
- `enabled`：是否启用插件，默认为 `true`
- `copyOptions`：图标文件复制配置
