import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw, NavigationAnimation, EventListeners, RouteLocation, ParamObject } from '@/types'
import { PARAMS_KEY } from '@/params'
import type { ParamsManager } from '@/params'
import { isSameQuery } from '@/utils/query'

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
 * 从已注入 params key 的路由位置中提取 __params_key
 *
 * enrichLocationWithParams 会将 key 写入 query，但 matcher.resolve 会将其移除。
 * 此方法在 resolve 之后从 enrichedLocation 中读取 key，用于拼入实际导航 URL，
 * 使 back() 返回时 syncCurrentRoute 可从 URL 重建 params。
 *
 * @param location - 已经过 enrichLocationWithParams 处理的路由位置
 * @returns params key，不存在时返回 undefined
 */
export function extractParamsKey(location: RouteLocationRaw): string | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'query' in location) {
		const query = (location as { query?: Record<string, unknown> }).query
		return query?.[PARAMS_KEY] as string | undefined
	}
	return undefined
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
 * 从原始路由位置中提取 params 和 persistent，存入 ParamsManager 并将 key 注入 location
 *
 * params 在 resolve 前处理，因为需要将 key 拼入 query 以便目标页面读取。
 *
 * @param location - 原始路由位置
 * @param paramsManager - Params 管理器实例
 * @returns 注入 __params_key 后的路由位置
 */
export function enrichLocationWithParams(location: RouteLocationRaw, paramsManager: ParamsManager): RouteLocationRaw {
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
