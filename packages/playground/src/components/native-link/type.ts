import type { RouteLocationRaw, EventChannel } from '@meng-xi/uni-router'

/**
 * NativeLink 组件属性
 *
 * 与 RouterLink 的导航能力对齐，但 H5 端渲染为原生 `<a>` 标签，
 * 恢复链接的原生能力（语义化、右键新标签页、无障碍识别、href 原生行为）。
 * 非 H5 平台（App / 小程序）回退为 `<view>` 渲染。
 */
export interface NativeLinkProps {
	/** 目标路由位置，支持路径字符串、路径对象或命名路由对象 */
	to: RouteLocationRaw
	/** 是否使用 replace 模式导航 */
	replace?: boolean
	/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
	relaunch?: boolean
	/** 按下时的样式类（仅非 H5 平台生效，H5 使用 CSS :hover） */
	hoverClass?: string
}

/**
 * NativeLink 组件事件
 */
export interface NativeLinkEmits {
	/** 导航成功，参数为目标页面的 eventChannel（可用时） */
	navigated: [eventChannel?: EventChannel]
	/** 导航失败，参数为错误对象（NavigationFailure 等） */
	error: [error: unknown]
}
