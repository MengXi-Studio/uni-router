import { BasePluginOptions, PluginFactory } from '../../../factory/index.mjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.mjs';
import '../../../shared/vite-plugin.DRRlWY8P.mjs';

/** 路由元信息（支持索引签名扩展自定义字段） */
interface RouteMeta {
    /** 页面标题，对应 pages.json 中的 navigationBarTitleText */
    title?: string;
    /** 是否为 TabBar 页面，由插件自动从 tabBar 配置推断 */
    isTab?: boolean;
    /** 是否需要登录才能访问 */
    requireAuth?: boolean;
    [key: string]: any;
}
/** 路由配置项 */
interface RouteConfig {
    /** 路由路径，以 `/` 开头 */
    path: string;
    /** 路由名称，根据 nameStrategy 自动生成 */
    name?: string;
    /** 路由元信息 */
    meta?: RouteMeta;
    /** 用户自定义扩展属性（如 beforeEnter、component 等） */
    [key: string]: any;
}
/** uni-app pages.json 中的页面配置项 */
interface UniAppPageConfig {
    /** 页面路径，相对于 pages.json 所在目录 */
    path: string;
    /** 页面名称，优先级高于 nameStrategy */
    name?: string;
    /** 页面元信息，优先级高于 metaMapping 映射 */
    meta?: Record<string, any>;
    /** 页面样式配置 */
    style?: {
        navigationBarTitleText?: string;
        requireAuth?: boolean;
        [key: string]: any;
    };
    [key: string]: any;
}
/** uni-app pages.json 中的 tabBar 配置 */
interface UniAppTabBarConfig {
    /** tabBar 页面列表 */
    list?: Array<{
        pagePath: string;
        text?: string;
        iconPath?: string;
        selectedIconPath?: string;
    }>;
    [key: string]: any;
}
/** uni-app pages.json 结构 */
interface UniAppPagesJson {
    /** 主包页面列表 */
    pages: UniAppPageConfig[];
    /** 子包（分包）配置列表 */
    subPackages?: Array<{
        root: string;
        pages: UniAppPageConfig[];
    }>;
    /** tabBar 配置 */
    tabBar?: UniAppTabBarConfig;
    /** 全局样式配置 */
    globalStyle?: Record<string, any>;
    [key: string]: any;
}
/** 输出文件格式（'ts' 或 'js'） */
type OutputFormat = 'ts' | 'js';
/** 路由名称生成策略（path/camelCase/pascalCase/custom） */
type NameStrategy = 'path' | 'camelCase' | 'pascalCase' | 'custom';
/** 生成路由配置插件选项 */
interface GenerateRouterOptions extends BasePluginOptions {
    /** pages.json 文件路径（相对于项目根目录） @default 'src/pages.json' */
    pagesJsonPath?: string;
    /** 输出文件路径（相对于项目根目录） @default 'src/router.config.ts' */
    outputPath?: string;
    /** 输出文件格式 @default 'ts' */
    outputFormat?: OutputFormat;
    /** 路由名称生成策略 @default 'camelCase' */
    nameStrategy?: NameStrategy;
    /** 自定义路由名称生成函数（nameStrategy 为 'custom' 时必须提供） */
    customNameGenerator?: (path: string) => string;
    /** 是否包含子包路由 @default true */
    includeSubPackages?: boolean;
    /** 是否监听 pages.json 变化并自动重新生成 @default true */
    watch?: boolean;
    /**
     * 额外的元信息字段映射（将 pages.json 中 style 的字段映射到 meta 中）
     *
     * @example { navigationBarTitleText: 'title', requireAuth: 'requireAuth' }
     */
    metaMapping?: Record<string, string>;
    /** 是否导出类型定义 @default true */
    exportTypes?: boolean;
    /** 是否保留用户对 routes 配置的修改 @default true */
    preserveRouteChanges?: boolean;
    /**
     * TypeScript 类型声明文件输出路径
     *
     * - `string`：在指定路径生成
     * - `true`：使用默认路径 `src/router.d.ts`
     * - `false`：不生成
     *
     * 生成的声明文件会扩展 `@meng-xi/uni-router` 的 `RouteNameMap` 接口，
     * 提供路由名称到路径和元信息的类型映射。
     *
     * @default false
     */
    dts?: string | boolean;
    /**
     * 文件头部注释模板
     *
     * 在生成的路由配置文件顶部添加 JSDoc 风格的注释头：
     * - `false` / 不传 / `''`：不生成注释头
     * - `true`：使用默认模板 `{name} {date} {version}`
     * - `string`：自定义模板，支持占位符
     *
     * 占位符与对应 JSDoc 标签：
     * - `{name}` → `@plugin`
     * - `{date}` / `{date:格式}` → `@date`（格式符与 `formatDate` 一致）
     * - `{version}` → `@version`
     * - `{custom:键名}` → `@键名`（值从 `customFields` 读取）
     *
     * 每个占位符独立成行，占位符之间的非占位符文本被丢弃。
     * 若模板不含占位符，则按纯文本原样输出。
     *
     * @default false
     *
     * @example
     * ```typescript
     * generateRouter({ headerTemplate: true })
     * // 输出：@plugin generate-router / @date 2026-06-19 14:30:00 / @version 0.2.7
     *
     * generateRouter({
     *   headerTemplate: '{name} {custom:author} {version}',
     *   customFields: { author: 'MengXi Studio' }
     * })
     * // 输出：@plugin generate-router / @author MengXi Studio / @version 0.2.7
     * ```
     */
    headerTemplate?: boolean | string;
    /**
     * 自定义字段键值对（供 `{custom:键名}` 占位符引用，键名同时作为 JSDoc 标签名）
     *
     * 若模板引用了 `{custom:KEY}` 但未提供该键，则原样保留占位符文本。
     *
     * @default {}
     */
    customFields?: Record<string, string>;
}

/**
 * 生成路由配置插件
 *
 * 读取 uni-app 项目的 pages.json，自动生成路由配置文件。支持子包、tabBar 推断、
 * 多种命名策略、自定义元信息映射、开发模式监听 pages.json 变化。
 *
 * @example
 * ```typescript
 * generateRouter()
 * generateRouter({ nameStrategy: 'pascalCase', dts: true })
 * ```
 */
declare const generateRouter: PluginFactory<GenerateRouterOptions, GenerateRouterOptions>;

export { generateRouter };
export type { GenerateRouterOptions, NameStrategy, OutputFormat, RouteConfig, RouteMeta, UniAppPageConfig, UniAppPagesJson, UniAppTabBarConfig };
