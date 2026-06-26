import type {
	RouteLocation,
	RouteLocationRaw,
	RouteLocationPathRaw,
	RouteLocationNamedRaw,
	NavigationAnimation,
	EventListeners,
	NavigationId,
	ParamObject
} from '@/types'
import { PARAMS_KEY, NAV_ID_KEY } from '@/params'

/**
 * Params 存储接口（enrichLocationWithParams 仅需 set 方法）
 */
export interface ParamsSetter {
	set(params: ParamObject, persistent?: boolean): string
}

/**
 * 判断两个路由位置是否相同
 * @param a - 第一个路由位置
 * @param b - 第二个路由位置
 * @returns 路径和查询参数均相同时返回 true
 */
export function isSameRouteLocation(a: RouteLocation, b: RouteLocation): boolean {
	if (a.path !== b.path) return false
	if (a.name !== b.name) return false
	return isSameQuery(a.query, b.query)
}

/**
 * 判断两组查询参数是否相同
 * @param a - 第一组查询参数
 * @param b - 第二组查询参数
 * @returns 键值对完全一致时返回 true
 */
export function isSameQuery(a: Record<string, string>, b: Record<string, string>): boolean {
	if (a === b) return true
	const keysA = Object.keys(a)
	const keysB = Object.keys(b)
	if (keysA.length !== keysB.length) return false
	if (keysA.length === 0) return true
	return keysA.every(key => a[key] === b[key])
}

/**
 * 从原始路由位置中提取动画参数
 *
 * resolve() 会丢弃 animation 字段，因此需要在解析前提取。
 * 字符串形式的路由位置不包含动画参数。
 *
 * @param location - 原始路由位置
 * @returns 动画配置，不存在时返回 undefined
 */
export function extractAnimation(location: RouteLocationRaw): NavigationAnimation | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'animation' in location) return location.animation
	return undefined
}

/**
 * 从原始路由位置中提取事件监听器
 *
 * resolve() 会丢弃 events 字段，因此需要在解析前提取。
 * 字符串形式的路由位置不包含事件监听器。
 *
 * @param location - 原始路由位置
 * @returns 事件监听器，不存在时返回 undefined
 */
export function extractEvents(location: RouteLocationRaw): EventListeners | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'events' in location) return location.events
	return undefined
}

/**
 * 将 navigationId 注入到路由位置的 params 中
 *
 * 启用内置通信管理器时调用，使目标页面能通过 `route.params.__navId`
 * 拿到与调用方配对的通道标识。
 *
 * 字符串形式的位置会被转为对象形式（`{ path, params: { __navId } }`）。
 *
 * @param location - 原始路由位置
 * @param navigationId - 通信通道标识
 * @returns 注入 __navId 后的路由位置
 */
export function injectNavId(location: RouteLocationRaw, navigationId: NavigationId): RouteLocationRaw {
	if (typeof location === 'string') {
		return { path: location, params: { [NAV_ID_KEY]: navigationId } } as RouteLocationPathRaw
	}
	const existingParams = ('params' in location ? (location as { params?: ParamObject }).params : undefined) ?? {}
	return { ...location, params: { ...existingParams, [NAV_ID_KEY]: navigationId } } as RouteLocationRaw
}

/**
 * 从原始路由位置中提取 params 和 persistent，存入 ParamsManager 并将 key 注入 location
 *
 * params 在 resolve 前处理，因为需要将 key 拼入 query 以便目标页面读取。
 *
 * @param location - 原始路由位置
 * @param paramsManager - params 存储管理器
 * @returns 注入 __params_key 后的路由位置
 */
export function enrichLocationWithParams(location: RouteLocationRaw, paramsManager: ParamsSetter): RouteLocationRaw {
	if (typeof location === 'string') return location

	// 检查是否有 params
	const hasParams = 'params' in location && (location as { params?: ParamObject }).params
	if (!hasParams || Object.keys((location as { params: ParamObject }).params).length === 0) return location

	const params = (location as { params: ParamObject }).params
	const persistent = 'persistent' in location ? (location as { persistent?: boolean }).persistent : undefined
	const key = paramsManager.set(params, persistent)

	// 将 key 注入 query
	if ('path' in location) {
		const pathLoc = location as RouteLocationPathRaw
		return {
			...pathLoc,
			query: { ...pathLoc.query, [PARAMS_KEY]: key }
		}
	}

	if ('name' in location) {
		const namedLoc = location as RouteLocationNamedRaw
		return {
			...namedLoc,
			query: { ...namedLoc.query, [PARAMS_KEY]: key }
		}
	}

	return location
}
