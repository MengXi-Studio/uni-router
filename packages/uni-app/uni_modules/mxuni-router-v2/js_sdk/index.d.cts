import { R as RouterOptions, a as Router, b as RouteLocation, E as EventChannel, c as RouterErrorCode, U as UniApiError$1, d as UniApiCause } from './index-_RvXJflB.cjs';
export { A as AnimationPlugin, C as ChannelPlugin, D as DEFAULT_ANIMATION_DURATION, e as EventListeners, G as GuardRouteOptions, I as InterceptorPlugin, N as NavigationAnimation, f as NavigationCompleteContext, g as NavigationGuard, h as NavigationGuardNext, i as NavigationGuardNextOptions, j as NavigationPrepareContext, k as NavigationRedirectMode, l as NavigationResult, P as ParamObject, m as ParamValue, n as ParamsInput, o as ParamsPlugin, p as PluginContext, q as PostNavigationGuard, Q as QueryValue, r as RouteConfig, s as RouteLocationNamedRaw, t as RouteLocationPathRaw, u as RouteLocationRaw, v as RouteMeta, w as RouteName, x as RouteNameMap, y as RoutePath, z as RouterOnError, B as RouterPlugin, F as UniAnimationType, H as usePageChannel } from './index-_RvXJflB.cjs';
import { Ref } from 'vue';

/**
 * 路由器注入键，用于 Vue 的 provide/inject 机制
 *
 * @internal 内部使用，不应在应用代码中直接引用
 */
declare const ROUTER_SYMBOL: unique symbol;
/**
 * 创建 uni-app 路由器实例
 *
 * @param options - 路由器初始化选项
 * @returns 路由器实例
 *
 * @example
 * ```ts
 * import { createRouter, Params, Animation, Channel, Interceptor } from '@meng-xi/uni-router'
 *
 * const router = createRouter({
 *   routes: [
 *     { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
 *     { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
 *     { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
 *   ],
 *   plugins: [Params, Animation, Channel, Interceptor],
 * })
 *
 * // 注册到 Vue 应用
 * app.use(router)
 *
 * // 导航
 * await router.push('/pages/about/about')
 * await router.push({ name: 'about', query: { id: '1' } })
 * await router.back()
 * ```
 */
declare function createRouter(options: RouterOptions): Router;

/**
 * 获取当前路由器实例
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 * 内部通过 Vue 的 inject 机制获取路由器实例。
 *
 * @returns 路由器实例
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { useRouter } from '@meng-xi/uni-router'
 *
 * const router = useRouter()
 * await router.push({ name: 'home' })
 * ```
 */
declare function useRouter(): Router;
/**
 * 获取当前路由位置的响应式引用
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 * 返回的是响应式的路由位置 ref，当路由变化时组件会自动重新渲染。
 *
 * @returns 响应式路由位置 ref
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { useRoute } from '@meng-xi/uni-router'
 *
 * const route = useRoute()
 * // 在模板中直接使用 route.path、route.query 等
 * // 路由变化时组件会自动更新
 * ```
 */
declare function useRoute(): Ref<RouteLocation>;

/**
 * 基于 uni.$emit/$on 全局事件的页面间通信通道
 *
 * 实现与 uni.navigateTo 原生 eventChannel 相同的 EventChannel 接口，
 * 但通过 uni.$emit/$on 全局事件总线通信，使所有导航方法（push/replace/relaunch/back/switchTab）都支持页面通信。
 *
 * 事件名通过 `uni-router:<navId>:<event>` 格式隔离，避免全局事件冲突。
 *
 * 粘性事件缓存：emit 时总是缓存事件参数；on/once 注册监听器时若有缓存，异步触发（不删除缓存）。
 * 解决导航方 emit 与目标页面 setup 注册监听器的时序竞争问题——无论 emit 和 on/once 的先后顺序，
 * 所有监听器都能收到最后一次 emit 的数据。once 通过缓存触发时手动 uni.$off 防止重复触发。
 */
declare class UniEventChannel implements EventChannel {
    private readonly navId;
    /** 按 event 名分组的监听器集合，用于 destroy 时批量清理 */
    private readonly listeners;
    /** 粘性事件缓存：无监听器时 emit 的事件参数，on/once 注册时异步触发 */
    private readonly pendingEvents;
    private destroyed;
    constructor(navId: string);
    on(event: string, callback: (...args: any[]) => void): EventChannel;
    once(event: string, callback: (...args: any[]) => void): EventChannel;
    off(event: string, callback?: (...args: any[]) => void): EventChannel;
    emit(event: string, ...args: any[]): EventChannel;
    /**
     * 销毁通道，清理所有监听器和待处理事件
     *
     * 框架内部在页面卸载时调用，防止监听器累积导致内存泄漏。
     */
    destroy(): void;
}
/**
 * 空操作通道
 *
 * 当目标页面无 __nav_id 时由 usePageChannel() 返回，避免调用方需判空。
 */
declare const noopChannel: EventChannel;

/**
 * 路由错误类，表示路由过程中产生的错误
 */
declare class RouterError extends Error {
    /** 错误码 */
    readonly code: RouterErrorCode;
    /**
     * @param code - 错误码
     * @param message - 错误信息（会自动添加 [uni-router] 前缀）
     */
    constructor(code: RouterErrorCode, message: string);
}

/**
 * 导航失败类，表示导航过程中产生的失败，包含来源和目标路由信息
 */
declare class NavigationFailure extends RouterError {
    /** 目标路由 */
    readonly to: RouteLocation;
    /** 来源路由 */
    readonly from: RouteLocation;
    /** 原始错误原因 */
    readonly cause?: UniApiError$1;
    /**
     * @param to - 目标路由
     * @param from - 来源路由
     * @param code - 错误码
     * @param message - 可选的错误信息，默认自动生成
     * @param cause - 原始错误原因
     */
    constructor(to: RouteLocation, from: RouteLocation, code: RouterErrorCode, message?: string, cause?: UniApiError$1);
}

/**
 * uni API 调用失败时的错误封装
 *
 * 当 uni.navigateTo / uni.redirectTo 等导航 API 调用失败时，
 * 将错误原因封装为此类实例，作为 {@link NavigationFailure.cause} 传递。
 */
declare class UniApiError extends Error {
    /** 调用失败的 API 名称（如 navigateTo / redirectTo） */
    readonly api: string;
    /** 原始错误原因 */
    readonly cause: UniApiCause;
    /**
     * @param api - 失败的 uni API 名称
     * @param cause - 原始错误对象
     */
    constructor(api: string, cause: UniApiCause);
}

export { EventChannel, NavigationFailure, ROUTER_SYMBOL, RouteLocation, Router, RouterError, RouterErrorCode, RouterOptions, UniApiCause, UniApiError, UniEventChannel, createRouter, noopChannel, useRoute, useRouter };
