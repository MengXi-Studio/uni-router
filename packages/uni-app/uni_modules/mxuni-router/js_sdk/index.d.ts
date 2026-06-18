import { App, Ref } from 'vue';

/**
 * 导航守卫的 next 回调函数
 * @param to - 传入 false 中断导航，传入路由位置重定向，不传参数则放行
 */
type NavigationGuardNext = (to?: RouteLocationRaw | false) => void;
/**
 * 前置导航守卫函数类型
 * @param to - 即将进入的目标路由
 * @param from - 当前导航正要离开的路由
 * @param next - 必须调用以 resolve 此守卫
 */
type NavigationGuard = (to: RouteLocation, from: RouteLocation, next: NavigationGuardNext) => void | Promise<void>;
/**
 * 后置导航钩子函数类型
 * @param to - 已进入的目标路由
 * @param from - 离开的路由
 */
type PostNavigationGuard = (to: RouteLocation, from: RouteLocation) => void;

/**
 * 导航动画类型
 *
 * 用于 uni.navigateTo / uni.navigateBack 的 animationType 参数，
 * 仅 App 端生效，其他平台自动忽略。
 *
 * 显示动画（navigateTo）：slide-in-right / slide-in-left / slide-in-top / slide-in-bottom / pop-in / fade-in / zoom-out / zoom-fade-out / none / auto
 * 关闭动画（navigateBack）：slide-out-right / slide-out-left / slide-out-top / slide-out-bottom / pop-out / fade-out / zoom-in / zoom-fade-in / none / auto
 *
 * @see https://en.uniapp.dcloud.io/api/router.html#animation
 */
type UniAnimationType = 'auto' | 'none' | 'slide-in-right' | 'slide-in-left' | 'slide-in-top' | 'slide-in-bottom' | 'slide-out-right' | 'slide-out-left' | 'slide-out-top' | 'slide-out-bottom' | 'fade-in' | 'fade-out' | 'zoom-out' | 'zoom-in' | 'zoom-fade-out' | 'zoom-fade-in' | 'pop-in' | 'pop-out';
/**
 * 动画持续时间默认值（ms），与 uni-app 官方默认值一致
 */
declare const DEFAULT_ANIMATION_DURATION = 300;
/**
 * 导航动画配置
 *
 * 仅 App 端生效，其他平台自动忽略。
 * 优先级：push/replace 调用时传入 > meta.animation > uni 默认值
 */
interface NavigationAnimation {
    /** 窗口动画类型 */
    type: UniAnimationType;
    /** 动画持续时间（ms），默认 300 */
    duration?: number;
}
/**
 * 路由名称映射表
 *
 * 用于为路由名称和路径提供 TypeScript 类型提示。
 * 通过模块增强（module augmentation）填充具体路由信息，
 * 即可让 name 和 path 字段获得自动补全和类型检查。
 *
 * @example
 * ```ts
 * // 在生成的类型文件中增强
 * declare module '@meng-xi/uni-router' {
 *   interface RouteNameMap {
 *     pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
 *     pagesDetailDetail: { path: '/pages/detail/detail'; meta: { title: string } }
 *   }
 * }
 * ```
 */
interface RouteNameMap {
}
/**
 * 路由名称类型（从 RouteNameMap 推导，未增强时回退为 string）
 */
type RouteName = keyof RouteNameMap extends never ? string : keyof RouteNameMap;
/**
 * 路由路径类型（从 RouteNameMap 推导，未增强时回退为 string）
 */
type RoutePath = keyof RouteNameMap extends never ? string : RouteNameMap[keyof RouteNameMap]['path'];
/**
 * 路由元信息，用于描述路由的附加属性
 */
interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 是否为 TabBar 页面 */
    isTab?: boolean;
    /** 是否需要登录认证 */
    requireAuth?: boolean;
    /** 默认导航动画（仅 App 端生效），可被 push/replace 时的 animation 参数覆盖 */
    animation?: NavigationAnimation;
    /** 自定义扩展字段 */
    [key: string]: any;
}
/**
 * 路由配置项，对应 pages.json 中的页面声明
 */
interface RouteConfig {
    /** 页面路径，需与 pages.json 中的路径一致 */
    path: string;
    /** 路由名称，用于命名路由导航 */
    name?: string;
    /** 路由元信息 */
    meta?: RouteMeta;
    /** 路由独享守卫，进入该路由时触发 */
    beforeEnter?: NavigationGuard | NavigationGuard[];
}
/**
 * 解析后的路由位置信息
 */
interface RouteLocation {
    /** 规范化后的路径 */
    path: string;
    /** 路由名称 */
    name?: string;
    /** 路由元信息 */
    meta: RouteMeta;
    /** 查询参数 */
    query: Record<string, string>;
    /** 完整路径（含查询参数） */
    fullPath: string;
    /**
     * 是否为状态同步（非完整导航）
     *
     * 当路由状态通过 syncRoute() / syncCurrentRoute() 从页面栈同步时设为 true。
     * 状态同步不是一次完整的导航（未经过前置守卫），afterEach 不会触发。
     * 正常导航完成时此字段为 undefined 或 false。
     *
     * @internal 内部标记，不应在应用代码中依赖此字段
     */
    _synced?: boolean;
}
/**
 * 页面间通信事件通道
 *
 * 用于 uni.navigateTo 的 events 参数和 success 回调中的 eventChannel，
 * 实现页面间双向通信。
 *
 * @see https://uniapp.dcloud.net.cn/api/router.html#navigateto
 */
interface EventChannel {
    /** 监听事件 */
    on(event: string, callback: (...args: any[]) => void): EventChannel;
    /** 监听事件（仅触发一次） */
    once(event: string, callback: (...args: any[]) => void): EventChannel;
    /** 取消监听事件 */
    off(event: string, callback?: (...args: any[]) => void): EventChannel;
    /** 触发事件 */
    emit(event: string, ...args: any[]): EventChannel;
}
/**
 * 页面间通信事件监听器
 *
 * 键为事件名称，值为事件处理函数。用于 uni.navigateTo 的 events 参数，
 * 监听目标页面通过 eventChannel.emit 发送的事件。
 */
type EventListeners = Record<string, (...args: any[]) => void>;
/**
 * 导航结果
 *
 * push 导航完成后的返回值，包含目标路由位置和可选的页面间通信通道。
 * 继承 RouteLocation，因此可以直接作为 RouteLocation 使用。
 *
 * eventChannel 仅在 push（对应 uni.navigateTo）时可用，
 * 其他导航方式（replace / relaunch / back）不支持 EventChannel。
 */
interface NavigationResult extends RouteLocation {
    /**
     * 页面间通信事件通道（仅 push 时可用）
     *
     * 通过此通道可以向目标页面发送事件，目标页面通过 getOpenerEventChannel() 接收。
     * 仅对应 uni.navigateTo 的导航结果，其他导航方式此字段为 undefined。
     */
    eventChannel?: EventChannel;
}
/**
 * 基于路径的原始路由位置
 */
interface RouteLocationPathRaw {
    /** 目标路径 */
    path: RoutePath;
    /** 查询参数 */
    query?: Record<string, string>;
    /** 导航动画（仅 App 端生效），覆盖 meta.animation */
    animation?: NavigationAnimation;
    /**
     * 页面间通信事件监听器（仅 push 时生效）
     *
     * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
     * 其他导航方式（replace / relaunch）不支持 events，传入时将被忽略。
     */
    events?: EventListeners;
}
/**
 * 基于名称的原始路由位置
 */
interface RouteLocationNamedRaw {
    /** 目标路由名称 */
    name: RouteName;
    /** 查询参数 */
    query?: Record<string, string>;
    /** 导航动画（仅 App 端生效），覆盖 meta.animation */
    animation?: NavigationAnimation;
    /**
     * 页面间通信事件监听器（仅 push 时生效）
     *
     * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
     * 其他导航方式（replace / relaunch）不支持 events，传入时将被忽略。
     */
    events?: EventListeners;
}
/**
 * 原始路由位置，支持路径字符串、路径对象或命名对象
 */
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw;

/**
 * 路由错误接口，描述路由过程中产生的错误
 */
interface RouterError$1 {
    /** 错误码 */
    readonly code: RouterErrorCode;
    /** 错误信息 */
    readonly message: string;
}
/**
 * 路由错误码枚举
 */
declare enum RouterErrorCode {
    /** 导航被守卫中止 */
    NAVIGATION_ABORTED = "NAVIGATION_ABORTED",
    /** 导航被取消（守卫抛出异常或重定向超限） */
    NAVIGATION_CANCELLED = "NAVIGATION_CANCELLED",
    /** 重复导航到当前位置 */
    NAVIGATION_DUPLICATED = "NAVIGATION_DUPLICATED",
    /** 未找到匹配的路由 */
    ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
    /** uni 导航 API 调用失败 */
    NAVIGATION_API_ERROR = "NAVIGATION_API_ERROR",
    /** 路由器初始化或使用方式错误 */
    SETUP_ERROR = "SETUP_ERROR"
}

/**
 * 路由错误处理回调
 * @param error - 错误对象
 * @param to - 目标路由
 * @param from - 来源路由
 */
type RouterOnError = (error: RouterError$1, to: RouteLocation, from: RouteLocation) => void;
/**
 * 路由器初始化选项
 */
interface RouterOptions {
    /** 路由配置列表，需与 pages.json 中的页面声明保持一致 */
    routes: RouteConfig[];
    /** 是否启用严格模式，启用后未匹配的命名路由将抛出异常 */
    strict?: boolean;
    /**
     * 是否拦截 uni 原生导航 API（navigateTo / redirectTo / switchTab / navigateBack）
     *
     * 启用后，直接调用 uni.navigateTo 等方法将被拦截并转由路由器处理，
     * 确保路由守卫（beforeEach / beforeResolve / afterEach）始终生效。
     *
     * @default false
     */
    interceptUniApi?: boolean;
    /**
     * 守卫超时时间（毫秒）
     *
     * 当守卫函数在此时间内既未调用 next() 也未返回 rejected Promise 时，
     * 将输出警告并自动中止导航以防止永久挂起。
     * 适用于守卫中包含耗时异步操作（如网络请求）的场景。
     *
     * 设为 0 可禁用超时保护（不推荐）。
     *
     * @default 10000
     */
    guardTimeout?: number;
    /**
     * 路由器就绪超时时间（毫秒）
     *
     * 当路由器在此时间内未能完成初始化时，`await router.isReady()` 将被 reject，
     * 防止路由器初始化异常时 Promise 永久挂起。
     *
     * 设为 0 可禁用超时保护（默认行为，即永不超时）。
     *
     * @default 0
     */
    readyTimeout?: number;
}
/**
 * 路由器实例接口，提供路由导航、守卫注册和状态查询能力
 */
interface Router {
    /** 当前路由位置（只读） */
    readonly currentRoute: RouteLocation;
    /**
     * 导航到新页面，对应 uni.navigateTo / uni.switchTab
     *
     * 返回 NavigationResult，包含目标路由位置和可选的 eventChannel。
     * eventChannel 仅在对应 uni.navigateTo 时可用，用于页面间双向通信。
     *
     * @param location - 目标路由位置
     * @returns 导航结果，包含目标路由位置和可选的 eventChannel
     * @throws {NavigationFailure} 导航被中止、重复或 API 调用失败时抛出
     */
    push(location: RouteLocationRaw): Promise<NavigationResult>;
    /**
     * 替换当前页面，对应 uni.redirectTo / uni.switchTab
     * @param location - 目标路由位置
     * @returns 解析后的目标路由位置
     * @throws {NavigationFailure} 导航被中止或 API 调用失败时抛出
     */
    replace(location: RouteLocationRaw): Promise<RouteLocation>;
    /**
     * 关闭所有页面并打开目标页面，对应 uni.reLaunch / uni.switchTab
     *
     * 常用于退出登录后跳转登录页、从深层页面返回首页、重置整个页面栈等场景。
     * TabBar 页面自动切换为 uni.switchTab。
     * reLaunch 不支持动画参数，传入时将输出警告。
     *
     * @param location - 目标路由位置
     * @returns 解析后的目标路由位置
     * @throws {NavigationFailure} 导航被中止或 API 调用失败时抛出
     */
    relaunch(location: RouteLocationRaw): Promise<RouteLocation>;
    /**
     * 返回上一页或多级页面，对应 uni.navigateBack
     *
     * 执行完整的导航守卫链（beforeEach → beforeResolve），守卫可中止或重定向返回操作。
     * 返回同步后的当前路由位置，调用者可获取返回到的目标页面信息。
     * 注意：物理返回键和浏览器后退不经过路由器，无法被守卫拦截。
     *
     * @param delta - 返回的页面数，默认为 1
     * @param animation - 导航动画（仅 App 端生效），覆盖 meta.animation
     * @returns 返回到的目标路由位置
     * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
     */
    back(delta?: number, animation?: NavigationAnimation): Promise<RouteLocation>;
    /**
     * 注册全局前置守卫，在每次导航前执行
     * @param guard - 前置守卫函数
     * @returns 用于移除此守卫的函数
     */
    beforeEach(guard: NavigationGuard): () => void;
    /**
     * 注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行
     * @param guard - 解析守卫函数
     * @returns 用于移除此守卫的函数
     */
    beforeResolve(guard: NavigationGuard): () => void;
    /**
     * 注册全局后置钩子，在导航完成后执行
     * @param guard - 后置钩子函数
     * @returns 用于移除此钩子的函数
     */
    afterEach(guard: PostNavigationGuard): () => void;
    /**
     * 获取所有已注册的路由配置列表
     * @returns 路由配置数组的浅拷贝
     */
    getRoutes(): RouteConfig[];
    /**
     * 检查是否存在指定名称的路由
     * @param name - 路由名称
     * @returns 存在时返回 true
     */
    hasRoute(name: string): boolean;
    /**
     * 解析路由位置为完整的 RouteLocation 对象，不执行导航
     * @param location - 原始路由位置
     * @returns 解析后的路由位置
     * @throws {RouterError} 严格模式下未找到路由时抛出
     */
    resolve(location: RouteLocationRaw): RouteLocation;
    /**
     * 等待路由器初始化完成
     * @returns 路由器就绪后 resolve 的 Promise
     */
    isReady(): Promise<void>;
    /**
     * 注册路由变化监听器
     *
     * 当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。
     * 与 afterEach 不同，此方法用于订阅路由状态变化，不参与导航流程控制。
     *
     * @param listener - 路由变化回调函数
     * @returns 用于移除此监听器的函数
     */
    onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void;
    /**
     * 注册路由错误处理回调
     * @param handler - 错误处理函数
     * @returns 用于移除此处理器的函数
     */
    onError(handler: RouterOnError): () => void;
    /**
     * 同步路由状态与实际页面栈
     *
     * 当页面通过浏览器后退、物理返回键等非路由器方式切换时，
     * 路由器的 currentRoute 可能与实际页面不同步。
     * 调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。
     *
     * 建议在每个页面的 onShow 生命周期中调用此方法。
     */
    syncRoute(): void;
    /**
     * 安装路由器到 Vue 应用实例，注册全局属性和 provide
     * @param app - Vue 应用实例
     */
    install(app: App): void;
}

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
 * const router = createRouter({
 *   routes: [
 *     { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
 *     { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
 *     { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
 *   ],
 *   strict: true
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
    readonly cause?: unknown;
    /**
     * @param to - 目标路由
     * @param from - 来源路由
     * @param code - 错误码
     * @param message - 可选的错误信息，默认自动生成
     * @param cause - 原始错误原因
     */
    constructor(to: RouteLocation, from: RouteLocation, code: RouterErrorCode, message?: string, cause?: unknown);
}

export { DEFAULT_ANIMATION_DURATION, type EventChannel, type EventListeners, type NavigationAnimation, NavigationFailure, type NavigationGuard, type NavigationGuardNext, type NavigationResult, type PostNavigationGuard, ROUTER_SYMBOL, type RouteConfig, type RouteLocation, type RouteLocationNamedRaw, type RouteLocationPathRaw, type RouteLocationRaw, type RouteMeta, type RouteName, type RouteNameMap, type RoutePath, type Router, RouterError, RouterErrorCode, type RouterOnError, type RouterOptions, type UniAnimationType, createRouter, useRoute, useRouter };
