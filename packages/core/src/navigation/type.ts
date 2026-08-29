import type { RouteMeta, NavigationAnimation, EventListeners } from '@/types/route'

/**
 * uni 导航 API 的统一选项
 */
export interface UniNavigationOptions {
	/** 目标页面路径 */
	path: string
	/** 路由元信息 */
	meta: RouteMeta
	/** 查询参数 */
	query?: Record<string, string>
	/** 导航动画（App 端由 animationType 原生处理，H5 端通过 CSS 过渡实现），覆盖 meta.animation */
	animation?: NavigationAnimation
	/**
	 * 页面间通信事件监听器（仅 push 时生效）
	 *
	 * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
	 * 其他导航方式不支持 events，传入时将被忽略。
	 */
	events?: EventListeners
}
