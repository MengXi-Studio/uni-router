import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * Loading 组件的显示位置
 *
 * @remarks 控制加载指示器在视口中的垂直对齐方式
 *
 * @defaultValue `'center'`
 *
 * @example
 * ```typescript
 * loadingManager({ position: 'top' })
 * ```
 */
type LoadingPosition = 'center' | 'top' | 'bottom';
/**
 * Loading 自动绑定请求拦截的模式
 *
 * @remarks 决定插件自动拦截哪些类型的网络请求来管理 loading 状态
 *
 * @defaultValue `'none'`
 *
 * @example
 * ```typescript
 * // 自动拦截所有 fetch 请求
 * loadingManager({ autoBind: 'fetch' })
 * ```
 */
type AutoBindMode = 'fetch' | 'xhr' | 'all' | 'none';
/**
 * Loading 旋转图标的内置类型
 *
 * @remarks 提供四种内置加载动画，无需自定义 CSS 即可使用
 *
 * @defaultValue `'spinner'`
 *
 * @example
 * ```typescript
 * loadingManager({ spinnerType: 'dots' })
 * ```
 */
type SpinnerType = 'spinner' | 'dots' | 'pulse' | 'bar';
/**
 * 当 `defaultVisible` 为 `true` 时，loading 的自动隐藏时机
 *
 * @remarks 仅在 {@link LoadingManagerOptions.defaultVisible} 为 `true` 时生效，
 * 决定 loading 在页面加载过程中的自动隐藏策略
 *
 * @defaultValue `'DOMContentLoaded'`
 *
 * @example
 * ```typescript
 * // Vue/React SPA：手动控制隐藏时机
 * loadingManager({ defaultVisible: true, autoHideOn: 'manual' })
 * // 在应用入口：window.__LOADING_MANAGER__.hide()
 * ```
 */
type AutoHideOn = 'DOMContentLoaded' | 'load' | 'manual';
/**
 * Loading 过渡动画配置
 *
 * @remarks 控制 loading 显示/隐藏时的 CSS 过渡效果
 */
interface TransitionConfig {
    /**
     * 是否启用过渡动画
     *
     * @defaultValue `true`
     */
    enabled?: boolean;
    /**
     * 过渡动画持续时间（毫秒）
     *
     * @defaultValue `200`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    duration?: number;
    /**
     * CSS 过渡缓动函数
     *
     * @defaultValue `'ease-out'`
     *
     * @example
     * ```typescript
     * { easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
     * ```
     */
    easing?: string;
}
/**
 * Loading 自定义样式配置
 *
 * @remarks 控制 loading 遮罩层、图标和文本的视觉表现
 */
interface LoadingStyle {
    /**
     * 遮罩层背景色（CSS 颜色值）
     *
     * @defaultValue `'rgba(255, 255, 255, 0.7)'`
     */
    overlayColor?: string;
    /**
     * Loading 图标颜色（CSS 颜色值）
     *
     * @defaultValue `'#4361ee'`
     */
    spinnerColor?: string;
    /**
     * Loading 图标大小（CSS 长度值）
     *
     * @defaultValue `'40px'`
     */
    spinnerSize?: string;
    /**
     * 文本颜色（CSS 颜色值）
     *
     * @defaultValue `'#333'`
     */
    textColor?: string;
    /**
     * 文本大小（CSS 长度值）
     *
     * @defaultValue `'14px'`
     */
    textSize?: string;
    /**
     * 自定义 CSS 类名，附加到 overlay 元素上
     *
     * @remarks 可用于覆盖默认样式或添加额外样式
     */
    customClass?: string;
    /**
     * 自定义内联样式字符串，附加到 overlay 元素上
     *
     * @remarks 将作为 `style` 属性值直接注入
     */
    customStyle?: string;
    /**
     * 遮罩层 z-index 值
     *
     * @defaultValue `9999`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    zIndex?: number;
    /**
     * 是否启用遮罩层的指针事件
     *
     * @remarks
     * 对应 CSS `pointer-events` 属性，控制遮罩层是否拦截用户的点击、滚动等交互操作：
     * - `true`（默认）：启用指针事件（`pointer-events: auto`），遮罩层阻止所有交互
     * - `false`：禁用指针事件（`pointer-events: none`），遮罩层允许交互穿透
     *
     * @defaultValue `true`
     *
     * @example
     * ```typescript
     * // 阻止交互（默认行为）
     * loadingManager({ style: { pointerEvents: true } })
     *
     * // 允许交互穿透（如仅展示加载状态，不阻止操作）
     * loadingManager({ style: { pointerEvents: false } })
     * ```
     */
    pointerEvents?: boolean;
    /**
     * 是否启用 backdrop-filter 模糊效果
     *
     * @remarks 启用后遮罩层下方的页面内容将被高斯模糊处理，
     * 需要浏览器支持 `backdrop-filter` CSS 属性
     *
     * @defaultValue `false`
     */
    backdropBlur?: boolean;
    /**
     * backdrop-filter 模糊程度（单位：px）
     *
     * @remarks 仅在 {@link backdropBlur} 为 `true` 时生效
     *
     * @defaultValue `4`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    backdropBlurAmount?: number;
}
/**
 * Loading 最小显示时间配置
 *
 * @remarks 确保 loading 至少显示指定时长，避免快速闪烁
 */
interface MinDisplayTime {
    /**
     * 是否启用最小显示时间
     *
     * @defaultValue `true`
     */
    enabled?: boolean;
    /**
     * 最小显示时间（毫秒）
     *
     * @remarks 即使请求在更短时间内完成，loading 也会至少显示此时长
     *
     * @defaultValue `300`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    duration?: number;
}
/**
 * Loading 延迟显示配置
 *
 * @remarks 当请求在短时间内完成时，延迟显示可避免 loading 闪烁
 */
interface DelayShow {
    /**
     * 是否启用延迟显示
     *
     * @defaultValue `true`
     */
    enabled?: boolean;
    /**
     * 延迟时间（毫秒）
     *
     * @remarks 请求开始后等待此时长再显示 loading；
     * 若请求在此时间内完成，则不会显示 loading
     *
     * @defaultValue `200`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    duration?: number;
}
/**
 * Loading 防抖隐藏配置
 *
 * @remarks 当频繁触发 hide 操作时，延迟执行以避免 loading 闪烁
 */
interface DebounceHide {
    /**
     * 是否启用防抖隐藏
     *
     * @defaultValue `false`
     */
    enabled?: boolean;
    /**
     * 防抖等待时间（毫秒）
     *
     * @remarks 在最后一次 hide 调用后等待此时长再执行隐藏
     *
     * @defaultValue `100`
     *
     * @throws 配置验证时若为负数将抛出错误
     */
    duration?: number;
}
/**
 * Loading 请求过滤配置
 *
 * @remarks 用于精细控制哪些网络请求会触发 loading 状态变化
 */
interface RequestFilter {
    /**
     * 需要排除的 URL 正则表达式数组
     *
     * @remarks 匹配的 URL 不会触发 loading
     *
     * @example
     * ```typescript
     * { excludeUrls: [/\/api\/health/, /\/static\//] }
     * ```
     */
    excludeUrls?: RegExp[];
    /**
     * 需要包含的 URL 正则表达式数组
     *
     * @remarks 仅匹配的 URL 才会触发 loading。
     * 与 {@link excludeUrls} 互斥，{@link includeUrls} 优先级更高
     *
     * @example
     * ```typescript
     * { includeUrls: [/\/api\/data/] }
     * ```
     */
    includeUrls?: RegExp[];
    /**
     * 需要排除的 HTTP 方法数组（不区分大小写）
     *
     * @example
     * ```typescript
     * { excludeMethods: ['OPTIONS', 'HEAD'] }
     * ```
     */
    excludeMethods?: string[];
    /**
     * 需要排除的 URL 字符串前缀数组
     *
     * @remarks 使用前缀匹配（`indexOf === 0`），比正则更高效
     *
     * @example
     * ```typescript
     * { excludeUrlPrefixes: ['http://localhost', 'data:'] }
     * ```
     */
    excludeUrlPrefixes?: string[];
}
/**
 * Loading 生命周期回调
 *
 * @remarks 回调以 **函数体字符串** 形式提供，因为插件在构建时注入代码到浏览器端，
 * 无法直接传递函数引用。字符串应为有效的 JavaScript 函数体代码。
 */
interface LoadingCallbacks {
    /**
     * Loading 显示前的回调
     *
     * @remarks 函数体内 `return false` 可阻止显示
     *
     * @example
     * ```typescript
     * { onBeforeShow: 'if (someCondition) return false;' }
     * ```
     */
    onBeforeShow?: string;
    /**
     * Loading 显示后的回调
     *
     * @example
     * ```typescript
     * { onShow: 'console.log("loading shown")' }
     * ```
     */
    onShow?: string;
    /**
     * Loading 隐藏前的回调
     *
     * @remarks 函数体内 `return false` 可阻止隐藏
     *
     * @example
     * ```typescript
     * { onBeforeHide: 'if (shouldKeepVisible) return false;' }
     * ```
     */
    onBeforeHide?: string;
    /**
     * Loading 隐藏后的回调
     *
     * @example
     * ```typescript
     * { onHide: 'console.log("loading hidden")' }
     * ```
     */
    onHide?: string;
    /**
     * Loading 销毁时的回调
     *
     * @remarks 在 DOM 清理和拦截器恢复之后执行
     */
    onDestroy?: string;
}
/**
 * Loading 管理器实例接口
 *
 * @remarks 注入到浏览器全局变量（默认 `window.__LOADING_MANAGER__`），
 * 提供运行时 loading 状态控制方法
 */
interface LoadingManager {
    /**
     * 显示 loading
     *
     * @param text - 可选，显示的文本内容；不传则保留默认文本
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.show()
     * window.__LOADING_MANAGER__.show('正在保存...')
     * ```
     */
    show(text?: string): void;
    /**
     * 隐藏 loading
     *
     * @remarks 受 {@link MinDisplayTime} 和 {@link DebounceHide} 配置约束；
     * 若需忽略这些约束，请使用 {@link forceHide}
     */
    hide(): void;
    /**
     * 强制隐藏 loading，忽略最小显示时间和防抖隐藏
     *
     * @remarks 适用于需要立即隐藏 loading 的紧急场景
     */
    forceHide(): void;
    /**
     * 切换 loading 的显示/隐藏状态
     *
     * @remarks 如果当前显示则调用 {@link hide}，如果当前隐藏则调用 {@link show}
     *
     * @param text - 可选，切换为显示时的文本内容；不传则保留默认文本
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.toggle()
     * window.__LOADING_MANAGER__.toggle('正在加载...')
     * ```
     */
    toggle(text?: string): void;
    /**
     * 启用遮罩层的指针事件，拦截所有点击和滚动操作
     *
     * @remarks 设置遮罩层的 `pointer-events: auto`，恢复默认的交互拦截行为。
     * 适用于运行时动态启用交互阻止，例如在特定操作期间临时锁定页面
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.enablePointerEvents()
     * ```
     */
    enablePointerEvents(): void;
    /**
     * 禁用遮罩层的指针事件，允许交互穿透
     *
     * @remarks 设置遮罩层的 `pointer-events: none`，使鼠标事件穿透到下层元素。
     * 适用于运行时动态禁用交互阻止，例如需要用户在 loading 期间仍能操作页面
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.disablePointerEvents()
     * ```
     */
    disablePointerEvents(): void;
    /**
     * 切换遮罩层的指针事件状态
     *
     * @remarks 如果当前启用指针事件则调用 {@link disablePointerEvents}，如果当前禁用则调用 {@link enablePointerEvents}
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.togglePointerEvents()
     * ```
     */
    togglePointerEvents(): void;
    /**
     * 更新 loading 文本内容
     *
     * @param text - 新的文本内容
     *
     * @example
     * ```typescript
     * window.__LOADING_MANAGER__.updateText('正在处理数据...')
     * ```
     */
    updateText(text: string): void;
    /**
     * 获取当前 loading 是否正在显示
     *
     * @returns `true` 表示 loading 正在显示且未被销毁
     */
    isVisible(): boolean;
    /**
     * 获取当前遮罩层是否启用了指针事件
     *
     * @returns `true` 表示指针事件已启用（遮罩层拦截交互），`false` 表示已禁用（允许穿透）
     */
    isPointerEventsEnabled(): boolean;
    /**
     * 获取当前挂起的请求数量
     *
     * @returns 当前正在进行的、被拦截的请求数量
     */
    getPendingCount(): number;
    /**
     * 销毁 loading 实例
     *
     * @remarks 清理 DOM 元素、事件监听器，并恢复原始的 fetch/XHR 拦截。
     * 销毁后所有其他方法调用将被安全忽略
     */
    destroy(): void;
}
/**
 * loadingManager 插件的配置选项
 *
 * @remarks 继承自 {@link BasePluginOptions}，包含 loading 的所有可配置项
 */
interface LoadingManagerOptions extends BasePluginOptions {
    /**
     * Loading 显示位置
     *
     * @defaultValue `'center'`
     */
    position?: LoadingPosition;
    /**
     * 默认显示文本
     *
     * @defaultValue `'加载中...'`
     */
    defaultText?: string;
    /**
     * 旋转图标类型
     *
     * @defaultValue `'spinner'`
     */
    spinnerType?: SpinnerType;
    /**
     * 自定义样式配置
     *
     * @remarks 详见 {@link LoadingStyle}
     */
    style?: LoadingStyle;
    /**
     * 过渡动画配置
     *
     * @defaultValue `{ enabled: true, duration: 200, easing: 'ease-out' }`
     */
    transition?: TransitionConfig;
    /**
     * 最小显示时间配置
     *
     * @remarks 详见 {@link MinDisplayTime}
     */
    minDisplayTime?: MinDisplayTime;
    /**
     * 延迟显示配置
     *
     * @remarks 详见 {@link DelayShow}
     */
    delayShow?: DelayShow;
    /**
     * 防抖隐藏配置
     *
     * @remarks 详见 {@link DebounceHide}
     */
    debounceHide?: DebounceHide;
    /**
     * 自动绑定请求拦截模式
     *
     * @defaultValue `'none'`
     */
    autoBind?: AutoBindMode;
    /**
     * 请求过滤配置
     *
     * @remarks 详见 {@link RequestFilter}
     */
    requestFilter?: RequestFilter;
    /**
     * 注入到浏览器全局的变量名
     *
     * @defaultValue `'__LOADING_MANAGER__'`
     *
     * @example
     * ```typescript
     * loadingManager({ globalName: '__MY_LOADING__' })
     * // 使用：window.__MY_LOADING__.show()
     * ```
     */
    globalName?: string;
    /**
     * 自定义 Loading HTML 模板
     *
     * @remarks 如果提供，将替代默认的 loading 模板。
     * 模板中 **必须** 包含一个具有 `data-loading-text` 属性的元素用于文本显示，
     * 否则 {@link LoadingManager.updateText} 将无法工作
     *
     * @example
     * ```typescript
     * loadingManager({
     *   customTemplate: '<div class="my-loader"><span data-loading-text></span></div>'
     * })
     * ```
     */
    customTemplate?: string;
    /**
     * Loading DOM 的初始可见状态
     *
     * @defaultValue `false`
     *
     * @remarks
     * 设为 `true` 时，loading DOM 以可见状态注入到 HTML 的 `<head>` 中，
     * 无需等待 JS 执行即可在白屏阶段显示 loading。
     *
     * 典型用法：配合 {@link autoHideOn} 使用，实现"白屏时显示 → 页面就绪后自动隐藏"。
     *
     * @example
     * ```typescript
     * // 白屏阶段即显示 loading，DOMContentLoaded 后自动隐藏
     * loadingManager({ defaultVisible: true, autoHideOn: 'DOMContentLoaded' })
     *
     * // 白屏阶段即显示 loading，所有资源加载完成后自动隐藏
     * loadingManager({ defaultVisible: true, autoHideOn: 'load' })
     *
     * // Vue/React SPA：白屏阶段即显示，框架渲染完成后手动隐藏
     * loadingManager({ defaultVisible: true, autoHideOn: 'manual' })
     * // 在应用入口处：window.__LOADING_MANAGER__.hide()
     * ```
     */
    defaultVisible?: boolean;
    /**
     * 当 `defaultVisible` 为 `true` 时，loading 的自动隐藏时机
     *
     * @defaultValue `'DOMContentLoaded'`
     *
     * @remarks 仅在 {@link defaultVisible} 为 `true` 时生效：
     * - `'DOMContentLoaded'` — DOM 解析完成后自动隐藏（适合 SSR/MPA）
     * - `'load'` — 所有资源（图片、样式等）加载完成后自动隐藏（适合资源较重的页面）
     * - `'manual'` — 不自动隐藏，需在应用代码中手动调用 `window.__LOADING_MANAGER__.hide()`
     *   （适合 Vue/React SPA，在框架渲染完成后手动隐藏）
     */
    autoHideOn?: AutoHideOn;
    /**
     * 生命周期回调
     *
     * @remarks 回调以函数体字符串形式提供，在运行时执行。
     * 详见 {@link LoadingCallbacks}
     *
     * @example
     * ```typescript
     * loadingManager({
     *   callbacks: {
     *     onShow: 'console.log("loading shown")',
     *     onBeforeShow: 'return true'
     *   }
     * })
     * ```
     */
    callbacks?: LoadingCallbacks;
}

/**
 * 全局 Loading 状态管理插件
 *
 * @param options - 插件配置选项，详见 {@link LoadingManagerOptions}
 * @returns Vite 插件实例
 *
 * @example
 * ```typescript
 * // 基本使用
 * loadingManager()
 *
 * // 自定义位置和文本
 * loadingManager({
 *   position: 'top',
 *   defaultText: '请稍候...'
 * })
 *
 * // 使用不同类型的加载图标
 * loadingManager({
 *   spinnerType: 'dots',  // spinner | dots | pulse | bar
 * })
 *
 * // 自动拦截 fetch 请求
 * loadingManager({
 *   autoBind: 'fetch',
 *   requestFilter: {
 *     excludeUrls: [/\/api\/health/],
 *     excludeUrlPrefixes: ['http://localhost']
 *   }
 * })
 *
 * // 自定义样式（含模糊背景）
 * loadingManager({
 *   style: {
 *     overlayColor: 'rgba(0, 0, 0, 0.5)',
 *     spinnerColor: '#ff6b6b',
 *     spinnerSize: '50px',
 *     backdropBlur: true,
 *     backdropBlurAmount: 6
 *   }
 * })
 *
 * // 自定义过渡动画
 * loadingManager({
 *   transition: {
 *     enabled: true,
 *     duration: 300,
 *     easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
 *   }
 * })
 *
 * // 防抖隐藏（避免快速闪烁）
 * loadingManager({
 *   debounceHide: {
 *     enabled: true,
 *     duration: 100
 *   }
 * })
 *
 * // 生命周期回调
 * loadingManager({
 *   callbacks: {
 *     onShow: 'console.log("loading shown")',
 *     onBeforeShow: 'return true',  // 返回 false 可阻止显示
 *     onHide: 'console.log("loading hidden")'
 *   }
 * })
 *
 * // 自定义模板
 * loadingManager({
 *   customTemplate: '<div class="my-loader"><span data-loading-text></span></div>'
 * })
 *
 * // 白屏阶段即显示 loading，DOMContentLoaded 后自动隐藏
 * loadingManager({
 *   defaultVisible: true,
 *   autoHideOn: 'DOMContentLoaded'
 * })
 *
 * // 白屏阶段即显示 loading，所有资源加载完成后自动隐藏
 * loadingManager({
 *   defaultVisible: true,
 *   autoHideOn: 'load'
 * })
 *
 * // Vue/React SPA：白屏阶段即显示，框架渲染完成后手动隐藏
 * loadingManager({
 *   defaultVisible: true,
 *   autoHideOn: 'manual'
 * })
 * // 在应用入口处手动隐藏：
 * // window.__LOADING_MANAGER__.hide()
 * ```
 *
 * @remarks
 * 该插件在 HTML 中注入全局 Loading 状态管理代码，提供以下能力：
 * - 全局 loading 的创建、显示、隐藏和销毁
 * - 跨组件/页面共享 loading 状态
 * - 多种内置加载图标（spinner / dots / pulse / bar）
 * - 自定义样式、文本和显示位置
 * - 过渡动画配置（淡入淡出）
 * - 自动拦截 fetch/XHR 请求实现 loading 自动管理
 * - 延迟显示和最小显示时间机制
 * - 防抖隐藏避免闪烁
 * - 请求过滤（排除/包含特定 URL、前缀匹配、方法过滤）
 * - 生命周期回调（onBeforeShow / onShow / onBeforeHide / onHide / onDestroy）
 * - 背景模糊效果（backdrop-filter）
 * - 销毁时自动恢复原始 fetch/XHR
 * - SSR 环境安全检测
 * - 白屏阶段即显示 loading（defaultVisible + autoHideOn）
 *
 * 运行时 API：
 * ```typescript
 * // 显示 loading
 * window.__LOADING_MANAGER__.show('加载中...')
 *
 * // 隐藏 loading
 * window.__LOADING_MANAGER__.hide()
 *
 * // 强制隐藏（忽略最小显示时间）
 * window.__LOADING_MANAGER__.forceHide()
 *
 * // 更新文本
 * window.__LOADING_MANAGER__.updateText('正在处理...')
 *
 * // 检查状态
 * window.__LOADING_MANAGER__.isVisible()
 *
 * // 获取挂起请求数
 * window.__LOADING_MANAGER__.getPendingCount()
 *
 * // 销毁（恢复原始 fetch/XHR）
 * window.__LOADING_MANAGER__.destroy()
 * ```
 */
declare const loadingManager: PluginFactory<LoadingManagerOptions, LoadingManagerOptions>;

export { loadingManager };
export type { AutoBindMode, AutoHideOn, DebounceHide, DelayShow, LoadingCallbacks, LoadingManager, LoadingManagerOptions, LoadingPosition, LoadingStyle, MinDisplayTime, RequestFilter, SpinnerType, TransitionConfig };
