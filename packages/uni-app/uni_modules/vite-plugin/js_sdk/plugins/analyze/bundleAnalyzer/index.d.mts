import { BasePluginOptions, PluginFactory } from '../../../factory/index.mjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.mjs';
import '../../../shared/vite-plugin.DRRlWY8P.mjs';

/**
 * 输出报告格式类型
 *
 * @typedef {('json' | 'html' | 'both')} BundleOutputFormat
 * @description 支持的报告输出格式：
 * - `json`: 生成 JSON 格式的分析报告
 * - `html`: 生成包含可视化图表的 HTML 报告
 * - `both`: 同时生成 JSON 和 HTML 报告
 */
type BundleOutputFormat = 'json' | 'html' | 'both';
/**
 * 单个模块的统计信息
 *
 * @interface ModuleStats
 * @description 记录构建产物中单个模块的详细统计数据
 */
interface ModuleStats {
    /** 模块标识符（通常是模块路径或 ID） */
    id: string;
    /** 模块原始大小（字节） */
    size: number;
    /** 模块 gzip 压缩后大小（字节），仅在 gzipSize 开启时可用 */
    gzipSize: number;
    /** 所属 chunk 名称列表 */
    chunks: string[];
    /** 该模块的依赖模块 ID 列表 */
    imports: string[];
    /** 是否为入口模块 */
    isEntry: boolean;
    /** 是否来自 node_modules */
    isNodeModule: boolean;
}
/**
 * 单个 chunk 的统计信息
 *
 * @interface ChunkStats
 * @description 记录构建产物中单个 chunk 的详细统计数据
 */
interface ChunkStats {
    /** chunk 名称 */
    name: string;
    /** chunk 原始大小（字节） */
    size: number;
    /** chunk gzip 压缩后大小（字节），仅在 gzipSize 开启时可用 */
    gzipSize: number;
    /** chunk 包含的模块列表 */
    modules: ModuleStats[];
    /** chunk 类型标识（如 'entry'、'chunk'、'asset'） */
    type: 'entry' | 'chunk' | 'asset';
    /** chunk 包含的文件数量 */
    fileCount: number;
}
/**
 * 文件类型分布统计项
 *
 * @interface FileTypeDistribution
 * @description 按文件扩展名分类的体积分布统计
 */
interface FileTypeDistribution {
    /** 文件扩展名（如 '.js', '.css'） */
    extension: string;
    /** 该类型的文件数量 */
    count: number;
    /** 该类型的总大小（字节） */
    totalSize: number;
    /** 该类型的总体积占比（0-100） */
    percentage: number;
}
/**
 * 体积阈值告警信息
 *
 * @interface SizeWarning
 * @description 当模块或 chunk 超过配置的体积阈值时生成的告警
 */
interface SizeWarning {
    /** 告警类型：模块级别或 chunk 级别 */
    level: 'module' | 'chunk';
    /** 告警目标名称 */
    name: string;
    /** 实际大小（KB） */
    sizeKB: number;
    /** 阈值大小（KB） */
    thresholdKB: number;
    /** 告警消息 */
    message: string;
}
/**
 * 构建对比差异项
 *
 * @interface ComparisonDiff
 * @description 两次构建之间同一模块/chunk 的体积变化
 */
interface ComparisonDiff {
    /** 模块或 chunk 名称 */
    name: string;
    /** 上次构建大小（字节），不存在则为 -1 */
    previousSize: number;
    /** 本次构建大小（字节） */
    currentSize: number;
    /** 体积变化量（字节），正数表示增大 */
    diff: number;
    /** 变化百分比 */
    diffPercentage: number;
    /** 变化趋势：增大、减小、不变、新增、移除 */
    trend: 'increased' | 'decreased' | 'unchanged' | 'added' | 'removed';
}
/**
 * 构建产物分析结果
 *
 * @interface BundleAnalysisResult
 * @description 包含完整的构建产物分析数据，用于报告生成和日志输出
 */
interface BundleAnalysisResult {
    /** 分析时间戳（ISO 格式） */
    timestamp: string;
    /** 构建产物总大小（字节） */
    totalSize: number;
    /** 构建产物 gzip 总大小（字节） */
    totalGzipSize: number;
    /** chunk 统计列表 */
    chunks: ChunkStats[];
    /** Top N 大模块排行 */
    topModules: ModuleStats[];
    /** 文件类型分布统计 */
    fileTypeDistribution: FileTypeDistribution[];
    /** 体积阈值告警列表 */
    warnings: SizeWarning[];
    /** 构建对比差异列表（仅在配置 compareWith 时可用） */
    comparisonDiffs: ComparisonDiff[];
    /** 分析耗时（毫秒） */
    analysisTime: number;
}
/**
 * 构建产物分析插件的配置选项
 *
 * @interface BundleAnalyzerOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * bundleAnalyzer({
 *   outputFormat: 'both',
 *   outputFile: 'bundle-analysis',
 *   openAnalyzer: true,
 *   sizeThreshold: 200,
 *   topModules: 30,
 *   gzipSize: true,
 *   compareWith: 'bundle-analysis-prev.json'
 * })
 * ```
 */
interface BundleAnalyzerOptions extends BasePluginOptions {
    /** 报告输出格式：json、html 或同时输出两者 */
    outputFormat?: BundleOutputFormat;
    /** 报告输出文件名（不含扩展名），默认 'bundle-analysis' */
    outputFile?: string;
    /** 是否在生成 HTML 报告后自动打开浏览器 */
    openAnalyzer?: boolean;
    /** 体积告警阈值（KB），超过此大小的 chunk 将产生告警 */
    sizeThreshold?: number;
    /** Top N 大模块排行数量 */
    topModules?: number;
    /** 用于对比的之前分析报告路径，设为 null 则不进行对比 */
    compareWith?: string | null;
    /** 是否计算 gzip 大小 */
    gzipSize?: boolean;
    /** 是否在分析中排除 node_modules 中的模块 */
    excludeNodeModules?: boolean;
    /** 需要排除的文件路径模式列表（支持 glob 模式） */
    excludePatterns?: string[];
    /** 需要包含的文件扩展名列表，为空则包含所有 */
    includeExtensions?: string[];
    /** HTML 报告中图表的默认展示形式 */
    defaultChartType?: 'treemap' | 'sunburst' | 'list';
}

/**
 * 创建构建产物分析插件
 *
 * @function bundleAnalyzer
 * @param {Partial<BundleAnalyzerOptions>} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 在 Vite 构建完成后自动分析输出目录中的构建产物，
 * 生成体积统计、模块排行、文件类型分布等关键指标，
 * 支持 JSON 报告和 HTML 可视化图表，支持体积阈值告警和构建对比。
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { bundleAnalyzer } from '@meng-xi/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     bundleAnalyzer({
 *       outputFormat: 'both',
 *       sizeThreshold: 200,
 *       topModules: 30,
 *       gzipSize: true,
 *       compareWith: 'bundle-analysis-prev.json',
 *       defaultChartType: 'treemap'
 *     })
 *   ]
 * })
 * ```
 */
declare const bundleAnalyzer: PluginFactory<BundleAnalyzerOptions, BundleAnalyzerOptions>;

export { bundleAnalyzer };
export type { BundleAnalysisResult, BundleAnalyzerOptions, BundleOutputFormat, ChunkStats, ComparisonDiff, FileTypeDistribution, ModuleStats, SizeWarning };
