import type { NavigationGuardReturn, NavigationRedirect, RouteLocationRaw } from '@/types'
import { RouterErrorCode } from '@/enums'
import type { GuardResult } from '../type'

/**
 * 判断守卫返回值是否为可控重定向对象（NavigationRedirect）
 *
 * NavigationRedirect 通过顶层 `location` 字段与 RouteLocationRaw 区分：
 * RouteLocationPathRaw（必须有 path）/ RouteLocationNamedRaw（必须有 name）均不含 `location` 顶层字段。
 */
export function isRedirect(value: unknown): value is NavigationRedirect {
	return typeof value === 'object' && value !== null && 'location' in value
}

/**
 * 将守卫返回值转换为 GuardResult
 *
 * @param value - 守卫返回值
 * @returns 对应的 GuardResult
 */
export function resolveGuardReturn(value: NavigationGuardReturn): GuardResult {
	if (value === false) {
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_ABORTED }
	}
	if (value instanceof Error) {
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
	}
	if (value === true || value === undefined || value === null || value === void 0) {
		return { type: 'next' }
	}
	// NavigationRedirect：重定向并指定导航方式
	if (isRedirect(value)) {
		return { type: 'next', redirect: value.location, mode: value.mode }
	}
	// 其他值视为 RouteLocationRaw（string 或对象），重定向
	return { type: 'next', redirect: value as RouteLocationRaw }
}
