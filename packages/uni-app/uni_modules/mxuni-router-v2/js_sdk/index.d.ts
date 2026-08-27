import { R as RouterOptions, a as Router, b as RouteLocation, c as RouteLeaveGuard, d as RouteLocationRaw, N as NavigationResult, E as EventChannel, e as RouterErrorCode, U as UniApiError$1, f as UniApiCause } from './index-BrbxXzIJ.js';
export { A as AnimationPlugin, g as AppRouterOptions, B as BackGuard, h as BackGuardReturn, C as ChannelPlugin, D as DEFAULT_ANIMATION_DURATION, i as EventListeners, G as GuardRouteOptions, I as InterceptorPlugin, j as NavigationAnimation, k as NavigationCompleteContext, l as NavigationGuard, m as NavigationPrepareContext, n as NavigationRedirect, o as NavigationRedirectMode, P as ParamObject, p as ParamValue, q as ParamsInput, r as ParamsPlugin, s as PluginContext, t as PostNavigationGuard, Q as QueryValue, u as RouteConfig, v as RouteLocationNamedRaw, w as RouteLocationPathRaw, x as RouteMeta, y as RouteName, z as RouteNameMap, F as RoutePath, H as RouterOnError, J as RouterPlugin, S as SideSlipGesture, K as UniAnimationType, L as usePageChannel } from './index-BrbxXzIJ.js';
import { Ref, ComputedRef } from 'vue';

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
 * 组件内离开守卫，在当前组件即将离开时执行
 *
 * 通过返回值控制导航行为，与 Vue Router 4.x 的 onBeforeRouteLeave 一致：
 * - `undefined` / `true` — 放行
 * - `false` — 中止导航
 * - `RouteLocationRaw` — 重定向
 * - `Error` — 取消导航
 * - 抛出异常 — 取消导航
 *
 * 内部通过 router.beforeEach 注册守卫，在组件卸载时自动移除。
 *
 * @param guard - 离开守卫函数，接收目标路由和来源路由，通过返回值控制导航
 *
 * @example
 * ```ts
 * import { onBeforeRouteLeave } from '@meng-xi/uni-router'
 *
 * onBeforeRouteLeave((to, from) => {
 *   if (hasUnsavedChanges) {
 *     return false // 中止导航
 *   }
 * })
 *
 * // 异步离开确认
 * onBeforeRouteLeave((to, from) => {
 *   if (from.meta.dirty) {
 *     return new Promise((resolve) => {
 *       uni.showModal({
 *         title: '提示',
 *         content: '有未保存的修改，确认离开？',
 *         success: (res) => resolve(res.confirm ? true : false)
 *       })
 *     })
 *   }
 * })
 * ```
 */
declare function onBeforeRouteLeave(guard: RouteLeaveGuard): void;

/**
 * useLink 的选项，与 RouterLink 组件的 props 对应
 *
 * 支持传入普通对象或 ref 包裹的值。
 */
interface UseLinkOptions {
    /** 目标路由位置，支持路径字符串、路径对象或命名路由对象 */
    to: RouteLocationRaw;
    /** 是否使用 replace 模式导航 */
    replace?: boolean;
    /** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
    relaunch?: boolean;
}
/**
 * useLink 的返回值
 */
interface UseLinkReturn {
    /** 解析后的路由对象 */
    route: ComputedRef<RouteLocation>;
    /** 目标路径字符串（fullPath，包含 query 参数） */
    href: ComputedRef<string>;
    /** 当前路由是否匹配此链接（比较 path，忽略 query 和 hash） */
    isActive: ComputedRef<boolean>;
    /** 当前路由是否完全匹配此链接（比较 fullPath，包含 query） */
    isExactActive: ComputedRef<boolean>;
    /** 执行导航到目标页面 */
    navigate: () => Promise<NavigationResult>;
}
/**
 * 暴露 RouterLink 内部行为为组合式 API
 *
 * 用于构建自定义导航组件，与 Vue Router 4.x 的 `useLink` 行为一致。
 * 返回响应式的路由信息、匹配状态和导航方法，方便在自定义组件中复用 RouterLink 的逻辑。
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 *
 * @param options - 选项对象，包含目标路由位置和导航模式
 * @returns 包含路由信息、匹配状态和导航方法的对象
 *
 * @example
 * ```ts
 * import { useLink } from '@meng-xi/uni-router'
 *
 * const { href, isActive, isExactActive, navigate } = useLink({
 *   to: { name: 'pagesDetailDetail', query: { id: '1' } }
 * })
 *
 * // 响应式绑定
 * const classes = computed(() => ({
 *   'nav-link': true,
 *   'nav-link-active': isActive.value
 * }))
 * ```
 *
 * @example
 * ```ts
 * // 在自定义组件中使用
 * const props = defineProps<{
 *   to: RouteLocationRaw
 *   replace?: boolean
 * }>()
 *
 * const { href, isActive, navigate } = useLink(props)
 * ```
 */
declare function useLink(options: UseLinkOptions): UseLinkReturn;

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

/**
 * 检查一个错误是否为特定类型的导航失败
 *
 * 与 Vue Router 4.x 的 `isNavigationFailure` 行为一致，用于在 catch 块中
 * 精准判断导航失败的类型，无需手动检查 instanceof 和 error.code。
 *
 * 当不传 `code` 时，仅检查是否为 NavigationFailure 实例。
 * 传入 `code` 时，同时检查错误码，将类型收窄为特定导航失败。
 *
 * @param error - 捕获的错误对象
 * @param code - 可选的错误码，传入时同时检查错误类型和错误码
 * @returns 匹配时返回 true，同时将 error 的类型收窄为 NavigationFailure
 *
 * @example
 * ```ts
 * import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'
 *
 * try {
 *   await router.push('/somewhere')
 * } catch (error) {
 *   if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED)) {
 *     // 忽略重复导航
 *   } else if (isNavigationFailure(error)) {
 *     // 其他导航失败
 *   }
 * }
 * ```
 */
declare function isNavigationFailure(error: unknown, code?: RouterErrorCode): error is NavigationFailure;

export { EventChannel, NavigationFailure, NavigationResult, ROUTER_SYMBOL, RouteLeaveGuard, RouteLocation, RouteLocationRaw, Router, RouterError, RouterErrorCode, RouterOptions, UniApiCause, UniApiError, UniEventChannel, type UseLinkOptions, type UseLinkReturn, createRouter, isNavigationFailure, noopChannel, onBeforeRouteLeave, useLink, useRoute, useRouter };
