/**
 * HTML 单点注入结果
 *
 * @description 表示在 HTML 中进行单点注入操作后的结果，
 * 包含注入后的 HTML 内容和是否成功注入的标志。
 */
interface HtmlInjectResult {
    /** 注入后的 HTML 内容 */
    html: string;
    /** 是否成功注入 */
    injected: boolean;
}
/**
 * HTML 双区域注入结果
 *
 * @description 表示在 HTML 的 head 和 body 两个区域同时注入后的结果，
 * 包含各区域的注入状态和是否使用了回退策略。
 */
interface DualInjectResult {
    /** 注入后的 HTML 内容 */
    html: string;
    /** 是否成功注入到 head 区域 */
    headInjected: boolean;
    /** 是否成功注入到 body 区域 */
    bodyInjected: boolean;
    /** body 注入是否使用了回退策略（追加到末尾） */
    usedFallback: boolean;
}
/**
 * HTML 注入位置类型
 *
 * @description 定义内容在 HTML 中可注入的所有位置：
 * - `head-start`：`<head>` 标签开始后
 * - `head-end`：`</head>` 标签前
 * - `body-start`：`<body>` 标签开始后
 * - `body-end`：`</body>` 标签前
 * - `before-selector`：选择器匹配位置前
 * - `after-selector`：选择器匹配位置后
 * - `replace-selector`：替换选择器匹配的内容
 */
type InjectPosition = 'head-start' | 'head-end' | 'body-start' | 'body-end' | 'before-selector' | 'after-selector' | 'replace-selector';
/**
 * 选择器匹配模式
 *
 * @description 定义 HTML 选择器的匹配方式：
 * - `string`：使用字符串精确匹配（默认）
 * - `regex`：使用正则表达式匹配
 */
type SelectorMatch = 'string' | 'regex';
/**
 * 条件判断类型
 *
 * @description 定义注入条件的类型：
 * - `env`：基于环境变量是否存在且为真值
 * - `file-contains`：基于 HTML 内容是否包含指定字符串
 * - `custom`：基于自定义函数的返回值
 */
type ConditionType = 'env' | 'file-contains' | 'custom';
/**
 * 注入条件配置
 *
 * @description 定义 HTML 内容注入的条件判断规则，
 * 支持环境变量检测、内容包含检测和自定义函数判断，
 * 可通过 `negate` 字段取反结果。
 *
 * @example
 * ```typescript
 * // 当环境变量 ENABLE_ANALYTICS 存在时注入
 * { type: 'env', value: 'ENABLE_ANALYTICS' }
 *
 * // 当 HTML 不包含特定元素时注入（取反）
 * { type: 'file-contains', value: '<div id="app">', negate: true }
 *
 * // 使用自定义函数判断
 * { type: 'custom', value: () => process.env.NODE_ENV === 'production' }
 * ```
 */
interface InjectCondition {
    /** 条件类型 */
    type: ConditionType;
    /**
     * 条件值：
     * - `env` 类型：环境变量名
     * - `file-contains` 类型：要搜索的字符串
     * - `custom` 类型：返回布尔值的自定义函数
     */
    value: string | ((...args: any[]) => boolean);
    /** 是否取反条件结果，默认为 `false` */
    negate?: boolean;
}
/**
 * HTML 安全配置
 *
 * @description 控制 HTML 内容注入时的安全过滤策略，
 * 可配置是否阻止危险标签和属性，以及自定义允许/阻止列表。
 *
 * @example
 * ```typescript
 * // 完全禁用安全过滤（不推荐）
 * const config: SecurityConfig = { blockDangerousTags: false, blockDangerousAttributes: false }
 *
 * // 允许特定标签
 * const config: SecurityConfig = { allowedTags: ['iframe'] }
 *
 * // 自定义阻止属性列表
 * const config: SecurityConfig = { blockedAttributes: ['onclick', 'onerror'] }
 * ```
 */
interface SecurityConfig {
    /** 是否阻止危险 HTML 标签（如 script、iframe），默认为 `true` */
    blockDangerousTags?: boolean;
    /** 是否阻止危险 HTML 属性（如 onclick、onerror），默认为 `true` */
    blockDangerousAttributes?: boolean;
    /** 允许的标签列表，设置后将从默认阻止列表中排除这些标签 */
    allowedTags?: string[];
    /** 自定义阻止的标签列表，覆盖默认阻止列表 */
    blockedTags?: string[];
    /** 自定义阻止的属性列表，覆盖默认阻止属性列表 */
    blockedAttributes?: string[];
}

export type { ConditionType as C, DualInjectResult as D, HtmlInjectResult as H, InjectCondition as I, SecurityConfig as S, InjectPosition as a, SelectorMatch as b };
