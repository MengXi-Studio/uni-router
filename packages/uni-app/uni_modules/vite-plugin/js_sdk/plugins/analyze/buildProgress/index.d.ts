import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 进度条显示格式类型
 *
 * @description
 * - 'bar': 完整进度条模式，显示旋转动画 + 阶段标签 + 进度条 + 百分比 + 模块名
 * - 'spinner': 旋转动画模式，显示旋转动画 + 阶段标签 + 百分比
 * - 'minimal': 精简模式，仅显示阶段标签 + 百分比
 */
type ProgressFormat = 'bar' | 'spinner' | 'minimal';
/**
 * 构建进度插件的配置选项接口
 *
 * @interface BuildProgressOptions
 */
interface BuildProgressOptions extends BasePluginOptions {
    /**
     * 进度条宽度（字符数）
     *
     * @default 30
     */
    width?: number;
    /**
     * 进度条显示格式
     *
     * @default 'bar'
     */
    format?: ProgressFormat;
    /**
     * 已完成部分的填充字符
     *
     * @default '█'
     * @example '█'、'■'、'='
     */
    completeChar?: string;
    /**
     * 未完成部分的填充字符
     *
     * @default '░'
     * @example '░'、'□'、'-'
     */
    incompleteChar?: string;
    /**
     * 构建完成后是否清除进度条
     *
     * @default true
     * @description 设为 false 时，构建完成后保留 100% 进度条在终端中
     */
    clearOnComplete?: boolean;
    /**
     * 是否显示当前正在处理的模块名称
     *
     * @default true
     * @description 仅在 transform 阶段显示，模块名超长时自动截断
     */
    showModuleName?: boolean;
    /**
     * 自定义颜色主题
     *
     * @remarks
     * 每个属性是一个接受字符串并返回带 ANSI 颜色码字符串的函数。
     * 未提供的属性将使用默认主题。
     */
    theme?: ProgressTheme;
}
/**
 * 进度条颜色主题接口
 *
 * @interface ProgressTheme
 * @description 定义进度条各部分的颜色渲染函数，每个函数接受文本并返回带 ANSI 颜色码的字符串
 */
interface ProgressTheme {
    /**
     * 已完成部分的颜色渲染函数
     *
     * @param text - 需要着色的文本
     * @returns 带 ANSI 颜色码的字符串
     */
    completeColor: (text: string) => string;
    /**
     * 未完成部分的颜色渲染函数
     *
     * @param text - 需要着色的文本
     * @returns 带 ANSI 颜色码的字符串
     */
    incompleteColor: (text: string) => string;
    /**
     * 百分比数字的颜色渲染函数
     *
     * @param text - 需要着色的文本
     * @returns 带 ANSI 颜色码的字符串
     */
    percentageColor: (text: string) => string;
    /**
     * 阶段标签的颜色渲染函数
     *
     * @param text - 需要着色的文本
     * @returns 带 ANSI 颜色码的字符串
     */
    phaseColor: (text: string) => string;
    /**
     * 模块名称的颜色渲染函数
     *
     * @param text - 需要着色的文本
     * @returns 带 ANSI 颜色码的字符串
     */
    moduleColor: (text: string) => string;
}
/**
 * 构建阶段类型
 *
 * @description
 * - 'idle': 空闲状态，插件尚未开始工作
 * - 'config': 读取配置阶段
 * - 'resolve': 解析模块依赖阶段
 * - 'transform': 转换模块阶段
 * - 'bundle': 打包阶段（仅生产构建）
 * - 'write': 写入文件阶段
 * - 'done': 构建完成
 */
type BuildPhase = 'idle' | 'config' | 'resolve' | 'transform' | 'bundle' | 'write' | 'done';

/**
 * 构建进度条插件
 *
 * @param {BuildProgressOptions} options - 插件配置选项
 * @returns {Plugin} 一个 Vite 插件实例
 *
 * @example
 * ```typescript
 * // 基本使用 - 默认进度条格式
 * buildProgress()
 *
 * // 旋转动画格式
 * buildProgress({
 *   format: 'spinner'
 * })
 *
 * // 精简格式
 * buildProgress({
 *   format: 'minimal'
 * })
 *
 * // 自定义进度条外观
 * buildProgress({
 *   width: 40,
 *   completeChar: '■',
 *   incompleteChar: '□',
 *   clearOnComplete: false
 * })
 *
 * // 自定义颜色主题
 * buildProgress({
 *   theme: {
 *     completeColor: (t) => `\x1b[32m${t}\x1b[39m`,
 *     incompleteColor: (t) => `\x1b[90m${t}\x1b[39m`,
 *     percentageColor: (t) => `\x1b[1m${t}\x1b[22m`,
 *     phaseColor: (t) => `\x1b[36m${t}\x1b[39m`,
 *     moduleColor: (t) => `\x1b[90m${t}\x1b[39m`
 *   }
 * })
 *
 * // 禁用模块名显示
 * buildProgress({
 *   showModuleName: false
 * })
 * ```
 *
 * @remarks
 * 该插件在 Vite 构建过程中实时显示终端进度条，支持三种显示格式：
 * - bar: 完整进度条（默认），包含旋转动画、阶段标签、进度条和百分比
 * - spinner: 旋转动画模式，仅显示动画、阶段标签和百分比
 * - minimal: 精简模式，仅显示阶段标签和百分比
 *
 * 进度计算基于 Vite 构建生命周期：
 * 1. config 阶段（5%）→ resolve 阶段（10%）→ transform 阶段（15%-85%）→ bundle 阶段（+10%）→ write 阶段（+5%）→ 完成（100%）
 *
 * 在非 TTY 终端环境下（如 CI/CD），自动降级为日志输出模式。
 */
declare const buildProgress: PluginFactory<BuildProgressOptions, BuildProgressOptions>;

export { buildProgress };
export type { BuildPhase, BuildProgressOptions, ProgressFormat, ProgressTheme };
