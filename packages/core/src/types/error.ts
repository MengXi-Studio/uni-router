import type { RouteLocation } from './route'

/**
 * 路由错误接口，描述路由过程中产生的错误
 */
export interface RouterError {
	/** 错误码 */
	readonly code: RouterErrorCode

	/** 错误信息 */
	readonly message: string
}

/**
 * 导航失败接口，描述导航过程中产生的失败，包含来源和目标路由信息
 */
export interface NavigationFailure extends RouterError {
	/** 目标路由 */
	readonly to: RouteLocation

	/** 来源路由 */
	readonly from: RouteLocation

	/** 原始错误原因 */
	readonly cause?: unknown
}

/**
 * 路由错误码枚举
 */
export enum RouterErrorCode {
	/** 导航被守卫中止 */
	NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',

	/** 导航被取消（守卫抛出异常或重定向超限） */
	NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',

	/** 重复导航到当前位置 */
	NAVIGATION_DUPLICATED = 'NAVIGATION_DUPLICATED',

	/** 未找到匹配的路由 */
	ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',

	/** uni 导航 API 调用失败 */
	NAVIGATION_API_ERROR = 'NAVIGATION_API_ERROR',

	/** 路由器初始化或使用方式错误 */
	SETUP_ERROR = 'SETUP_ERROR'
}
