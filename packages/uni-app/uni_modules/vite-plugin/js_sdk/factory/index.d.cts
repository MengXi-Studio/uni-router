import { Plugin, ResolvedConfig } from 'vite';
import { P as PluginLogger, L as LoggerOptions } from '../shared/vite-plugin.BmNqGOzh.cjs';
import { V as Validator } from '../shared/vite-plugin.DRRlWY8P.cjs';

/**
 * 带插件实例引用的 Vite 插件类型
 *
 * @template T 插件配置类型
 */
interface PluginWithInstance<T extends BasePluginOptions = BasePluginOptions> extends Plugin {
    /**
     * 原始插件实例的引用，方便外部访问插件内部状态
     */
    pluginInstance?: BasePlugin<T>;
}
/**
 * 基础插件配置
 *
 * @interface BasePluginOptions
 */
interface BasePluginOptions {
    /**
     * 是否启用插件
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * 是否启用日志
     *
     * @default true
     */
    verbose?: boolean;
    /**
     * 错误处理策略
     *
     * @default 'throw'
     */
    errorStrategy?: 'throw' | 'log' | 'ignore';
}
/**
 * 插件选项标准化器类型
 *
 * @template T 目标选项类型
 * @template R 原始选项类型
 */
type OptionsNormalizer<T, R = any> = (raw?: R) => T;
/**
 * 插件工厂函数类型
 *
 * @template T 插件配置类型，默认继承自 BasePluginOptions
 * @template R 原始配置类型，默认与 T 相同
 */
type PluginFactory<T extends BasePluginOptions = BasePluginOptions, R = T> = (options?: R) => PluginWithInstance<T>;

/**
 * 基础插件抽象类，提供插件开发的核心功能和生命周期管理
 *
 * @class BasePlugin
 * @template T - 插件配置类型，必须继承自 BasePluginOptions
 * @abstract
 * @description 该类是所有插件的基类，提供了插件配置管理、日志记录、生命周期管理等核心功能
 * @example
 * ```typescript
 * class MyPlugin extends BasePlugin<MyPluginOptions> {
 *   protected getPluginName() {
 *     return 'my-plugin'
 *   }
 *
 *   protected addPluginHooks(plugin: Plugin) {
 *     // 添加插件钩子
 *   }
 * }
 * ```
 */
declare abstract class BasePlugin<T extends BasePluginOptions = BasePluginOptions> {
    /**
     * 插件配置
     *
     * @protected
     * @description 插件配置，包含插件的运行参数和选项
     */
    protected options: Required<T>;
    /**
     * 插件日志记录器
     *
     * @protected
     * @description 插件日志记录器，用于记录插件运行时的日志信息
     */
    protected logger: PluginLogger;
    /**
     * 日志实例唯一标识
     * @description 用于 Logger 单例中区分同类型插件的多个实例
     */
    private readonly loggerKey;
    /**
     * 实例计数器（类级别）
     * @description 为每个 BasePlugin 实例生成唯一序号
     */
    private static instanceCounter;
    /**
     * 插件配置验证器
     *
     * @protected
     * @description 插件配置验证器，用于验证插件配置参数是否符合要求
     */
    protected validator: Validator<T>;
    /**
     * Vite 配置
     *
     * @protected
     * @description Vite 配置，包含 Vite 构建的运行参数和选项
     */
    protected viteConfig: ResolvedConfig | null;
    /**
     * 插件构造函数
     *
     * @param options 插件配置
     * @param loggerConfig 日志配置，可选
     *
     * @protected
     * @description 插件构造函数，初始化插件配置、日志记录器和验证插件参数
     */
    constructor(options: T, loggerConfig?: LoggerOptions);
    /**
     * 获取插件的默认配置选项
     *
     * @protected
     * @returns {Partial<T>} 插件特定的默认配置
     * @description 子类可以重写此方法，以提供插件特定的默认配置值。默认返回空对象
     */
    protected getDefaultOptions(): Partial<T>;
    /**
     * 合并插件配置，将用户提供的配置与默认配置合并
     *
     * @protected
     * @template T - 插件配置类型，必须继承自 BasePluginOptions
     * @param {T} options - 用户提供的插件配置
     * @returns {Required<T>} 合并后的完整插件配置，包含所有必填字段
     * @description 将用户提供的配置与基础默认值、插件特定默认值进行深度合并，确保所有必填字段都有值
     * @example
     * ```typescript
     * const userOptions = { enabled: false }
     * const mergedOptions = this.mergeOptions(userOptions)
     * // mergedOptions 将包含基础默认值和插件特定默认值
     * ```
     */
    protected mergeOptions(options: T): Required<T>;
    /**
     * 初始化日志记录器
     *
     * @private
     * @param {LoggerOptions} loggerConfig - 日志配置对象，可选
     * @returns {PluginLogger} 插件日志代理对象，用于记录插件日志
     * @description 使用单例 Logger 创建插件特定的日志代理对象
     */
    private initLogger;
    /**
     * 验证插件配置参数，确保配置符合要求
     *
     * @protected
     * @virtual
     * @returns {void} 无返回值
     * @throws {Error} 如果配置参数无效，抛出包含错误信息的异常
     * @description 该方法在插件初始化时被调用，用于验证插件配置的有效性。子类可以重写此方法以添加自定义验证逻辑
     * @example
     * ```typescript
     * protected validateOptions(): void {
     *   if (!this.options.sourceDir) {
     *     throw new Error('sourceDir 是必填项')
     *   }
     *
     *   if (!this.options.targetDir) {
     *     throw new Error('targetDir 是必填项')
     *   }
     * }
     * ```
     */
    protected validateOptions(): void;
    /**
     * 获取插件名称
     *
     * @protected
     * @returns {string} 插件的名称，用于 Vite 插件系统识别
     */
    protected abstract getPluginName(): string;
    /**
     * 获取插件执行时机
     *
     * @protected
     * @returns {Plugin['enforce']} 插件的执行时机，可选值为 'pre'、'post' 或 undefined
     * @description 'post' 表示插件在 Vite 构建后期执行
     */
    protected getEnforce(): Plugin['enforce'];
    /**
     * 处理配置解析完成事件
     *
     * @param config 解析后的 Vite 配置
     *
     * @protected
     * @description 处理 Vite 配置解析完成事件，将解析后的配置存储到插件实例中
     */
    protected onConfigResolved(config: ResolvedConfig): void;
    /**
     * 插件销毁生命周期
     *
     * @protected
     * @virtual
     * @description 插件销毁时调用的清理方法。基类会注销日志配置，子类可重写此方法添加自定义清理逻辑
     * @example
     * ```typescript
     * protected destroy(): void {
     *   super.destroy()
     *   this.stopWatching()
     * }
     * ```
     */
    protected destroy(): void;
    /**
     * 注册 Vite 插件钩子，自动包裹 enabled 检查和错误处理
     *
     * @protected
     * @param plugin - Vite 插件对象
     * @param hook - 钩子名称
     * @param handler - 钩子处理函数
     * @param context - 错误日志上下文描述
     * @description 注册钩子时自动包裹 enabled 检查（禁用时跳过执行）和 safeExecute（捕获异常），
     * 避免每个插件手动重复编写这两层包裹逻辑
     */
    protected registerHook<K extends keyof NonNullable<Plugin>>(plugin: Plugin, hook: K, handler: NonNullable<Plugin>[K], context: string): void;
    /**
     * 注册带 order 配置的 Vite 插件钩子，自动包裹 enabled 检查和错误处理
     *
     * @protected
     * @param plugin - Vite 插件对象
     * @param hook - 钩子名称
     * @param handler - 钩子处理函数
     * @param context - 错误日志上下文描述
     * @param order - 执行顺序，'pre' 或 'post'
     * @description 与 registerHook 类似，但支持 Vite 的 order 配置（用于 transform、resolveId、generateBundle、writeBundle 等支持排序的钩子）
     */
    protected registerOrderedHook<K extends keyof NonNullable<Plugin>>(plugin: Plugin, hook: K, handler: NonNullable<Plugin>[K], context: string, order: 'pre' | 'post'): void;
    /**
     * 注册 transformIndexHtml 钩子，支持 order 配置，自动包裹 enabled 检查和错误处理
     *
     * @protected
     * @param plugin - Vite 插件对象
     * @param handler - 钩子处理函数，接收 html 和可选的上下文参数
     * @param context - 错误日志上下文描述
     * @param order - 执行顺序，默认 'post'
     * @description transformIndexHtml 钩子需要返回 html 字符串，因此使用 safeExecuteSync 包裹，
     * 出错时返回原始 html 作为降级，确保构建不会中断
     */
    protected registerTransformIndexHtml(plugin: Plugin, handler: (html: string, ctx?: any) => any, context: string, order?: 'pre' | 'post'): void;
    /**
     * 添加插件钩子到 Vite 插件对象
     *
     * @protected
     * @abstract
     * @param {Plugin} plugin - Vite 插件对象，用于添加钩子
     * @returns {void} 无返回值
     * @description 添加插件钩子到 Vite 插件对象，用于在构建过程中执行插件逻辑
     */
    protected addPluginHooks(_plugin: Plugin): void;
    /**
     * 安全执行同步函数，自动处理执行过程中可能出现的错误
     *
     * @protected
     * @template T - 函数的返回值类型
     * @param {() => T} fn - 要执行的同步函数
     * @param {string} context - 执行上下文描述，用于错误日志记录
     * @returns {T | undefined} 函数的执行结果，如果执行过程中发生错误，根据错误策略返回 undefined 或抛出错误
     * @description 该方法封装了同步函数的执行，自动处理可能出现的错误，根据插件配置的 errorStrategy 决定如何处理错误
     * @example
     * ```typescript
     * // 安全执行同步操作
     * const result = this.safeExecuteSync(() => {
     *   return someSyncOperation()
     * }, '执行同步操作')
     *
     * // 如果 someSyncOperation() 抛出错误，会根据 errorStrategy 处理
     * ```
     */
    protected safeExecuteSync<T>(fn: () => T, context: string): T | undefined;
    /**
     * 安全执行异步函数，自动处理执行过程中可能出现的错误
     *
     * @protected
     * @async
     * @template T - 异步函数的返回值类型
     * @param {() => Promise<T>} fn - 要执行的异步函数
     * @param {string} context - 执行上下文描述，用于错误日志记录
     * @returns {Promise<T | undefined>} 异步函数的执行结果，如果执行过程中发生错误，根据错误策略返回 undefined 或抛出错误
     * @description 该方法封装了异步函数的执行，自动处理可能出现的错误，根据插件配置的 errorStrategy 决定如何处理错误
     * @example
     * ```typescript
     * // 安全执行异步操作
     * const result = await this.safeExecute(async () => {
     *   return await someAsyncOperation()
     * }, '执行异步操作')
     *
     * // 如果 someAsyncOperation() 抛出错误，会根据 errorStrategy 处理
     * ```
     */
    protected safeExecute<T>(fn: () => Promise<T>, context: string): Promise<T | undefined>;
    /**
     * 处理插件执行过程中出现的错误，根据配置的错误策略决定如何处理
     *
     * @protected
     * @template T - 返回值类型，仅当错误策略为 'log' 或 'ignore' 时返回 undefined
     * @param {unknown} error - 捕获到的错误对象
     * @param {string} context - 错误发生的上下文描述，用于错误日志记录
     * @returns {T | undefined} 当错误策略为 'log' 或 'ignore' 时返回 undefined，否则抛出错误
     * @description 根据插件配置的 errorStrategy 处理错误：
     * - 'throw': 记录错误日志并抛出错误，中断执行
     * - 'log': 记录错误日志但不抛出错误，继续执行
     * - 'ignore': 记录错误日志但不抛出错误，继续执行
     * - 默认：记录错误日志并抛出错误
     * @example
     * ```typescript
     * // 当 errorStrategy 为 'throw' 时
     * this.handleError(new Error('测试错误'), '测试上下文') // 记录错误日志并抛出错误
     *
     * // 当 errorStrategy 为 'log' 时
     * this.handleError(new Error('测试错误'), '测试上下文') // 记录错误日志并返回 undefined
     * ```
     */
    protected handleError<T>(error: unknown, context: string): T | undefined;
    /**
     * 将插件实例转换为 Vite 插件对象，用于 Vite 构建系统
     *
     * @public
     * @returns {PluginWithInstance<T>} Vite 插件对象，包含插件名称、执行时机、各种钩子函数以及对原始插件实例的引用
     * @description 该方法创建并返回一个符合 Vite 插件规范的对象，设置了插件的基本信息和 configResolved 钩子，然后调用 addPluginHooks 方法添加插件特定的钩子，并在插件对象上添加对原始插件实例的引用
     * @example
     * ```typescript
     * // 创建插件实例
     * const pluginInstance = new MyPlugin(options)
     *
     * // 转换为 Vite 插件
     * const vitePlugin = pluginInstance.toPlugin()
     *
     * // 导出 Vite 插件
     * export const myPlugin = vitePlugin
     * ```
     */
    toPlugin(): PluginWithInstance<T>;
}
/**
 * 创建插件工厂函数，用于生成 Vite 插件实例
 *
 * @template T - 插件配置类型，必须继承自 BasePluginOptions
 * @template P - 插件实例类型，必须继承自 BasePlugin<T>
 * @template R - 原始配置类型
 * @param {new (options: T, loggerConfig?: LoggerOptions) => P} PluginClass - 插件类构造函数
 * @param {OptionsNormalizer<T, R>} [normalizer] - 选项标准化器，可选
 * @returns {PluginFactory<T, R>} 插件工厂函数，接收插件配置并返回 Vite 插件实例
 * @description 该函数创建一个插件工厂，用于生成 Vite 插件实例。工厂函数接收插件配置，支持可选的标准化器，创建插件实例，转换为 Vite 插件对象，并在插件对象上添加对原始插件实例的引用
 * @example
 * ```typescript
 * // 基本使用
 * const myPluginFactory = createPluginFactory(MyPlugin)
 *
 * // 带标准化器的使用（支持字符串或对象）
 * const myPluginWithNormalizer = createPluginFactory(MyPlugin, (opt) => typeof opt === 'string' ? { path: opt } : opt)
 * ```
 */
declare function createPluginFactory<T extends BasePluginOptions, P extends BasePlugin<T>, R = T>(PluginClass: new (options: T, loggerConfig?: LoggerOptions) => P, normalizer?: OptionsNormalizer<T, R>): PluginFactory<T, R>;

export { BasePlugin, createPluginFactory };
export type { BasePluginOptions, OptionsNormalizer, PluginFactory, PluginWithInstance };
