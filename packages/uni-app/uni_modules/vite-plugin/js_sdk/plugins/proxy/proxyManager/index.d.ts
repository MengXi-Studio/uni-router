import { BasePluginOptions, PluginFactory } from '../../../factory/index.js';
import { IncomingMessage } from 'node:http';
import 'vite';
import '../../../shared/vite-plugin.BmNqGOzh.js';
import '../../../shared/vite-plugin.DRRlWY8P.js';

/**
 * 代理规则定义
 *
 * @description 单条代理规则的完整配置，支持路径匹配、目标转发、
 * 请求重写、响应修改、延迟模拟等能力
 */
interface ProxyRule {
    /** 匹配路径，支持字符串前缀或正则表达式 */
    context: string | RegExp;
    /** 代理目标地址，如 'http://localhost:3000' */
    target: string;
    /** 是否修改请求头中的 Origin 为目标地址，默认 true */
    changeOrigin?: boolean;
    /** 是否验证 SSL 证书，默认 false */
    secure?: boolean;
    /** 请求路径重写函数 */
    rewrite?: (path: string) => string;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 限定生效的环境列表，为空则所有环境生效 */
    env?: string[];
    /** 延迟模拟，数字表示固定毫秒数，对象表示随机范围 */
    delay?: number | {
        min: number;
        max: number;
    };
    /** 响应修改回调 */
    modifyResponse?: (body: any, proxyRes: IncomingMessage) => any;
    /** 是否启用 WebSocket 代理，默认 false */
    ws?: boolean;
    /** 规则备注/描述 */
    label?: string;
}
/**
 * 代理日志级别
 *
 * - `none`: 不输出日志
 * - `basic`: 输出请求方法和路径
 * - `verbose`: 输出完整请求/响应信息（含状态码、耗时、头部）
 */
type ProxyLogLevel = 'none' | 'basic' | 'verbose';
/**
 * 延迟配置类型
 *
 * - `false`: 不延迟
 * - `number`: 固定延迟毫秒数
 * - `{ min, max }`: 随机延迟范围
 */
type DelayConfig = number | {
    min: number;
    max: number;
} | false;
/**
 * 已解析的代理规则（context 已转为字符串 key）
 *
 * @description 用于生成 Vite server.proxy 配置的中间格式
 */
interface ResolvedProxyRule {
    /** context 的字符串表示，作为 proxy 配置的 key */
    key: string;
    /** 原始规则 */
    rule: ProxyRule;
}
/**
 * 代理请求日志条目
 */
interface ProxyLogEntry {
    /** 请求时间戳 */
    timestamp: number;
    /** 请求方法 */
    method: string;
    /** 请求路径 */
    path: string;
    /** 匹配的规则 key */
    ruleKey: string;
    /** 代理目标 */
    target: string;
    /** 响应状态码 */
    statusCode?: number;
    /** 请求耗时（毫秒） */
    duration?: number;
    /** 是否命中延迟模拟 */
    delayed?: boolean;
}
/**
 * proxyManager 插件配置选项
 *
 * @interface ProxyManagerOptions
 * @extends {BasePluginOptions}
 *
 * @example
 * ```typescript
 * proxyManager({
 *   rules: [
 *     { context: '/api', target: 'http://localhost:3000' },
 *     { context: '/upload', target: 'http://oss.example.com', rewrite: p => p.replace(/^\/upload/, '/v2/files') }
 *   ],
 *   logLevel: 'verbose',
 *   defaultDelay: { min: 100, max: 500 }
 * })
 * ```
 */
interface ProxyManagerOptions extends BasePluginOptions {
    /**
     * 代理规则列表
     *
     * @default []
     */
    rules?: ProxyRule[];
    /**
     * 代理规则配置文件路径，为 false 时不加载外部文件
     *
     * @default '.proxyrc.ts'
     */
    configFile?: string | false;
    /**
     * 代理日志级别
     *
     * @default 'basic'
     */
    logLevel?: ProxyLogLevel;
    /**
     * 全局默认延迟，对未配置 delay 的规则生效
     *
     * @default false
     */
    defaultDelay?: DelayConfig;
    /**
     * 环境变量前缀，用于从 process.env 读取代理目标
     * 例如 envPrefix='PROXY_' 时，会读取 PROXY_API_TARGET 作为规则目标
     *
     * @default 'PROXY_'
     */
    envPrefix?: string;
}

/**
 * 创建开发代理管理插件
 *
 * @function proxyManager
 * @param {ProxyManagerOptions} [options] - 插件配置选项
 * @returns {Plugin} Vite 插件实例
 *
 * @description 声明式代理规则管理插件，简化 Vite 开发服务器代理配置。
 * 支持环境切换、规则文件加载、请求日志、延迟模拟等能力。
 *
 * @example
 * ```typescript
 * // 基本使用
 * proxyManager({
 *   rules: [
 *     { context: '/api', target: 'http://localhost:3000' }
 *   ]
 * })
 *
 * // 多环境配置
 * proxyManager({
 *   rules: [
 *     { context: '/api', target: 'http://localhost:3000', env: ['development'] },
 *     { context: '/api', target: 'https://api.example.com', env: ['staging'] }
 *   ]
 * })
 *
 * // 请求重写
 * proxyManager({
 *   rules: [
 *     {
 *       context: '/upload',
 *       target: 'http://oss.example.com',
 *       rewrite: path => path.replace(/^\/upload/, '/v2/files')
 *     }
 *   ]
 * })
 *
 * // 延迟模拟（慢网络测试）
 * proxyManager({
 *   rules: [
 *     { context: '/api', target: 'http://localhost:3000', delay: { min: 200, max: 800 } }
 *   ],
 *   defaultDelay: 100
 * })
 *
 * // 详细日志
 * proxyManager({
 *   rules: [...],
 *   logLevel: 'verbose'
 * })
 *
 * // 使用配置文件
 * proxyManager({
 *   configFile: '.proxyrc.ts',
 *   logLevel: 'basic'
 * })
 *
 * // 环境变量覆盖目标
 * // 设置 PROXY_API_TARGET=http://staging-api.example.com
 * proxyManager({
 *   rules: [
 *     { context: '/api', target: 'http://localhost:3000' }
 *   ],
 *   envPrefix: 'PROXY_'
 * })
 * ```
 *
 * @remarks
 * 该插件在 Vite 开发服务器启动时生效，核心能力：
 * - **声明式规则**: 简洁的 ProxyRule 配置，替代繁琐的 http-proxy-middleware 选项
 * - **环境切换**: 通过 `env` 字段限定规则生效环境，自动按 NODE_ENV 过滤
 * - **规则文件**: 支持外部 `.proxyrc.ts` 配置文件，与 vite.config.ts 解耦
 * - **请求日志**: basic/verbose 两级日志，verbose 模式含状态码和耗时
 * - **延迟模拟**: 规则级/全局级延迟配置，支持固定值和随机范围
 * - **环境变量覆盖**: 通过 `PROXY_*_TARGET` 环境变量动态覆盖代理目标
 * - **请求重写**: 支持 rewrite 函数修改请求路径
 * - **响应修改**: 支持 modifyResponse 回调修改代理响应
 * - **WebSocket 代理**: 通过 `ws: true` 启用
 */
declare const proxyManager: PluginFactory<ProxyManagerOptions, ProxyManagerOptions>;

export { proxyManager };
export type { DelayConfig, ProxyLogEntry, ProxyLogLevel, ProxyManagerOptions, ProxyRule, ResolvedProxyRule };
