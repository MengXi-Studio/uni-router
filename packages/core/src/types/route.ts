import type { NavigationGuard } from './guard'

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
export type UniAnimationType =
	| 'auto'
	| 'none'
	| 'slide-in-right'
	| 'slide-in-left'
	| 'slide-in-top'
	| 'slide-in-bottom'
	| 'slide-out-right'
	| 'slide-out-left'
	| 'slide-out-top'
	| 'slide-out-bottom'
	| 'fade-in'
	| 'fade-out'
	| 'zoom-out'
	| 'zoom-in'
	| 'zoom-fade-out'
	| 'zoom-fade-in'
	| 'pop-in'
	| 'pop-out'

/**
 * 动画持续时间默认值（ms），与 uni-app 官方默认值一致
 */
export const DEFAULT_ANIMATION_DURATION = 300

/**
 * 导航动画配置
 *
 * 仅 App 端生效，其他平台自动忽略。
 * 优先级：push/replace 调用时传入 > meta.animation > uni 默认值
 */
export interface NavigationAnimation {
	/** 窗口动画类型 */
	type: UniAnimationType
	/** 动画持续时间（ms），默认 300 */
	duration?: number
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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RouteNameMap {}

/**
 * 路由名称类型（从 RouteNameMap 推导，未增强时回退为 string）
 */
export type RouteName = keyof RouteNameMap extends never ? string : keyof RouteNameMap

/**
 * 路由路径类型（从 RouteNameMap 推导，未增强时回退为 string）
 */
export type RoutePath = keyof RouteNameMap extends never ? string : RouteNameMap[keyof RouteNameMap]['path']

/**
 * 路由元信息，用于描述路由的附加属性
 */
export interface RouteMeta {
	/** 页面标题 */
	title?: string

	/** 是否为 TabBar 页面 */
	isTab?: boolean

	/** 是否需要登录认证 */
	requireAuth?: boolean

	/** 默认导航动画（仅 App 端生效），可被 push/replace 时的 animation 参数覆盖 */
	animation?: NavigationAnimation

	/** 自定义扩展字段 */
	[key: string]: unknown
}

/**
 * 路由配置项，对应 pages.json 中的页面声明
 */
export interface RouteConfig {
	/** 页面路径，需与 pages.json 中的路径一致 */
	path: string

	/** 路由名称，用于命名路由导航 */
	name?: string

	/** 路由元信息 */
	meta?: RouteMeta

	/** 路由独享守卫，进入该路由时触发 */
	beforeEnter?: NavigationGuard | NavigationGuard[]
}

/**
 * 解析后的路由位置信息
 */
export interface RouteLocation {
	/** 规范化后的路径 */
	path: string

	/** 路由名称 */
	name?: string

	/** 路由元信息 */
	meta: RouteMeta

	/** 查询参数 */
	query: Record<string, string>

	/** 完整路径（含查询参数） */
	fullPath: string

	/**
	 * 是否为状态同步（非完整导航）
	 *
	 * 当路由状态通过 syncRoute() / syncCurrentRoute() 从页面栈同步时设为 true。
	 * 状态同步不是一次完整的导航（未经过前置守卫），afterEach 不会触发。
	 * 正常导航完成时此字段为 undefined 或 false。
	 *
	 * @internal 内部标记，不应在应用代码中依赖此字段
	 */
	_synced?: boolean
}

/**
 * 页面间通信事件通道
 *
 * 用于 uni.navigateTo 的 events 参数和 success 回调中的 eventChannel，
 * 实现页面间双向通信。
 *
 * @see https://uniapp.dcloud.net.cn/api/router.html#navigateto
 */
export interface EventChannel {
	/** 监听事件 */
	on(event: string, callback: (...args: any[]) => void): EventChannel
	/** 监听事件（仅触发一次） */
	once(event: string, callback: (...args: any[]) => void): EventChannel
	/** 取消监听事件 */
	off(event: string, callback?: (...args: any[]) => void): EventChannel
	/** 触发事件 */
	emit(event: string, ...args: any[]): EventChannel
}

/**
 * 页面间通信事件监听器
 *
 * 键为事件名称，值为事件处理函数。用于 uni.navigateTo 的 events 参数，
 * 监听目标页面通过 eventChannel.emit 发送的事件。
 */
export type EventListeners = Record<string, (...args: any[]) => void>

/**
 * 导航结果
 *
 * push 导航完成后的返回值，包含目标路由位置和可选的页面间通信通道。
 * 继承 RouteLocation，因此可以直接作为 RouteLocation 使用。
 *
 * eventChannel 仅在 push（对应 uni.navigateTo）时可用，
 * 其他导航方式（replace / relaunch / back）不支持 EventChannel。
 */
export interface NavigationResult extends RouteLocation {
	/**
	 * 页面间通信事件通道（仅 push 时可用）
	 *
	 * 通过此通道可以向目标页面发送事件，目标页面通过 getOpenerEventChannel() 接收。
	 * 仅对应 uni.navigateTo 的导航结果，其他导航方式此字段为 undefined。
	 */
	eventChannel?: EventChannel
}

/**
 * 基于路径的原始路由位置
 */
export interface RouteLocationPathRaw {
	/** 目标路径 */
	path: RoutePath

	/** 查询参数 */
	query?: Record<string, string>

	/** 导航动画（仅 App 端生效），覆盖 meta.animation */
	animation?: NavigationAnimation

	/**
	 * 页面间通信事件监听器（仅 push 时生效）
	 *
	 * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
	 * 其他导航方式（replace / relaunch）不支持 events，传入时将被忽略。
	 */
	events?: EventListeners
}

/**
 * 基于名称的原始路由位置
 */
export interface RouteLocationNamedRaw {
	/** 目标路由名称 */
	name: RouteName

	/** 查询参数 */
	query?: Record<string, string>

	/** 导航动画（仅 App 端生效），覆盖 meta.animation */
	animation?: NavigationAnimation

	/**
	 * 页面间通信事件监听器（仅 push 时生效）
	 *
	 * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
	 * 其他导航方式（replace / relaunch）不支持 events，传入时将被忽略。
	 */
	events?: EventListeners
}

/**
 * 原始路由位置，支持路径字符串、路径对象或命名对象
 */
export type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
