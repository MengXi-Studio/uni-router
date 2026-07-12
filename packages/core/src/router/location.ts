import type { RouteLocation } from '@/types'
import { isSameQuery } from '@/utils/query'

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
