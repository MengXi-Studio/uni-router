import type { NavigationGuard } from './guard'
import type { NavigationAnimation } from './animation'
import type { QueryValue } from './query'
import type { ParamsInput, ParamObject } from './params'
import type { EventChannel, EventListeners } from './event-channel'

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
	[key: string]: any
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

	/** 页面参数（从内存或 storage 中读取，只读） */
	params: Readonly<ParamObject>

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

	/**
	 * 将查询参数解析为整数
	 *
	 * @param key - 查询参数键名
	 * @param defaultValue - 参数不存在或解析失败时的默认值
	 * @returns 解析后的整数值，参数不存在或解析失败时返回 defaultValue（未提供则为 undefined）
	 */
	queryInt(key: string, defaultValue?: number): number | undefined

	/**
	 * 将查询参数解析为数值（支持浮点数）
	 *
	 * @param key - 查询参数键名
	 * @param defaultValue - 参数不存在或解析失败时的默认值
	 * @returns 解析后的数值，参数不存在或解析失败时返回 defaultValue（未提供则为 undefined）
	 */
	queryNumber(key: string, defaultValue?: number): number | undefined

	/**
	 * 将查询参数解析为布尔值
	 *
	 * - `'true'` / `'1'` → `true`
	 * - `'false'` / `'0'` → `false`
	 * - 其他值 → 返回 defaultValue（未提供则为 undefined）
	 *
	 * @param key - 查询参数键名
	 * @param defaultValue - 参数不存在或无法识别时的默认值
	 * @returns 解析后的布尔值，参数不存在或无法识别时返回 defaultValue（未提供则为 undefined）
	 */
	queryBool(key: string, defaultValue?: boolean): boolean | undefined
}

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

	/** 查询参数，值支持 string / number / boolean，内部自动序列化为字符串 */
	query?: Record<string, QueryValue>

	/** 页面参数，支持复杂数据（仅 JSON 可序列化值），接受 `interface` 对象 */
	params?: ParamsInput

	/** 页面参数是否持久化到 storage（默认 false，仅内存存储） */
	persistent?: boolean

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

	/** 查询参数，值支持 string / number / boolean，内部自动序列化为字符串 */
	query?: Record<string, QueryValue>

	/** 页面参数，支持复杂数据（仅 JSON 可序列化值），接受 `interface` 对象 */
	params?: ParamsInput

	/** 页面参数是否持久化到 storage（默认 false，仅内存存储） */
	persistent?: boolean

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
