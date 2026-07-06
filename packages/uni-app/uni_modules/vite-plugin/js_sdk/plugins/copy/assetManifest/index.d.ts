import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 清单输出格式
 *
 * @typedef {('vite' | 'webpack' | 'custom')} ManifestOutputFormat
 * @description 支持的清单格式：
 * - `vite`: Vite 标准格式，键为原始路径，值为带 hash 的输出路径
 * - `webpack`: Webpack 兼容格式，包含 files、entry 等字段
 * - `custom`: 自定义格式，通过 customFormatter 回调生成
 */
type ManifestOutputFormat = 'vite' | 'webpack' | 'custom';
/**
 * 资源映射表
 *
 * @interface AssetMap
 * @description 键为原始资源路径，值为带 hash 的输出路径
 */
interface AssetMap {
    [key: string]: string;
}
/**
 * 按入口分组的资源信息
 *
 * @interface AssetGroup
 * @description 描述一个入口点及其关联的所有资源文件
 */
interface AssetGroup {
    /** 入口名称 */
    entry: string;
    /** 入口关联的资源分类 */
    assets: {
        /** JavaScript 文件列表 */
        js: string[];
        /** CSS 文件列表 */
        css: string[];
        /** 其他资源文件列表（图片、字体等） */
        other: string[];
    };
}
/**
 * 资源清单生成结果
 *
 * @interface AssetManifestResult
 * @description 插件生成的完整资源清单数据
 */
interface AssetManifestResult {
    /** 清单版本号 */
    version: string;
    /** 生成时间戳（ISO 8601 格式） */
    timestamp: string;
    /** 公共路径前缀 */
    publicPath: string;
    /** 资源映射表 */
    assets: AssetMap;
    /** 按入口分组的资源信息，仅在 groupByEntry 为 true 时存在 */
    groups?: AssetGroup[];
}
/**
 * Webpack 兼容格式的入口资源信息
 *
 * @interface WebpackEntryAsset
 * @description 模拟 Webpack ManifestPlugin 的输出结构
 */
interface WebpackEntryAsset {
    /** 入口名称 */
    name: string;
    /** 该入口的所有输出文件路径列表 */
    files: string[];
}
/**
 * Webpack 兼容格式的清单输出
 *
 * @interface WebpackManifestOutput
 */
interface WebpackManifestOutput {
    /** 所有入口的资源信息 */
    entries: WebpackEntryAsset[];
    /** 资源映射表（与 vite 格式相同） */
    assets: AssetMap;
}
/**
 * 自定义格式化器函数类型
 *
 * @param manifest - 资源映射表
 * @returns 自定义格式的输出对象
 */
type CustomFormatter = (manifest: AssetMap) => Record<string, any>;
/**
 * 资源清单生成插件的配置选项
 *
 * @interface AssetManifestOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * assetManifest({
 *   outputFormat: 'vite',
 *   publicPath: 'https://cdn.example.com/',
 *   injectRuntime: true,
 *   groupByEntry: true
 * })
 * ```
 */
interface AssetManifestOptions extends BasePluginOptions {
    /** 清单输出格式，支持 vite 标准、webpack 兼容或自定义 */
    outputFormat?: ManifestOutputFormat;
    /** 清单输出文件名，相对于构建输出目录 */
    outputFile?: string;
    /** 需要包含在清单中的文件扩展名列表，为空则包含所有 */
    includeExtensions?: string[];
    /** 公共路径前缀，会添加到所有资源路径前 */
    publicPath?: string;
    /** 是否将清单注入为运行时全局变量 */
    injectRuntime?: boolean;
    /** 运行时全局变量名称 */
    runtimeGlobalName?: string;
    /** 自定义格式化器，仅在 outputFormat 为 'custom' 时生效 */
    customFormatter?: CustomFormatter | null;
    /** 是否按入口分组资源 */
    groupByEntry?: boolean;
    /** 需要排除的文件扩展名列表，优先级高于 includeExtensions */
    excludeExtensions?: string[];
    /** 需要排除的路径模式列表 */
    excludePaths?: string[];
}

/**
 * 创建资源清单生成插件
 *
 * @function assetManifest
 * @param {Partial<AssetManifestOptions>} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 在 Vite 构建完成后自动扫描输出目录中的文件，
 * 生成资源映射清单，支持 Vite 标准、Webpack 兼容和自定义三种输出格式。
 * 支持按入口分组、运行时注入、自定义格式化等功能。
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { assetManifest } from '@meng-xi/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     assetManifest({
 *       outputFormat: 'vite',
 *       publicPath: 'https://cdn.example.com/',
 *       injectRuntime: true,
 *       groupByEntry: true
 *     })
 *   ]
 * })
 * ```
 */
declare const assetManifest: PluginFactory<AssetManifestOptions, AssetManifestOptions>;

export { assetManifest };
export type { AssetGroup, AssetManifestOptions, AssetManifestResult, AssetMap, CustomFormatter, ManifestOutputFormat, WebpackEntryAsset, WebpackManifestOutput };
