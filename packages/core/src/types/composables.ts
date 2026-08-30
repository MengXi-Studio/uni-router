import type { ComputedRef } from 'vue'
import type { RouteLocationRaw, RouteLocation, NavigationResult } from './route'

/**
 * useLink 的选项，与 RouterLink 组件的 props 对应
 *
 * 支持传入普通对象或 ref 包裹的值。
 */
export interface UseLinkOptions {
	/** 目标路由位置，支持路径字符串、路径对象或命名路由对象 */
	to: RouteLocationRaw
	/** 是否使用 replace 模式导航 */
	replace?: boolean
	/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
	relaunch?: boolean
}

/**
 * useLink 的返回值
 */
export interface UseLinkReturn {
	/** 解析后的路由对象 */
	route: ComputedRef<RouteLocation>
	/** 目标路径字符串（fullPath，包含 query 参数） */
	href: ComputedRef<string>
	/** 当前路由是否匹配此链接（比较 path，忽略 query 和 hash） */
	isActive: ComputedRef<boolean>
	/** 当前路由是否完全匹配此链接（比较 fullPath，包含 query） */
	isExactActive: ComputedRef<boolean>
	/** 执行导航到目标页面 */
	navigate: () => Promise<NavigationResult>
}
