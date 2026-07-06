import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 单个导入映射项
 *
 * @description 定义从某个模块导入的名称列表，
 * 支持命名导入和默认导入两种方式。
 * 用于 `AutoImportOptions.imports` 数组格式中。
 *
 * @example
 * ```typescript
 * const mapping: ImportMapping = {
 *   module: 'lodash',
 *   names: ['debounce', 'throttle'],
 *   defaultImport: false
 * }
 * ```
 */
interface ImportMapping {
    /**
     * 模块路径
     *
     * @description 可以是 npm 包名（如 `'vue'`、`'vue-router'`）
     * 或相对/绝对文件路径（如 `'./utils/helper'`）
     */
    module: string;
    /**
     * 要导入的名称列表
     *
     * @description 从指定模块导入的标识符名称数组。
     * 当 `defaultImport` 为 `true` 时，列表中的名称将作为默认导入的别名。
     */
    names: string[];
    /**
     * 是否为默认导入
     *
     * @default false
     *
     * @description 设为 `true` 时，生成的 import 语句形式为
     * `import name from 'module'` 而非 `import { name } from 'module'`
     */
    defaultImport?: boolean;
}
/**
 * 自动导入插件的配置选项
 *
 * @interface AutoImportOptions
 * @extends {BasePluginOptions}
 *
 * @description 配置自动导入插件的行为，包括导入映射、目录扫描、
 * 类型声明生成、Vue 模板支持等。
 *
 * @example
 * ```typescript
 * autoImport({
 *   imports: {
 *     vue: ['ref', 'reactive', 'computed', 'watch', 'onMounted'],
 *     'vue-router': ['useRouter', 'useRoute']
 *   },
 *   dirs: ['src/composables', 'src/stores'],
 *   dts: 'src/auto-imports.d.ts',
 *   vueTemplate: true,
 *   injectAtPosition: 'top'
 * })
 * ```
 */
interface AutoImportOptions extends BasePluginOptions {
    /**
     * 导入映射配置
     *
     * @description 支持三种格式：
     * 1. **简写格式**：`Record<string, string[]>` — 键为模块路径，值为导入名称数组
     *    ```typescript
     *    { vue: ['ref', 'reactive'] }
     *    ```
     * 2. **完整格式**：`ImportMapping[]` — 支持默认导入配置
     *    ```typescript
     *    [{ module: 'lodash', names: ['debounce'], defaultImport: true }]
     *    ```
     * 3. **混合格式**：两种格式可以在数组中混合使用
     *
     * @default {}
     */
    imports?: Record<string, string[]> | ImportMapping[] | Array<Record<string, string[]> | ImportMapping>;
    /**
     * 需要扫描的目录列表
     *
     * @description 自动扫描这些目录下的 `.ts`/`.js`/`.mts`/`.mjs` 文件，
     * 将导出的函数、变量、类等注册为可自动导入的标识符。
     * 支持绝对路径和相对路径（相对于项目根目录）。
     *
     * **扫描规则：**
     * - 递归扫描子目录
     * - 跳过 `node_modules` 和隐藏目录（以 `.` 开头）
     * - 跳过 `.d.ts` 类型声明文件
     *
     * @default []
     */
    dirs?: string[];
    /**
     * TypeScript 类型声明文件输出路径
     *
     * @description 控制是否生成 `.d.ts` 类型声明文件：
     * - `string`：在指定路径生成类型声明文件
     * - `false`：不生成类型声明文件
     *
     * 路径可以是相对路径（相对于项目根目录）或绝对路径。
     *
     * @default 'auto-imports.d.ts'
     */
    dts?: string | boolean;
    /**
     * 是否为 Vue 模板启用自动导入
     *
     * @description 开启后，Vue SFC 文件 `<template>` 中使用的 API
     * （如 `ref`、`computed`）也会被自动导入，
     * 无需在 `<script>` 中显式 `import`。
     *
     * **检测范围：**
     * - 插值表达式 `{{ }}` 中的标识符
     * - 指令绑定 `v-if`、`v-show`、`v-model` 等中的表达式
     * - 属性绑定 `:prop="expr"` 中的表达式
     * - 事件绑定 `@event="handler"` 中的表达式
     *
     * @default false
     */
    vueTemplate?: boolean;
    /**
     * 需要忽略的标识符列表
     *
     * @description 这些标识符即使匹配到映射规则也不会被自动导入。
     * 适用于与全局变量冲突的场景，例如某些标识符在运行时已通过
     * 其他方式全局注册。
     *
     * @default []
     *
     * @example
     * ```typescript
     * ignore: ['React'] // 如果 React 已通过 CDN 全局注入
     * ```
     */
    ignore?: string[];
    /**
     * 文件过滤正则表达式
     *
     * @description 只有文件路径匹配此正则的文件才会被 `transform` 钩子处理。
     * 不匹配的文件将被跳过，不进行自动导入注入。
     *
     * @default /\.(vue|jsx|tsx|ts|js|mjs)$/
     */
    fileFilter?: RegExp;
    /**
     * import 语句注入位置
     *
     * @description 控制自动生成的 import 语句在文件中的插入位置：
     * - `'top'`：注入到文件有效代码最顶部（自动跳过 shebang 和 `"use strict"`）
     * - `'after-last-import'`：注入到最后一个已有 import 语句之后；
     *   若无已有 import，回退到顶部注入
     *
     * @default 'top'
     */
    injectAtPosition?: 'top' | 'after-last-import';
}
/**
 * 内部使用的解析后映射项
 *
 * @description 统一的导入映射结构，由用户配置（`imports` 和 `dirs` 扫描结果）
 * 解析而来。所有格式的导入配置最终都会转换为这个统一结构。
 */
interface ResolvedImport {
    /**
     * 模块路径
     *
     * @description 可以是 npm 包名（如 `'vue'`）或文件绝对路径
     * （目录扫描结果使用绝对路径）
     */
    module: string;
    /**
     * 导入标识符名称
     *
     * @description 在代码中检测到此名称使用时，将自动从对应模块导入
     */
    name: string;
    /**
     * 是否为默认导入
     *
     * @description `true` 时生成 `import name from 'module'`，
     * `false` 时生成 `import { name } from 'module'`
     */
    isDefault: boolean;
}
/**
 * 扫描到的模块信息
 *
 * @description 从目录中扫描到的文件导出信息，
 * 由 {@link parseModuleExports} 函数解析生成
 */
interface ScannedModule {
    /**
     * 模块文件的绝对路径
     *
     * @description 用于生成 import 语句中的模块来源路径
     */
    filePath: string;
    /**
     * 命名导出名称列表
     *
     * @description 包含所有通过 `export function`、`export const`、
     * `export class`、`export { ... }`、`export type`、`export interface`
     * 等语法导出的标识符名称
     */
    exports: string[];
    /**
     * 默认导出名称
     *
     * @description 通过 `export default` 导出的标识符名称。
     * 如果默认导出没有命名（如 `export default {}`），
     * 则使用文件名作为标识符名称。无默认导出时为 `null`。
     */
    defaultExport: string | null;
}
/**
 * 代码转换结果
 *
 * @description `transformCode` 方法的返回类型，
 * 包含转换后的代码和可选的 source map
 */
interface TransformResult {
    /**
     * 转换后的代码字符串
     *
     * @description 注入了自动 import 语句后的完整源代码
     */
    code: string;
    /**
     * Source map 信息（可选）
     *
     * @description 用于支持调试时映射回原始源代码位置，
     * 当前实现中暂未生成 source map
     */
    map?: any;
}

/**
 * 创建自动导入插件
 *
 * @function autoImport
 * @param {AutoImportOptions} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 自动注入 import 语句的 Vite 插件工厂函数。
 * 支持预设映射和目录扫描两种方式发现可自动导入的标识符，
 * 可选生成 TypeScript 类型声明文件，支持 Vue 模板自动导入。
 *
 * **特性：**
 * - 多格式导入映射配置（简写 / 完整 / 混合）
 * - 递归目录扫描，自动发现导出
 * - 智能去重，跳过已显式导入的标识符
 * - Vue SFC 模板自动导入支持
 * - TypeScript 类型声明自动生成
 * - 可配置注入位置（顶部 / 最后 import 后）
 * - 自动跳过 shebang 和 `"use strict"`
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { autoImport } from '@meng-xi/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     autoImport({
 *       imports: {
 *         vue: ['ref', 'reactive', 'computed', 'watch', 'onMounted'],
 *         'vue-router': ['useRouter', 'useRoute']
 *       },
 *       dirs: ['src/composables'],
 *       dts: 'src/auto-imports.d.ts',
 *       vueTemplate: true,
 *       injectAtPosition: 'after-last-import'
 *     })
 *   ]
 * })
 * ```
 */
declare const autoImport: PluginFactory<AutoImportOptions, AutoImportOptions>;

export { autoImport };
export type { AutoImportOptions, ImportMapping, ResolvedImport, ScannedModule, TransformResult };
