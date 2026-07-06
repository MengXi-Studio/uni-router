import { BasePluginOptions, PluginFactory } from '../../../factory/index.mjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.mjs';
import '../../../shared/vite-plugin.DRRlWY8P.mjs';

/**
 * 图标配置选项接口
 *
 * @interface IconOptions
 * @description faviconManager 插件内部使用的图标配置选项，
 * 用于生成 HtmlTagDescriptor 或自定义 link 标签。
 */
interface IconOptions {
    /**
     * 图标文件的基础路径，默认为根路径 `/`
     */
    base?: string;
    /**
     * 图标的完整 URL，如果提供则优先使用（覆盖 base + favicon.ico）
     *
     * @example 'https://example.com/favicon.ico'
     */
    url?: string;
    /**
     * 自定义的完整 link 标签 HTML，如果提供则优先使用（覆盖 url 和 base）
     *
     * @example '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
     */
    link?: string;
    /**
     * 自定义图标数组，支持多种图标格式和尺寸
     *
     * @example
     * ```typescript
     * [
     *   { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
     *   { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' }
     * ]
     * ```
     */
    icons?: Icon[];
}
/**
 * 图标配置项接口
 *
 * @interface Icon
 * @description 定义单个网站图标的属性，对应 HTML `<link>` 标签的各个属性。
 */
interface Icon {
    /**
     * 图标关系类型，对应 `<link>` 标签的 `rel` 属性
     *
     * @example 'icon'
     * @example 'apple-touch-icon'
     * @example 'manifest'
     */
    rel: string;
    /**
     * 图标 URL，对应 `<link>` 标签的 `href` 属性
     *
     * @example '/favicon.ico'
     * @example '/apple-touch-icon.png'
     */
    href: string;
    /**
     * 图标尺寸，对应 `<link>` 标签的 `sizes` 属性
     *
     * @example '32x32'
     * @example '180x180'
     */
    sizes?: string;
    /**
     * 图标 MIME 类型，对应 `<link>` 标签的 `type` 属性
     *
     * @example 'image/png'
     * @example 'image/svg+xml'
     */
    type?: string;
}
/**
 * 图标文件复制配置选项接口
 *
 * @interface CopyOptions
 * @description 配置图标文件从源目录到构建输出目录的复制行为，
 * 仅当此对象存在时才开启图标文件复制功能。
 */
interface CopyOptions {
    /**
     * 图标源文件目录，用于复制图标到打包目录
     *
     * @example 'src/assets/icons'
     */
    sourceDir: string;
    /**
     * 图标目标目录（打包目录），用于复制图标到打包目录
     *
     * @example 'dist/assets/icons'
     */
    targetDir: string;
    /**
     * 是否覆盖同名文件
     *
     * @default true
     */
    overwrite?: boolean;
    /**
     * 是否支持递归复制子目录
     *
     * @default true
     */
    recursive?: boolean;
}
/**
 * 网站图标管理插件的配置选项接口
 *
 * @interface FaviconManagerOptions
 * @extends {BasePluginOptions}
 *
 * @description 支持三种图标配置方式（优先级从高到低）：
 * 1. `link` - 自定义完整的 `<link>` 标签 HTML
 * 2. `url` - 完整的图标 URL
 * 3. `base` + 默认 favicon.ico - 基础路径拼接
 * 此外还支持通过 `icons` 数组配置多个图标，以及通过 `copyOptions` 复制图标文件。
 *
 * @example
 * ```typescript
 * faviconManager({
 *   base: '/assets',
 *   icons: [
 *     { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
 *     { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
 *   ],
 *   copyOptions: {
 *     sourceDir: 'src/assets/icons',
 *     targetDir: 'dist/assets/icons'
 *   }
 * })
 * ```
 */
interface FaviconManagerOptions extends BasePluginOptions {
    /**
     * 图标文件的基础路径，默认为根路径 '/'
     *
     * @default '/'
     * @example '/assets'
     */
    base?: string;
    /**
     * 图标的完整 URL，如果提供则优先使用（覆盖 base + favicon.ico）
     *
     * @example 'https://example.com/favicon.ico'
     */
    url?: string;
    /**
     * 自定义的完整 link 标签 HTML，如果提供则优先使用（覆盖 url 和 base）
     *
     * @example '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
     */
    link?: string;
    /**
     * 自定义图标数组，支持多种图标格式和尺寸
     *
     * @example
     * [
     *   { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
     *   { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
     *   { rel: 'icon', href: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
     * ]
     */
    icons?: Icon[];
    /**
     * 图标文件复制配置选项
     *
     * @remarks
     * 当此对象存在时，才会开启图标文件复制功能
     */
    copyOptions?: CopyOptions;
}

/**
 * 网站图标管理插件
 *
 * @param options - 插件配置选项，可以是字符串形式的 base 路径或完整的配置对象
 * @returns Vite 插件实例
 *
 * @example
 * ```typescript
 * // 基本使用
 * faviconManager() // 使用默认配置
 *
 * // 使用字符串配置 base 路径
 * faviconManager('/assets')
 *
 * // 使用完整配置
 * faviconManager({
 *   base: '/assets',
 *   icons: [
 *     { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
 *     { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
 *   ],
 *   copyOptions: {
 *     sourceDir: 'src/assets/icons',
 *     targetDir: 'dist/assets/icons'
 *   }
 * })
 * ```
 *
 * @remarks
 * 该插件在构建过程中：
 * 1. 将网站图标（favicon）的 link 标签注入到 HTML 文件的 `<head>` 中
 * 2. 如果配置了 copyOptions，将图标文件复制到目标目录
 *
 * 支持自定义图标链接、图标数组配置以及图标文件复制功能。
 */
declare const faviconManager: PluginFactory<FaviconManagerOptions, string | FaviconManagerOptions>;

export { faviconManager };
export type { FaviconManagerOptions, Icon, IconOptions };
