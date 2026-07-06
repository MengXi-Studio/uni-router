import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 版本号格式类型
 *
 * @description
 * - 'timestamp': 时间戳格式，如 '20260203153000'
 * - 'date': 日期格式，如 '2026.02.03'
 * - 'datetime': 日期时间格式，如 '2026.02.03.153000'
 * - 'semver': 语义化版本格式，如 '1.0.0'
 * - 'hash': 随机哈希格式，如 'a1b2c3d4'
 * - 'custom': 自定义格式，需要配合 customFormat 使用
 */
type VersionFormat = 'timestamp' | 'date' | 'datetime' | 'semver' | 'hash' | 'custom';
/**
 * 版本号输出类型
 *
 * @description
 * - 'file': 输出到文件
 * - 'define': 通过 Vite 的 define 注入到代码中
 * - 'both': 同时输出到文件和注入代码
 */
type OutputType = 'file' | 'define' | 'both';
/**
 * 版本信息接口
 *
 * @description generateVersion 插件生成的版本信息对象类型，
 * 通过 define 注入到代码中后可通过 `__APP_VERSION___INFO` 全局变量访问
 */
interface VersionInfo {
    /** 版本号字符串 */
    version: string;
    /** 构建时间（ISO 8601 格式） */
    buildTime: string;
    /** 构建时间戳（毫秒） */
    timestamp: number;
    /** 版本号格式 */
    format: VersionFormat;
    /** 通过 extra 选项附加的自定义字段 */
    [key: string]: unknown;
}
/**
 * 自动生成版本号插件的配置选项接口
 *
 * @interface GenerateVersionOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * generateVersion({
 *   format: 'semver',
 *   semverBase: '2.0.0',
 *   outputType: 'both',
 *   prefix: 'v',
 *   extra: { environment: 'production' }
 * })
 * ```
 */
interface GenerateVersionOptions extends BasePluginOptions {
    /**
     * 版本号格式
     *
     * @default 'timestamp'
     */
    format?: VersionFormat;
    /**
     * 自定义格式模板，仅当 format 为 'custom' 时有效
     *
     * @description 支持以下占位符：
     * - {YYYY}: 四位年份
     * - {MM}: 两位月份
     * - {DD}: 两位日期
     * - {HH}: 两位小时
     * - {mm}: 两位分钟
     * - {ss}: 两位秒数
     * - {timestamp}: 时间戳
     * - {hash}: 随机哈希
     * - {major}: 主版本号（需配合 semverBase）
     * - {minor}: 次版本号（需配合 semverBase）
     * - {patch}: 补丁版本号（需配合 semverBase）
     *
     * @example '{YYYY}.{MM}.{DD}-{hash}'
     */
    customFormat?: string;
    /**
     * 语义化版本基础值，用于 semver 格式
     *
     * @default '1.0.0'
     */
    semverBase?: string;
    /**
     * 输出类型
     *
     * @default 'file'
     */
    outputType?: OutputType;
    /**
     * 输出文件路径（相对于构建输出目录）
     *
     * @default 'version.json'
     */
    outputFile?: string;
    /**
     * 注入到代码中的全局变量名
     *
     * @default '__APP_VERSION__'
     */
    defineName?: string;
    /**
     * 哈希长度
     *
     * @default 8
     */
    hashLength?: number;
    /**
     * 版本号前缀
     *
     * @example 'v'
     */
    prefix?: string;
    /**
     * 版本号后缀
     *
     * @example '-beta'
     */
    suffix?: string;
    /**
     * 额外的版本信息，会包含在输出的 JSON 文件中
     */
    extra?: Record<string, any>;
}

/**
 * 自动生成版本号插件
 *
 * @param {GenerateVersionOptions} options - 插件配置选项
 * @returns {Plugin} 一个 Vite 插件实例
 *
 * @example
 * ```typescript
 * // 基本使用 - 时间戳格式
 * generateVersion()
 *
 * // 日期格式
 * generateVersion({
 *   format: 'date'
 * })
 *
 * // 语义化版本格式
 * generateVersion({
 *   format: 'semver',
 *   semverBase: '2.0.0',
 *   prefix: 'v'
 * })
 *
 * // 自定义格式
 * generateVersion({
 *   format: 'custom',
 *   customFormat: '{YYYY}.{MM}.{DD}-{hash}',
 *   hashLength: 6
 * })
 *
 * // 注入到代码中
 * generateVersion({
 *   outputType: 'define',
 *   defineName: '__VERSION__'
 * })
 *
 * // 同时输出文件和注入代码
 * generateVersion({
 *   outputType: 'both',
 *   outputFile: 'build-info.json',
 *   defineName: '__BUILD_VERSION__',
 *   extra: {
 *     environment: 'production',
 *     author: 'MengXi Studio'
 *   }
 * })
 * ```
 *
 * @remarks
 * 该插件会在 Vite 构建过程中自动生成版本号，支持多种格式：
 * - timestamp: 时间戳格式 (20260203153000)
 * - date: 日期格式 (2026.02.03)
 * - datetime: 日期时间格式 (2026.02.03.153000)
 * - semver: 语义化版本格式 (1.0.0)
 * - hash: 随机哈希格式 (a1b2c3d4)
 * - custom: 自定义格式
 */
declare const generateVersion: PluginFactory<GenerateVersionOptions, GenerateVersionOptions>;

export { generateVersion };
export type { GenerateVersionOptions, OutputType, VersionFormat, VersionInfo };
