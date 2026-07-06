import { BasePluginOptions, PluginFactory } from '../../../factory/index.mjs';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.mjs';
import '../../../shared/vite-plugin.DRRlWY8P.mjs';

/**
 * 版本来源类型
 *
 * @description
 * - 'define': 从 Vite define 注入的全局变量中读取（如 __APP_VERSION__）
 * - 'file': 从版本文件（如 version.json）中读取
 * - 'auto': 自动检测，优先使用 define，回退到 file
 */
type VersionSource = 'define' | 'file' | 'auto';
/**
 * 更新提示 UI 样式
 *
 * @description
 * - 'modal': 居中弹窗，需用户手动操作
 * - 'banner': 顶部横幅，可自动消失或手动关闭
 * - 'toast': 底部轻提示，自动消失
 */
type PromptStyle = 'modal' | 'banner' | 'toast';
/**
 * 版本更新检查器的配置选项接口
 *
 * @interface VersionUpdateCheckerOptions
 */
interface VersionUpdateCheckerOptions extends BasePluginOptions {
    /**
     * 当前版本号的来源
     *
     * @default 'auto'
     */
    versionSource?: VersionSource;
    /**
     * define 模式下的全局变量名
     *
     * @description 当 versionSource 为 'define' 或 'auto' 时，
     * 从此全局变量读取当前构建版本号
     *
     * @default '__APP_VERSION__'
     */
    defineName?: string;
    /**
     * 版本检查文件的 URL 路径
     *
     * @description 客户端将定期请求此 URL 获取最新版本号，
     * 并与当前版本号对比判断是否有更新
     *
     * @default '/version.json'
     */
    checkUrl?: string;
    /**
     * 版本检查间隔时间（毫秒）
     *
     * @default 300000（5 分钟）
     */
    checkInterval?: number;
    /**
     * 页面可见性变化时是否立即检查
     *
     * @description 当用户从其他标签页切回时，立即检查版本更新，
     * 而不是等待下一个定时周期
     *
     * @default true
     */
    checkOnVisibilityChange?: boolean;
    /**
     * 是否在开发模式下启用版本检查
     *
     * @default false
     */
    enableInDev?: boolean;
    /**
     * 更新提示 UI 样式
     *
     * @default 'modal'
     */
    promptStyle?: PromptStyle;
    /**
     * 更新提示消息文本
     *
     * @default '发现新版本，是否立即刷新获取最新内容？'
     */
    promptMessage?: string;
    /**
     * 刷新按钮文本
     *
     * @default '立即刷新'
     */
    refreshButtonText?: string;
    /**
     * 忽略按钮文本
     *
     * @default '稍后再说'
     */
    dismissButtonText?: string;
    /**
     * 自定义提示 UI 的 HTML 模板
     *
     * @description 替换内置的提示 UI，模板中可使用以下占位符：
     * - {{message}}: 提示消息
     * - {{currentVersion}}: 当前版本号
     * - {{newVersion}}: 新版本号
     * - {{refreshButton}}: 刷新按钮
     * - {{dismissButton}}: 忽略按钮
     *
     * 模板中不允许包含 <script> 标签
     */
    customPromptTemplate?: string;
    /**
     * 自定义样式字符串
     *
     * @description 追加到内置样式之后的自定义 CSS
     */
    customStyle?: string;
    /**
     * 发现新版本时的回调（函数体字符串）
     *
     * @description 回调以函数体字符串形式提供，因为需要注入到客户端代码中。
     * 可用变量：currentVersion、newVersion
     *
     * @example 'console.log("新版本:", newVersion); return true;'
     */
    onUpdateAvailable?: string;
    /**
     * 用户选择刷新时的回调（函数体字符串）
     *
     * @example 'console.log("用户选择刷新");'
     */
    onRefresh?: string;
    /**
     * 用户选择忽略时的回调（函数体字符串）
     *
     * @example 'console.log("用户选择忽略");'
     */
    onDismiss?: string;
}

/**
 * 版本更新检查器插件
 *
 * @param options - 插件配置选项，详见 {@link VersionUpdateCheckerOptions}
 * @returns Vite 插件实例
 *
 * @example
 * ```typescript
 * // 基本使用 — 配合 generateVersion 插件
 * generateVersion({
 *   format: 'datetime',
 *   outputType: 'both',
 *   defineName: '__APP_VERSION__'
 * }),
 * versionUpdateChecker()
 *
 * // 自定义检查间隔和提示样式
 * versionUpdateChecker({
 *   checkInterval: 60000,    // 1 分钟检查一次
 *   promptStyle: 'banner'    // 顶部横幅提示
 * })
 *
 * // 自定义提示消息和回调
 * versionUpdateChecker({
 *   promptMessage: '系统已更新，请刷新页面',
 *   onUpdateAvailable: 'console.log("新版本:", newVersion); return true;',
 *   onRefresh: 'console.log("用户选择刷新");',
 *   onDismiss: 'console.log("用户选择忽略");'
 * })
 *
 * // 开发模式也启用
 * versionUpdateChecker({
 *   enableInDev: true,
 *   checkInterval: 10000
 * })
 *
 * // 自定义 UI 模板
 * versionUpdateChecker({
 *   customPromptTemplate: '<div class="my-update-prompt">{{message}} {{refreshButton}}</div>',
 *   customStyle: '.my-update-prompt { background: #333; color: #fff; }'
 * })
 * ```
 *
 * @remarks
 * 该插件通常与 `generateVersion` 插件配合使用：
 * - `generateVersion` 负责在构建时生成版本号并输出到 `version.json` 文件和全局变量
 * - `versionUpdateChecker` 负责在运行时定期检查版本号变更并提示用户刷新
 *
 * 工作原理：
 * 1. 页面加载时，从全局变量（如 `__APP_VERSION__`）读取当前版本号
 * 2. 定期请求 `version.json` 获取最新版本号
 * 3. 当版本号不一致时，显示更新提示 UI
 * 4. 用户点击"立即刷新"后执行 `location.reload()`
 * 5. 用户点击"稍后再说"后隐藏提示，本次会话不再提醒
 * 6. 页面可见性变化时（如从其他标签页切回）立即检查更新
 */
declare const versionUpdateChecker: PluginFactory<VersionUpdateCheckerOptions, VersionUpdateCheckerOptions>;

export { versionUpdateChecker };
export type { PromptStyle, VersionSource, VersionUpdateCheckerOptions };
