/**
 * 构造函数参数接口
 */
interface LoggerOptions {
    /**
     * 插件名称（用于日志前缀显示）
     */
    name: string;
    /**
     * 是否启用日志
     */
    enabled?: boolean;
    /**
     * 实例唯一标识（用于多实例隔离，默认与 name 相同）
     * 当同一插件类型存在多个实例时，应传入唯一 ID 避免配置互相覆盖
     */
    instanceId?: string;
}
/**
 * 插件日志代理接口
 * @description 为每个插件提供独立的日志接口
 */
interface PluginLogger {
    /**
     * 输出成功日志
     * @param message 日志消息
     * @param data 附加数据
     */
    success(message: string, data?: any): void;
    /**
     * 输出信息日志
     * @param message 日志消息
     * @param data 附加数据
     */
    info(message: string, data?: any): void;
    /**
     * 输出警告日志
     * @param message 日志消息
     * @param data 附加数据
     */
    warn(message: string, data?: any): void;
    /**
     * 输出错误日志
     * @param message 日志消息
     * @param data 附加数据
     */
    error(message: string, data?: any): void;
}

export type { LoggerOptions as L, PluginLogger as P };
