import type { QueryValue, RouteLocation, RouteMeta, ParamObject } from '@/types/route'

/**
 * 将 QueryValue 序列化为字符串
 *
 * - `string` → 原样返回
 * - `number` → `String(number)`
 * - `boolean` → `'true'` / `'false'`
 *
 * @param value - 查询参数值
 * @returns 序列化后的字符串
 */
export function serializeQueryValue(value: QueryValue): string {
	if (typeof value === 'string') return value
	if (typeof value === 'number') return String(value)
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	return String(value)
}

/**
 * 将包含 QueryValue 的查询参数对象序列化为纯字符串键值对
 *
 * @param query - 原始查询参数，值可为 string / number / boolean
 * @returns 所有值均为字符串的查询参数对象
 */
export function serializeQuery(query?: Record<string, QueryValue>): Record<string, string> {
	if (!query) return {}
	const result: Record<string, string> = {}
	for (const key of Object.keys(query)) {
		const value = query[key]
		if (value !== undefined && value !== null) {
			result[key] = serializeQueryValue(value as QueryValue)
		}
	}
	return result
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
 * 创建 RouteLocation 对象，附带 query 便捷方法
 *
 * 所有 RouteLocation 实例均应通过此工厂函数创建，
 * 以确保 queryInt / queryNumber / queryBool 方法可用。
 *
 * @param base - 路由位置基础数据
 * @returns 完整的 RouteLocation 对象
 */
export function createRouteLocation(base: { path: string; name?: string; meta: RouteMeta; query: Record<string, string>; fullPath: string; params?: ParamObject; _synced?: boolean }): RouteLocation {
	const query = Object.freeze(base.query)
	const params: Readonly<ParamObject> = base.params ? Object.freeze({ ...base.params }) : Object.freeze({})
	return {
		path: base.path,
		name: base.name,
		meta: Object.freeze({ ...base.meta }),
		query,
		params,
		fullPath: base.fullPath,
		...(base._synced !== undefined && { _synced: base._synced }),

		queryInt(key: string, defaultValue?: number): number | undefined {
			const val = query[key]
			if (val === undefined || val === '') return defaultValue
			const parsed = parseInt(val, 10)
			return isNaN(parsed) ? defaultValue : parsed
		},

		queryNumber(key: string, defaultValue?: number): number | undefined {
			const val = query[key]
			if (val === undefined || val === '') return defaultValue
			const parsed = Number(val)
			return isNaN(parsed) ? defaultValue : parsed
		},

		queryBool(key: string, defaultValue?: boolean): boolean | undefined {
			const val = query[key]
			if (val === undefined) return defaultValue
			if (val === 'true' || val === '1') return true
			if (val === 'false' || val === '0') return false
			return defaultValue
		}
	}
}

/**
 * 创建路由初始位置（START_LOCATION）
 *
 * @returns 冻结的初始路由位置对象
 */
export function createStartLocation(): RouteLocation {
	return createRouteLocation({
		path: '/',
		meta: {},
		query: {},
		fullPath: '/'
	})
}
