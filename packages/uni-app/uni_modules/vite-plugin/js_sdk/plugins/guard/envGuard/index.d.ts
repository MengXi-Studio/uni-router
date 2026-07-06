import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 环境变量值类型
 *
 * @description 定义环境变量支持的所有值类型：
 * - `string`：普通字符串（默认类型）
 * - `number`：数字类型
 * - `url`：URL 地址
 * - `boolean`：布尔值
 * - `enum`：枚举值
 * - `json`：JSON 字符串
 * - `semver`：语义化版本号
 * - `path`：文件路径
 */
type EnvType = 'string' | 'number' | 'url' | 'boolean' | 'enum' | 'json' | 'semver' | 'path';
/**
 * 环境变量字段校验规则
 *
 * @description 定义单个环境变量的校验规则，包括类型约束、范围限制、
 * 自定义验证函数和元数据信息等。
 *
 * @example
 * ```typescript
 * // 基本字符串字段
 * const rule: EnvFieldRule = { type: 'string', required: true }
 *
 * // 带范围的数字字段
 * const portRule: EnvFieldRule = { type: 'number', required: true, minValue: 1, maxValue: 65535 }
 *
 * // 枚举字段
 * const envRule: EnvFieldRule = { type: 'enum', required: true, enumValues: ['development', 'staging', 'production'] }
 *
 * // 自定义验证
 * const customRule: EnvFieldRule = {
 *   type: 'string',
 *   required: true,
 *   validator: (v) => v.startsWith('https://') || '必须使用 HTTPS'
 * }
 * ```
 */
interface EnvFieldRule {
    /** 值类型，默认为 `'string'` */
    type?: EnvType;
    /** 是否为必需字段，默认为 `true` */
    required?: boolean;
    /** 正则表达式，值必须匹配此模式 */
    pattern?: RegExp;
    /**
     * 自定义验证函数
     *
     * @description 返回 `true` 表示验证通过，返回字符串表示验证失败且字符串为错误消息
     */
    validator?: (value: string) => boolean | string;
    /** 自定义错误消息，覆盖默认的错误提示 */
    message?: string;
    /** 当值为空时使用的默认值 */
    default?: string;
    /** 枚举值列表（仅 `enum` 类型需要） */
    enumValues?: string[];
    /** 数值最小值（仅 `number` 类型） */
    minValue?: number;
    /** 数值最大值（仅 `number` 类型） */
    maxValue?: number;
    /** 字符串最小长度（仅字符串类类型） */
    minLength?: number;
    /** 字符串最大长度（仅字符串类类型） */
    maxLength?: number;
    /** 变量分组名称，用于模板生成时的分组显示 */
    group?: string;
    /** 变量描述信息，用于模板生成时的说明文本 */
    description?: string;
    /** 是否为敏感变量，模板中会隐藏实际值 */
    sensitive?: boolean;
}
/**
 * 环境变量验证结果
 *
 * @description 表示单个环境变量的验证结果，包含验证状态、错误消息和有效值。
 */
interface EnvValidationResult {
    /** 环境变量名 */
    key: string;
    /**
     * 验证状态：
     * - `pass`：验证通过
     * - `missing`：必需变量缺失
     * - `type_error`：类型不匹配
     * - `custom_error`：自定义验证失败或正则不匹配
     * - `enum_mismatch`：枚举值不匹配
     * - `range_error`：数值超出范围
     * - `length_error`：字符串长度不符合要求
     */
    status: 'pass' | 'missing' | 'type_error' | 'custom_error' | 'enum_mismatch' | 'range_error' | 'length_error';
    /** 验证消息（验证通过时为空字符串，失败时为错误描述） */
    message: string;
    /** 环境变量的有效值（缺失时可能为 `undefined` 或默认值） */
    value: string | undefined;
    /** 应用的校验规则（含默认值填充后的完整规则） */
    rule: EnvFieldRule;
}

/**
 * 环境变量校验失败时的处理动作
 *
 * @description 定义当环境变量校验未通过时的处理策略：
 * - `error`: 抛出错误，中断构建流程
 * - `warn`: 输出警告日志，继续构建
 * - `ignore`: 静默忽略，不输出任何信息
 */
type EnvFailAction = 'error' | 'warn' | 'ignore';
/**
 * 运行时守卫的行为模式
 *
 * @description 定义注入到 HTML 中的运行时守卫代码在检测到
 * 环境变量缺失或无效时的行为方式：
 * - `console`: 在浏览器控制台输出警告信息
 * - `throw`: 抛出运行时错误，阻止应用启动
 * - `overlay`: 在页面顶部显示警告横幅
 */
type RuntimeGuardMode = 'console' | 'throw' | 'overlay';
/**
 * 环境变量校验结果汇总
 *
 * @interface EnvGuardResult
 * @description 包含所有环境变量的校验统计信息和详细结果列表，
 * 用于报告生成和日志输出。
 */
interface EnvGuardResult {
    /** 校验时间戳（ISO 格式） */
    timestamp: string;
    /** 校验的环境变量总数 */
    total: number;
    /** 校验通过的变量数量 */
    passed: number;
    /** 缺失的必需变量数量 */
    missing: number;
    /** 校验失败的变量数量（类型不匹配、范围越界等） */
    invalid: number;
    /** 所有变量的详细校验结果列表 */
    results: EnvValidationResult[];
    /** 是否所有变量均校验通过 */
    allPassed: boolean;
}
/**
 * 环境变量守卫插件的配置选项
 *
 * @interface EnvGuardOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * envGuard({
 *   required: {
 *     VITE_API_URL: { type: 'url', required: true },
 *     VITE_APP_TITLE: { type: 'string', minLength: 1, maxLength: 50 }
 *   },
 *   failAction: 'error',
 *   generateTemplate: true,
 *   runtimeGuard: true,
 *   runtimeGuardMode: 'console'
 * })
 * ```
 */
interface EnvGuardOptions extends BasePluginOptions {
    /** 环境变量校验规则映射，键为变量名，值为校验规则 */
    required?: Record<string, EnvFieldRule>;
    /** 校验失败时的处理动作 */
    failAction?: EnvFailAction;
    /** 是否自动生成 .env 模板文件 */
    generateTemplate?: boolean;
    /** .env 模板文件的输出路径 */
    templateOutput?: string;
    /** 是否注入运行时环境变量守卫代码到 HTML */
    runtimeGuard?: boolean;
    /** 运行时守卫的全局变量名 */
    runtimeGlobalName?: string;
    /** 运行时守卫的行为模式 */
    runtimeGuardMode?: RuntimeGuardMode;
    /** 需要加载的 .env 文件路径列表 */
    envFiles?: string[];
    /** 是否自动加载 .env 文件中的变量到 process.env */
    autoLoadEnv?: boolean;
    /** 校验报告输出路径，设为 false 则不生成报告 */
    reportOutput?: string | false;
    /** 是否在构建前执行校验 */
    validateBeforeBuild?: boolean;
    /** 是否输出校验摘要日志 */
    showSummary?: boolean;
}

/**
 * 创建环境变量守卫插件
 *
 * @function envGuard
 * @param {Partial<EnvGuardOptions>} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 在 Vite 构建前校验环境变量的存在性和合法性，
 * 支持多种值类型校验、正则匹配、自定义校验函数等，
 * 可选生成 .env 模板文件和注入运行时守卫代码。
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { envGuard } from '@meng-xi/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     envGuard({
 *       required: {
 *         VITE_API_BASE_URL: {
 *           type: 'url',
 *           required: true,
 *           message: 'API 基础地址必须为合法 URL'
 *         },
 *         VITE_APP_TITLE: {
 *           type: 'string',
 *           required: true,
 *           minLength: 1,
 *           maxLength: 50
 *         },
 *         VITE_ENABLE_ANALYTICS: {
 *           type: 'boolean',
 *           required: false,
 *           default: 'false'
 *         },
 *         VITE_API_TIMEOUT: {
 *           type: 'number',
 *           minValue: 1000,
 *           maxValue: 60000,
 *           message: 'API 超时时间必须在 1000-60000ms 之间'
 *         },
 *         VITE_LOG_LEVEL: {
 *           type: 'enum',
 *           enumValues: ['debug', 'info', 'warn', 'error'],
 *           default: 'info'
 *         }
 *       },
 *       failAction: 'error',
 *       generateTemplate: true,
 *       runtimeGuard: true,
 *       runtimeGuardMode: 'console'
 *     })
 *   ]
 * })
 * ```
 */
declare const envGuard: PluginFactory<EnvGuardOptions, EnvGuardOptions>;

export { envGuard };
export type { EnvFailAction, EnvGuardOptions, EnvGuardResult, RuntimeGuardMode };
