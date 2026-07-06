import { L as LoggerOptions, P as PluginLogger } from '../shared/vite-plugin.BmNqGOzh.js';

/**
 * 日志工具类（单例模式）
 * @description 全局单例日志管理器，统一管理所有插件的日志输出
 */
declare class Logger {
    /**
     * 单例实例
     */
    private static instance;
    /**
     * 库名称
     */
    private readonly libName;
    /**
     * 插件日志配置映射表
     * @description 以实例 ID 为 key 存储每个插件实例的日志配置，避免同类型多实例互相覆盖
     */
    private pluginConfigs;
    /**
     * 日志类型映射
     */
    private readonly logTypes;
    /**
     * 私有构造函数，防止外部实例化
     */
    private constructor();
    /**
     * 获取单例实例
     * @returns Logger 单例实例
     */
    private static getInstance;
    /**
     * 注册插件日志配置并获取 Logger 实例
     * @param options 配置选项
     * @returns Logger 单例实例
     * @description 注册插件日志配置，返回单例实例。使用 instanceId 作为唯一 key 避免多实例冲突
     */
    static register(options: LoggerOptions): Logger;
    /**
     * 注册插件日志配置
     * @param key 实例唯一标识
     * @param name 插件显示名称
     * @param enabled 是否启用日志
     */
    private registerPlugin;
    /**
     * 注销插件日志配置
     * @param key 实例唯一标识
     */
    private unregisterPlugin;
    /**
     * 注销指定插件实例的日志配置
     * @param key 实例唯一标识（instanceId 或插件名称）
     * @description 从单例中移除指定插件实例的日志配置，通常在插件销毁时调用
     */
    static unregister(key: string): void;
    /**
     * 销毁单例实例，释放所有资源
     * @description 清除所有已注册的插件配置，重置单例实例。主要用于测试场景
     */
    static destroy(): void;
    /**
     * 生成日志前缀
     * @param pluginName 插件名称
     * @returns 格式化的日志前缀
     */
    private formatPrefix;
    /**
     * 检查插件日志是否启用
     * @param key 实例唯一标识
     * @returns 是否启用
     */
    private isPluginEnabled;
    /**
     * 统一日志输出方法
     * @param key 实例唯一标识
     * @param type 日志类型
     * @param message 日志消息
     * @param data 附加数据
     */
    private log;
    /**
     * 创建插件日志代理对象
     * @param key 实例唯一标识
     * @returns 插件日志代理对象
     * @internal 供 BasePlugin 内部使用
     */
    createPluginLogger(key: string): PluginLogger;
}

export { Logger, LoggerOptions, PluginLogger };
