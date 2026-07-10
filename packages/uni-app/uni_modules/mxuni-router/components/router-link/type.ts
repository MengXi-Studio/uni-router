import type { RouteLocationRaw, NavigationAnimation, EventListeners, ParamObject, EventChannel, NavigationFailure } from '../../js_sdk/index'

/** RouterLink 组件 Props 类型 */
export interface RouterLinkProps {
	/** 目标路由位置，支持路径字符串、路径对象或命名对象 */
	to: RouteLocationRaw
	/** 是否使用替换模式导航 */
	replace?: boolean
	/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
	relaunch?: boolean
	/** 页面参数，支持复杂数据（仅 JSON 可序列化值） */
	params?: ParamObject
	/** 页面参数是否持久化到 storage（默认 false，仅内存存储） */
	persistent?: boolean
	/** 导航动画（仅 App 端生效），覆盖 meta.animation */
	animation?: NavigationAnimation
	/** 页面间通信事件监听器，对应 uni.navigateTo 的 events 参数；默认仅 push 生效，启用 useUniEventChannel 后所有导航方式均生效 */
	events?: EventListeners
	/** 按下时的样式类，设置为 'none' 可禁用点击态 */
	hoverClass?: string
	/** 是否阻止祖先节点的点击态 */
	hoverStopPropagation?: boolean
	/** 按住后多久出现点击态，单位 ms */
	hoverStartTime?: number
	/** 手指松开后点击态保留时间，单位 ms */
	hoverStayTime?: number
}

/** RouterLink 组件 Emits 类型 */
export interface RouterLinkEmits {
	/** 导航成功后触发，返回 eventChannel 用于页面间通信；默认仅 push 时有值，启用 useUniEventChannel 后所有导航方式均可用 */
	navigated: [eventChannel: EventChannel | undefined]
	/** 导航失败时触发（如守卫中止、重复导航） */
	error: [error: NavigationFailure]
}
