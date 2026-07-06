import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 支持的图片格式类型
 *
 * @description 插件支持的所有图片格式：
 * - `jpeg`: JPEG/JPG 格式
 * - `png`: PNG 格式
 * - `webp`: WebP 格式
 * - `avif`: AVIF 格式
 * - `gif`: GIF 格式
 * - `tiff`: TIFF 格式
 * - `svg`: SVG 矢量格式
 */
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff' | 'svg';
/**
 * 格式转换映射配置
 *
 * @description 定义从源格式到目标格式的转换规则。
 * 键为源格式，值为目标格式。仅配置需要转换的格式。
 *
 * @example
 * ```typescript
 * const convertMap: ConvertMapping = {
 *   png: 'webp',  // PNG → WebP
 *   jpeg: 'avif'  // JPEG → AVIF
 * }
 * ```
 */
type ConvertMapping = Partial<Record<ImageFormat, ImageFormat>>;
/**
 * 单个图片格式的优化配置
 *
 * @interface FormatQualityOptions
 * @description 针对特定图片格式的压缩质量参数。
 * 不同格式使用不同的质量衡量标准。
 */
interface FormatQualityOptions {
    /** JPEG 质量，范围 1-100，默认 80 */
    jpeg?: number;
    /** PNG 压缩级别，范围 1-9（仅 palette-based），默认 6 */
    png?: number;
    /** WebP 质量，范围 1-100，默认 75 */
    webp?: number;
    /** AVIF 质量，范围 1-100，默认 50 */
    avif?: number;
    /** GIF 优化选项：是否尝试调色板优化，默认 true */
    gif?: boolean;
    /** TIFF 压缩选项：压缩算法，默认 'deflate' */
    tiff?: 'none' | 'lzw' | 'deflate' | 'packbits';
}
/**
 * SVGO 单个插件配置
 *
 * @interface SvgoPlugin
 * @description SVGO 插件配置项，name 为插件名称，其余为插件参数。
 */
interface SvgoPlugin {
    /** SVGO 插件名称 */
    name: string;
    /** 插件参数 */
    [key: string]: unknown;
}
/**
 * SVG 优化配置
 *
 * @interface SvgoOptions
 * @description 传递给 SVGO 的插件配置，与 SVGO 官方配置格式一致。
 * 每项为 SVGO 插件名称及激活状态。
 *
 * @example
 * ```typescript
 * const svgo: SvgoOptions = {
 *   plugins: [
 *     { name: 'removeViewBox', active: false },
 *     { name: 'removeEmptyContainers', active: true }
 *   ]
 * }
 * ```
 */
interface SvgoOptions {
    /** SVGO 插件列表 */
    plugins?: SvgoPlugin[];
    /** 是否启用 SVGO 多进程优化（仅当 SVG 文件较多时建议开启） */
    multipass?: boolean;
}
/**
 * 单个文件的优化统计信息
 *
 * @interface ImageOptimizeStats
 * @description 记录单个图片文件经过优化后的详细统计数据
 */
interface ImageOptimizeStats {
    /** 原始文件路径 */
    file: string;
    /** 相对于输出目录的相对路径 */
    relativePath: string;
    /** 原始文件大小（字节） */
    originalSize: number;
    /** 优化后文件大小（字节） */
    optimizedSize: number;
    /** 压缩率百分比（0-100），如 65.2 表示体积减少 65.2% */
    ratio: number;
    /** 源图片格式 */
    sourceFormat: ImageFormat;
    /** 输出图片格式（与 sourceFormat 相同表示仅压缩，不同表示格式转换） */
    outputFormat: ImageFormat;
    /** 是否发生了格式转换 */
    converted: boolean;
    /** 优化耗时（毫秒） */
    duration: number;
}
/**
 * 优化操作的汇总统计信息
 *
 * @interface ImageOptimizeSummary
 * @description 包含整个优化操作的总体统计数据，用于报告生成和日志输出
 */
interface ImageOptimizeSummary {
    /** 优化的文件总数 */
    totalFiles: number;
    /** 跳过的文件数量 */
    skippedFiles: number;
    /** 失败的文件数量 */
    failedFiles: number;
    /** 所有文件的原始大小总和（字节） */
    totalOriginalSize: number;
    /** 所有文件的优化后大小总和（字节） */
    totalOptimizedSize: number;
    /** 总体压缩率百分比 */
    totalRatio: number;
    /** 按格式分组的统计 */
    byFormat: Record<string, {
        count: number;
        originalSize: number;
        optimizedSize: number;
        ratio: number;
    }>;
    /** 格式转换统计：转换的文件数量 */
    convertedFiles: number;
    /** 优化操作总耗时（毫秒） */
    executionTime: number;
    /** 每个文件的详细优化统计 */
    stats: ImageOptimizeStats[];
}
/**
 * 图片优化插件的配置选项
 *
 * @interface ImageOptimizerOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * imageOptimizer({
 *   quality: { jpeg: 80, webp: 75, avif: 50 },
 *   convertToWebp: { png: true, jpeg: true },
 *   convertToAvif: { png: true },
 *   svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
 *   keepOriginal: true,
 *   parallelLimit: 5,
 *   reportOutput: 'image-optimize-report.json'
 * })
 * ```
 */
interface ImageOptimizerOptions extends BasePluginOptions {
    /** 各格式的压缩质量参数 */
    quality?: FormatQualityOptions;
    /** 是否将指定格式转换为 WebP，值为需要转换的源格式映射 */
    convertToWebp?: Partial<Record<'jpeg' | 'png' | 'gif' | 'tiff', boolean>>;
    /** 是否将指定格式转换为 AVIF，值为需要转换的源格式映射 */
    convertToAvif?: Partial<Record<'jpeg' | 'png' | 'gif' | 'tiff', boolean>>;
    /** 自定义格式转换映射，优先级高于 convertToWebp/convertToAvif */
    convertMapping?: ConvertMapping;
    /** SVG 优化配置 */
    svgo?: SvgoOptions;
    /** 需要优化的文件扩展名列表 */
    includeExtensions?: string[];
    /** 需要排除的路径前缀列表 */
    excludePaths?: string[];
    /** 最小优化阈值（字节），小于此大小的文件将被跳过 */
    threshold?: number;
    /** 是否保留原始文件（格式转换时有效，仅压缩时原文件始终被覆盖） */
    keepOriginal?: boolean;
    /** 压缩报告输出路径，设为 false 则不生成报告 */
    reportOutput?: string | false;
    /** 并发优化的最大文件数 */
    parallelLimit?: number;
    /** 单个图片最大像素数，超过此值的图片将被缩放（0 表示不限制） */
    maxPixels?: number;
}

/**
 * 创建图片优化插件
 *
 * @function imageOptimizer
 * @param {Partial<ImageOptimizerOptions>} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 在 Vite 构建完成后自动优化输出目录中的图片文件，
 * 支持多格式压缩、格式转换、并发处理、压缩报告生成等功能。
 * 使用 sharp 处理位图格式，svgo 处理 SVG 格式。
 *
 * @example
 * ```typescript
 * // 基本使用：仅压缩
 * imageOptimizer({
 *   quality: { jpeg: 80, png: 6, webp: 75 },
 *   reportOutput: 'image-optimize-report.json'
 * })
 *
 * // 格式转换：PNG/JPEG → WebP
 * imageOptimizer({
 *   convertToWebp: { png: true, jpeg: true },
 *   keepOriginal: true,
 *   quality: { webp: 75 }
 * })
 *
 * // 自定义转换映射
 * imageOptimizer({
 *   convertMapping: { png: 'avif', jpeg: 'webp' },
 *   quality: { avif: 50, webp: 75 }
 * })
 *
 * // SVG 优化
 * imageOptimizer({
 *   svgo: {
 *     plugins: [
 *       { name: 'removeViewBox', active: false },
 *       { name: 'removeEmptyContainers', active: true }
 *     ],
 *     multipass: true
 *   }
 * })
 * ```
 */
declare const imageOptimizer: PluginFactory<ImageOptimizerOptions, ImageOptimizerOptions>;

export { imageOptimizer };
export type { ConvertMapping, FormatQualityOptions, ImageFormat, ImageOptimizeStats, ImageOptimizeSummary, ImageOptimizerOptions, SvgoOptions, SvgoPlugin };
