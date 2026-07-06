import { BasePluginOptions, PluginFactory } from '../../../factory/index.mjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.mjs';
import '../../../shared/vite-plugin.DRRlWY8P.mjs';

/**
 * 压缩算法类型
 *
 * @typedef {('gzip' | 'brotli' | 'both')} CompressAlgorithm
 * @description 支持的压缩算法：
 * - `gzip`: 使用 gzip 压缩，输出 `.gz` 文件
 * - `brotli`: 使用 brotli 压缩，输出 `.br` 文件
 * - `both`: 同时生成 gzip 和 brotli 两种压缩文件
 */
type CompressAlgorithm = 'gzip' | 'brotli' | 'both';
/**
 * 单个文件的压缩统计信息
 *
 * @interface CompressStats
 * @description 记录单个文件经过压缩后的详细统计数据
 */
interface CompressStats {
    /** 原始文件路径 */
    file: string;
    /** 原始文件大小（字节） */
    originalSize: number;
    /** 压缩后文件大小（字节） */
    compressedSize: number;
    /** 压缩率百分比（0-100），如 75.3 表示压缩后体积减少 75.3% */
    ratio: number;
    /** 使用的压缩算法 */
    algorithm: 'gzip' | 'brotli';
}
/**
 * 压缩操作的汇总统计信息
 *
 * @interface CompressSummary
 * @description 包含整个压缩操作的总体统计数据，用于报告生成和日志输出
 */
interface CompressSummary {
    /** 压缩的文件总数 */
    totalFiles: number;
    /** 所有文件的原始大小总和（字节） */
    totalOriginalSize: number;
    /** 所有文件的压缩后大小总和（字节） */
    totalCompressedSize: number;
    /** 总体压缩率百分比 */
    totalRatio: number;
    /** 使用 gzip 压缩的文件数量 */
    gzipFiles: number;
    /** 使用 brotli 压缩的文件数量 */
    brotliFiles: number;
    /** 压缩操作总耗时（毫秒） */
    executionTime: number;
    /** 每个文件的详细压缩统计 */
    stats: CompressStats[];
}
/**
 * 构建产物压缩插件的配置选项
 *
 * @interface CompressAssetsOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * compressAssets({
 *   algorithm: 'both',
 *   threshold: 2048,
 *   compressionLevel: 9,
 *   brotliQuality: 11,
 *   reportOutput: 'compress-report.json'
 * })
 * ```
 */
interface CompressAssetsOptions extends BasePluginOptions {
    /** 压缩算法，支持 gzip、brotli 或同时使用两者 */
    algorithm?: CompressAlgorithm;
    /** 最小压缩阈值（字节），小于此大小的文件将被跳过 */
    threshold?: number;
    /** 是否在压缩后删除原始文件，仅保留压缩版本 */
    deleteOriginalFile?: boolean;
    /** 需要压缩的文件扩展名列表，如 ['.js', '.css', '.html'] */
    includeExtensions?: string[];
    /** 需要排除的文件扩展名列表，优先级高于 includeExtensions */
    excludeExtensions?: string[];
    /** 需要排除的路径前缀列表，匹配到的路径下的文件将跳过压缩 */
    excludePaths?: string[];
    /** gzip 压缩级别，范围 1-9，1 最快压缩率最低，9 最慢压缩率最高 */
    compressionLevel?: number;
    /** brotli 崩质量参数，范围 1-11，1 最快质量最低，11 最慢质量最高 */
    brotliQuality?: number;
    /** 压缩报告输出路径，设为 false 则不生成报告 */
    reportOutput?: string | false;
    /** 并发压缩的最大文件数，控制同时进行压缩操作的文件数量 */
    parallelLimit?: number;
}

/**
 * 创建构建产物压缩插件
 *
 * @function compressAssets
 * @param {Partial<CompressAssetsOptions>} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 在 Vite 构建完成后自动压缩输出目录中的文件，
 * 支持 gzip 和 brotli 两种压缩算法，可配置压缩级别、文件过滤规则、
 * 并发数量等参数，并生成压缩统计报告。
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { compressAssets } from '@meng-xi/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     compressAssets({
 *       algorithm: 'both',
 *       threshold: 2048,
 *       deleteOriginalFile: false,
 *       compressionLevel: 9,
 *       brotliQuality: 11,
 *       reportOutput: 'compress-report.json',
 *       parallelLimit: 10
 *     })
 *   ]
 * })
 * ```
 */
declare const compressAssets: PluginFactory<CompressAssetsOptions, CompressAssetsOptions>;

export { compressAssets };
export type { CompressAlgorithm, CompressAssetsOptions, CompressStats, CompressSummary };
