import { BasePluginOptions, PluginFactory } from '../../../factory/index.cjs';
import { a as InjectPosition, b as SelectorMatch, I as InjectCondition, S as SecurityConfig } from '../../../shared/vite-plugin.BI9taN75.cjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.cjs';
import '../../../shared/vite-plugin.DRRlWY8P.cjs';

/**
 * HTML 注入规则接口
 *
 * @interface InjectRule
 * @description 定义单条 HTML 内容注入规则，包含注入内容、位置、条件和安全配置。
 *
 * @example
 * ```typescript
 * {
 *   id: 'meta-viewport',
 *   content: '<meta name="viewport" content="width=device-width">',
 *   position: 'head-end',
 *   priority: 10
 * }
 * ```
 */
interface InjectRule {
    /** 规则唯一标识，用于日志输出和调试追踪 */
    id?: string;
    /** 要注入的 HTML 内容字符串，支持模板变量占位符 `{{varName}}` */
    content: string;
    /** 注入位置，如 'head-start'、'head-end'、'body-start'、'body-end' 等 */
    position: InjectPosition;
    /** CSS 选择器，仅在 position 为 'before-selector' 或 'after-selector' 时需要 */
    selector?: string;
    /** 选择器匹配模式，仅在指定 selector 时有效 */
    selectorMatch?: SelectorMatch;
    /** 规则优先级，数值越大越先执行 */
    priority?: number;
    /** 条件注入配置，满足条件时才执行注入 */
    condition?: InjectCondition;
    /** 规则级别的模板变量，会与全局 templateVars 合并 */
    templateVars?: Record<string, string>;
    /** 是否允许注入 `<script>` 标签，默认为 false 以防止 XSS 攻击 */
    allowScriptInjection?: boolean;
}
/**
 * 注入日志条目接口
 *
 * @interface InjectionLogEntry
 * @description 记录单条注入规则的执行结果，用于调试和统计。
 */
interface InjectionLogEntry {
    /** 规则标识 */
    ruleId: string;
    /** 注入位置 */
    position: InjectPosition;
    /** 使用的 CSS 选择器（如果有） */
    selector?: string;
    /** 是否注入成功 */
    injected: boolean;
    /** 注入失败原因（如果失败） */
    reason?: string;
    /** 日志记录时间戳（毫秒） */
    timestamp: number;
}
/**
 * HTML 内容注入插件的配置选项接口
 *
 * @interface HtmlInjectOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * htmlInject({
 *   targetFile: 'index.html',
 *   rules: [
 *     { content: '<meta name="description" content="My App">', position: 'head-end' }
 *   ],
 *   security: { blockDangerousTags: true },
 *   templateVars: { appName: 'My App' },
 *   logInjection: true
 * })
 * ```
 */
interface HtmlInjectOptions extends BasePluginOptions {
    /** 目标 HTML 文件路径或文件名，默认为 'index.html' */
    targetFile?: string;
    /** 注入规则数组，至少包含一条规则 */
    rules: InjectRule[];
    /** 安全过滤配置，控制危险标签和属性的过滤行为 */
    security?: SecurityConfig;
    /** 全局模板变量映射，用于替换内容中的 `{{varName}}` 占位符 */
    templateVars?: Record<string, string>;
    /** 是否在控制台输出注入结果日志 */
    logInjection?: boolean;
}

/**
 * HTML 内容注入插件工厂函数
 *
 * @description 创建 htmlInject Vite 插件实例，用于在构建过程中将自定义 HTML 内容注入到目标 HTML 文件中
 *
 * @param {HtmlInjectOptions} options - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @example
 * ```ts
 * import { htmlInject } from '@mengxi-studio/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     htmlInject({
 *       rules: [
 *         {
 *           id: 'meta-description',
 *           content: '<meta name="description" content="{{appName}}">',
 *           position: 'head-end',
 *           templateVars: { appName: 'My Application' }
 *         },
 *         {
 *           id: 'analytics',
 *           content: '<script src="/analytics.js"></script>',
 *           position: 'body-end',
 *           condition: { type: 'env', value: 'PRODUCTION' },
 *           allowScriptInjection: true
 *         }
 *       ]
 *     })
 *   ]
 * })
 * ```
 */
declare const htmlInject: PluginFactory<HtmlInjectOptions, HtmlInjectOptions>;

export { htmlInject };
export type { HtmlInjectOptions, InjectRule, InjectionLogEntry };
