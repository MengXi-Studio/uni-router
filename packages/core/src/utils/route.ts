import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw } from '@/types'

/**
 * 向路由位置的 query 中注入 key-value 对
 *
 * 自动处理字符串/路径对象/命名对象三种形式，返回新的路由位置对象。
 * 用于 ParamsPlugin 注入 __params_key、ChannelPlugin 注入 __nav_id 等场景。
 *
 * @param location - 原始路由位置
 * @param key - query 中的键名
 * @param value - query 中的值
 * @returns 注入后的新路由位置
 */
export function injectQueryKey(location: RouteLocationRaw, key: string, value: string): RouteLocationRaw {
	if (typeof location === 'string') {
		return { path: location, query: { [key]: value } }
	}

	if ('path' in location) {
		const pathLoc = location as RouteLocationPathRaw
		return {
			...pathLoc,
			query: { ...pathLoc.query, [key]: value }
		}
	}

	if ('name' in location) {
		const namedLoc = location as RouteLocationNamedRaw
		return {
			...namedLoc,
			query: { ...namedLoc.query, [key]: value }
		}
	}

	return location
}

/**
 * 从路由位置的 query 中提取指定 key 的值
 *
 * 字符串形式的路由位置不含 query，返回 undefined。
 *
 * @param location - 路由位置
 * @param key - 要提取的 query 键名
 * @returns key 对应的值，不存在时返回 undefined
 */
export function extractQueryKey(location: RouteLocationRaw, key: string): string | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'query' in location) {
		const query = (location as { query?: Record<string, unknown> }).query
		return query?.[key] as string | undefined
	}
	return undefined
}
